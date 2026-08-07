-- "Zones spécifiques" de l'atelier documentaire : mentions marginales,
-- signatures, ratures marginales... Générique à tous les types de documents
-- (pas seulement les actes d'état civil, cf. décision du 2026-08-07) — les
-- types de zone sont eux-mêmes une référence extensible (ref_*), pas un enum
-- figé, pour pouvoir en ajouter sans migration de schéma.

create table if not exists rebond.ref_transcription_zone_types (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  ordre integer null,
  constraint ref_transcription_zone_types_pkey primary key (id),
  constraint uq_ref_transcription_zone_types_code unique (code)
);

insert into rebond.ref_transcription_zone_types (code, label, ordre) values
  ('mention_marginale', 'Mention marginale', 1),
  ('signature', 'Signature', 2),
  ('rature_marginale', 'Rature marginale', 3)
on conflict (code) do nothing;

comment on table rebond.ref_transcription_zone_types is
  'Types de zone spécifique disponibles dans l''atelier documentaire (mention marginale, signature, rature...). Extensible sans migration de schéma.';

create table if not exists rebond.transcription_zones (
  id uuid not null default gen_random_uuid(),
  transcription_id uuid not null,
  zone_type_id uuid not null,
  contenu text not null,
  ordre integer null,
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  updated_at timestamp with time zone not null default now(),
  updated_by uuid null,
  constraint transcription_zones_pkey primary key (id),
  constraint fk_transcription_zones_transcription
    foreign key (transcription_id) references rebond.transcriptions (id) on delete cascade,
  constraint fk_transcription_zones_type
    foreign key (zone_type_id) references rebond.ref_transcription_zone_types (id) on delete restrict
);

create index if not exists idx_transcription_zones_transcription
  on rebond.transcription_zones using btree (transcription_id);
create index if not exists idx_transcription_zones_type
  on rebond.transcription_zones using btree (zone_type_id);

create trigger trg_transcription_zones_touch
  before update on rebond.transcription_zones
  for each row execute function public.fn_touch_updated_at();

comment on table rebond.transcription_zones is
  'Relevés de "zones spécifiques" (mentions marginales, signatures, ratures...) d''une transcription. Voir apps/rebond/supabase/schema-docs/transcription_zones.md';
