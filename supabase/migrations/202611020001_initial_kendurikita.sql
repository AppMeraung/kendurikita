create schema if not exists kendurikita;
grant usage on schema kendurikita to anon, authenticated, service_role;

create type kendurikita.member_role as enum ('owner','partner','editor','viewer','parent');
create type kendurikita.vendor_status as enum ('pending','approved','rejected');
create type kendurikita.lead_status as enum ('new','replied','quotation_sent','negotiating','confirmed','lost');

create table kendurikita.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','vendor','admin')),
  name text not null default '', phone text, photo_url text, preferred_language text not null default 'ms' check (preferred_language in ('ms','en','zh','ta','id')),
  state text, city text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table kendurikita.events (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references kendurikita.profiles(id) on delete cascade,
  name text not null, event_type text not null, event_dates jsonb not null default '[]', venue jsonb not null default '{}', country text not null default 'MY',
  total_budget numeric(14,2) not null default 0 check (total_budget >= 0), estimated_guests integer not null default 0 check (estimated_guests >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table kendurikita.event_members (
  event_id uuid references kendurikita.events(id) on delete cascade, user_id uuid references kendurikita.profiles(id) on delete cascade,
  role kendurikita.member_role not null, invited_by uuid references kendurikita.profiles(id), joined_at timestamptz not null default now(), primary key(event_id,user_id)
);

create or replace function kendurikita.is_event_member(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from kendurikita.event_members m where m.event_id=target and m.user_id=auth.uid());
$$;
create or replace function kendurikita.can_edit_event(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from kendurikita.event_members m where m.event_id=target and m.user_id=auth.uid() and m.role in ('owner','partner','editor'));
$$;
create or replace function kendurikita.is_event_owner(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from kendurikita.event_members m where m.event_id=target and m.user_id=auth.uid() and m.role='owner');
$$;

create table kendurikita.checklist_items (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id) on delete cascade, local_key text not null, title text not null, due_at timestamptz, priority text not null default 'medium', assigned_to uuid references kendurikita.profiles(id), assigned_name text, reminder_at timestamptz, done boolean not null default false, sort_order integer not null default 0, created_at timestamptz not null default now(), unique(event_id,local_key));
create table kendurikita.budget_items (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id) on delete cascade, local_key text not null, category text not null, name text not null, vendor_id uuid, vendor_name text, planned numeric(14,2) not null default 0 check(planned>=0), paid numeric(14,2) not null default 0 check(paid>=0), payment_type text, payment_method text, payer text, paid_at date, due_at date, receipt_path text, note text, created_at timestamptz not null default now(), unique(event_id,local_key));
create table kendurikita.guests (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id) on delete cascade, local_key text not null, name text not null, phone text, guest_group text, pax integer not null default 1 check(pax>0), dietary text, table_id uuid, table_local_key text, rsvp_status text not null default 'pending', invitation_token uuid not null default gen_random_uuid(), checked_in_at timestamptz, created_at timestamptz not null default now(), unique(event_id,local_key));
create table kendurikita.rsvps (id uuid primary key default gen_random_uuid(), guest_id uuid not null references kendurikita.guests(id) on delete cascade, attending boolean not null, pax integer not null check(pax>0), dietary text, message text, responded_at timestamptz not null default now());
create table kendurikita.invitations (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id) on delete cascade, guest_id uuid references kendurikita.guests(id) on delete cascade, language text not null default 'ms', template_id text not null, content jsonb not null default '{}', sent_at timestamptz);
create table kendurikita.tables_seating (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id) on delete cascade, local_key text not null, name text not null, shape text not null default 'round', capacity integer not null check(capacity>0), position jsonb not null default '{}', unique(event_id,local_key));
create table kendurikita.timeline_items (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id) on delete cascade, local_key text not null, title text not null, starts_at timestamptz, ends_at timestamptz, pic_id uuid references kendurikita.profiles(id), pic_name text, note text, sort_order integer not null default 0, unique(event_id,local_key));
create table kendurikita.team_contacts (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id) on delete cascade, local_key text not null, name text not null, role text not null, phone text, status text not null default 'local', unique(event_id,local_key));
create table kendurikita.documents (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id) on delete cascade, name text not null, folder text, storage_path text not null, mime_type text, size_bytes bigint check(size_bytes>=0), created_at timestamptz not null default now());
create table kendurikita.inventory_items (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id) on delete cascade, name text not null, quantity integer not null default 1 check(quantity>=0), status text not null default 'needed', note text);

create table kendurikita.vendors (id uuid primary key default gen_random_uuid(), owner_id uuid not null references kendurikita.profiles(id) on delete cascade, slug text not null unique, company_name text not null, ssm_number text, business_type text, description jsonb not null default '{}', phone text, email text, address jsonb not null default '{}', coverage jsonb not null default '[]', verification_status kendurikita.vendor_status not null default 'pending', rejection_reason text, policies jsonb not null default '{}', created_at timestamptz not null default now());
create table kendurikita.vendor_categories (vendor_id uuid references kendurikita.vendors(id) on delete cascade, category text not null, primary key(vendor_id,category));
create table kendurikita.vendor_packages (id uuid primary key default gen_random_uuid(), vendor_id uuid not null references kendurikita.vendors(id) on delete cascade, name text not null, price numeric(14,2) not null check(price>=0), price_type text not null, inclusions jsonb not null default '[]', addons jsonb not null default '[]', minimum_pax integer, active boolean not null default true);
create table kendurikita.vendor_portfolio (id uuid primary key default gen_random_uuid(), vendor_id uuid not null references kendurikita.vendors(id) on delete cascade, media_url text not null, media_type text not null, caption text, sort_order integer not null default 0);
create table kendurikita.vendor_availability (id uuid primary key default gen_random_uuid(), vendor_id uuid not null references kendurikita.vendors(id) on delete cascade, starts_at timestamptz not null, ends_at timestamptz not null, status text not null check(status in ('available','tentative','booked')));
create table kendurikita.vendor_reviews (id uuid primary key default gen_random_uuid(), vendor_id uuid not null references kendurikita.vendors(id) on delete cascade, event_id uuid not null references kendurikita.events(id) on delete cascade, author_id uuid not null references kendurikita.profiles(id), rating integer not null check(rating between 1 and 5), body text, reply text, verified boolean not null default false, created_at timestamptz not null default now());
create table kendurikita.leads (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id) on delete cascade, vendor_id uuid not null references kendurikita.vendors(id) on delete cascade, sender_id uuid not null references kendurikita.profiles(id), message text not null, status kendurikita.lead_status not null default 'new', created_at timestamptz not null default now());
create table kendurikita.quotations (id uuid primary key default gen_random_uuid(), lead_id uuid not null references kendurikita.leads(id) on delete cascade, vendor_id uuid not null references kendurikita.vendors(id), number text not null, items jsonb not null default '[]', total numeric(14,2) not null check(total>=0), status text not null default 'sent', pdf_path text, created_at timestamptz not null default now());
create table kendurikita.invoices (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id), vendor_id uuid not null references kendurikita.vendors(id), number text not null, total numeric(14,2) not null check(total>=0), due_at date, status text not null default 'unpaid', pdf_path text);
create table kendurikita.payments (id uuid primary key default gen_random_uuid(), event_id uuid not null references kendurikita.events(id), vendor_id uuid references kendurikita.vendors(id), invoice_id uuid references kendurikita.invoices(id), amount numeric(14,2) not null check(amount>=0), kind text not null, method text, receipt_path text, paid_at timestamptz);
create table kendurikita.messages (id uuid primary key default gen_random_uuid(), lead_id uuid not null references kendurikita.leads(id) on delete cascade, sender_id uuid not null references kendurikita.profiles(id), body text, attachment_path text, read_at timestamptz, created_at timestamptz not null default now());
create table kendurikita.subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid references kendurikita.profiles(id), vendor_id uuid references kendurikita.vendors(id), event_id uuid references kendurikita.events(id), entitlement text not null, provider text not null, provider_customer_id text, status text not null, expires_at timestamptz, updated_at timestamptz not null default now(), unique(provider,provider_customer_id));
create table kendurikita.push_tokens (id uuid primary key default gen_random_uuid(), user_id uuid not null references kendurikita.profiles(id) on delete cascade, token text not null unique, platform text not null, device_id text not null, language text not null, last_seen_at timestamptz not null default now());
create table kendurikita.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references kendurikita.profiles(id) on delete cascade, category text not null, title text not null, body text not null, deep_link text, read_at timestamptz, created_at timestamptz not null default now());
create table kendurikita.notification_settings (user_id uuid primary key references kendurikita.profiles(id) on delete cascade, categories jsonb not null default '{}', quiet_start time not null default '22:00', quiet_end time not null default '08:00', timezone text not null default 'Asia/Kuala_Lumpur', promotions boolean not null default false);
create table kendurikita.notification_log (id uuid primary key default gen_random_uuid(), user_id uuid references kendurikita.profiles(id), token text, category text not null, status text not null, error text, sent_at timestamptz not null default now());
create table kendurikita.audit_log (id bigint generated always as identity primary key, actor_id uuid, action text not null, table_name text not null, record_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now());

do $$ declare t text; begin
  foreach t in array array['profiles','events','event_members','checklist_items','budget_items','guests','rsvps','invitations','tables_seating','timeline_items','team_contacts','documents','inventory_items','vendors','vendor_categories','vendor_packages','vendor_portfolio','vendor_availability','vendor_reviews','leads','quotations','invoices','payments','messages','subscriptions','push_tokens','notifications','notification_settings','notification_log','audit_log'] loop
    execute format('alter table kendurikita.%I enable row level security', t);
  end loop;
end $$;

create policy profiles_self on kendurikita.profiles for all using(id=auth.uid()) with check(id=auth.uid());
create policy events_member_read on kendurikita.events for select using(kendurikita.is_event_member(id));
create policy events_owner_insert on kendurikita.events for insert with check(owner_id=auth.uid());
create policy events_editor_update on kendurikita.events for update using(kendurikita.can_edit_event(id));
create policy events_owner_delete on kendurikita.events for delete using(kendurikita.is_event_owner(id));
create policy members_read on kendurikita.event_members for select using(kendurikita.is_event_member(event_id));
create policy members_owner_write on kendurikita.event_members for all using(kendurikita.is_event_owner(event_id)) with check(kendurikita.is_event_owner(event_id));

create or replace function kendurikita.add_event_owner() returns trigger language plpgsql security definer set search_path='' as $$ begin
  insert into kendurikita.event_members(event_id,user_id,role) values(new.id,new.owner_id,'owner'); return new;
end $$;
create trigger event_owner_membership after insert on kendurikita.events for each row execute function kendurikita.add_event_owner();
create or replace function kendurikita.create_profile() returns trigger language plpgsql security definer set search_path='' as $$ begin
  insert into kendurikita.profiles(id,name,preferred_language,role) values(new.id,coalesce(new.raw_user_meta_data->>'name',''),case when new.raw_user_meta_data->>'language' in ('ms','en','zh','ta','id') then new.raw_user_meta_data->>'language' else 'ms' end,case when new.raw_user_meta_data->>'role'='vendor' then 'vendor' else 'user' end); return new;
end $$;
create trigger auth_user_profile after insert on auth.users for each row execute function kendurikita.create_profile();

do $$ declare t text; begin
  foreach t in array array['checklist_items','budget_items','guests','invitations','tables_seating','timeline_items','team_contacts','documents','inventory_items','payments'] loop
    execute format('create policy %I_member_read on kendurikita.%I for select using(kendurikita.is_event_member(event_id))', t, t);
    execute format('create policy %I_editor_write on kendurikita.%I for all using(kendurikita.can_edit_event(event_id)) with check(kendurikita.can_edit_event(event_id))', t, t);
  end loop;
end $$;
create or replace function kendurikita.get_public_invitation(token uuid) returns table(guest_id uuid, guest_name text, invited_pax integer) language sql stable security definer set search_path='' as $$
  select g.id,g.name,g.pax from kendurikita.guests g where g.invitation_token=token limit 1;
$$;
create or replace function kendurikita.submit_public_rsvp(token uuid, is_attending boolean, response_pax integer, dietary_note text default null, guest_message text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare target uuid; created uuid; begin
  if response_pax < 1 then raise exception 'invalid_pax'; end if;
  select g.id into target from kendurikita.guests g where g.invitation_token=token;
  if target is null then raise exception 'invalid_token'; end if;
  insert into kendurikita.rsvps(guest_id,attending,pax,dietary,message) values(target,is_attending,response_pax,dietary_note,guest_message) returning id into created;
  update kendurikita.guests set rsvp_status=case when is_attending then 'attending' else 'declined' end where id=target;
  return created;
end $$;
create policy vendors_public_read on kendurikita.vendors for select using(verification_status='approved' or owner_id=auth.uid());
create policy vendors_owner_write on kendurikita.vendors for all using(owner_id=auth.uid()) with check(owner_id=auth.uid());
do $$ declare t text; begin
  foreach t in array array['vendor_categories','vendor_packages','vendor_portfolio','vendor_availability'] loop
    execute format('create policy %I_public_read on kendurikita.%I for select using(exists(select 1 from kendurikita.vendors v where v.id=vendor_id and (v.verification_status=''approved'' or v.owner_id=auth.uid())))', t, t);
    execute format('create policy %I_owner_write on kendurikita.%I for all using(exists(select 1 from kendurikita.vendors v where v.id=vendor_id and v.owner_id=auth.uid())) with check(exists(select 1 from kendurikita.vendors v where v.id=vendor_id and v.owner_id=auth.uid()))', t, t);
  end loop;
end $$;
create policy reviews_public_read on kendurikita.vendor_reviews for select using(verified or author_id=auth.uid() or exists(select 1 from kendurikita.vendors v where v.id=vendor_id and v.owner_id=auth.uid()));
create policy reviews_member_insert on kendurikita.vendor_reviews for insert with check(author_id=auth.uid() and kendurikita.is_event_member(event_id));
create policy leads_parties on kendurikita.leads for select using(sender_id=auth.uid() or exists(select 1 from kendurikita.vendors v where v.id=vendor_id and v.owner_id=auth.uid()));
create policy leads_sender_insert on kendurikita.leads for insert with check(sender_id=auth.uid() and kendurikita.is_event_member(event_id));
create policy messages_parties on kendurikita.messages for select using(exists(select 1 from kendurikita.leads l left join kendurikita.vendors v on v.id=l.vendor_id where l.id=lead_id and (l.sender_id=auth.uid() or v.owner_id=auth.uid())));
create policy messages_party_insert on kendurikita.messages for insert with check(sender_id=auth.uid());
create policy subscriptions_self on kendurikita.subscriptions for select using(user_id=auth.uid() or exists(select 1 from kendurikita.vendors v where v.id=vendor_id and v.owner_id=auth.uid()));
create policy tokens_self on kendurikita.push_tokens for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy notifications_self on kendurikita.notifications for select using(user_id=auth.uid());
create policy notification_settings_self on kendurikita.notification_settings for all using(user_id=auth.uid()) with check(user_id=auth.uid());

insert into storage.buckets(id,name,public) values ('event-docs','event-docs',false),('vendor-media','vendor-media',true),('guest-gallery','guest-gallery',false) on conflict(id) do nothing;
create policy event_docs_member_read on storage.objects for select to authenticated using(bucket_id='event-docs' and kendurikita.is_event_member(((storage.foldername(name))[1])::uuid));
create policy event_docs_editor_write on storage.objects for insert to authenticated with check(bucket_id='event-docs' and kendurikita.can_edit_event(((storage.foldername(name))[1])::uuid));
create policy vendor_media_owner_write on storage.objects for all to authenticated using(bucket_id='vendor-media' and exists(select 1 from kendurikita.vendors v where v.id=((storage.foldername(name))[1])::uuid and v.owner_id=auth.uid())) with check(bucket_id='vendor-media' and exists(select 1 from kendurikita.vendors v where v.id=((storage.foldername(name))[1])::uuid and v.owner_id=auth.uid()));
create policy guest_gallery_member_read on storage.objects for select to authenticated using(bucket_id='guest-gallery' and kendurikita.is_event_member(((storage.foldername(name))[1])::uuid));
create policy guest_gallery_member_write on storage.objects for insert to authenticated with check(bucket_id='guest-gallery' and kendurikita.is_event_member(((storage.foldername(name))[1])::uuid));
grant select,insert,update,delete on all tables in schema kendurikita to authenticated;
grant select on kendurikita.vendors,kendurikita.vendor_categories,kendurikita.vendor_packages,kendurikita.vendor_portfolio,kendurikita.vendor_availability to anon;
grant execute on function kendurikita.get_public_invitation(uuid),kendurikita.submit_public_rsvp(uuid,boolean,integer,text,text) to anon,authenticated;
