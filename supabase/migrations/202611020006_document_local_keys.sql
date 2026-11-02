alter table kendurikita.documents add column local_key text;
update kendurikita.documents set local_key = id::text where local_key is null;
alter table kendurikita.documents alter column local_key set not null;
alter table kendurikita.documents add constraint documents_event_local_unique unique(event_id, local_key);

create policy event_docs_editor_update on storage.objects
  for update to authenticated using(
    bucket_id = 'event-docs'
    and kendurikita.can_edit_event(((storage.foldername(name))[1])::uuid)
  );
create policy event_docs_editor_delete on storage.objects
  for delete to authenticated using(
    bucket_id = 'event-docs'
    and kendurikita.can_edit_event(((storage.foldername(name))[1])::uuid)
  );
