alter table kendurikita.vendor_reviews
  add column if not exists photo_paths text[] not null default '{}';

alter table kendurikita.vendor_reviews
  add constraint vendor_reviews_photo_limit check(cardinality(photo_paths)<=3);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('review-media','review-media',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create policy review_media_author_insert on storage.objects
  for insert to authenticated with check(bucket_id='review-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy review_media_author_update on storage.objects
  for update to authenticated using(bucket_id='review-media' and owner_id=auth.uid()::text)
  with check(bucket_id='review-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy review_media_author_delete on storage.objects
  for delete to authenticated using(bucket_id='review-media' and owner_id=auth.uid()::text);
