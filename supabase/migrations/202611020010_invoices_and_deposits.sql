alter table kendurikita.invoices add column quotation_id uuid unique references kendurikita.quotations(id) on delete set null;

drop policy if exists invoices_vendor_insert on kendurikita.invoices;
drop policy if exists invoices_vendor_update on kendurikita.invoices;
create policy invoices_vendor_insert on kendurikita.invoices
  for insert with check(
    kendurikita.owns_vendor(vendor_id)
    and exists(
      select 1 from kendurikita.quotations q
      join kendurikita.leads l on l.id = q.lead_id
      where q.id = quotation_id and q.vendor_id = vendor_id
        and l.event_id = event_id and q.status = 'accepted'
    )
  );
create policy invoices_vendor_update on kendurikita.invoices
  for update using(kendurikita.owns_vendor(vendor_id))
  with check(
    kendurikita.owns_vendor(vendor_id)
    and exists(
      select 1 from kendurikita.quotations q
      join kendurikita.leads l on l.id = q.lead_id
      where q.id = quotation_id and q.vendor_id = vendor_id
        and l.event_id = event_id and q.status = 'accepted'
    )
  );

create or replace function kendurikita.respond_to_quotation(target uuid, response text)
returns text language plpgsql security definer set search_path = '' as $$
declare quote_row kendurikita.quotations%rowtype; lead_row kendurikita.leads%rowtype; next_status text; begin
  if response not in ('accepted','rejected') then raise exception 'invalid_response'; end if;
  select q.* into quote_row from kendurikita.quotations q where q.id = target;
  select l.* into lead_row from kendurikita.leads l where l.id = quote_row.lead_id and l.sender_id = auth.uid();
  if lead_row.id is null then raise exception 'not_allowed'; end if;
  update kendurikita.quotations set status = response where id = target;
  next_status := case when response = 'accepted' then 'confirmed' else 'lost' end;
  update kendurikita.leads set status = next_status::kendurikita.lead_status where id = lead_row.id;
  if response = 'accepted' then
    insert into kendurikita.invoices(event_id,vendor_id,quotation_id,number,total,due_at,status)
    values(lead_row.event_id,quote_row.vendor_id,quote_row.id,'INV-'||to_char(current_date,'YYYYMMDD')||'-'||right(quote_row.id::text,6),quote_row.total,current_date+14,'unpaid')
    on conflict(quotation_id) do nothing;
  end if;
  return response;
end $$;

create or replace function kendurikita.record_invoice_payment(target uuid, payment_amount numeric, payment_method text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invoice_row kendurikita.invoices%rowtype; paid_total numeric; created uuid; begin
  if payment_amount <= 0 then raise exception 'invalid_amount'; end if;
  select * into invoice_row from kendurikita.invoices where id = target;
  if invoice_row.id is null or not kendurikita.can_edit_event(invoice_row.event_id) then raise exception 'not_allowed'; end if;
  select coalesce(sum(p.amount),0) into paid_total from kendurikita.payments p where p.invoice_id = target;
  if paid_total + payment_amount > invoice_row.total then raise exception 'amount_exceeds_balance'; end if;
  insert into kendurikita.payments(event_id,vendor_id,invoice_id,amount,kind,method,paid_at)
  values(invoice_row.event_id,invoice_row.vendor_id,target,payment_amount,case when paid_total=0 then 'deposit' else 'balance' end,payment_method,now())
  returning id into created;
  update kendurikita.invoices set status=case when paid_total+payment_amount>=total then 'paid' else 'partial' end where id=target;
  return created;
end $$;

grant execute on function kendurikita.record_invoice_payment(uuid,numeric,text) to authenticated;
