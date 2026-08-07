-- Table générique de transcription pour l'atelier documentaire : le contenu
-- riche (Tiptap JSON) d'un exemplaire, tous types de documents confondus.
-- Volontairement simple (pas de versioning, une transcription par
-- exemplaire) — distincte de rebond.etat_civil_transcriptions (métadonnées
-- de transcription spécifiques aux actes d'état civil, sans colonne de
-- contenu, cf. supabase/schema-docs/etat_civil_transcriptions.md).

create table if not exists rebond.transcriptions (
  id uuid not null default gen_random_uuid(),
  exemplaire_id uuid not null,
  contenu jsonb not null default '{}'::jsonb,
  statut text not null default 'en_cours',
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  updated_at timestamp with time zone not null default now(),
  updated_by uuid null,
  constraint transcriptions_pkey primary key (id),
  constraint fk_transcriptions_exemplaire
    foreign key (exemplaire_id) references rebond.exemplaires (id) on delete cascade,
  constraint uq_transcriptions_exemplaire unique (exemplaire_id),
  constraint chk_transcriptions_statut check (statut in ('en_cours', 'termine'))
);

create index if not exists idx_transcriptions_exemplaire
  on rebond.transcriptions using btree (exemplaire_id);

create trigger trg_transcriptions_touch
  before update on rebond.transcriptions
  for each row execute function public.fn_touch_updated_at();

comment on table rebond.transcriptions is
  'Contenu de transcription (Tiptap JSON) par exemplaire, pour l''atelier documentaire. Voir apps/rebond/supabase/schema-docs/transcriptions.md';
