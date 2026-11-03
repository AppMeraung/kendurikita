-- Web enquiries: kendurikita.com visitors do not sign in, so each WhatsApp or email tap on a product or
-- vendor page is logged here (no personal data) for the vendor's dashboard and analytics.
-- Promo: public count of launch-price slots left, so the plans page can close the promo by itself.

create table if not exists kendurikita.web_enquiries (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references kendurikita.vendors(id) on delete cascade,
  package_id uuid references kendurikita.vendor_packages(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'email')),
  created_at timestamptz not null default now()
);
create index if not exists web_enquiries_vendor_idx on kendurikita.web_enquiries(vendor_id, created_at desc);
alter table kendurikita.web_enquiries enable row level security;
create policy web_enquiries_owner_read on kendurikita.web_enquiries
  for select using (kendurikita.owns_vendor(vendor_id) or kendurikita.is_admin());
-- No insert policy: rows arrive only through log_web_enquiry below.

create or replace function kendurikita.log_web_enquiry(target_vendor uuid, target_package uuid default null, via text default 'whatsapp')
returns void language plpgsql security definer set search_path='' as $$
begin
  if via not in ('whatsapp', 'email') then return; end if;
  if not exists(select 1 from kendurikita.vendors where id=target_vendor and verification_status='approved') then return; end if;
  if target_package is not null and not exists(select 1 from kendurikita.vendor_packages where id=target_package and vendor_id=target_vendor) then
    target_package := null;
  end if;
  -- Caps bursts so repeated taps cannot inflate a vendor's numbers.
  if (select count(*) from kendurikita.web_enquiries where vendor_id=target_vendor and created_at > now() - interval '1 minute') >= 10 then return; end if;
  insert into kendurikita.web_enquiries(vendor_id, package_id, channel) values (target_vendor, target_package, via);
end $$;

-- Launch price is for the first 50 vendors who take a paid plan; a lapsed plan keeps its slot.
create or replace function kendurikita.promo_slots_left()
returns integer language sql stable security definer set search_path='' as $$
  select greatest(0, 50 - count(distinct vendor_id))::integer
  from kendurikita.subscriptions
  where vendor_id is not null and entitlement ~* '(pro|premium)';
$$;

revoke all on function kendurikita.log_web_enquiry(uuid, uuid, text), kendurikita.promo_slots_left() from public;
grant execute on function kendurikita.log_web_enquiry(uuid, uuid, text), kendurikita.promo_slots_left() to anon, authenticated;
grant select on kendurikita.web_enquiries to authenticated;
