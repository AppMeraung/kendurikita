create table kendurikita.marketplace_categories (
  key text primary key,
  label jsonb not null default '{}',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table kendurikita.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references kendurikita.profiles(id),
  target_type text not null check(target_type in ('vendor','review','portfolio')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
  resolution text,
  resolved_by uuid references kendurikita.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table kendurikita.marketplace_categories enable row level security;
alter table kendurikita.moderation_reports enable row level security;

create policy categories_public_read on kendurikita.marketplace_categories
  for select using(active or kendurikita.is_admin());
create policy categories_admin_manage on kendurikita.marketplace_categories
  for all using(kendurikita.is_admin()) with check(kendurikita.is_admin());
create policy reports_author_insert on kendurikita.moderation_reports
  for insert with check(reporter_id=auth.uid());
create policy reports_author_read on kendurikita.moderation_reports
  for select using(reporter_id=auth.uid());
create policy reports_admin_manage on kendurikita.moderation_reports
  for all using(kendurikita.is_admin()) with check(kendurikita.is_admin());
create policy profiles_admin_read on kendurikita.profiles
  for select using(kendurikita.is_admin());
create policy events_admin_read on kendurikita.events
  for select using(kendurikita.is_admin());
create policy subscriptions_admin_manage on kendurikita.subscriptions
  for all using(kendurikita.is_admin()) with check(kendurikita.is_admin());
create policy audit_admin_read on kendurikita.audit_log
  for select using(kendurikita.is_admin());
create policy portfolio_admin_manage on kendurikita.vendor_portfolio
  for all using(kendurikita.is_admin()) with check(kendurikita.is_admin());

grant select on kendurikita.marketplace_categories to anon;
grant select,insert,update,delete on kendurikita.marketplace_categories,
  kendurikita.moderation_reports to authenticated;

insert into kendurikita.marketplace_categories(key,label,sort_order) values
  ('venue','{"ms":"Dewan / Tempat","en":"Venue"}',10),
  ('catering','{"ms":"Katering","en":"Catering"}',20),
  ('decor','{"ms":"Pelamin & Dekorasi","en":"Dais & Decoration"}',30),
  ('attire','{"ms":"Busana Pengantin","en":"Bridal Attire"}',40),
  ('makeup','{"ms":"Mak Andam / Solekan","en":"Makeup"}',50),
  ('photo_video','{"ms":"Foto & Video","en":"Photo & Video"}',60),
  ('invitation_gifts','{"ms":"Kad & Cenderahati","en":"Invitations & Gifts"}',70),
  ('hantaran','{"ms":"Hantaran","en":"Gift Trays"}',80),
  ('cake','{"ms":"Kek & Pencuci Mulut","en":"Cake & Desserts"}',90),
  ('entertainment','{"ms":"Hiburan","en":"Entertainment"}',100),
  ('emcee','{"ms":"Pengacara Majlis","en":"Emcee"}',110),
  ('equipment','{"ms":"Kanopi & Peralatan","en":"Canopy & Equipment"}',120),
  ('nikah','{"ms":"Perkhidmatan Nikah","en":"Nikah Services"}',130),
  ('henna','{"ms":"Inai","en":"Henna"}',140),
  ('planner','{"ms":"Perancang Perkahwinan","en":"Wedding Planner"}',150),
  ('transport','{"ms":"Pengangkutan","en":"Transport"}',160),
  ('florist','{"ms":"Kedai Bunga","en":"Florist"}',170),
  ('cultural','{"ms":"Khidmat Budaya","en":"Cultural Services"}',180)
on conflict(key) do nothing;

create or replace function kendurikita.moderate_vendor(
  target uuid,
  decision kendurikita.vendor_status,
  reason text default null
) returns void language plpgsql security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  if decision = 'pending' then raise exception 'invalid_decision'; end if;
  update kendurikita.vendors
    set verification_status=decision,
        rejection_reason=case when decision='rejected' then nullif(btrim(reason),'') else null end
    where id=target;
  if not found then raise exception 'vendor_not_found'; end if;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'moderate_vendor','vendors',target,jsonb_build_object('decision',decision,'reason',reason));
end $$;

create or replace function kendurikita.moderate_review(target uuid, publish boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  update kendurikita.vendor_reviews set verified=publish where id=target;
  if not found then raise exception 'review_not_found'; end if;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'moderate_review','vendor_reviews',target,jsonb_build_object('publish',publish));
end $$;

create or replace function kendurikita.set_vendor_badges(target uuid, badge_values text[])
returns void language plpgsql security definer set search_path='' as $$
begin
  if not kendurikita.is_admin() then raise exception 'not_allowed'; end if;
  if exists(select 1 from unnest(badge_values) badge where badge not in ('popular','fast_response','halal','premium'))
    then raise exception 'invalid_badge'; end if;
  update kendurikita.vendors set badges=coalesce(badge_values,'{}') where id=target;
  if not found then raise exception 'vendor_not_found'; end if;
  insert into kendurikita.audit_log(actor_id,action,table_name,record_id,metadata)
    values(auth.uid(),'set_vendor_badges','vendors',target,jsonb_build_object('badges',badge_values));
end $$;

revoke all on function kendurikita.moderate_vendor(uuid,kendurikita.vendor_status,text) from public;
revoke all on function kendurikita.moderate_review(uuid,boolean) from public;
revoke all on function kendurikita.set_vendor_badges(uuid,text[]) from public;
grant execute on function kendurikita.moderate_vendor(uuid,kendurikita.vendor_status,text),
  kendurikita.moderate_review(uuid,boolean),
  kendurikita.set_vendor_badges(uuid,text[]) to authenticated;
