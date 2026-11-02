alter table kendurikita.vendor_portfolio
  add column if not exists event_name text,
  add column if not exists storage_path text;

alter table kendurikita.vendor_portfolio
  add constraint vendor_portfolio_event_name_length
  check(event_name is null or char_length(event_name) between 1 and 120);
