-- A ban used to wait for the open access token to expire (about 1 hour). This restrictive policy on every
-- kendurikita table shuts a banned user out of reads and writes on their next request.
-- shortcut: security definer RPCs skip RLS, so a banned user can still call them until the token expires.
create or replace function kendurikita.is_banned()
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((select banned_until > now() from auth.users where id = auth.uid()), false)
$$;
revoke all on function kendurikita.is_banned() from public, anon;
grant execute on function kendurikita.is_banned() to authenticated;

do $$
declare t text;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'kendurikita' and c.relkind = 'r' and c.relrowsecurity loop
    execute format('drop policy if exists not_banned on kendurikita.%I', t);
    execute format('create policy not_banned on kendurikita.%I as restrictive for all to authenticated
      using (not (select kendurikita.is_banned())) with check (not (select kendurikita.is_banned()))', t);
  end loop;
end $$;

-- Check: every RLS table should show a not_banned policy (expect 0 rows).
select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'kendurikita' and c.relkind = 'r' and c.relrowsecurity
  and not exists(select 1 from pg_policies p where p.schemaname = 'kendurikita' and p.tablename = c.relname and p.policyname = 'not_banned');
