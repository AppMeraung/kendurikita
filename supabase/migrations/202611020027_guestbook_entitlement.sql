drop function if exists kendurikita.get_public_invitation(uuid);
create function kendurikita.get_public_invitation(token uuid)
returns table(
  guest_id uuid,guest_name text,invited_pax integer,event_name text,event_date date,
  venue text,invitation_language text,invitation_template text,invitation_content jsonb,
  gallery_enabled boolean,guestbook_enabled boolean
) language sql stable security definer set search_path='' as $$
  select g.id,g.name,g.pax,e.name,nullif(e.event_dates->>0,'')::date,
    coalesce(e.venue->>'name',''),coalesce(i.language,p.preferred_language,'ms'),
    coalesce(i.template_id,'malay'),coalesce(i.content,'{}'::jsonb),
    kendurikita.event_plan(e.id)='premium',kendurikita.event_plan(e.id)<>'basic'
  from kendurikita.guests g join kendurikita.events e on e.id=g.event_id
  left join kendurikita.invitations i on i.guest_id=g.id
  left join kendurikita.profiles p on p.id=e.owner_id
  where g.invitation_token=token limit 1;
$$;

create or replace function kendurikita.submit_public_rsvp(token uuid,is_attending boolean,response_pax integer,dietary_note text default null,guest_message text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare target uuid; invited integer; target_event uuid; created uuid; allowed_message text;
begin
  select g.id,g.pax,g.event_id into target,invited,target_event from kendurikita.guests g where g.invitation_token=token;
  if target is null then raise exception 'invalid_token'; end if;
  if response_pax<1 or response_pax>invited then raise exception 'invalid_pax'; end if;
  allowed_message:=case when kendurikita.event_plan(target_event)<>'basic' then nullif(left(trim(guest_message),1000),'') else null end;
  insert into kendurikita.rsvps(guest_id,attending,pax,dietary,message) values(target,is_attending,response_pax,nullif(left(trim(dietary_note),500),''),allowed_message) returning id into created;
  update kendurikita.guests set rsvp_status=case when is_attending then 'attending' else 'declined' end where id=target;
  return created;
end $$;
grant execute on function kendurikita.get_public_invitation(uuid),kendurikita.submit_public_rsvp(uuid,boolean,integer,text,text) to anon,authenticated;
