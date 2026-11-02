do $$ declare table_name text; begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'checklist_items','budget_items','guests','timeline_items','team_contacts',
      'tables_seating','inventory_items','documents','messages','rsvps','event_gallery'
    ] loop
      if not exists(
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'kendurikita'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table kendurikita.%I', table_name);
      end if;
    end loop;
  end if;
end $$;
