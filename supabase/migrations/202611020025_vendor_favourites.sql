create table kendurikita.vendor_favourites (
  user_id uuid not null references kendurikita.profiles(id) on delete cascade,
  vendor_id uuid not null references kendurikita.vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,vendor_id)
);
alter table kendurikita.vendor_favourites enable row level security;
create policy vendor_favourites_self on kendurikita.vendor_favourites for all using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,delete on kendurikita.vendor_favourites to authenticated;
