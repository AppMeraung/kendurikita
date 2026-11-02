alter table kendurikita.vendor_packages add column coverage jsonb not null default '[]';
alter table kendurikita.vendor_packages add column travel_charge numeric(14,2) not null default 0 check(travel_charge >= 0);
alter table kendurikita.vendor_availability add column note text;
alter table kendurikita.vendor_availability add constraint availability_valid_range check(ends_at > starts_at);

create or replace function kendurikita.prevent_vendor_booking_overlap()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status in ('tentative','booked') and exists(
    select 1 from kendurikita.vendor_availability a
    where a.vendor_id = new.vendor_id and a.id <> new.id
      and a.status in ('tentative','booked')
      and a.starts_at < new.ends_at and a.ends_at > new.starts_at
  ) then raise exception 'availability_conflict'; end if;
  return new;
end $$;
create trigger vendor_availability_no_overlap
  before insert or update on kendurikita.vendor_availability
  for each row execute function kendurikita.prevent_vendor_booking_overlap();
