-- Public marketplace listing for kendurikita.com: approved vendors, non-sensitive columns only,
-- with their plan so Premium vendors rank first and can be featured on the home page.
create or replace function kendurikita.public_vendor_directory()
returns table(slug text, company_name text, short_description jsonb, state text, coverage text[], logo_url text, cover_url text, categories text[], plan text)
language sql stable security definer set search_path='' as $$
  select v.slug, v.company_name, v.short_description, v.address->>'state', v.coverage, v.logo_url, v.cover_url,
    coalesce(array(select vc.category::text from kendurikita.vendor_categories vc where vc.vendor_id=v.id), '{}'),
    kendurikita.vendor_plan(v.id)
  from kendurikita.vendors v
  where v.verification_status='approved'
  order by case kendurikita.vendor_plan(v.id) when 'premium' then 0 when 'pro' then 1 else 2 end, v.created_at desc
$$;
revoke all on function kendurikita.public_vendor_directory() from public;
grant execute on function kendurikita.public_vendor_directory() to anon, authenticated;
