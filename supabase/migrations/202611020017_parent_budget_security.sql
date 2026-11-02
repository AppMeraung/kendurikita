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
