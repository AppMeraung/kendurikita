create or replace function kendurikita.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from kendurikita.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function kendurikita.owns_vendor(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from kendurikita.vendors v
    where v.id = target and v.owner_id = auth.uid()
  );
$$;

create policy vendors_admin_manage on kendurikita.vendors
  for all using(kendurikita.is_admin()) with check(kendurikita.is_admin());
create policy reviews_admin_manage on kendurikita.vendor_reviews
  for all using(kendurikita.is_admin()) with check(kendurikita.is_admin());

create policy leads_vendor_update on kendurikita.leads
  for update using(kendurikita.owns_vendor(vendor_id))
  with check(kendurikita.owns_vendor(vendor_id));
create policy leads_sender_update on kendurikita.leads
  for update using(sender_id = auth.uid() and kendurikita.is_event_member(event_id))
  with check(sender_id = auth.uid() and kendurikita.is_event_member(event_id));

create policy quotations_parties_read on kendurikita.quotations
  for select using(
    kendurikita.owns_vendor(vendor_id)
    or exists(
      select 1 from kendurikita.leads l
      where l.id = lead_id and l.sender_id = auth.uid()
        and kendurikita.is_event_member(l.event_id)
    )
  );
create policy quotations_vendor_insert on kendurikita.quotations
  for insert with check(
    kendurikita.owns_vendor(vendor_id)
    and exists(select 1 from kendurikita.leads l where l.id = lead_id and l.vendor_id = vendor_id)
  );
create policy quotations_vendor_update on kendurikita.quotations
  for update using(kendurikita.owns_vendor(vendor_id))
  with check(kendurikita.owns_vendor(vendor_id));
create policy quotations_vendor_delete on kendurikita.quotations
  for delete using(kendurikita.owns_vendor(vendor_id));

create policy invoices_parties_read on kendurikita.invoices
  for select using(
    kendurikita.is_event_member(event_id) or kendurikita.owns_vendor(vendor_id)
  );
create policy invoices_vendor_insert on kendurikita.invoices
  for insert with check(kendurikita.owns_vendor(vendor_id));
create policy invoices_vendor_update on kendurikita.invoices
  for update using(kendurikita.owns_vendor(vendor_id))
  with check(kendurikita.owns_vendor(vendor_id));
create policy invoices_vendor_delete on kendurikita.invoices
  for delete using(kendurikita.owns_vendor(vendor_id));

create policy payments_vendor_read on kendurikita.payments
  for select using(vendor_id is not null and kendurikita.owns_vendor(vendor_id));

drop policy if exists messages_party_insert on kendurikita.messages;
create policy messages_party_insert on kendurikita.messages
  for insert with check(
    sender_id = auth.uid()
    and exists(
      select 1 from kendurikita.leads l
      left join kendurikita.vendors v on v.id = l.vendor_id
      where l.id = lead_id
        and (l.sender_id = auth.uid() or v.owner_id = auth.uid())
    )
  );
create policy messages_parties_update on kendurikita.messages
  for update using(
    exists(
      select 1 from kendurikita.leads l
      left join kendurikita.vendors v on v.id = l.vendor_id
      where l.id = lead_id
        and (l.sender_id = auth.uid() or v.owner_id = auth.uid())
    )
  );

grant execute on function kendurikita.is_admin(), kendurikita.owns_vendor(uuid) to authenticated;
