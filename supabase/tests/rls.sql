begin;
select plan(25);
select has_schema('kendurikita','dedicated schema exists');
select row_security_active('kendurikita','events','events RLS active');
select row_security_active('kendurikita','budget_items','budget RLS active');
select row_security_active('kendurikita','vendors','vendors RLS active');
select policies_are('kendurikita','events',array['events_editor_update','events_member_read','events_owner_delete','events_owner_insert'],'event policies present');
select policies_are('kendurikita','leads',array['leads_parties','leads_sender_insert','leads_sender_update','leads_vendor_update'],'lead isolation policies present');
select policies_are('kendurikita','quotations',array['quotations_parties_read','quotations_vendor_delete','quotations_vendor_insert','quotations_vendor_update'],'quotation party policies present');
select policies_are('kendurikita','invoices',array['invoices_parties_read','invoices_vendor_delete','invoices_vendor_insert','invoices_vendor_update'],'invoice party policies present');
select policies_are('kendurikita','messages',array['messages_parties','messages_parties_update','messages_party_insert'],'message party policies present');
select policies_are('kendurikita','rsvps',array['rsvps_member_read'],'RSVP member policy present');
select policies_are('kendurikita','event_gallery',array['event_gallery_member_read','event_gallery_member_write'],'gallery policies present');
select row_security_active('kendurikita','notification_jobs','notification outbox RLS active');
select row_security_active('kendurikita','vendor_profile_views','vendor profile analytics RLS active');

insert into auth.users(id,aud,role,email) values
  ('10000000-0000-4000-8000-000000000001','authenticated','authenticated','a@example.test'),
  ('10000000-0000-4000-8000-000000000002','authenticated','authenticated','b@example.test'),
  ('10000000-0000-4000-8000-000000000003','authenticated','authenticated','vendor@example.test');
insert into kendurikita.profiles(id,role,name) values
  ('10000000-0000-4000-8000-000000000001','user','User A'),
  ('10000000-0000-4000-8000-000000000002','user','User B'),
  ('10000000-0000-4000-8000-000000000003','vendor','Vendor C');
insert into kendurikita.events(id,owner_id,name,event_type) values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Event A','wedding'),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Event B','wedding');
insert into kendurikita.budget_items(event_id,local_key,category,name,planned) values
  ('20000000-0000-4000-8000-000000000001','a-budget','Other','A item',100),
  ('20000000-0000-4000-8000-000000000002','b-budget','Other','B item',200);
insert into kendurikita.vendors(id,owner_id,slug,company_name,verification_status) values
  ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','vendor-c','Vendor C','approved');
insert into kendurikita.leads(id,event_id,vendor_id,sender_id,message) values
  ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','A lead');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select throws_ok(
  $update kendurikita.profiles set role='admin' where id='10000000-0000-4000-8000-000000000001'$,
  '42501', null, 'user cannot promote self to admin');
select throws_ok(
  $update kendurikita.profiles set role='superadmin' where id='10000000-0000-4000-8000-000000000001'$,
  '42501', null, 'user cannot promote self to superadmin');
select lives_ok(
  $update kendurikita.profiles set name='Updated name' where id='10000000-0000-4000-8000-000000000001'$,
  'user can still edit non-privileged profile fields');
select results_eq($select name from kendurikita.events order by name$,$$values('Event A'::text)$$,'user A reads own event');
select results_eq($$select count(*)::integer from kendurikita.events where id='20000000-0000-4000-8000-000000000002'$$,$$values(0)$$,'user A cannot read user B event');
select results_eq($$select name from kendurikita.budget_items order by name$$,$$values('A item'::text)$$,'user A reads own budget');
select results_eq($$select count(*)::integer from kendurikita.budget_items where event_id='20000000-0000-4000-8000-000000000002'$$,$$values(0)$$,'user A cannot read user B budget');
select throws_ok($$insert into kendurikita.budget_items(event_id,local_key,category,name,planned) values('20000000-0000-4000-8000-000000000002','attack','Other','Attack',1)$$,'42501',null,'user A cannot write user B budget');
select results_eq($$select count(*)::integer from kendurikita.leads$$,$$values(1)$$,'lead sender reads own lead');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select results_eq($$select count(*)::integer from kendurikita.leads$$,$$values(1)$$,'owning vendor reads assigned lead');
select results_eq($$update kendurikita.vendors set verification_status='rejected' where id='30000000-0000-4000-8000-000000000001' returning verification_status::text$$,$$values('approved'::text)$$,'vendor cannot change own moderation status');
select results_eq($$select count(*)::integer from kendurikita.budget_items$$,$$values(0)$$,'vendor cannot read customer budget without event membership');
select * from finish();
rollback;
