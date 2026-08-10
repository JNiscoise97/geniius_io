# `rebond.transcription_versions`

Historique de versions de `rebond.transcriptions` — instantanés nommés,
créés **explicitement** par l'utilisateur (bouton "Enregistrer une version"
dans l'atelier documentaire), pas à chaque auto-sauvegarde.
`rebond.transcriptions`/`rebond.transcription_zones` restent le brouillon
courant, mis à jour en continu (auto-save texte, écriture immédiate zones/
qualité) ; une version est un point de restauration volontaire.

**Modèle brouillon/version resserré le 2026-08-08** (analogie git working
tree / commit) : une version fige désormais **trois facettes ensemble**
(texte + zones + qualité), pas seulement le texte comme au départ. Le
frontend (`TranscriptionEditorPage.tsx`, `computeIsDirty`) compare le
brouillon courant à `versions[0]` pour savoir s'il a divergé ("isDirty") —
ça gate le bouton "Marquer comme transcrit" (indisponible tant que le
brouillon n'est pas identique à la dernière version enregistrée) et active
"Annuler le brouillon" (revient au contenu de `versions[0]`). Les
commentaires ancrés (`rebond.transcription_commentaires`) sont **exclus**
de ce mécanisme, volontairement : ils forment un fil de discussion continu,
pas un fait documentaire à figer par version.

## Colonnes

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | PK |
| `transcription_id` | uuid | FK → `rebond.transcriptions`, `CASCADE`. |
| `version` | integer | Numéro incrémental par `transcription_id`, assigné automatiquement par `trg_transcription_versions_autonumber` si non fourni (évite une race condition côté client). |
| `contenu` | jsonb | Instantané du document Tiptap au moment de l'enregistrement. |
| `change_summary` | text | Résumé optionnel du changement, saisi par l'utilisateur. |
| `zones_snapshot` | jsonb | Ajouté 2026-08-08. Instantané des zones spécifiques au moment de l'enregistrement — tableau de `{zoneTypeId, contenu}`, pas les lignes `transcription_zones` elles-mêmes (pas d'id/created_at propres, un id de ligne DB n'a pas de sens à comparer entre brouillon et instantané). Défaut `'[]'::jsonb`. |
| `qualite_snapshot` | jsonb | Ajouté 2026-08-08. Instantané des champs de qualité (mêmes clés que `rebond.transcriptions` : `source_lecture_kind`, `langue_ref`...) au moment de l'enregistrement. Défaut `'{}'::jsonb`. |
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
