# `rebond.etat_civil_actes`

Actes d'état civil individuels (naissance, mariage, décès...) — l'unité la
plus fine du domaine, rattachée à un bureau et éventuellement à un registre.

## Colonnes principales

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `bureau_id` | uuid | not null, FK → `etat_civil_bureaux` | Bureau de l'acte |
| `redaction_bureau_id` | uuid | nullable, FK → `etat_civil_bureaux` | Bureau de rédaction si différent |
| `registre_id` | uuid | nullable, FK → `etat_civil_registres` | Registre d'appartenance |
| `type_acte` | text | nullable | **Texte libre**, doublon avec `type_acte_ref` (voir note) |
| `type_acte_ref` | uuid | nullable, FK → `ref_etat_civil_type_acte` | Type d'acte normalisé |
| `annee`, `date`, `heure`, `numero_acte` | — | nullable | Datation/référence de l'acte |
| `transcription`, `source`, `reference` | text | nullable | Contenu et provenance |
| `mentions_marginales`, `comparution_mairie`, `comparution_observations`, `contrat_mariage`, `enfants_legitimes`, `enfants_nombre`, `multi`, `lieu_situation`, `lieu_transport_raison` | — | nullable | Champs métier état civil |
| `auteur_institutionnel_ref` | uuid | nullable, FK cross-schema | Institution auteure |
| `preferred_transcription_id` | uuid | nullable, FK cross-schema | Transcription retenue |
| `status` | text | not null, défaut `'TO_TRANSCRIBE'`, FK cross-schema sur clé naturelle | Statut du workflow de transcription |
| `label` | text | nullable | Libellé (pas de génération automatique ici, contrairement à `etat_civil_registres`) |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `bureau_id`, `redaction_bureau_id` → `rebond.etat_civil_bureaux.id`.
- `registre_id` → `rebond.etat_civil_registres.id`, `CASCADE`.
- `type_acte_ref` → `rebond.ref_etat_civil_type_acte.id`, `RESTRICT`.
- `status` → cross-schema `public.ref_transcription_status.key` — **FK sur
  clé naturelle texte**, pas sur un `id` uuid (seule table du lot dans ce cas).
- `auteur_institutionnel_ref` → cross-schema `public.ref_auteur_institutionnel.id`.
- `preferred_transcription_id` → cross-schema `public.ec_transcriptions.id`.

Ces 3 dernières restent en `public.*` (tables pas encore migrées) — à
corriger quand elles le seront.

## Audit

Trigger `trg_audit_etat_civil_actes` → réutilise `public.fn_audit_trigger()`
telle quelle, catégorisée `'acte'`.

## Écarts vs `public.etat_civil_actes`

`created_at`/`updated_at` passés en `not null` (déjà `default now()`, même
correctif que `etat_civil_bureaux`/`etat_civil_registres`, sans impact réel).

## Note (non corrigée)

Même duplication `type_acte` (texte) / `type_acte_ref` (FK) que sur
`etat_civil_registres` — l'app écrit toujours les deux, non touché.
