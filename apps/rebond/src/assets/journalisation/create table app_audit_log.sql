create table if not exists public.app_audit_log (
  id          uuid primary key default gen_random_uuid(),
  at          timestamptz not null default now(),
  action      text not null check (action in ('INSERT','UPDATE','DELETE')),
  table_name  text not null,
  row_id      uuid,                       -- id de la ligne cible (si UUID), sinon null
  pk_text     text,                       -- fallback si la PK n'est pas un uuid
  user_id     uuid,                       -- auth.uid() quand dispo (JWT)
  session_id  text,                       -- optionnel: fourni par le client
  old_data    jsonb,
  new_data    jsonb,
  diff        jsonb,
  ip          inet,                       -- optionnel: si tu la passes depuis le client
  ua          text                        -- user-agent, optionnel
);

-- 2) Index utiles
create index if not exists app_audit_log_at_desc_idx on public.app_audit_log (at desc);
create index if not exists app_audit_log_tbl_row_idx on public.app_audit_log (table_name, row_id, at desc);
create index if not exists app_audit_log_user_idx on public.app_audit_log (user_id, at desc);
create index if not exists app_audit_log_newdata_gin on public.app_audit_log using gin (new_data jsonb_path_ops);

create type public.entity_kind as enum ('acte', 'registre', 'bureau', 'acteur', 'autre');

alter table public.app_audit_log
  add column if not exists entity_type public.entity_kind,
  add column if not exists entity_id   uuid,         -- recopie de la PK si UUID
  add column if not exists entity_label text; 