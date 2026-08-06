-- Transcriptions d'actes d'état civil. Renommée depuis public.ec_transcriptions
-- (ec_ → etat_civil_, même conversion que ec_tables → etat_civil_repertoires).
--
-- FK repointées vers rebond (tables déjà migrées) :
--   - acte_id → rebond.etat_civil_actes
--   - langue_ref → rebond.ref_langues
--   - handwriting_legibility_ref → rebond.ref_handwriting_legibility
--   - status → rebond.ref_etat_civil_transcription_status (créée dans ce lot)
-- FK restant cross-schema vers public.* (tables pas encore migrées) :
--   acte_source_id / acte_citation_id → etat_civil_acte_citations,
--   gabarit_id → ec_transcription_gabarits,
--   conventions_id → ec_transcription_conventions,
--   validated_version_id → ec_transcription_versions,
--   completeness_ref → ref_completude_transcription,
--   handwriting_style_ref → ref_handwriting_style,
--   language_confidence_ref → ref_confiance,
--   reserve_level_ref → ref_niveau_reserve,
--   source_lecture_kind_ref → ref_support_lecture.
--
-- Les types enum (ref_transcription_visibility, ref_transcription_state,
-- ec_source_lecture_kind, ec_confidence_level, ec_handwriting_style,
-- ec_handwriting_legibility, ref_transcription_goal, ref_transcription_scope,
-- ref_transcription_completeness, ref_transcription_incompleteness_reason,
-- ref_transcription_reserve_level) sont réutilisés tels quels depuis public
-- (schéma-agnostiques par nature, pas de donnée à migrer).

create table if not exists rebond.etat_civil_transcriptions (
  id uuid not null default gen_random_uuid(),
  acte_id uuid not null,
  owner_id uuid null,
  visibility public.ref_transcription_visibility not null default 'private'::public.ref_transcription_visibility,
  state public.ref_transcription_state not null default 'active'::public.ref_transcription_state,
  preference_reason text null,
  source_lecture_kind public.ec_source_lecture_kind not null default 'image_originale'::public.ec_source_lecture_kind,
  scope public.ref_transcription_scope not null default 'full_acte'::public.ref_transcription_scope,
  scope_details text null,
  langue_vue text null,
  language_confidence public.ec_confidence_level null,
  handwriting_style public.ec_handwriting_style null,
  handwriting_legibility public.ec_handwriting_legibility null,
  goal public.ref_transcription_goal null,
  normalisation_policy jsonb not null default '{}'::jsonb,
  conventions_id uuid null,
  conventions_override_text text null,
  gabarit_id uuid null,
  completeness public.ref_transcription_completeness not null default 'complete'::public.ref_transcription_completeness,
  incompleteness_reason public.ref_transcription_incompleteness_reason null,
  reserve_level public.ref_transcription_reserve_level not null default 'none'::public.ref_transcription_reserve_level,
  reserve_reason text null,
  source_page_from integer null,
  source_page_to integer null,
  image_anchor jsonb not null default '{}'::jsonb,
  image_transform_notes text null,
  note text null,
  validated_version_id uuid null,
  validated_at timestamp with time zone null,
  validated_by uuid null,
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  updated_at timestamp with time zone not null default now(),
  updated_by uuid null,
  acte_citation_id uuid null,
  acte_source_id uuid null,
  is_reference boolean not null default false,
  reference_set_at timestamp with time zone null,
  reference_set_by uuid null,
  status text not null default 'TO_TRANSCRIBE'::text,
  transcription_part text not null default 'main_body'::text,
  source_lecture_kind_ref uuid null,
  langue_ref uuid null,
  language_confidence_ref uuid null,
  handwriting_style_ref uuid null,
  handwriting_legibility_ref uuid null,
  completeness_ref uuid null,
  reserve_level_ref uuid null,
  constraint etat_civil_transcriptions_pkey primary key (id),
  constraint fk_etat_civil_transcriptions_acte
    foreign key (acte_id) references rebond.etat_civil_actes (id) on delete cascade,
  constraint etat_civil_transcriptions_acte_source_fk
    foreign key (acte_source_id) references public.etat_civil_acte_citations (id) on delete cascade,
  constraint fk_etat_civil_transcriptions_acte_citation
    foreign key (acte_citation_id) references public.etat_civil_acte_citations (id) on delete restrict,
  constraint fk_etat_civil_transcriptions_conventions
    foreign key (conventions_id) references public.ec_transcription_conventions (id) on delete set null,
  constraint fk_etat_civil_transcriptions_gabarit
    foreign key (gabarit_id) references public.ec_transcription_gabarits (id) on delete set null,
  constraint fk_etat_civil_transcriptions_validated_version
    foreign key (validated_version_id) references public.ec_transcription_versions (id) on delete set null,
  constraint fk_etat_civil_transcriptions_status
    foreign key (status) references rebond.ref_etat_civil_transcription_status (key) on update cascade on delete restrict,
  constraint etat_civil_transcriptions_completeness_ref_fkey
    foreign key (completeness_ref) references public.ref_completude_transcription (id) on delete set null,
  constraint etat_civil_transcriptions_handwriting_legibility_ref_fkey
    foreign key (handwriting_legibility_ref) references rebond.ref_handwriting_legibility (id) on delete set null,
  constraint etat_civil_transcriptions_handwriting_style_ref_fkey
    foreign key (handwriting_style_ref) references public.ref_handwriting_style (id) on delete set null,
  constraint etat_civil_transcriptions_language_confidence_ref_fkey
    foreign key (language_confidence_ref) references public.ref_confiance (id) on delete set null,
  constraint etat_civil_transcriptions_langue_ref_fkey
    foreign key (langue_ref) references rebond.ref_langues (id) on delete set null,
  constraint etat_civil_transcriptions_reserve_level_ref_fkey
    foreign key (reserve_level_ref) references public.ref_niveau_reserve (id) on delete set null,
  constraint etat_civil_transcriptions_source_lecture_kind_ref_fkey
    foreign key (source_lecture_kind_ref) references public.ref_support_lecture (id) on delete set null,
  constraint chk_etat_civil_transcriptions_pages_range check (
    (source_page_from is null and source_page_to is null)
    or (source_page_from is not null and source_page_to is not null and source_page_from <= source_page_to)
  ),
  constraint chk_etat_civil_transcriptions_incomplete_reason check (
    (completeness = 'complete'::public.ref_transcription_completeness and incompleteness_reason is null)
    or (completeness <> 'complete'::public.ref_transcription_completeness and incompleteness_reason is not null)
  )
);

create index if not exists idx_etat_civil_transcriptions_acte_citation
  on rebond.etat_civil_transcriptions using btree (acte_citation_id);
create unique index if not exists uq_etat_civil_transcriptions_acte_source_part
  on rebond.etat_civil_transcriptions using btree (acte_id, acte_source_id, transcription_part);
create index if not exists idx_etat_civil_transcriptions_acte_ref
  on rebond.etat_civil_transcriptions using btree (acte_id, is_reference);
create unique index if not exists uq_etat_civil_transcriptions_one_reference_per_acte
  on rebond.etat_civil_transcriptions using btree (acte_id) where (is_reference is true);
create index if not exists idx_etat_civil_transcriptions_status
  on rebond.etat_civil_transcriptions using btree (status);
create unique index if not exists uq_etat_civil_transcriptions_acte_citation_part
  on rebond.etat_civil_transcriptions using btree (acte_id, acte_citation_id, transcription_part) where (acte_citation_id is not null);
create index if not exists idx_etat_civil_transcriptions_source_lecture_kind_ref
  on rebond.etat_civil_transcriptions using btree (source_lecture_kind_ref);
create index if not exists idx_etat_civil_transcriptions_langue_ref
  on rebond.etat_civil_transcriptions using btree (langue_ref);
create index if not exists idx_etat_civil_transcriptions_language_confidence_ref
  on rebond.etat_civil_transcriptions using btree (language_confidence_ref);
create index if not exists idx_etat_civil_transcriptions_handwriting_style_ref
  on rebond.etat_civil_transcriptions using btree (handwriting_style_ref);
create index if not exists idx_etat_civil_transcriptions_acte
  on rebond.etat_civil_transcriptions using btree (acte_id);
create index if not exists idx_etat_civil_transcriptions_gabarit
  on rebond.etat_civil_transcriptions using btree (gabarit_id);
create index if not exists idx_etat_civil_transcriptions_conventions
  on rebond.etat_civil_transcriptions using btree (conventions_id);
create index if not exists idx_etat_civil_transcriptions_state
  on rebond.etat_civil_transcriptions using btree (state);
create index if not exists idx_etat_civil_transcriptions_handwriting_legibility_ref
  on rebond.etat_civil_transcriptions using btree (handwriting_legibility_ref);
create index if not exists idx_etat_civil_transcriptions_completeness_ref
  on rebond.etat_civil_transcriptions using btree (completeness_ref);
create index if not exists idx_etat_civil_transcriptions_reserve_level_ref
  on rebond.etat_civil_transcriptions using btree (reserve_level_ref);

comment on table rebond.etat_civil_transcriptions is
  'Transcriptions d''actes d''état civil. Voir apps/rebond/supabase/schema-docs/etat_civil_transcriptions.md';
