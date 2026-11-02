create or replace function kendurikita.enforce_member_limit()
returns trigger language plpgsql security definer set search_path='' as $$
declare used integer; maximum integer; plan text;
begin
  if new.role='owner' then return new; end if;
  plan := kendurikita.event_plan(new.event_id);
  if new.role='parent' and plan='basic' then raise exception 'pro_required'; end if;
  maximum := case plan when 'premium' then 2147483647 when 'pro' then 5 else 1 end;
  select count(*) into used from kendurikita.event_members
    where event_id=new.event_id and role<>'owner' and user_id<>new.user_id;
  if used+1>maximum then raise exception 'member_limit_reached'; end if;
  return new;
end $$;

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
