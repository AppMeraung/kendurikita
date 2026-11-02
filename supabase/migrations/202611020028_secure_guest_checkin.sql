create or replace function kendurikita.check_in_guest(
  target_event uuid,
  p_invitation_token uuid
) returns table(guest_name text, checked_in_pax bigint, invited_pax bigint)
language plpgsql
security definer
set search_path = kendurikita, public
as $$
declare
  matched_name text;
begin
  if not kendurikita.is_event_member(target_event) then
    raise exception 'Event access denied';
  end if;
  if kendurikita.event_plan(target_event) = 'basic' then
    raise exception 'pro_required';
  end if;

  update kendurikita.guests
  set checked_in_at = coalesce(checked_in_at, now())
  where event_id = target_event and guests.invitation_token = p_invitation_token
  returning name into matched_name;

  if matched_name is null then
    raise exception 'Guest QR is not valid for this event';
  end if;

  return query
  select matched_name,
    coalesce(sum(g.pax) filter (where g.checked_in_at is not null), 0)::bigint,
    coalesce(sum(g.pax), 0)::bigint
  from kendurikita.guests g
  where g.event_id = target_event;
end;
$$;

revoke all on function kendurikita.check_in_guest(uuid,uuid) from public, anon;
grant execute on function kendurikita.check_in_guest(uuid,uuid) to authenticated;
