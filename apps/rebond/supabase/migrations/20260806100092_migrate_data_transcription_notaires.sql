-- Migration additive des données des 3 tables de ce lot. Idempotent
-- (id/key préservés, ON CONFLICT DO NOTHING). Ne touche pas à public.*.
-- Ordre : ref_etat_civil_transcription_status avant etat_civil_transcriptions
-- (FK status).

insert into rebond.ref_etat_civil_transcription_status (
  key, label, color_border, color_bg, color_text, sort_order, is_active, created_at, updated_at
)
select
  key, label, color_border, color_bg, color_text, sort_order, is_active, created_at, updated_at
from public.ref_transcription_status
on conflict (key) do nothing;

insert into rebond.notariat_notaires (
  id, nom, prenom, titre, etude, lieu_exercice, notes, created_at, updated_at
)
select
  id, nom, prenom, titre, etude, lieu_exercice, notes,
  coalesce(created_at::timestamptz, now()), now()
from public.notaires
on conflict (id) do nothing;

insert into rebond.etat_civil_transcriptions (
  id, acte_id, owner_id, visibility, state, preference_reason, source_lecture_kind,
  scope, scope_details, langue_vue, language_confidence, handwriting_style,
  handwriting_legibility, goal, normalisation_policy, conventions_id,
  conventions_override_text, gabarit_id, completeness, incompleteness_reason,
  reserve_level, reserve_reason, source_page_from, source_page_to, image_anchor,
  image_transform_notes, note, validated_version_id, validated_at, validated_by,
  created_at, created_by, updated_at, updated_by, acte_citation_id, acte_source_id,
  is_reference, reference_set_at, reference_set_by, status, transcription_part,
  source_lecture_kind_ref, langue_ref, language_confidence_ref, handwriting_style_ref,
  handwriting_legibility_ref, completeness_ref, reserve_level_ref
)
select
  id, acte_id, owner_id, visibility, state, preference_reason, source_lecture_kind,
  scope, scope_details, langue_vue, language_confidence, handwriting_style,
  handwriting_legibility, goal, normalisation_policy, conventions_id,
  conventions_override_text, gabarit_id, completeness, incompleteness_reason,
  reserve_level, reserve_reason, source_page_from, source_page_to, image_anchor,
  image_transform_notes, note, validated_version_id, validated_at, validated_by,
  created_at, created_by, updated_at, updated_by, acte_citation_id, acte_source_id,
  is_reference, reference_set_at, reference_set_by, status, transcription_part,
  source_lecture_kind_ref, langue_ref, language_confidence_ref, handwriting_style_ref,
  handwriting_legibility_ref, completeness_ref, reserve_level_ref
from public.ec_transcriptions
on conflict (id) do nothing;
