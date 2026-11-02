create table kendurikita.event_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references kendurikita.events(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  role kendurikita.member_role not null check(role<>'owner'),
  invited_by uuid not null references kendurikita.profiles(id),
  expires_at timestamptz not null default now()+interval '7 days',
  accepted_by uuid references kendurikita.profiles(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table kendurikita.event_invites enable row level security;
create policy event_invites_owner_read on kendurikita.event_invites
  for select using(kendurikita.is_event_owner(event_id));

create or replace function kendurikita.create_event_invite(target_event uuid, target_role kendurikita.member_role)
returns uuid language plpgsql security definer set search_path='' as $$
declare invite_token uuid;
begin
  if not kendurikita.is_event_owner(target_event) then raise exception 'owner_required' using errcode='42501'; end if;
  if target_role='owner' then raise exception 'invalid_role'; end if;
  if target_role='parent' and kendurikita.event_plan(target_event)='basic' then raise exception 'pro_required'; end if;
  insert into kendurikita.event_invites(event_id,role,invited_by)
    values(target_event,target_role,auth.uid()) returning token into invite_token;
  return invite_token;
end $$;

create or replace function kendurikita.accept_event_invite(invite_token uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare invite kendurikita.event_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into invite from kendurikita.event_invites where token=invite_token for update;
  if invite.id is null or invite.expires_at<=now() then raise exception 'invite_invalid_or_expired'; end if;
  if invite.accepted_by is not null and invite.accepted_by<>auth.uid() then raise exception 'invite_already_used'; end if;
  insert into kendurikita.event_members(event_id,user_id,role,invited_by)
    values(invite.event_id,auth.uid(),invite.role,invite.invited_by)
    on conflict(event_id,user_id) do nothing;
  update kendurikita.event_invites set accepted_by=auth.uid(),accepted_at=coalesce(accepted_at,now()) where id=invite.id;
  return invite.event_id;
end $$;

revoke all on function kendurikita.create_event_invite(uuid,kendurikita.member_role) from public;
revoke all on function kendurikita.accept_event_invite(uuid) from public,anon;
grant execute on function kendurikita.create_event_invite(uuid,kendurikita.member_role), kendurikita.accept_event_invite(uuid) to authenticated;
