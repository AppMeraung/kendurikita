-- Signed-out visitors could read every column of approved vendors, including SSM number,
-- verification document paths, rejection reason and owner details. Limit anon to public columns.
-- Signed-in owners and admins keep full access (their queries run as 'authenticated').
revoke select on kendurikita.vendors from anon;
grant select (
  id, owner_id, slug, company_name, business_type, description, short_description, phone, email, address, coverage,
  verification_status, policies, created_at, founded_year, languages, social_links, badges, logo_url, cover_url
) on kendurikita.vendors to anon;
