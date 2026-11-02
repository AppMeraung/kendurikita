create table kendurikita.vendor_profile_views (
  id bigint generated always as identity primary key,
  vendor_id uuid not null references kendurikita.vendors(id) on delete cascade,
  viewer_id uuid references kendurikita.profiles(id) on delete set null,
  viewed_at timestamptz not null default now()
);
create table kendurikita.vendor_package_views (
  id bigint generated always as identity primary key,
  package_id uuid not null references kendurikita.vendor_packages(id) on delete cascade,
  viewer_id uuid references kendurikita.profiles(id) on delete set null,
  viewed_at timestamptz not null default now()
);
alter table kendurikita.vendor_profile_views enable row level security;
alter table kendurikita.vendor_package_views enable row level security;
create policy vendor_profile_view_owner on kendurikita.vendor_profile_views for select using(exists(select 1 from kendurikita.vendors v where v.id=vendor_id and v.owner_id=auth.uid()));
create policy vendor_package_view_owner on kendurikita.vendor_package_views for select using(exists(select 1 from kendurikita.vendor_packages p join kendurikita.vendors v on v.id=p.vendor_id where p.id=package_id and v.owner_id=auth.uid()));

create or replace function kendurikita.record_vendor_profile_view(target uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from kendurikita.vendors where id=target and verification_status='approved') then raise exception 'vendor_not_found'; end if;
  if not exists(select 1 from kendurikita.vendor_profile_views where vendor_id=target and viewer_id is not distinct from auth.uid() and viewed_at>now()-interval '30 minutes') then
    insert into kendurikita.vendor_profile_views(vendor_id,viewer_id) values(target,auth.uid());
  end if;
end $$;
grant execute on function kendurikita.record_vendor_profile_view(uuid) to anon,authenticated;

create or replace function kendurikita.record_vendor_package_views(target uuid, packages uuid[])
returns void language plpgsql security definer set search_path='' as $$
begin
  insert into kendurikita.vendor_package_views(package_id,viewer_id)
  select p.id,auth.uid() from kendurikita.vendor_packages p where p.vendor_id=target and p.id=any(packages)
    and not exists(select 1 from kendurikita.vendor_package_views x where x.package_id=p.id and x.viewer_id is not distinct from auth.uid() and x.viewed_at>now()-interval '30 minutes');
end $$;
grant execute on function kendurikita.record_vendor_package_views(uuid,uuid[]) to anon,authenticated;

create index vendor_profile_views_vendor_date on kendurikita.vendor_profile_views(vendor_id,viewed_at);
create index vendor_package_views_package_date on kendurikita.vendor_package_views(package_id,viewed_at);
