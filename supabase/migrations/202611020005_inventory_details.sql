alter table kendurikita.inventory_items add column local_key text;
alter table kendurikita.inventory_items add column category text not null default 'other';
alter table kendurikita.inventory_items add column completed integer not null default 0 check(completed >= 0);
update kendurikita.inventory_items set local_key = id::text where local_key is null;
alter table kendurikita.inventory_items alter column local_key set not null;
alter table kendurikita.inventory_items add constraint inventory_event_local_unique unique(event_id, local_key);
