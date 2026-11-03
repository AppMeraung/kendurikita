-- Close a privilege escalation: profiles_self let any signed-in user set their own role to 'admin'.
-- Users may still switch themselves between 'user' and 'vendor'; only an admin (or the database
-- owner / service role, e.g. the SQL editor or edge functions) may grant or remove 'admin'.
-- Invoker rights on purpose: current_user is the API role ('authenticated'/'anon') for client calls.
create or replace function kendurikita.guard_profile_role()
returns trigger language plpgsql set search_path='' as $$
begin
  if current_user in ('authenticated', 'anon')
    and (new.role = 'admin' or (tg_op = 'UPDATE' and old.role = 'admin'))
    and (tg_op = 'INSERT' or new.role is distinct from old.role)
    and not kendurikita.is_admin() then
    raise exception 'role_change_forbidden';
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_role on kendurikita.profiles;
create trigger guard_profile_role before insert or update of role on kendurikita.profiles
  for each row execute function kendurikita.guard_profile_role();
