create or replace function kendurikita.vendor_competitor_benchmark()
returns table(
  peer_count bigint,
  average_monthly_views numeric,
  average_monthly_leads numeric,
  average_rating numeric,
  average_starting_price numeric
)
language plpgsql
security definer
set search_path = kendurikita, public
as $$
declare
  target_vendor uuid;
begin
  select id into target_vendor from kendurikita.vendors where owner_id=auth.uid();
  if target_vendor is null then raise exception 'vendor_not_found'; end if;
  if kendurikita.vendor_plan(target_vendor)<>'premium' then raise exception 'vendor_premium_required'; end if;

  return query
  with peers as (
    select distinct v.id
    from kendurikita.vendors v
    join kendurikita.vendor_categories vc on vc.vendor_id=v.id
    where v.id<>target_vendor
      and v.verification_status='approved'
      and vc.category in (select own.category from kendurikita.vendor_categories own where own.vendor_id=target_vendor)
  ), metrics as (
    select p.id,
      (select count(*) from kendurikita.vendor_profile_views pv where pv.vendor_id=p.id and pv.viewed_at>=now()-interval '30 days')::numeric as views,
      (select count(*) from kendurikita.leads l where l.vendor_id=p.id and l.created_at>=now()-interval '30 days')::numeric as leads,
      (select avg(r.rating)::numeric from kendurikita.vendor_reviews r where r.vendor_id=p.id and r.verified) as rating,
      (select min(pkg.price)::numeric from kendurikita.vendor_packages pkg where pkg.vendor_id=p.id and pkg.active) as starting_price
    from peers p
  )
  select count(*)::bigint,
    round(avg(views),1), round(avg(leads),1), round(avg(rating),2), round(avg(starting_price),2)
  from metrics
  having count(*)>=3;
end;
$$;

revoke all on function kendurikita.vendor_competitor_benchmark() from public, anon;
grant execute on function kendurikita.vendor_competitor_benchmark() to authenticated;
