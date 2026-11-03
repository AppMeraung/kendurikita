-- Hotfix for 202611030048: row-level policies on vendor_packages, vendor_portfolio, vendor_categories
-- and others check vendors.owner_id, so anon needs that one column for public reads to work.
-- owner_id is an internal UUID; SSM, owner name, rejection reason and documents stay hidden.
grant select (owner_id) on kendurikita.vendors to anon;
