create or replace function kendurikita.queue_subscription_notification()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid; selected_template text;
begin
  recipient:=new.user_id;
  if recipient is null and new.vendor_id is not null then
    select owner_id into recipient from kendurikita.vendors where id=new.vendor_id;
  end if;
  if recipient is null then return new; end if;
  selected_template:=case when new.status='grace' then 'billing_issue' else 'package_active' end;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,dedupe_key)
  values(recipient,'payments',selected_template,jsonb_build_object('package',new.entitlement),'kendurikita://paywall',
    'subscription:'||new.provider||':'||new.provider_customer_id||':'||new.status||':'||coalesce(new.expires_at::text,''))
  on conflict do nothing;
  return new;
end $$;

create or replace function kendurikita.enqueue_vendor_weekly_notifications(run_at timestamptz default now())
returns integer language plpgsql security definer set search_path='' as $$
declare inserted integer:=0;
begin
  if extract(isodow from run_at)<>1 then return 0; end if;
  insert into kendurikita.notification_jobs(user_id,category,template,variables,deep_link,scheduled_for,dedupe_key)
  select v.owner_id,'vendor_leads','vendor_weekly_summary',jsonb_build_object(
    'views',(select count(*) from kendurikita.vendor_profile_views pv where pv.vendor_id=v.id and pv.viewed_at>=run_at-interval '7 days'),
    'leads',(select count(*) from kendurikita.leads l where l.vendor_id=v.id and l.created_at>=run_at-interval '7 days'),
    'bookings',(select count(*) from kendurikita.leads l where l.vendor_id=v.id and l.status='confirmed' and l.created_at>=run_at-interval '7 days')
  ),'kendurikita://analytics',run_at,'vendor-weekly:'||v.id||':'||run_at::date
  from kendurikita.vendors v where v.verification_status='approved'
  on conflict do nothing;
  get diagnostics inserted=row_count;
  return inserted;
end $$;

revoke all on function kendurikita.enqueue_vendor_weekly_notifications(timestamptz) from public;
grant execute on function kendurikita.enqueue_vendor_weekly_notifications(timestamptz) to service_role;
