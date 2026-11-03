-- NOT YET APPLIED (production change approval declined 2026-11-03); run supabase/run-in-sql-editor.sql.
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
