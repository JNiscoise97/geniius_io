# `rebond.ref_etat_civil_transcription_status`

Statuts de workflow d'une transcription d'acte d'état civil (à transcrire, en
cours, validée...), avec couleurs d'affichage.

**Renommée depuis `public.ref_transcription_status`.**

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `key` | text | PK | Clé stable du statut (ex. `TO_TRANSCRIBE`) |
| `label` | text | not null | Libellé affiché |
| `color_border` / `color_bg` / `color_text` | text | not null | Couleurs d'affichage du badge de statut |
| `sort_order` | integer | not null, défaut `0` | Ordre d'affichage |
| `is_active` | boolean | not null, défaut `true` | Statut activable/désactivable |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Référencée par `rebond.etat_civil_transcriptions.status` (`ON UPDATE CASCADE
ON DELETE RESTRICT`).

## Pourquoi ce renommage

Préfixe `etat_civil_` ajouté : seule consommatrice est
`etat_civil_transcriptions.status`, table transversale en apparence mais en
réalité spécifique au domaine état civil (aucune autre table du schéma ne la
référence). Suit la même logique que `ref_etat_civil_registre_*`.

## Écarts vs `public.ref_transcription_status`

Aucun. PK sur `key` (text) conservée telle quelle — volontaire dans
l'originale.
