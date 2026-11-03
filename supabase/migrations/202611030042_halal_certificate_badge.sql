create or replace function kendurikita.set_vendor_badges(target uuid, badge_values text[])
returns void language plpgsql security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  if exists(select 1 from unnest(badge_values) badge where badge not in ('popular','fast_response','halal','premium'))
    then raise exception 'invalid_badge'; end if;
  if 'premium'=any(coalesce(badge_values,'{}')) and kendurikita.vendor_plan(target)<>'premium'
    then raise exception 'premium_plan_required'; end if;
  if 'halal'=any(coalesce(badge_values,'{}')) and not exists(
    select 1 from kendurikita.vendors
    where id=target
      and coalesce(verification_documents->>'halal','')<>''
  ) then raise exception 'halal_certificate_required'; end if;
  update kendurikita.vendors set badges=coalesce(badge_values,'{}') where id=target;
  if not found then raise exception 'vendor_not_found'; end if;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'set_vendor_badges','vendors',target,jsonb_build_object('badges',badge_values));
end $$;

revoke all on function kendurikita.set_vendor_badges(uuid,text[]) from public;
grant execute on function kendurikita.set_vendor_badges(uuid,text[]) to authenticated;
