create table kendurikita.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references kendurikita.profiles(id) on delete cascade,
  category text not null check(category in ('reminders','rsvp','messages','payments','vendor_leads','promotions')),
  template text not null,
  variables jsonb not null default '{}',
  deep_link text not null,
  urgent boolean not null default false,
  scheduled_for timestamptz not null default now(),
  dedupe_key text not null unique,
  status text not null default 'pending' check(status in ('pending','processing','sent','failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table kendurikita.notification_jobs enable row level security;
create index notification_jobs_due on kendurikita.notification_jobs(status,scheduled_for);
grant select,insert,update,delete on kendurikita.notification_jobs to service_role;

create or replace function kendurikita.queue_rsvp_notification()
returns trigger language plpgsql security definer set search_path='' as $$
declare owner uuid; target_event uuid; total integer; bucket timestamptz; plan text;
begin
  select e.owner_id,e.id into owner,target_event from kendurikita.guests g join kendurikita.events e on e.id=g.event_id where g.id=new.guest_id;
  select coalesce(sum(r.pax),0)::integer into total from kendurikita.rsvps r join kendurikita.guests g on g.id=r.guest_id where g.event_id=target_event and r.attending;
  plan:=kendurikita.event_plan(target_event);
  bucket:=case when plan='basic' then date_trunc('day',now())+interval '1 day 8 hours' else date_trunc('hour',now())+interval '30 minutes'*(1+(extract(minute from now())::integer/30)) end;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,scheduled_for,dedupe_key)
  values(owner,'rsvp','new_rsvp',jsonb_build_object('count',1,'total',total),'kendurikita://guests',bucket,'rsvp:'||target_event||':'||bucket)
  on conflict(dedupe_key) do update set variables=jsonb_set(jsonb_set(kendurikita.notification_jobs.variables,'{count}',to_jsonb(coalesce((kendurikita.notification_jobs.variables->>'count')::integer,0)+1)),'{total}',to_jsonb(total));
  return new;
end $$;
create trigger queue_rsvp after insert on kendurikita.rsvps for each row execute function kendurikita.queue_rsvp_notification();

create or replace function kendurikita.queue_lead_notification()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid; snapshot jsonb;
begin
  select owner_id into recipient from kendurikita.vendors where id=new.vendor_id;
  snapshot:=coalesce(new.event_snapshot,'{}'::jsonb);
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,urgent,dedupe_key)
  values(recipient,'vendor_leads','vendor_lead',jsonb_build_object('event',coalesce(snapshot->>'name',''),'location',coalesce(snapshot->>'venue',''),'pax',coalesce(snapshot->>'pax','')),'kendurikita://leads',true,'lead:'||new.id);
  return new;
end $$;
create trigger queue_lead after insert on kendurikita.leads for each row execute function kendurikita.queue_lead_notification();

create or replace function kendurikita.queue_message_notification()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid; customer uuid; vendor_owner uuid; sender_name text;
begin
  select l.sender_id,v.owner_id into customer,vendor_owner from kendurikita.leads l join kendurikita.vendors v on v.id=l.vendor_id where l.id=new.lead_id;
  recipient:=case when new.sender_id=customer then vendor_owner else customer end;
  select name into sender_name from kendurikita.profiles where id=new.sender_id;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
  values(recipient,'messages','new_message',jsonb_build_object('sender',coalesce(sender_name,''),'message',left(coalesce(new.body,'Lampiran'),120)),'kendurikita://chat/'||new.lead_id,'message:'||new.id);
  return new;
end $$;
create trigger queue_message after insert on kendurikita.messages for each row execute function kendurikita.queue_message_notification();

create or replace function kendurikita.queue_quotation_response()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid;
begin
  if new.status is not distinct from old.status then return new; end if;
  select owner_id into recipient from kendurikita.vendors where id=new.vendor_id;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
  values(recipient,'messages','quotation_response',jsonb_build_object('number',new.number,'status',new.status),'kendurikita://leads','quotation:'||new.id||':'||new.status) on conflict do nothing;
  return new;
end $$;
create trigger queue_quotation_response after update of status on kendurikita.quotations for each row execute function kendurikita.queue_quotation_response();

create or replace function kendurikita.queue_review_notification()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid;
begin
  select owner_id into recipient from kendurikita.vendors where id=new.vendor_id;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
  values(recipient,'messages','new_review',jsonb_build_object('rating',new.rating),'kendurikita://analytics','review:'||new.id);
  return new;
end $$;
create trigger queue_review after insert on kendurikita.vendor_reviews for each row execute function kendurikita.queue_review_notification();

create or replace function kendurikita.queue_vendor_verification()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.verification_status is not distinct from old.verification_status then return new; end if;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
  values(new.owner_id,'messages','verification',jsonb_build_object('status',new.verification_status),'kendurikita://','verification:'||new.id||':'||new.verification_status) on conflict do nothing;
  return new;
end $$;
create trigger queue_vendor_verification after update of verification_status on kendurikita.vendors for each row execute function kendurikita.queue_vendor_verification();

create or replace function kendurikita.queue_subscription_notification()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid;
begin
  recipient:=new.user_id;
  if recipient is null and new.vendor_id is not null then select owner_id into recipient from kendurikita.vendors where id=new.vendor_id; end if;
  if recipient is null then return new; end if;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
  values(recipient,'payments','package_active',jsonb_build_object('package',new.entitlement),'kendurikita://paywall','subscription:'||new.provider||':'||new.provider_customer_id||':'||new.status||':'||coalesce(new.expires_at::text,'')) on conflict do nothing;
  return new;
end $$;
create trigger queue_subscription after insert or update of status,expires_at on kendurikita.subscriptions for each row when(new.status in ('active','grace')) execute function kendurikita.queue_subscription_notification();

create or replace function kendurikita.queue_task_assignment()
returns trigger language plpgsql security definer set search_path='' as $$
declare assigner text;
begin
  if new.assigned_to is null or (tg_op='UPDATE' and new.assigned_to is not distinct from old.assigned_to) then return new; end if;
  select name into assigner from kendurikita.profiles where id=auth.uid();
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
  values(new.assigned_to,'reminders','task_assigned',jsonb_build_object('assigner',coalesce(assigner,''),'task',new.title),'kendurikita://checklist','task-assigned:'||new.id||':'||new.assigned_to) on conflict do nothing;
  return new;
end $$;
create trigger queue_task_assignment after insert or update of assigned_to on kendurikita.checklist_items for each row execute function kendurikita.queue_task_assignment();

create or replace function kendurikita.queue_budget_warning()
returns trigger language plpgsql security definer set search_path='' as $$
declare target_event uuid; owner uuid; event_name text; total numeric; planned numeric; threshold integer;
begin
  target_event:=case when tg_op='DELETE' then old.event_id else new.event_id end;
  select e.owner_id,e.name,e.total_budget into owner,event_name,total from kendurikita.events e where e.id=target_event;
  if total<=0 then if tg_op='DELETE' then return old; else return new; end if; end if;
  select coalesce(sum(planned),0) into planned from kendurikita.budget_items where event_id=target_event;
  threshold:=case when planned>=total then 100 when planned>=total*.9 then 90 else 0 end;
  if threshold>0 then insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
    values(owner,'payments','over_budget',jsonb_build_object('event',event_name,'percent',threshold),'kendurikita://budget','budget:'||target_event||':'||threshold) on conflict do nothing; end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
create trigger queue_budget_warning after insert or delete or update of planned on kendurikita.budget_items for each row execute function kendurikita.queue_budget_warning();

create or replace function kendurikita.queue_booking_confirmation()
returns trigger language plpgsql security definer set search_path='' as $$
declare vendor_name text;
begin
  if new.status<>'confirmed' or new.status is not distinct from old.status then return new; end if;
  select company_name into vendor_name from kendurikita.vendors where id=new.vendor_id;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
  values(new.sender_id,'messages','booking_confirmed',jsonb_build_object('vendor',vendor_name),'kendurikita://vendors','booking:'||new.id) on conflict do nothing;
  return new;
end $$;
create trigger queue_booking_confirmation after update of status on kendurikita.leads for each row execute function kendurikita.queue_booking_confirmation();

create or replace function kendurikita.queue_member_joined()
returns trigger language plpgsql security definer set search_path='' as $$
declare owner uuid; event_name text; member_name text;
begin
  select owner_id,name into owner,event_name from kendurikita.events where id=new.event_id;
  if owner=new.user_id then return new; end if;
  select name into member_name from kendurikita.profiles where id=new.user_id;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
  values(owner,'messages','member_joined',jsonb_build_object('member',member_name,'event',event_name),'kendurikita://team','member:'||new.event_id||':'||new.user_id) on conflict do nothing;
  return new;
end $$;
create trigger queue_member_joined after insert on kendurikita.event_members for each row execute function kendurikita.queue_member_joined();

create or replace function kendurikita.queue_payment_recorded()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid; event_name text;
begin
  if new.vendor_id is null then return new; end if;
  select owner_id into recipient from kendurikita.vendors where id=new.vendor_id;
  select name into event_name from kendurikita.events where id=new.event_id;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
  values(recipient,'payments','payment_recorded',jsonb_build_object('kind',new.kind,'amount',new.amount,'event',event_name),'kendurikita://payments','payment-recorded:'||new.id) on conflict do nothing;
  return new;
end $$;
create trigger queue_payment_recorded after insert on kendurikita.payments for each row execute function kendurikita.queue_payment_recorded();

create or replace function kendurikita.queue_admin_alert()
returns trigger language plpgsql security definer set search_path='' as $$
declare admin_id uuid; message text;
begin
  message:=case when tg_table_name='vendors' then 'Vendor baharu menunggu pengesahan' else 'Laporan moderasi baharu menunggu semakan' end;
  for admin_id in select id from kendurikita.profiles where role='admin' loop
    insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
    values(admin_id,'messages','admin_alert',jsonb_build_object('message',message),'kendurikita://admin','admin:'||tg_table_name||':'||new.id||':'||admin_id) on conflict do nothing;
  end loop;
  return new;
end $$;
create trigger queue_new_vendor_admin after insert on kendurikita.vendors for each row execute function kendurikita.queue_admin_alert();
create trigger queue_new_report_admin after insert on kendurikita.moderation_reports for each row execute function kendurikita.queue_admin_alert();

create or replace function kendurikita.enqueue_scheduled_notifications(run_at timestamptz default now())
returns integer language plpgsql security definer set search_path='' as $$
declare inserted integer:=0; affected integer; today date:=run_at::date;
begin
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,scheduled_for,dedupe_key)
  select e.owner_id,'reminders','task_due',jsonb_build_object('task',c.title,'when',c.due_at::date::text),'kendurikita://checklist',run_at,
    'task:'||c.id||':'||today
  from kendurikita.checklist_items c join kendurikita.events e on e.id=c.event_id
  where not c.done and c.due_at::date in(today,today+3)
  on conflict do nothing; get diagnostics affected=row_count; inserted:=inserted+affected;

  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,scheduled_for,dedupe_key)
  select e.owner_id,'reminders','event_day',jsonb_build_object(
    'event',e.name,
    'attendance',(select count(*) from kendurikita.guests g where g.event_id=e.id and g.checked_in_at is not null),
    'next',coalesce((select t.title from kendurikita.timeline_items t where t.event_id=e.id and t.starts_at>=run_at order by t.starts_at limit 1),'—')
  ),'kendurikita://day-mode',run_at,'event-day:'||e.id
  from kendurikita.events e cross join lateral jsonb_array_elements_text(e.event_dates) d(value)
  where d.value::date=today
  on conflict do nothing; get diagnostics affected=row_count; inserted:=inserted+affected;

  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,scheduled_for,dedupe_key)
  select e.owner_id,'payments','payment_due',jsonb_build_object('amount',greatest(b.planned-b.paid,0),'vendor',coalesce(b.vendor_name,b.name),'date',b.due_at::text),'kendurikita://payments',run_at,
    'payment:'||b.id||':'||today
  from kendurikita.budget_items b join kendurikita.events e on e.id=b.event_id
  where b.due_at in(today+1,today+7) and b.paid<b.planned
  on conflict do nothing; get diagnostics affected=row_count; inserted:=inserted+affected;

  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,scheduled_for,dedupe_key)
  select e.owner_id,'reminders','countdown',jsonb_build_object('days',(d.value::date-today),'event',e.name),'kendurikita://',run_at,
    'countdown:'||e.id||':'||today
  from kendurikita.events e cross join lateral jsonb_array_elements_text(e.event_dates) d(value)
  where d.value::date-today in(100,30,7,1)
  on conflict do nothing; get diagnostics affected=row_count; inserted:=inserted+affected;

  if extract(isodow from run_at)=1 then
    insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,scheduled_for,dedupe_key)
    select e.owner_id,'rsvp','rsvp_pending',jsonb_build_object('count',count(*)),'kendurikita://guests',run_at,
      'rsvp-pending:'||e.id||':'||today
    from kendurikita.events e join kendurikita.guests g on g.event_id=e.id
    where g.rsvp_status='pending' and kendurikita.event_plan(e.id)<>'basic' group by e.id,e.owner_id having count(*)>0
    on conflict do nothing; get diagnostics affected=row_count; inserted:=inserted+affected;
  end if;

  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,scheduled_for,dedupe_key)
  select v.owner_id,'vendor_leads','lead_unanswered',jsonb_build_object('count',1),'kendurikita://leads',run_at,
    'lead-unanswered:'||l.id||':'||case when l.created_at<=run_at-interval '24 hours' then '24h' else '2h' end
  from kendurikita.leads l join kendurikita.vendors v on v.id=l.vendor_id
  where l.status='new' and kendurikita.vendor_plan(v.id)<>'basic' and (l.created_at between run_at-interval '3 hours' and run_at-interval '2 hours' or l.created_at between run_at-interval '25 hours' and run_at-interval '24 hours')
  on conflict do nothing; get diagnostics affected=row_count; inserted:=inserted+affected;

  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,scheduled_for,dedupe_key)
  select e.owner_id,'reminders','event_followup',jsonb_build_object('event',e.name),'kendurikita://post-event',run_at,
    'followup:'||e.id
  from kendurikita.events e cross join lateral jsonb_array_elements_text(e.event_dates) d(value)
  where d.value::date=today-1
  on conflict do nothing; get diagnostics affected=row_count; inserted:=inserted+affected;
  return inserted;
end $$;
revoke all on function kendurikita.enqueue_scheduled_notifications(timestamptz) from public;
grant execute on function kendurikita.enqueue_scheduled_notifications(timestamptz) to service_role;

create or replace function kendurikita.claim_notification_jobs(batch_size integer default 100)
returns setof kendurikita.notification_jobs language plpgsql security definer set search_path='' as $$
begin
  return query with claimed as (
    select id from kendurikita.notification_jobs
    where status in ('pending','failed') and scheduled_for<=now() and attempts<5
    order by scheduled_for for update skip locked limit least(greatest(batch_size,1),100)
  ) update kendurikita.notification_jobs j set status='processing',attempts=attempts+1
    from claimed where j.id=claimed.id returning j.*;
end $$;
revoke all on function kendurikita.claim_notification_jobs(integer) from public;
grant execute on function kendurikita.claim_notification_jobs(integer) to service_role;
