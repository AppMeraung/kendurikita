alter table kendurikita.leads add column event_snapshot jsonb not null default '{}';

create or replace function kendurikita.respond_to_quotation(target uuid, response text)
returns text language plpgsql security definer set search_path = '' as $$
declare lead_target uuid; next_status text; begin
  if response not in ('accepted','rejected') then raise exception 'invalid_response'; end if;
  select q.lead_id into lead_target
  from kendurikita.quotations q
  join kendurikita.leads l on l.id = q.lead_id
  where q.id = target and l.sender_id = auth.uid();
  if lead_target is null then raise exception 'not_allowed'; end if;
  update kendurikita.quotations set status = response where id = target;
  next_status := case when response = 'accepted' then 'confirmed' else 'lost' end;
  update kendurikita.leads set status = next_status::kendurikita.lead_status where id = lead_target;
  return response;
end $$;

grant execute on function kendurikita.respond_to_quotation(uuid,text) to authenticated;
