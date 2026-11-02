alter table kendurikita.invitations
  add constraint invitations_event_guest_unique unique(event_id, guest_id);

insert into storage.buckets(id, name, public)
values ('invitation-media', 'invitation-media', true)
on conflict(id) do nothing;

create policy invitation_media_public_read on storage.objects
  for select using(bucket_id = 'invitation-media');
create policy invitation_media_editor_write on storage.objects
  for insert to authenticated with check(
    bucket_id = 'invitation-media'
    and kendurikita.can_edit_event(((storage.foldername(name))[1])::uuid)
  );
create policy invitation_media_editor_update on storage.objects
  for update to authenticated using(
    bucket_id = 'invitation-media'
    and kendurikita.can_edit_event(((storage.foldername(name))[1])::uuid)
  );
