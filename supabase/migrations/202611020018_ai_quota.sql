create or replace function kendurikita.consume_ai_quota(
  target_user uuid,
  target_month date,
  monthly_limit integer
) returns integer language plpgsql security definer set search_path='' as $$
declare used integer;
begin
  if auth.role() <> 'service_role' then raise exception 'not_allowed'; end if;
  insert into kendurikita.ai_usage(user_id,month,request_count)
    values(target_user,target_month,1)
    on conflict(user_id,month) do update
      set request_count=kendurikita.ai_usage.request_count+1
      where kendurikita.ai_usage.request_count < monthly_limit
    returning request_count into used;
  if used is null then raise exception 'monthly_limit'; end if;
  return used;
end $$;
revoke all on function kendurikita.consume_ai_quota(uuid,date,integer) from public,anon,authenticated;
grant execute on function kendurikita.consume_ai_quota(uuid,date,integer) to service_role;
