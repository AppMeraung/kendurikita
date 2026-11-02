alter table kendurikita.vendor_portfolio
  add column moderation_status text not null default 'approved'
  check(moderation_status in ('approved','hidden'));

drop policy if exists vendor_portfolio_public_read on kendurikita.vendor_portfolio;
create policy vendor_portfolio_public_read on kendurikita.vendor_portfolio
  for select using(
    (moderation_status='approved' and exists(select 1 from kendurikita.vendors v where v.id=vendor_id and v.verification_status='approved'))
    or kendurikita.owns_vendor(vendor_id)
    or kendurikita.is_admin()
  );

create or replace function kendurikita.moderate_portfolio(target uuid, publish boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  update kendurikita.vendor_portfolio set moderation_status=case when publish then 'approved' else 'hidden' end where id=target;
  if not found then raise exception 'portfolio_not_found'; end if;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'moderate_portfolio','vendor_portfolio',target,jsonb_build_object('publish',publish));
end $$;

create or replace function kendurikita.admin_update_subscription(target uuid, next_status text, next_expiry timestamptz default null)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  if next_status not in ('active','grace','cancelled','expired') then raise exception 'invalid_status'; end if;
  update kendurikita.subscriptions set status=next_status, expires_at=next_expiry, updated_at=now() where id=target;
  if not found then raise exception 'subscription_not_found'; end if;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'admin_update_subscription','subscriptions',target,jsonb_build_object('status',next_status,'expires_at',next_expiry));
end $$;

revoke all on function kendurikita.moderate_portfolio(uuid,boolean) from public;
revoke all on function kendurikita.admin_update_subscription(uuid,text,timestamptz) from public;
grant execute on function kendurikita.moderate_portfolio(uuid,boolean), kendurikita.admin_update_subscription(uuid,text,timestamptz) to authenticated;
