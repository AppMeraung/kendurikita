alter table kendurikita.events add column post_event jsonb not null default '{}';

create table kendurikita.event_gallery (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references kendurikita.events(id) on delete cascade,
  guest_id uuid references kendurikita.guests(id) on delete set null,
  uploader_id uuid references kendurikita.profiles(id) on delete set null,
  storage_path text not null unique,
  caption text,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);
alter table kendurikita.event_gallery enable row level security;

create policy event_gallery_member_read on kendurikita.event_gallery
  for select using(kendurikita.is_event_member(event_id));
create policy event_gallery_member_write on kendurikita.event_gallery
  for all using(kendurikita.can_edit_event(event_id))
  with check(kendurikita.can_edit_event(event_id));

create policy rsvps_member_read on kendurikita.rsvps
  for select using(exists(
    select 1 from kendurikita.guests g
    where g.id = rsvps.guest_id and kendurikita.is_event_member(g.event_id)
  ));

create policy guest_gallery_editor_delete on storage.objects
  for delete to authenticated using(
    bucket_id = 'guest-gallery'
    and kendurikita.can_edit_event(((storage.foldername(name))[1])::uuid)
  );

grant select, insert, update, delete on kendurikita.event_gallery to authenticated;
