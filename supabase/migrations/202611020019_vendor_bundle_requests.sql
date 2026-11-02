alter table kendurikita.vendor_bundles add column description text;
alter table kendurikita.vendor_bundles add column commission_enabled boolean not null default false;

create table kendurikita.vendor_bundle_requests (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references kendurikita.vendor_bundles(id) on delete cascade,
  event_id uuid not null references kendurikita.events(id) on delete cascade,
  sender_id uuid not null references kendurikita.profiles(id),
  message text not null,
  status text not null default 'new' check(status in ('new','contacted','confirmed','lost')),
  created_at timestamptz not null default now(),
  unique(bundle_id,event_id)
);
alter table kendurikita.vendor_bundle_requests enable row level security;

create policy bundle_members_owner_write on kendurikita.vendor_bundle_members
  for all using(
    exists(
      select 1 from kendurikita.vendor_bundles b
      join kendurikita.vendors v on v.id=b.owner_vendor_id
      where b.id=bundle_id and v.owner_id=auth.uid()
    )
  ) with check(
    exists(
      select 1 from kendurikita.vendor_bundles b
      join kendurikita.vendors v on v.id=b.owner_vendor_id
      where b.id=bundle_id and v.owner_id=auth.uid()
    )
  );
create policy bundle_requests_sender_read on kendurikita.vendor_bundle_requests
  for select using(sender_id=auth.uid());
create policy bundle_requests_member_insert on kendurikita.vendor_bundle_requests
  for insert with check(
    sender_id=auth.uid() and kendurikita.is_event_member(event_id)
    and exists(select 1 from kendurikita.vendor_bundles b where b.id=bundle_id and b.active)
  );
create policy bundle_requests_vendor_read on kendurikita.vendor_bundle_requests
  for select using(
    exists(
      select 1 from kendurikita.vendor_bundle_members bm
      join kendurikita.vendors v on v.id=bm.vendor_id
      where bm.bundle_id=bundle_id and v.owner_id=auth.uid()
    )
  );
create policy bundle_requests_owner_update on kendurikita.vendor_bundle_requests
  for update using(
    exists(
      select 1 from kendurikita.vendor_bundles b
      join kendurikita.vendors v on v.id=b.owner_vendor_id
      where b.id=bundle_id and v.owner_id=auth.uid()
    )
  ) with check(
    exists(
      select 1 from kendurikita.vendor_bundles b
      join kendurikita.vendors v on v.id=b.owner_vendor_id
      where b.id=bundle_id and v.owner_id=auth.uid()
    )
  );
grant select,insert,update,delete on kendurikita.vendor_bundle_members to authenticated;
grant select,insert,update on kendurikita.vendor_bundle_requests to authenticated;
