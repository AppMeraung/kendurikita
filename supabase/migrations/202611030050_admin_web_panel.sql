-- Super admin panel on kendurikita.com/admin. Every function checks is_admin() and writes audit_log.
-- Admins cannot create, change or ban another admin: the admin role is granted only from the SQL editor.

create policy vendor_packages_admin_manage on kendurikita.vendor_packages
  for all using (kendurikita.is_admin()) with check (kendurikita.is_admin());
create policy leads_admin_read on kendurikita.leads for select using (kendurikita.is_admin());
create policy payments_admin_read on kendurikita.payments for select using (kendurikita.is_admin());

-- Hide a product from the marketplace (back to draft), or publish it again.
create or replace function kendurikita.moderate_package(target uuid, publish boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  update kendurikita.vendor_packages
    set status=case when publish then 'published' else 'draft' end, active=publish, updated_at=now()
    where id=target;
  if not found then raise exception 'package_not_found'; end if;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'moderate_package','vendor_packages',target,jsonb_build_object('publish',publish));
end $$;

-- Users with their email, which lives in auth.users and is not readable from the API.
create or replace function kendurikita.admin_list_users()
returns table(id uuid, email text, name text, phone text, role text, created_at timestamptz,
  last_sign_in_at timestamptz, banned boolean, vendor_id uuid, company_name text)
language plpgsql stable security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  return query
    select p.id, u.email::text, p.name, p.phone, p.role, p.created_at, u.last_sign_in_at,
      coalesce(u.banned_until > now(), false), v.id, v.company_name
    from kendurikita.profiles p
    join auth.users u on u.id=p.id
    left join kendurikita.vendors v on v.owner_id=p.id
    order by p.created_at desc;
end $$;

create or replace function kendurikita.admin_set_role(target uuid, next_role text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  if next_role not in ('user','vendor') then raise exception 'invalid_role'; end if;
  if exists(select 1 from kendurikita.profiles where id=target and role='admin') then raise exception 'cannot_change_admin'; end if;
  update kendurikita.profiles set role=next_role, updated_at=now() where id=target;
  if not found then raise exception 'user_not_found'; end if;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'admin_set_role','profiles',target,jsonb_build_object('role',next_role));
end $$;

-- Blocks sign-in and token refresh; a session already open lasts until its access token expires (about 1 hour).
create or replace function kendurikita.admin_set_banned(target uuid, ban boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  if exists(select 1 from kendurikita.profiles where id=target and role='admin') then raise exception 'cannot_change_admin'; end if;
  update auth.users set banned_until=case when ban then 'infinity'::timestamptz else null end where id=target;
  if not found then raise exception 'user_not_found'; end if;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'admin_set_banned','profiles',target,jsonb_build_object('banned',ban));
end $$;

-- Manual plan for a vendor, e.g. when a CHIP payment arrived but the webhook did not record it.
create or replace function kendurikita.admin_grant_plan(target_vendor uuid, plan text, expiry timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  if plan not in ('vendor_pro','vendor_premium') then raise exception 'invalid_plan'; end if;
  if expiry is null or expiry <= now() then raise exception 'invalid_expiry'; end if;
  if not exists(select 1 from kendurikita.vendors where id=target_vendor) then raise exception 'vendor_not_found'; end if;
  insert into kendurikita.subscriptions(vendor_id,entitlement,provider,status,expires_at,updated_at)
    values(target_vendor,plan,'manual','active',expiry,now()) returning id into new_id;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'admin_grant_plan','subscriptions',new_id,jsonb_build_object('vendor_id',target_vendor,'plan',plan,'expires_at',expiry));
  return new_id;
end $$;

revoke all on function kendurikita.moderate_package(uuid,boolean), kendurikita.admin_list_users(),
  kendurikita.admin_set_role(uuid,text), kendurikita.admin_set_banned(uuid,boolean),
  kendurikita.admin_grant_plan(uuid,text,timestamptz) from public, anon;
grant execute on function kendurikita.moderate_package(uuid,boolean), kendurikita.admin_list_users(),
  kendurikita.admin_set_role(uuid,text), kendurikita.admin_set_banned(uuid,boolean),
  kendurikita.admin_grant_plan(uuid,text,timestamptz) to authenticated;
