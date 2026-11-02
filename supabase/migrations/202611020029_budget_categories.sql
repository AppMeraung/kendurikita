alter table kendurikita.events
  add column if not exists budget_categories jsonb not null default '[]'::jsonb;

update kendurikita.events
set budget_categories = '[
  {"id":"hall","name":"Dewan"},
  {"id":"catering","name":"Katering"},
  {"id":"dais","name":"Pelamin"},
  {"id":"attire","name":"Busana"},
  {"id":"photo-video","name":"Foto & Video"},
  {"id":"hantaran","name":"Hantaran"},
  {"id":"door-gift","name":"Door gift"},
  {"id":"other","name":"Lain-lain"}
]'::jsonb
where budget_categories = '[]'::jsonb;
