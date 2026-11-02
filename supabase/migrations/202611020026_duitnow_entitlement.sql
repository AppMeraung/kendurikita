create or replace function kendurikita.enforce_invitation_entitlement()
returns trigger language plpgsql security definer set search_path='' as $$
declare plan text;
begin
  plan := kendurikita.event_plan(new.event_id);
  if plan='basic' and new.template_id not in ('malay','chinese','indian') then raise exception 'template_limit_reached'; end if;
  if plan='basic' then new.content := new.content - 'duitnow_qr_url'; end if;
  if plan<>'premium' then new.content := new.content - 'music_url'; end if;
  new.content := new.content || jsonb_build_object('watermark',plan='basic');
  return new;
end $$;
