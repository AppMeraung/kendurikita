alter table kendurikita.vendors add column badges text[] not null default '{}';
alter table kendurikita.vendors add column logo_url text;
alter table kendurikita.vendors add column cover_url text;
alter table kendurikita.vendor_reviews add constraint reviews_vendor_event_unique unique(vendor_id,event_id);

create or replace function kendurikita.protect_vendor_moderation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'authenticated' and not kendurikita.is_admin() then
    if tg_op = 'INSERT' then
      new.verification_status := 'pending';
      new.rejection_reason := null;
      new.badges := '{}';
    else
      new.badges := old.badges;
      if new.verification_documents is distinct from old.verification_documents then
        new.verification_status := 'pending';
        new.rejection_reason := null;
      else
        new.verification_status := old.verification_status;
        new.rejection_reason := old.rejection_reason;
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger protect_vendor_moderation_fields
  before insert or update on kendurikita.vendors
  for each row execute function kendurikita.protect_vendor_moderation();

drop policy if exists reviews_member_insert on kendurikita.vendor_reviews;
create policy reviews_verified_booking_insert on kendurikita.vendor_reviews
  for insert with check(
    author_id = auth.uid()
    and kendurikita.is_event_member(event_id)
    and exists(
      select 1 from kendurikita.leads l
      where l.vendor_id = vendor_id and l.event_id = event_id
        and l.sender_id = auth.uid() and l.status = 'confirmed'
    )
  );

create or replace function kendurikita.reply_to_vendor_review(target uuid, response text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists(
    select 1 from kendurikita.vendor_reviews r
    join kendurikita.vendors v on v.id=r.vendor_id
    where r.id=target and v.owner_id=auth.uid()
  ) then raise exception 'not_allowed'; end if;
  update kendurikita.vendor_reviews set reply=nullif(btrim(response),'') where id=target;
end $$;
revoke all on function kendurikita.reply_to_vendor_review(uuid,text) from public;
grant execute on function kendurikita.reply_to_vendor_review(uuid,text) to authenticated;
