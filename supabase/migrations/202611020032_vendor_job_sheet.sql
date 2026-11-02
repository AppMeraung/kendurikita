create or replace function kendurikita.get_vendor_job_sheet(target_lead uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'lead_id', l.id,
    'event', jsonb_build_object(
      'name', e.name,
      'type', e.event_type,
      'dates', e.event_dates,
      'venue', e.venue,
      'estimated_guests', e.estimated_guests
    ),
    'timeline', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', t.title,
        'starts_at', t.starts_at,
        'ends_at', t.ends_at,
        'pic_name', t.pic_name,
        'note', t.note
      ) order by t.sort_order, t.starts_at nulls last)
      from kendurikita.timeline_items t where t.event_id = e.id
    ), '[]'::jsonb),
    'contacts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', c.name,
        'role', c.role,
        'phone', c.phone
      ) order by c.name)
      from kendurikita.team_contacts c
      where c.event_id = e.id and nullif(c.phone, '') is not null
    ), '[]'::jsonb)
  ) into result
  from kendurikita.leads l
  join kendurikita.vendors v on v.id = l.vendor_id
  join kendurikita.events e on e.id = l.event_id
  where l.id = target_lead
    and l.status = 'confirmed'
    and v.owner_id = auth.uid();

  if result is null then
    raise exception 'confirmed_vendor_booking_required' using errcode = '42501';
  end if;
  return result;
end;
$$;

revoke all on function kendurikita.get_vendor_job_sheet(uuid) from public;
grant execute on function kendurikita.get_vendor_job_sheet(uuid) to authenticated;
