create or replace function kendurikita.event_plan(target uuid)
returns text language sql stable security definer set search_path='' as $$
  select case
    when exists(
      select 1 from kendurikita.subscriptions s
      join kendurikita.events e on e.owner_id=s.user_id
      where e.id=target and s.status='active'
        and (s.expires_at is null or s.expires_at>now())
        and (s.event_id is null or s.event_id=target)
        and lower(s.entitlement) like '%premium%'
    ) then 'premium'
    when exists(
      select 1 from kendurikita.subscriptions s
      join kendurikita.events e on e.owner_id=s.user_id
      where e.id=target and s.status='active'
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
      where s.vendor_id=target and s.status='active'
        and (s.expires_at is null or s.expires_at>now())
        and lower(s.entitlement) like '%premium%'
    ) then 'premium'
    when exists(
      select 1 from kendurikita.subscriptions s
      where s.vendor_id=target and s.status='active'
        and (s.expires_at is null or s.expires_at>now())
        and lower(s.entitlement) like '%pro%'
    ) then 'pro'
    else 'basic' end;
$$;

create or replace function kendurikita.enforce_guest_limit()
returns trigger language plpgsql security definer set search_path='' as $$
declare used integer; maximum integer;
begin
  maximum := case kendurikita.event_plan(new.event_id)
    when 'premium' then 2147483647 when 'pro' then 500 else 100 end;
  select coalesce(sum(pax),0) into used from kendurikita.guests
    where event_id=new.event_id and id<>new.id;
  if used+new.pax>maximum then raise exception 'guest_limit_reached'; end if;
  return new;
end $$;
create trigger enforce_guest_plan_limit
  before insert or update of pax,event_id on kendurikita.guests
  for each row execute function kendurikita.enforce_guest_limit();

create or replace function kendurikita.enforce_member_limit()
returns trigger language plpgsql security definer set search_path='' as $$
declare used integer; maximum integer;
begin
  if new.role='owner' then return new; end if;
  maximum := case kendurikita.event_plan(new.event_id)
    when 'premium' then 2147483647 when 'pro' then 5 else 1 end;
  select count(*) into used from kendurikita.event_members
    where event_id=new.event_id and role<>'owner' and user_id<>new.user_id;
  if used+1>maximum then raise exception 'member_limit_reached'; end if;
  return new;
end $$;
create trigger enforce_member_plan_limit
  before insert or update of event_id,role on kendurikita.event_members
  for each row execute function kendurikita.enforce_member_limit();

create or replace function kendurikita.enforce_event_limit()
returns trigger language plpgsql security definer set search_path='' as $$
declare used integer; maximum integer; owner_plan text;
begin
  select case
    when exists(select 1 from kendurikita.subscriptions s where s.user_id=new.owner_id and s.status='active' and (s.expires_at is null or s.expires_at>now()) and lower(s.entitlement) like '%premium%') then 'premium'
    else 'basic' end into owner_plan;
  maximum := case when owner_plan='premium' then 3 else 1 end;
  select count(*) into used from kendurikita.events where owner_id=new.owner_id and id<>new.id;
  if used+1>maximum then raise exception 'event_limit_reached'; end if;
  return new;
end $$;
create trigger enforce_event_plan_limit
  before insert on kendurikita.events
  for each row execute function kendurikita.enforce_event_limit();

create or replace function kendurikita.enforce_event_feature()
returns trigger language plpgsql security definer set search_path='' as $$
declare plan text; used bigint; maximum bigint;
begin
  plan := kendurikita.event_plan(new.event_id);
  if tg_table_name='tables_seating' and plan='basic' then
    raise exception 'pro_required';
  elsif tg_table_name='event_gallery' and plan<>'premium' then
    raise exception 'premium_required';
  elsif tg_table_name='documents' then
    maximum := case plan when 'premium' then 5368709120 when 'pro' then 1073741824 else 52428800 end;
    select coalesce(sum(size_bytes),0) into used from kendurikita.documents
      where event_id=new.event_id and id<>new.id;
    if used+coalesce(new.size_bytes,0)>maximum then raise exception 'storage_limit_reached'; end if;
  end if;
  return new;
end $$;
create trigger enforce_seating_entitlement before insert or update on kendurikita.tables_seating
  for each row execute function kendurikita.enforce_event_feature();
create trigger enforce_gallery_entitlement before insert or update on kendurikita.event_gallery
  for each row execute function kendurikita.enforce_event_feature();
create trigger enforce_document_entitlement before insert or update on kendurikita.documents
  for each row execute function kendurikita.enforce_event_feature();

create or replace function kendurikita.enforce_invitation_entitlement()
returns trigger language plpgsql security definer set search_path='' as $$
declare plan text;
begin
  plan := kendurikita.event_plan(new.event_id);
  if plan='basic' and new.template_id not in ('malay','chinese','indian') then
    raise exception 'template_limit_reached';
  end if;
  if plan<>'premium' then
    new.content := new.content - 'music_url';
  end if;
  new.content := new.content || jsonb_build_object('watermark',plan='basic');
  return new;
end $$;
create trigger enforce_invitation_plan
  before insert or update on kendurikita.invitations
  for each row execute function kendurikita.enforce_invitation_entitlement();

create or replace function kendurikita.enforce_vendor_limit()
returns trigger language plpgsql security definer set search_path='' as $$
declare plan text; used integer; maximum integer;
begin
  plan := kendurikita.vendor_plan(new.vendor_id);
  if tg_table_name='vendor_categories' then
    maximum := case plan when 'premium' then 2147483647 when 'pro' then 3 else 1 end;
  elsif tg_table_name='vendor_packages' then
    maximum := case plan when 'premium' then 2147483647 when 'pro' then 10 else 2 end;
  elsif tg_table_name='vendor_portfolio' then
    if new.media_type='video' and plan<>'premium' then raise exception 'premium_required'; end if;
    maximum := case plan when 'premium' then 2147483647 when 'pro' then 100 else 10 end;
  elsif tg_table_name='leads' then
    maximum := case when plan='basic' then 5 else 2147483647 end;
    select count(*) into used from kendurikita.leads
      where vendor_id=new.vendor_id and created_at>=date_trunc('month',now()) and id<>new.id;
    if used+1>maximum then raise exception 'lead_limit_reached'; end if;
    return new;
  else return new;
  end if;
  execute format('select count(*) from kendurikita.%I where vendor_id=$1',tg_table_name)
    into used using new.vendor_id;
  if tg_op='UPDATE' then used:=greatest(0,used-1); end if;
  if used+1>maximum then raise exception 'vendor_limit_reached'; end if;
  return new;
end $$;
create trigger enforce_vendor_category_limit before insert or update on kendurikita.vendor_categories
  for each row execute function kendurikita.enforce_vendor_limit();
create trigger enforce_vendor_package_limit before insert or update on kendurikita.vendor_packages
  for each row execute function kendurikita.enforce_vendor_limit();
create trigger enforce_vendor_portfolio_limit before insert or update on kendurikita.vendor_portfolio
  for each row execute function kendurikita.enforce_vendor_limit();
create trigger enforce_vendor_lead_limit before insert on kendurikita.leads
  for each row execute function kendurikita.enforce_vendor_limit();

create or replace function kendurikita.enforce_vendor_coverage_limit()
returns trigger language plpgsql security definer set search_path='' as $$
declare maximum integer; used integer; plan text;
begin
  plan := kendurikita.vendor_plan(new.id);
  maximum := case plan when 'premium' then 2147483647 when 'pro' then 3 else 1 end;
  used := jsonb_array_length(coalesce(new.coverage,'[]'::jsonb));
  if used>maximum then raise exception 'coverage_limit_reached'; end if;
  return new;
end $$;
create trigger enforce_vendor_coverage_plan
  before insert or update of coverage on kendurikita.vendors
  for each row execute function kendurikita.enforce_vendor_coverage_limit();

create or replace function kendurikita.set_vendor_badges(target uuid, badge_values text[])
returns void language plpgsql security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  if exists(select 1 from unnest(badge_values) badge where badge not in ('popular','fast_response','halal','premium'))
    then raise exception 'invalid_badge'; end if;
  if 'premium'=any(coalesce(badge_values,'{}')) and kendurikita.vendor_plan(target)<>'premium'
    then raise exception 'premium_plan_required'; end if;
  update kendurikita.vendors set badges=coalesce(badge_values,'{}') where id=target;
  if not found then raise exception 'vendor_not_found'; end if;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'set_vendor_badges','vendors',target,jsonb_build_object('badges',badge_values));
end $$;

create or replace function kendurikita.enforce_vendor_paid_workflow()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if kendurikita.vendor_plan(new.vendor_id)='basic' then raise exception 'vendor_pro_required'; end if;
  return new;
end $$;
create trigger enforce_quotation_plan before insert on kendurikita.quotations
  for each row execute function kendurikita.enforce_vendor_paid_workflow();
create trigger enforce_invoice_plan before insert on kendurikita.invoices
  for each row execute function kendurikita.enforce_vendor_paid_workflow();

drop function if exists kendurikita.get_public_invitation(uuid);
create function kendurikita.get_public_invitation(token uuid)
returns table(
  guest_id uuid,guest_name text,invited_pax integer,event_name text,event_date date,
  venue text,invitation_language text,invitation_template text,invitation_content jsonb,
  gallery_enabled boolean
) language sql stable security definer set search_path='' as $$
  select g.id,g.name,g.pax,e.name,nullif(e.event_dates->>0,'')::date,
    coalesce(e.venue->>'name',''),coalesce(i.language,p.preferred_language,'ms'),
    coalesce(i.template_id,'malay'),coalesce(i.content,'{}'::jsonb),
    kendurikita.event_plan(e.id)='premium'
  from kendurikita.guests g
  join kendurikita.events e on e.id=g.event_id
  left join kendurikita.invitations i on i.guest_id=g.id
  left join kendurikita.profiles p on p.id=e.owner_id
  where g.invitation_token=token limit 1;
$$;

grant execute on function kendurikita.event_plan(uuid),kendurikita.vendor_plan(uuid) to authenticated;
grant execute on function kendurikita.get_public_invitation(uuid) to anon,authenticated;
