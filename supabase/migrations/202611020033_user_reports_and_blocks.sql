alter table kendurikita.moderation_reports drop constraint if exists moderation_reports_target_type_check;
alter table kendurikita.moderation_reports add constraint moderation_reports_target_type_check
  check(target_type in ('vendor','review','portfolio','user','message'));
create unique index moderation_reports_open_once
  on kendurikita.moderation_reports(reporter_id,target_type,target_id)
  where status in ('open','reviewing');

drop policy if exists reports_author_insert on kendurikita.moderation_reports;
create policy reports_author_insert on kendurikita.moderation_reports
  for insert with check(
    reporter_id=auth.uid() and (
      (target_type='vendor' and exists(select 1 from kendurikita.vendors v where v.id=target_id and v.verification_status='approved'))
      or (target_type='review' and exists(select 1 from kendurikita.vendor_reviews r where r.id=target_id and r.verified))
      or (target_type='portfolio' and exists(select 1 from kendurikita.vendor_portfolio p join kendurikita.vendors v on v.id=p.vendor_id where p.id=target_id and v.verification_status='approved'))
      or (target_type='user' and target_id<>auth.uid())
      or (target_type='message' and exists(
        select 1 from kendurikita.messages m join kendurikita.leads l on l.id=m.lead_id join kendurikita.vendors v on v.id=l.vendor_id
        where m.id=target_id and (l.sender_id=auth.uid() or v.owner_id=auth.uid())
      ))
    )
  );

create table kendurikita.user_blocks (
  blocker_id uuid not null references kendurikita.profiles(id) on delete cascade,
  blocked_id uuid not null references kendurikita.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id, blocked_id),
  check(blocker_id <> blocked_id)
);
alter table kendurikita.user_blocks enable row level security;
create policy blocks_self_manage on kendurikita.user_blocks
  for all using(blocker_id = auth.uid()) with check(blocker_id = auth.uid());
grant select, insert, delete on kendurikita.user_blocks to authenticated;

create or replace function kendurikita.get_chat_safety_context(target_lead uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare customer uuid; vendor_owner uuid; other_user uuid; other_name text;
begin
  select l.sender_id, v.owner_id into customer, vendor_owner
  from kendurikita.leads l join kendurikita.vendors v on v.id=l.vendor_id
  where l.id=target_lead;
  if auth.uid()=customer then other_user:=vendor_owner;
  elsif auth.uid()=vendor_owner then other_user:=customer;
  else raise exception 'not_chat_party' using errcode='42501';
  end if;
  select nullif(p.name,'') into other_name from kendurikita.profiles p where p.id=other_user;
  return jsonb_build_object(
    'other_user_id', other_user,
    'other_name', coalesce(other_name,'KenduriKita user'),
    'blocked_by_me', exists(select 1 from kendurikita.user_blocks b where b.blocker_id=auth.uid() and b.blocked_id=other_user),
    'blocked_me', exists(select 1 from kendurikita.user_blocks b where b.blocker_id=other_user and b.blocked_id=auth.uid())
  );
end $$;

create or replace function kendurikita.set_chat_party_block(target_lead uuid, should_block boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare context jsonb; other_user uuid;
begin
  context := kendurikita.get_chat_safety_context(target_lead);
  other_user := (context->>'other_user_id')::uuid;
  if should_block then
    insert into kendurikita.user_blocks(blocker_id,blocked_id) values(auth.uid(),other_user) on conflict do nothing;
  else
    delete from kendurikita.user_blocks where blocker_id=auth.uid() and blocked_id=other_user;
  end if;
end $$;

drop policy if exists messages_party_insert on kendurikita.messages;
create policy messages_party_insert on kendurikita.messages
  for insert with check(
    sender_id = auth.uid()
    and exists(
      select 1 from kendurikita.leads l join kendurikita.vendors v on v.id=l.vendor_id
      where l.id=lead_id
        and (l.sender_id=auth.uid() or v.owner_id=auth.uid())
        and not exists(
          select 1 from kendurikita.user_blocks b
          where (b.blocker_id=l.sender_id and b.blocked_id=v.owner_id)
             or (b.blocker_id=v.owner_id and b.blocked_id=l.sender_id)
        )
    )
  );

revoke all on function kendurikita.get_chat_safety_context(uuid) from public;
revoke all on function kendurikita.set_chat_party_block(uuid,boolean) from public;
grant execute on function kendurikita.get_chat_safety_context(uuid), kendurikita.set_chat_party_block(uuid,boolean) to authenticated;
