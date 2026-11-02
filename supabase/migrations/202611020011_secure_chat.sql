drop policy if exists messages_parties_update on kendurikita.messages;
alter table kendurikita.messages add constraint message_content_present
  check(nullif(btrim(body),'') is not null or attachment_path is not null);

create or replace function kendurikita.mark_lead_messages_read(target uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare changed integer; begin
  if not exists(
    select 1 from kendurikita.leads l
    left join kendurikita.vendors v on v.id = l.vendor_id
    where l.id = target and (l.sender_id = auth.uid() or v.owner_id = auth.uid())
  ) then raise exception 'not_allowed'; end if;
  update kendurikita.messages
    set read_at = now()
    where lead_id = target and sender_id <> auth.uid() and read_at is null;
  get diagnostics changed = row_count;
  return changed;
end $$;
grant execute on function kendurikita.mark_lead_messages_read(uuid) to authenticated;

insert into storage.buckets(id,name,public)
values ('chat-attachments','chat-attachments',false)
on conflict(id) do nothing;

create policy chat_attachments_parties_read on storage.objects
  for select to authenticated using(
    bucket_id = 'chat-attachments'
    and exists(
      select 1 from kendurikita.leads l
      left join kendurikita.vendors v on v.id = l.vendor_id
      where l.id = ((storage.foldername(name))[1])::uuid
        and (l.sender_id = auth.uid() or v.owner_id = auth.uid())
    )
  );
create policy chat_attachments_parties_insert on storage.objects
  for insert to authenticated with check(
    bucket_id = 'chat-attachments'
    and exists(
      select 1 from kendurikita.leads l
      left join kendurikita.vendors v on v.id = l.vendor_id
      where l.id = ((storage.foldername(name))[1])::uuid
        and (l.sender_id = auth.uid() or v.owner_id = auth.uid())
    )
  );
create policy chat_attachments_parties_delete on storage.objects
  for delete to authenticated using(
    bucket_id = 'chat-attachments'
    and exists(
      select 1 from kendurikita.leads l
      left join kendurikita.vendors v on v.id = l.vendor_id
      where l.id = ((storage.foldername(name))[1])::uuid
        and (l.sender_id = auth.uid() or v.owner_id = auth.uid())
    )
  );
