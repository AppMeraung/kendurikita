create table kendurikita.day_notes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references kendurikita.events(id) on delete cascade,
  local_key text not null,
  title text not null,
  detail text not null,
  created_at timestamptz not null default now(),
  unique(event_id, local_key)
);

alter table kendurikita.day_notes enable row level security;

create policy day_notes_member_read on kendurikita.day_notes
  for select to authenticated using (kendurikita.is_event_member(event_id));
create policy day_notes_editor_insert on kendurikita.day_notes
  for insert to authenticated with check (
    kendurikita.can_edit_event(event_id)
    and kendurikita.event_plan(event_id) <> 'basic'
  );
create policy day_notes_editor_update on kendurikita.day_notes
  for update to authenticated using (
    kendurikita.can_edit_event(event_id)
    and kendurikita.event_plan(event_id) <> 'basic'
  ) with check (
    kendurikita.can_edit_event(event_id)
    and kendurikita.event_plan(event_id) <> 'basic'
  );
create policy day_notes_editor_delete on kendurikita.day_notes
  for delete to authenticated using (
    kendurikita.can_edit_event(event_id)
    and kendurikita.event_plan(event_id) <> 'basic'
  );

grant select, insert, update, delete on kendurikita.day_notes to authenticated;
alter publication supabase_realtime add table kendurikita.day_notes;
