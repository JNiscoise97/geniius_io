# `rebond.etat_civil_transcriptions`

Transcriptions d'actes d'état civil : une ou plusieurs transcriptions par
acte, avec métadonnées de source, langue, écriture, complétude, réserve, et
un système de validation (version validée, transcription de référence).

**Renommée depuis `public.ec_transcriptions`** (`ec_` → `etat_civil_`, même
conversion que `ec_tables` → `etat_civil_repertoires`).

## Colonnes

Colonnes inchangées vs l'originale (voir `public.ec_transcriptions` pour le
détail complet — 45 colonnes). Points notables :

- `status` (text) : FK vers `ref_etat_civil_transcription_status.key`.
- Nombreuses colonnes `*_ref` (uuid) en parallèle de colonnes enum du même
  nom sans suffixe (ex. `handwriting_style` enum + `handwriting_style_ref`
  uuid → `ref_handwriting_style`) : coexistence assumée de l'originale, pas
  résolue dans ce lot (pattern de migration enum → référentiel normalisé déjà
  en cours côté `public`, hors périmètre de ce renommage).
- Deux FK distinctes vers la même table de citations
  (`acte_source_id`/`acte_citation_id` → `etat_civil_acte_citations`), avec
  des comportements `ON DELETE` différents (`CASCADE` vs `RESTRICT`) —
  conservé tel quel.

## Relations

FK repointées vers `rebond` (tables déjà migrées) :
- `acte_id` → `rebond.etat_civil_actes`, `CASCADE`
- `langue_ref` → `rebond.ref_langues`, `SET NULL`
- `handwriting_legibility_ref` → `rebond.ref_handwriting_legibility`, `SET NULL`
- `status` → `rebond.ref_etat_civil_transcription_status`, `ON UPDATE CASCADE ON DELETE RESTRICT`

FK restant cross-schema vers `public.*` (tables pas encore migrées) :
- `acte_source_id` / `acte_citation_id` → `public.etat_civil_acte_citations`
- `gabarit_id` → `public.ec_transcription_gabarits`
- `conventions_id` → `public.ec_transcription_conventions`
- `validated_version_id` → `public.ec_transcription_versions`
- `completeness_ref` → `public.ref_completude_transcription`
- `handwriting_style_ref` → `public.ref_handwriting_style`
- `language_confidence_ref` → `public.ref_confiance`
- `reserve_level_ref` → `public.ref_niveau_reserve`
- `source_lecture_kind_ref` → `public.ref_support_lecture`

Les types enum utilisés par les colonnes (`ref_transcription_visibility`,
`ref_transcription_state`, `ec_source_lecture_kind`, `ec_confidence_level`,
`ec_handwriting_style`, `ec_handwriting_legibility`, `ref_transcription_goal`,
`ref_transcription_scope`, `ref_transcription_completeness`,
`ref_transcription_incompleteness_reason`, `ref_transcription_reserve_level`)
sont réutilisés directement depuis `public` : un type n'est pas une donnée,
pas de migration nécessaire, référencé cross-schema comme les fonctions
schéma-agnostiques.

## Fonctions et triggers

- `trg_etat_civil_transcriptions_touch` (`BEFORE UPDATE`) : réutilise
  `public.fn_touch_updated_at()` — corps vérifié (`new.updated_at := now()`),
  schéma-agnostique. Identique en comportement à
  `public.fn_set_updated_at()`/`set_updated_at()`, doublon pré-existant côté
  `public`, non résolu.
- `trg_etat_civil_transcriptions_validated_version_belongs`
  (`BEFORE INSERT OR UPDATE OF validated_version_id`) : utilise
  `rebond.fn_ec_transcriptions_validated_version_belongs()`, dupliquée
  (référence en dur `public.ec_transcription_versions`, non migrée) — corps
  identique à l'originale.

## Pourquoi ce renommage

Le préfixe `ec_` est systématiquement converti en `etat_civil_` dans ce
schéma (déjà fait pour `ec_tables` → `etat_civil_repertoires`).

## Écarts vs `public.ec_transcriptions`

Aucun écart de colonnes ou de contrainte, uniquement des renommages de
contraintes/index pour matcher le nouveau nom de table.
