-- Modules Entités + Réconciliation (2026-08-08).
--
-- Registre canonique d'entités, distinct de rebond.transcription_entities
-- (qui reste local à une version de transcription précise). Une entité
-- canonique regroupe tout ce qu'on sait d'une même personne/lieu réel à
-- travers plusieurs actes. Promue automatiquement (pas d'action manuelle)
-- dès qu'au moins une assertion la concernant est validée dans le module
-- Extraction — voir apps/rebond/src/features/entites/entites.service.ts,
-- ensureEntitiesPromoted().
--
-- Seuls entity_type 'person' et 'place' sont promus. 'document' reste dans
-- Patrimoine documentaire, 'event' reste local à Extraction (un événement
-- d'un acte n'a pas de sens à rapprocher de celui d'un autre acte) — voir
-- schema-docs/entities.md pour la doctrine complète.

create table if not exists rebond.entities (
  id uuid not null default gen_random_uuid(),
  entity_type text not null,
  label text not null,
  merged_into_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint entities_pkey primary key (id),
  constraint chk_entities_entity_type check (entity_type in ('person', 'place')),
  constraint fk_entities_merged_into
    foreign key (merged_into_id) references rebond.entities (id) on delete set null
);

create index if not exists idx_entities_type_label
  on rebond.entities using btree (entity_type, lower(label));
create index if not exists idx_entities_merged_into
  on rebond.entities using btree (merged_into_id);

create trigger trg_entities_touch
  before update on rebond.entities
  for each row execute function public.fn_touch_updated_at();

comment on table rebond.entities is
  'Registre canonique de personnes/lieux, cross-documents. Alimenté par promotion automatique depuis transcription_entities (assertions validées), fusionné via le module Réconciliation. Voir apps/rebond/supabase/schema-docs/entities.md.';

-- Lien entre une entité locale (scopée à une version) et sa fiche
-- canonique. Une entité locale ne peut être promue qu'une seule fois (elle
-- garde toujours le même entity_id, même si celui-ci est ensuite fusionné
-- dans un autre via entities.merged_into_id).
create table if not exists rebond.entity_links (
  id uuid not null default gen_random_uuid(),
  entity_id uuid not null,
  transcription_entity_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint entity_links_pkey primary key (id),
  constraint fk_entity_links_entity
    foreign key (entity_id) references rebond.entities (id) on delete cascade,
  constraint fk_entity_links_transcription_entity
    foreign key (transcription_entity_id) references rebond.transcription_entities (id) on delete cascade,
  constraint uq_entity_links_transcription_entity unique (transcription_entity_id)
);

create index if not exists idx_entity_links_entity
  on rebond.entity_links using btree (entity_id);

comment on table rebond.entity_links is
  'Association entité locale (transcription_entities, un acte) -> entité canonique (entities, cross-documents).';

-- Une paire (type, libellé) que l'utilisateur a explicitement confirmée
-- comme n'étant PAS un doublon, pour ne plus la re-suggérer dans
-- Réconciliation. Dismissal au niveau du groupe (même libellé normalisé),
-- pas par paire d'entités précise — plus simple, cohérent avec la façon
-- dont Réconciliation présente les candidats (par groupe, pas par paire).
create table if not exists rebond.entity_merge_dismissals (
  id uuid not null default gen_random_uuid(),
  entity_type text not null,
  normalized_label text not null,
  created_at timestamp with time zone not null default now(),
  constraint entity_merge_dismissals_pkey primary key (id),
  constraint chk_entity_merge_dismissals_type check (entity_type in ('person', 'place')),
  constraint uq_entity_merge_dismissals unique (entity_type, normalized_label)
);

comment on table rebond.entity_merge_dismissals is
  'Groupes (entity_type, libellé normalisé) explicitement écartés comme non-doublons dans Réconciliation — ne plus les re-suggérer.';
