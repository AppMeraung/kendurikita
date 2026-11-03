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
