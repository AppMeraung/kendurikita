-- Product listings for kendurikita.com: category fields, variants, quantity pricing, gallery,
-- booking terms and draft/publish. Existing rows stay published so the mobile app is unaffected.
alter table kendurikita.vendor_packages
  add column if not exists category text,
  add column if not exists description text not null default '',
  add column if not exists attributes jsonb not null default '{}',
  add column if not exists variants jsonb not null default '[]',
  add column if not exists pricing_tiers jsonb not null default '[]',
  add column if not exists extras jsonb not null default '[]',
  add column if not exists images jsonb not null default '[]',
  add column if not exists unit text not null default 'unit',
  add column if not exists min_qty integer check (min_qty is null or min_qty >= 1),
  add column if not exists max_qty integer check (max_qty is null or max_qty >= 1),
  add column if not exists lead_days integer not null default 0 check (lead_days >= 0),
  add column if not exists pickup boolean not null default false,
  add column if not exists delivery boolean not null default false,
  add column if not exists delivery_fee numeric(14,2) not null default 0 check (delivery_fee >= 0),
  add column if not exists status text not null default 'published' check (status in ('draft','pending_review','published')),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Same rules as publishProblems() in product.js; drafts may be incomplete.
create or replace function kendurikita.validate_vendor_package()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  new.updated_at := now();
  if jsonb_typeof(new.variants)<>'array' or jsonb_typeof(new.pricing_tiers)<>'array' or jsonb_typeof(new.extras)<>'array' or jsonb_typeof(new.images)<>'array' then
    raise exception 'listing_invalid: senarai tidak sah';
  end if;
  if exists(select 1 from jsonb_array_elements(new.variants) where coalesce(trim(value->>'name'),'')='' or (value->>'price')::numeric < 0)
    or exists(select 1 from jsonb_array_elements(new.pricing_tiers) where (value->>'min_qty')::numeric < 1 or (value->>'unit_price')::numeric < 0)
    or exists(select 1 from jsonb_array_elements(new.extras) where coalesce(trim(value->>'name'),'')='' or (value->>'price')::numeric < 0) then
    raise exception 'listing_invalid: harga tidak sah';
  end if;
  if new.min_qty is not null and new.max_qty is not null and new.max_qty < new.min_qty then
    raise exception 'listing_invalid: maksimum kurang daripada minimum';
  end if;
  if new.status in ('published','pending_review') then
    -- Web listings carry a category; older app packages (no category) keep their simpler rules.
    if new.category is not null and (trim(new.name)='' or trim(new.description)='' or jsonb_array_length(new.images)=0
      or (new.price <= 0 and jsonb_array_length(new.variants)=0)) then
      raise exception 'listing_incomplete: lengkapkan nama, kategori, penerangan, gambar dan harga';
    end if;
    -- Listings from vendors not yet approved wait for review instead of going live.
    if not exists(select 1 from kendurikita.vendors v where v.id=new.vendor_id and v.verification_status='approved') then
      new.status := 'pending_review';
    else
      new.status := 'published';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists validate_vendor_package on kendurikita.vendor_packages;
create trigger validate_vendor_package before insert or update on kendurikita.vendor_packages
  for each row execute function kendurikita.validate_vendor_package();

-- When a vendor is approved, its waiting listings go live.
create or replace function kendurikita.publish_pending_packages()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.verification_status='approved' and old.verification_status is distinct from 'approved' then
    update kendurikita.vendor_packages set status='published' where vendor_id=new.id and status='pending_review';
  end if;
  return new;
end $$;
drop trigger if exists publish_pending_packages on kendurikita.vendors;
create trigger publish_pending_packages after update of verification_status on kendurikita.vendors
  for each row execute function kendurikita.publish_pending_packages();

-- Customers only see active, published listings of approved vendors; owners see all of their own.
drop policy if exists vendor_packages_public_read on kendurikita.vendor_packages;
create policy vendor_packages_public_read on kendurikita.vendor_packages for select using (
  (active and status='published' and exists(select 1 from kendurikita.vendors v where v.id=vendor_id and v.verification_status='approved'))
  or exists(select 1 from kendurikita.vendors v where v.id=vendor_id and v.owner_id=auth.uid())
);

-- Server-side price for a customer's choice. Mirrors quote() in product.js.
create or replace function kendurikita.quote_package_json(listing jsonb, variant text, qty integer, chosen_extras text[], with_delivery boolean)
returns jsonb language plpgsql immutable set search_path='' as $$
declare
  errors text[] := '{}';
  chosen jsonb;
  tier jsonb;
  unit_price numeric;
  subtotal numeric;
  extra_total numeric;
  delivery_fee numeric;
  min_qty integer := nullif(listing->>'min_qty','')::integer;
  max_qty integer := nullif(listing->>'max_qty','')::integer;
  has_variants boolean := jsonb_array_length(coalesce(listing->'variants','[]'))>0;
begin
  variant := coalesce(variant,'');
  if qty is null or qty < 1 then errors := errors || 'Kuantiti tidak sah.'::text; end if;
  if min_qty is not null and qty < min_qty then errors := errors || format('Minimum tempahan %s.', min_qty); end if;
  if max_qty is not null and qty > max_qty then errors := errors || format('Maksimum tempahan %s.', max_qty); end if;
  select value into chosen from jsonb_array_elements(coalesce(listing->'variants','[]')) where value->>'name'=variant limit 1;
  if variant<>'' and chosen is null then errors := errors || 'Pilihan tidak dijumpai.'::text; end if;
  if variant='' and has_variants then errors := errors || 'Sila pilih satu pilihan.'::text; end if;
  unit_price := coalesce((chosen->>'price')::numeric, (listing->>'price')::numeric, 0);
  select value into tier from jsonb_array_elements(coalesce(listing->'pricing_tiers','[]'))
    where (coalesce(value->>'variant','')='' or value->>'variant'=variant) and coalesce(qty,0) >= (value->>'min_qty')::numeric
    order by (value->>'min_qty')::numeric desc, (coalesce(value->>'variant','')<>'') desc limit 1;
  if tier is not null then unit_price := (tier->>'unit_price')::numeric; end if;
  subtotal := case when listing->>'price_type' in ('per_unit','per_pax') then unit_price * greatest(coalesce(qty,0),0) else unit_price end;
  select coalesce(sum((value->>'price')::numeric),0) into extra_total from jsonb_array_elements(coalesce(listing->'extras','[]'))
    where value->>'name' = any(coalesce(chosen_extras,'{}'));
  delivery_fee := case when with_delivery then coalesce((listing->>'delivery_fee')::numeric,0) else 0 end;
  return jsonb_build_object('unitPrice', round(unit_price,2), 'subtotal', round(subtotal,2), 'extras', round(extra_total,2),
    'delivery', round(delivery_fee,2), 'total', round(subtotal+extra_total+delivery_fee,2), 'errors', to_jsonb(errors));
end $$;

-- Public entry point: prices a published listing by id.
create or replace function kendurikita.quote_package(package_id uuid, variant text default '', qty integer default 1, extras text[] default '{}', delivery boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
  -- Positional params: extras/delivery are also column names on vendor_packages.
  select kendurikita.quote_package_json(to_jsonb(p), $2, $3, $4, $5)
  from kendurikita.vendor_packages p join kendurikita.vendors v on v.id=p.vendor_id
  where p.id=$1 and p.active and p.status='published' and v.verification_status='approved'
$$;
revoke all on function kendurikita.quote_package(uuid,text,integer,text[],boolean) from public;
grant execute on function kendurikita.quote_package(uuid,text,integer,text[],boolean) to anon, authenticated;

-- Indexes for marketplace reads at scale (thousands of vendors): RLS checks and listing pages
-- filter on these columns, and without them every request scans the whole table.
create index if not exists vendor_packages_vendor_idx on kendurikita.vendor_packages (vendor_id);
create index if not exists vendor_packages_public_idx on kendurikita.vendor_packages (status, active, category, updated_at desc);
create index if not exists vendor_portfolio_vendor_idx on kendurikita.vendor_portfolio (vendor_id, sort_order);
create index if not exists subscriptions_vendor_idx on kendurikita.subscriptions (vendor_id, status);
create index if not exists vendors_status_idx on kendurikita.vendors (verification_status, created_at desc);
create index if not exists leads_vendor_idx on kendurikita.leads (vendor_id, status);
