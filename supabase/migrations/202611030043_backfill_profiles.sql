-- Auth is shared with other Meraung apps: accounts created before the auth_user_profile
-- trigger existed had no KenduriKita profile, so sign-in and vendor sign-up silently failed.
insert into kendurikita.profiles(id,name,preferred_language,role)
select u.id,
  coalesce(u.raw_user_meta_data->>'name',''),
  case when u.raw_user_meta_data->>'language' in ('ms','en','zh','ta','id') then u.raw_user_meta_data->>'language' else 'ms' end,
  'user'
from auth.users u
where not exists (select 1 from kendurikita.profiles p where p.id=u.id)
on conflict (id) do nothing;
