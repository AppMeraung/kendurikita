create or replace function kendurikita.event_plan(target uuid)
returns text language sql stable security definer set search_path='' as $$
  select case
    when exists(
      select 1 from kendurikita.subscriptions s
      join kendurikita.events e on e.owner_id=s.user_id
      where e.id=target and s.status in ('active','grace')
        and (s.expires_at is null or s.expires_at>now())
        and (s.event_id is null or s.event_id=target)
        and lower(s.entitlement) like '%premium%'
    ) then 'premium'
    when exists(
      select 1 from kendurikita.subscriptions s
      join kendurikita.events e on e.owner_id=s.user_id
      where e.id=target and s.status in ('active','grace')
        and (s.expires_at is null or s.expires_at>now())
        and (s.event_id is null or s.event_id=target)
        and lower(s.entitlement) like '%pro%'
    ) then 'pro'
    else 'basic' end;
$$;
create or replace function kendurikita.vendor_plan(target uuid)
returns text language sql stable security definer set search_path='' as $$
  select case
    when exists(
      select 1 from kendurikita.subscriptions s
      where s.vendor_id=target and s.status in ('active','grace')
        and (s.expires_at is null or s.expires_at>now())
        and lower(s.entitlement) like '%premium%'
    ) then 'premium'
    when exists(
      select 1 from kendurikita.subscriptions s
      where s.vendor_id=target and s.status in ('active','grace')
        and (s.expires_at is null or s.expires_at>now())
        and lower(s.entitlement) like '%pro%'
    ) then 'pro'
    else 'basic' end;
$$;

create or replace function kendurikita.enforce_event_limit()
returns trigger language plpgsql security definer set search_path='' as $$
declare used integer; maximum integer; owner_plan text;
begin
  select case
    when exists(
      select 1 from kendurikita.subscriptions s
      where s.user_id=new.owner_id and s.status in ('active','grace')
        and (s.expires_at is null or s.expires_at>now())
        and lower(s.entitlement) like '%premium%'
    ) then 'premium' else 'basic' end into owner_plan;
  maximum := case when owner_plan='premium' then 3 else 1 end;
  select count(*) into used from kendurikita.events
    where owner_id=new.owner_id and id<>new.id;
  if used+1>maximum then raise exception 'event_limit_reached'; end if;
  return new;
end $$;

create or replace function kendurikita.activate_vendor_referral()
returns trigger language plpgsql security definer set search_path='' as $$
declare referred_owner uuid; referral_row kendurikita.referrals%rowtype; target_vendor uuid;
begin
  if new.provider='referral' or new.status not in ('active','grace') or new.vendor_id is null then return new; end if;
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
