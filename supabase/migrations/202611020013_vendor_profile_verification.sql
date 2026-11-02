alter table kendurikita.vendors add constraint vendors_owner_unique unique(owner_id);
alter table kendurikita.vendors add column owner_name text;
alter table kendurikita.vendors add column founded_year integer check(founded_year between 1800 and 2200);
alter table kendurikita.vendors add column languages text[] not null default '{}';
alter table kendurikita.vendors add column social_links jsonb not null default '{}';
alter table kendurikita.vendors add column verification_documents jsonb not null default '{}';

insert into storage.buckets(id,name,public)
values ('vendor-verification','vendor-verification',false)
on conflict(id) do nothing;

create policy vendor_verification_owner_read on storage.objects
  for select to authenticated using(
    bucket_id = 'vendor-verification'
    and exists(select 1 from kendurikita.vendors v where v.id=((storage.foldername(name))[1])::uuid and v.owner_id=auth.uid())
  );
create policy vendor_verification_owner_insert on storage.objects
  for insert to authenticated with check(
    bucket_id = 'vendor-verification'
    and exists(select 1 from kendurikita.vendors v where v.id=((storage.foldername(name))[1])::uuid and v.owner_id=auth.uid())
  );
create policy vendor_verification_owner_update on storage.objects
  for update to authenticated using(
    bucket_id = 'vendor-verification'
    and exists(select 1 from kendurikita.vendors v where v.id=((storage.foldername(name))[1])::uuid and v.owner_id=auth.uid())
  );
create policy vendor_verification_admin_read on storage.objects
  for select to authenticated using(bucket_id='vendor-verification' and kendurikita.is_admin());
