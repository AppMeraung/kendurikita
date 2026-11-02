alter table kendurikita.profiles add column referral_code text unique;
alter table kendurikita.referrals
  add column kind text check(kind in ('user','vendor'));
alter table kendurikita.referrals
  add constraint referral_status_valid check(status in ('pending','active','rewarded','rejected'));
create unique index referrals_device_unique
  on kendurikita.referrals(device_hash) where device_hash is not null;

create or replace function kendurikita.make_referral_code()
returns text language plpgsql volatile set search_path='' as $$
declare candidate text;
begin
  loop
    candidate := upper(substr(encode(extensions.gen_random_bytes(8),'hex'),1,10));
    exit when not exists(
      select 1 from kendurikita.profiles p where p.referral_code=candidate
    );
  end loop;
  return candidate;
end $$;

update kendurikita.profiles
set referral_code=kendurikita.make_referral_code()
where referral_code is null;
alter table kendurikita.profiles alter column referral_code set not null;
alter table kendurikita.profiles
  alter column referral_code set default kendurikita.make_referral_code();

revoke insert,update,delete on kendurikita.referrals from authenticated;

create or replace function kendurikita.redeem_referral(
  referral_code text,
  device_fingerprint text
) returns uuid language plpgsql security definer set search_path='' as $$
declare referrer kendurikita.profiles%rowtype; created uuid; current_role text;
begin
  if auth.uid() is null then raise exception 'sign_in_required'; end if;
  if length(btrim(device_fingerprint)) < 12 then raise exception 'invalid_device'; end if;
  select * into referrer from kendurikita.profiles p
    where p.referral_code=upper(btrim(redeem_referral.referral_code));
  if referrer.id is null then raise exception 'invalid_code'; end if;
  if referrer.id=auth.uid() then raise exception 'self_referral'; end if;
  select role into current_role from kendurikita.profiles where id=auth.uid();
  insert into kendurikita.referrals(
    referrer_id,referred_id,code,device_hash,status,kind
  ) values(
    referrer.id,auth.uid(),referrer.referral_code,
    encode(extensions.digest(device_fingerprint,'sha256'),'hex'),
    'pending',case when current_role='vendor' then 'vendor' else 'user' end
  ) returning id into created;
  return created;
exception
  when unique_violation then raise exception 'referral_already_used';
end $$;

create or replace function kendurikita.process_user_referral_reward(target uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target_event uuid; winner uuid;
begin
  if (
    select count(*) from kendurikita.referrals
    where referrer_id=target and kind='user' and status in ('active','rewarded')
  ) < 3 then return; end if;
  if exists(
    select 1 from kendurikita.referrals
    where referrer_id=target and reward='event_pro'
  ) then return; end if;
  select id into target_event from kendurikita.events
    where owner_id=target order by created_at desc limit 1;
  if target_event is null then return; end if;
  select id into winner from kendurikita.referrals
    where referrer_id=target and kind='user' and status='active'
    order by created_at limit 1;
  update kendurikita.referrals
    set status='rewarded',reward='event_pro',rewarded_at=now()
    where id=winner;
  insert into kendurikita.subscriptions(
    user_id,event_id,entitlement,provider,provider_customer_id,status
  ) values(
    target,target_event,'event_pro','referral','user-'||target::text,'active'
  ) on conflict(provider,provider_customer_id) do update
    set status='active',event_id=excluded.event_id,updated_at=now();
end $$;

create or replace function kendurikita.activate_user_referral()
returns trigger language plpgsql security definer set search_path='' as $$
declare source uuid;
begin
  update kendurikita.referrals set status='active'
    where referred_id=new.owner_id and kind='user' and status='pending'
    returning referrer_id into source;
  if source is not null then perform kendurikita.process_user_referral_reward(source); end if;
  perform kendurikita.process_user_referral_reward(new.owner_id);
  return new;
end $$;
create trigger activate_referral_on_event
  after insert on kendurikita.events
  for each row execute function kendurikita.activate_user_referral();

create or replace function kendurikita.activate_vendor_referral()
returns trigger language plpgsql security definer set search_path='' as $$
declare referred_owner uuid; referral_row kendurikita.referrals%rowtype; target_vendor uuid;
begin
  if new.provider='referral' or new.status<>'active' or new.vendor_id is null then return new; end if;
  select owner_id into referred_owner from kendurikita.vendors where id=new.vendor_id;
  select * into referral_row from kendurikita.referrals
    where referred_id=referred_owner and kind='vendor' and status='pending';
  if referral_row.id is null then return new; end if;
  select id into target_vendor from kendurikita.vendors
    where owner_id=referral_row.referrer_id;
  if target_vendor is null then return new; end if;
  update kendurikita.referrals
    set status='rewarded',reward='vendor_month',rewarded_at=now()
    where id=referral_row.id;
  insert into kendurikita.subscriptions(
    vendor_id,entitlement,provider,provider_customer_id,status,expires_at
  ) values(
    target_vendor,'vendor_pro','referral','vendor-'||referral_row.id::text,
    'active',now()+interval '1 month'
  ) on conflict(provider,provider_customer_id) do nothing;
  return new;
end $$;
create trigger activate_referral_on_vendor_subscription
  after insert or update of status on kendurikita.subscriptions
  for each row execute function kendurikita.activate_vendor_referral();

revoke all on function kendurikita.redeem_referral(text,text) from public;
revoke all on function kendurikita.process_user_referral_reward(uuid) from public,anon,authenticated;
grant execute on function kendurikita.redeem_referral(text,text) to authenticated;
