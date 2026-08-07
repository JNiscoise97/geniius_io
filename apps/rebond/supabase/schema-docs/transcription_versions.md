# `rebond.transcription_versions`

Historique de versions de `rebond.transcriptions` — instantanés nommés du
contenu (Tiptap JSON), créés **explicitement** par l'utilisateur (bouton
"Enregistrer une version" dans l'atelier documentaire), pas à chaque
auto-sauvegarde. `rebond.transcriptions.contenu` reste le brouillon courant,
mis à jour en continu par l'auto-save ; une version est un point de
restauration volontaire.

## Colonnes

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | PK |
| `transcription_id` | uuid | FK → `rebond.transcriptions`, `CASCADE`. |
| `version` | integer | Numéro incrémental par `transcription_id`, assigné automatiquement par `trg_transcription_versions_autonumber` si non fourni (évite une race condition côté client). |
| `contenu` | jsonb | Instantané du document Tiptap au moment de l'enregistrement. |
| `change_summary` | text | Résumé optionnel du changement, saisi par l'utilisateur. |
| `created_at` / `created_by` | timestamptz / uuid | — |

## Relations

- `transcription_id` → `rebond.transcriptions`, `ON DELETE CASCADE`.

## Fonctions et triggers

- `trg_transcription_versions_autonumber` (`BEFORE INSERT`) : si `version`
  est `NULL`, l'assigne à `max(version) + 1` pour ce `transcription_id` via
  `rebond.fn_transcription_versions_autonumber()`.

## Pourquoi pas une version à chaque auto-save

Décidé en session (2026-08-07) : l'auto-save tourne toutes les ~1,2s après
une frappe — créer une version à chaque déclenchement ferait exploser
l'historique et le rendrait inexploitable. Une version est donc un
"checkpoint" volontaire, cohérent avec l'usage (relire l'évolution d'une
transcription, revenir à un état antérieur), pas un journal de chaque
frappe.
