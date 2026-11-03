create or replace function kendurikita.event_plan(target uuid)
returns text language sql stable security definer set search_path='' as $$
  select case
    when exists(
      select 1 from kendurikita.subscriptions s
      join kendurikita.events e on e.owner_id=s.user_id
      where e.id=target and s.status='active'
        and (s.expires_at is null or s.expires_at>now())
        and (s.event_id is null or s.event_id=target)
        and lower(s.entitlement) like '%premium%'
    ) then 'premium'
    when exists(
      select 1 from kendurikita.subscriptions s
      join kendurikita.events e on e.owner_id=s.user_id
      where e.id=target and s.status='active'
        and (s.expires_at is null or s.expires_at>now())
        and (s.event_id is null or s.event_id=target)
        and lower(s.entitlement) like '%pro%'
    ) then 'pro'
    else 'basic' end;
$$;

drop policy if exists contributions_parent_write on kendurikita.budget_contributions;
create policy contributions_parent_write on kendurikita.budget_contributions
  for insert with check(
    contributor_id=auth.uid()
    and kendurikita.event_plan(event_id)<>'basic'
    and exists(
      select 1 from kendurikita.event_members m
      where m.event_id=event_id and m.user_id=auth.uid()
        and m.role in ('owner','partner','parent')
    )
  );
