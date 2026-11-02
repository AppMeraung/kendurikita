alter table kendurikita.mas_kahwin_rates
  add column if not exists unmarried_amount numeric(12,2) check(unmarried_amount>=0),
  add column if not exists previously_married_amount numeric(12,2) check(previously_married_amount>=0);

create policy rates_admin_insert on kendurikita.mas_kahwin_rates
  for insert to authenticated with check(kendurikita.is_admin());
create policy rates_admin_update on kendurikita.mas_kahwin_rates
  for update to authenticated using(kendurikita.is_admin()) with check(kendurikita.is_admin());
create policy rates_admin_delete on kendurikita.mas_kahwin_rates
  for delete to authenticated using(kendurikita.is_admin());
grant insert, update, delete on kendurikita.mas_kahwin_rates to authenticated;

insert into kendurikita.mas_kahwin_rates(
  state, amount, unmarried_amount, previously_married_amount,
  typical_hantaran_min, typical_hantaran_max, source_url, checked_at
) values
  ('Selangor',300,300,300,null,null,'https://emusykil.muftiselangor.gov.my/index.php/site/jawapan?id=5910','2026-11-03'),
  ('Pahang',100,100,100,null,null,'https://www.pahang.gov.my/pahang/resources/PDF/Berita/2024/Mac/%2828hb%29_KADAR_BAHARU_MAS_KAHWIN_PAHANG_DITETAP_RM100.pdf','2026-11-03'),
  ('Negeri Sembilan',200,200,100,null,null,'https://jheains.ns.gov.my/images/download/perkahwinan/PERMOHONAN_PERKAHWINAN.pdf','2026-11-03')
on conflict(state) do update set
  amount=excluded.amount,
  unmarried_amount=excluded.unmarried_amount,
  previously_married_amount=excluded.previously_married_amount,
  source_url=excluded.source_url,
  checked_at=excluded.checked_at;
