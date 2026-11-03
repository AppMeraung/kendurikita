-- KenduriKita: jalankan sekali di Supabase > projek moto > SQL Editor. Selamat dijalankan berulang kali.
-- Mengandungi 051 (4 polisi keselamatan), 053 (data kekal selepas turun pakej), 054 (sorok lebihan kuota).

begin;

-- ===== 202611030051_fix_self_compare_policies.sql =====
-- Four policies compared a subquery column with itself (an unqualified column bound to the subquery's
-- own table), so their ownership check was always true. Each is recreated with the outer table named.
-- Also adds the two foreign-key indexes the admin and vendor dashboards scan.

drop policy if exists reviews_verified_booking_insert on kendurikita.vendor_reviews;
create policy reviews_verified_booking_insert on kendurikita.vendor_reviews for insert with check (
  author_id = auth.uid()
  and kendurikita.is_event_member(event_id)
  and exists(
    select 1 from kendurikita.leads l
    where l.vendor_id = vendor_reviews.vendor_id and l.event_id = vendor_reviews.event_id
      and l.sender_id = auth.uid() and l.status = 'confirmed'
  )
);

drop policy if exists quotations_vendor_insert on kendurikita.quotations;
create policy quotations_vendor_insert on kendurikita.quotations for insert with check (
  kendurikita.owns_vendor(vendor_id)
  and exists(select 1 from kendurikita.leads l where l.id = quotations.lead_id and l.vendor_id = quotations.vendor_id)
);

drop policy if exists contributions_parent_write on kendurikita.budget_contributions;
create policy contributions_parent_write on kendurikita.budget_contributions for insert with check (
  contributor_id = auth.uid()
  and kendurikita.event_plan(event_id) <> 'basic'
  and exists(
    select 1 from kendurikita.event_members m
    where m.event_id = budget_contributions.event_id and m.user_id = auth.uid()
      and m.role = any(array['owner','partner','parent']::kendurikita.member_role[])
  )
);

drop policy if exists bundle_requests_vendor_read on kendurikita.vendor_bundle_requests;
create policy bundle_requests_vendor_read on kendurikita.vendor_bundle_requests for select using (
  exists(
    select 1 from kendurikita.vendor_bundle_members bm
    join kendurikita.vendors v on v.id = bm.vendor_id
    where bm.bundle_id = vendor_bundle_requests.bundle_id and v.owner_id = auth.uid()
  )
);

create index if not exists payments_vendor_idx on kendurikita.payments(vendor_id);
create index if not exists leads_sender_idx on kendurikita.leads(sender_id);

-- ===== 202611030053_downgrade_keeps_data.sql =====
-- When a paid plan lapses nothing is deleted. Vendors keep editing everything they own, but cannot add past
-- the Basic limits, and the marketplace shows only the oldest listings and photos that fit the current plan.
-- Upgrading again shows everything at once.

-- Limits now apply when adding, never when editing an existing row.
create or replace function kendurikita.enforce_vendor_limit()
returns trigger language plpgsql security definer set search_path='' as $$
declare plan text; used integer; maximum integer;
begin
  if tg_op = 'UPDATE' and tg_table_name <> 'vendor_portfolio' then return new; end if;
  plan := kendurikita.vendor_plan(new.vendor_id);
  if tg_table_name = 'vendor_portfolio' then
    if new.media_type = 'video' and plan <> 'premium' and (tg_op = 'INSERT' or old.media_type <> 'video') then raise exception 'premium_required'; end if;
    if tg_op = 'UPDATE' then return new; end if;
    maximum := case plan when 'premium' then 2147483647 when 'pro' then 100 else 10 end;
  elsif tg_table_name = 'vendor_categories' then
    maximum := case plan when 'premium' then 2147483647 when 'pro' then 3 else 1 end;
  elsif tg_table_name = 'vendor_packages' then
    maximum := case plan when 'premium' then 2147483647 when 'pro' then 10 else 2 end;
  elsif tg_table_name = 'leads' then
    maximum := case when plan = 'basic' then 5 else 2147483647 end;
    select count(*) into used from kendurikita.leads
      where vendor_id = new.vendor_id and created_at >= date_trunc('month', now()) and id <> new.id;
    if used + 1 > maximum then raise exception 'lead_limit_reached'; end if;
    return new;
  else
    return new;
  end if;
  execute format('select count(*) from kendurikita.%I where vendor_id=$1', tg_table_name) into used using new.vendor_id;
  if used + 1 > maximum then raise exception 'vendor_limit_reached'; end if;
  return new;
end $$;

-- Coverage may always shrink or stay the same; only growing it is checked against the plan.
create or replace function kendurikita.enforce_vendor_coverage_limit()
returns trigger language plpgsql security definer set search_path='' as $$
declare maximum integer; used integer;
begin
  used := jsonb_array_length(coalesce(new.coverage, '[]'::jsonb));
  if tg_op = 'UPDATE' and used <= jsonb_array_length(coalesce(old.coverage, '[]'::jsonb)) then return new; end if;
  maximum := case kendurikita.vendor_plan(new.id) when 'premium' then 2147483647 when 'pro' then 3 else 1 end;
  if used > maximum then raise exception 'coverage_limit_reached'; end if;
  return new;
end $$;

-- True when a published listing is among the oldest the vendor's current plan allows.
create or replace function kendurikita.package_in_quota(target uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select (
    select count(*) from kendurikita.vendor_packages other
    where other.vendor_id = p.vendor_id and other.active and other.status = 'published'
      and (other.created_at, other.id) < (p.created_at, p.id)
  ) < case kendurikita.vendor_plan(p.vendor_id) when 'premium' then 2147483647 when 'pro' then 10 else 2 end
  from kendurikita.vendor_packages p where p.id = target;
$$;

create or replace function kendurikita.portfolio_in_quota(target uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select (p.media_type <> 'video' or kendurikita.vendor_plan(p.vendor_id) = 'premium') and (
    select count(*) from kendurikita.vendor_portfolio other
    where other.vendor_id = p.vendor_id and other.moderation_status = 'approved'
      and (other.sort_order, other.id) < (p.sort_order, p.id)
  ) < case kendurikita.vendor_plan(p.vendor_id) when 'premium' then 2147483647 when 'pro' then 100 else 10 end
  from kendurikita.vendor_portfolio p where p.id = target;
$$;

grant execute on function kendurikita.package_in_quota(uuid), kendurikita.portfolio_in_quota(uuid) to anon, authenticated;

-- ===== 202611030054_hide_listings_over_quota.sql =====
-- Marketplace shows only listings and photos within the vendor's current plan; owners and admins still see all.
-- Needs package_in_quota and portfolio_in_quota from 202611030053.

drop policy if exists vendor_packages_public_read on kendurikita.vendor_packages;
create policy vendor_packages_public_read on kendurikita.vendor_packages for select using (
  (active and status = 'published'
    and exists(select 1 from kendurikita.vendors v where v.id = vendor_packages.vendor_id and v.verification_status = 'approved')
    and kendurikita.package_in_quota(vendor_packages.id))
  or exists(select 1 from kendurikita.vendors v where v.id = vendor_packages.vendor_id and v.owner_id = auth.uid())
);

drop policy if exists vendor_portfolio_public_read on kendurikita.vendor_portfolio;
create policy vendor_portfolio_public_read on kendurikita.vendor_portfolio for select using (
  (moderation_status = 'approved'
    and exists(select 1 from kendurikita.vendors v where v.id = vendor_portfolio.vendor_id and v.verification_status = 'approved')
    and kendurikita.portfolio_in_quota(vendor_portfolio.id))
  or kendurikita.owns_vendor(vendor_id)
  or kendurikita.is_admin()
);

commit;
