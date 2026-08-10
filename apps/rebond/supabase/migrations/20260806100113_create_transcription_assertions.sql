-- Module Extraction : assertions documentaires atomiques générées par un
-- agent IA (Anthropic) à partir d'une version de transcription. Voir
-- apps/rebond/supabase/schema-docs/transcription_assertions.md pour la
-- philosophie complète (une assertion = un fait, aucune connaissance
-- extérieure, exhaustivité documentaire, entités documentaires distinctes
-- des personnes généalogiques).

-- Vocabulaire contrôlé de prédicats — extensible (ref_*), pas un enum figé,
-- pour pouvoir en ajouter au fil des actes rencontrés sans migration.
create table if not exists rebond.ref_assertion_predicates (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  ordre integer null,
  constraint ref_assertion_predicates_pkey primary key (id),
  constraint uq_ref_assertion_predicates_code unique (code)
);

insert into rebond.ref_assertion_predicates (code, label, ordre) values
  ('name', 'Nom / prénom', 1),
  ('sex', 'Sexe', 2),
  ('age', 'Âge', 3),
  ('birth', 'Naissance', 4),
  ('birth_date', 'Date de naissance', 5),
  ('birth_place', 'Lieu de naissance', 6),
  ('death', 'Décès', 7),
  ('death_date', 'Date de décès', 8),
  ('death_place', 'Lieu de décès', 9),
  ('occupation', 'Profession', 10),
  ('residence', 'Résidence', 11),
  ('domicile', 'Domicile', 12),
  ('nationality', 'Nationalité', 13),
  ('marital_status', 'Statut matrimonial', 14),
  ('widowhood', 'Veuvage', 15),
  ('father', 'Père', 16),
  ('mother', 'Mère', 17),
  ('spouse', 'Conjoint', 18),
  ('child', 'Enfant', 19),
  ('sibling', 'Frère / sœur', 20),
  ('relative', 'Autre lien de parenté', 21),
  ('neighbor', 'Voisin', 22),
  ('friend', 'Ami / connaissance', 23),
  ('witness', 'Témoin', 24),
  ('comparant', 'Comparant', 25),
  ('declarant', 'Déclarant', 26),
  ('officer_role', 'Officier d''état civil', 27),
  ('function', 'Qualité / fonction', 28),
  ('present', 'Présence', 29),
  ('absent', 'Absence', 30),
  ('consent', 'Consentement', 31),
  ('opposition', 'Opposition', 32),
  ('publication', 'Publication de mariage', 33),
  ('document_presented', 'Document présenté', 34),
  ('signs', 'Sait signer', 35),
  ('cannot_sign', 'Ne sait pas signer', 36),
  ('recognition', 'Reconnaissance', 37),
  ('reading', 'Lecture de l''acte', 38),
  ('drafting_date', 'Date de rédaction', 39),
  ('drafting_place', 'Lieu de rédaction', 40),
  ('time', 'Heure', 41),
  ('other', 'Autre', 999)
on conflict (code) do nothing;

comment on table rebond.ref_assertion_predicates is
  'Vocabulaire contrôlé des prédicats d''assertion (module Extraction). Extensible sans migration ; "other" + raw_relation pour les cas non catégorisés.';

-- Entités documentaires internes à une version de transcription (P1, P2...)
-- — distinctes des personnes de l'arbre généalogique. Le rapprochement
-- identité documentaire <-> personne généalogique est une étape ultérieure,
-- hors du périmètre de ce module.
create table if not exists rebond.transcription_entities (
  id uuid not null default gen_random_uuid(),
  transcription_version_id uuid not null,
  local_key text not null,
  label text not null,
  created_at timestamp with time zone not null default now(),
  constraint transcription_entities_pkey primary key (id),
  constraint fk_transcription_entities_version
    foreign key (transcription_version_id) references rebond.transcription_versions (id) on delete cascade,
  constraint uq_transcription_entities_version_key unique (transcription_version_id, local_key)
);

create index if not exists idx_transcription_entities_version
  on rebond.transcription_entities using btree (transcription_version_id);

comment on table rebond.transcription_entities is
  'Entités documentaires (personnes mentionnées) internes à une version de transcription précise. Voir schema-docs/transcription_assertions.md.';

-- Assertions documentaires atomiques.
create table if not exists rebond.transcription_assertions (
  id uuid not null default gen_random_uuid(),
  transcription_version_id uuid not null,
  subject_entity_id uuid not null,
  predicate_id uuid not null,
  raw_relation text null,
  object_entity_id uuid null,
  value_text text null,
  value_number numeric null,
  value_date text null,
  source_text text null,
  source_start integer null,
  source_end integer null,
  status text not null default 'pending',
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  constraint transcription_assertions_pkey primary key (id),
  constraint fk_transcription_assertions_version
    foreign key (transcription_version_id) references rebond.transcription_versions (id) on delete cascade,
  constraint fk_transcription_assertions_subject
    foreign key (subject_entity_id) references rebond.transcription_entities (id) on delete cascade,
  constraint fk_transcription_assertions_object
    foreign key (object_entity_id) references rebond.transcription_entities (id) on delete cascade,
  constraint fk_transcription_assertions_predicate
    foreign key (predicate_id) references rebond.ref_assertion_predicates (id) on delete restrict,
  constraint chk_transcription_assertions_status
    check (status in ('pending', 'validated', 'rejected'))
);

create index if not exists idx_transcription_assertions_version
  on rebond.transcription_assertions using btree (transcription_version_id);
create index if not exists idx_transcription_assertions_subject
  on rebond.transcription_assertions using btree (subject_entity_id);
create index if not exists idx_transcription_assertions_status
  on rebond.transcription_assertions using btree (status);

comment on table rebond.transcription_assertions is
  'Assertions documentaires atomiques générées par extraction IA à partir d''une version de transcription. Voir schema-docs/transcription_assertions.md.';
