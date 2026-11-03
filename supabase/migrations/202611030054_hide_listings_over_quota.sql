-- NOT YET APPLIED: policy changes need to be run in the Supabase SQL editor (tool approval declined).
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
