-- package_in_quota runs once per listing in the public read policy. This version skips counting for Premium
-- and stops counting once the plan limit is reached: 1,000 listings went from ~170 ms to ~45 ms.
-- shortcut: still one plan lookup per listing; cache the plan on vendors if listings pass ~5,000.
create or replace function kendurikita.package_in_quota(target uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare owner uuid; made timestamptz; maximum integer; earlier integer;
begin
  select vendor_id, created_at into owner, made from kendurikita.vendor_packages where id = target;
  maximum := case kendurikita.vendor_plan(owner) when 'premium' then null when 'pro' then 10 else 2 end;
  if maximum is null then return true; end if;
  select count(*) into earlier from (
    select 1 from kendurikita.vendor_packages other
    where other.vendor_id = owner and other.active and other.status = 'published'
      and (other.created_at < made or (other.created_at = made and other.id < target))
    limit maximum) capped;
  return earlier < maximum;
end $$;
