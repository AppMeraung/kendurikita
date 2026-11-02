alter table kendurikita.vendors
  add column if not exists short_description jsonb not null default '{}',
  add column if not exists social_links jsonb not null default '{}';
