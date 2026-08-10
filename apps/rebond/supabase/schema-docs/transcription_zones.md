# `rebond.transcription_zones` / `rebond.ref_transcription_zone_types`

"Zones spécifiques" de l'atelier documentaire : des passages d'un type
particulier qu'on relève à part du corps principal de la transcription —
mentions marginales, signatures, ratures marginales. Générique à tous les
types de documents (pas seulement les actes d'état civil), contrairement à
l'ancien modèle de `rebond_deprecated` où ces trois zones étaient câblées en
dur pour les actes.

## `ref_transcription_zone_types`

Table de référence extensible : les types de zone ne sont pas un enum figé
dans le schéma, pour pouvoir en ajouter (ex. "cachet", "tampon") sans
migration de code. Seedée avec 3 types au lancement : `mention_marginale`,
`signature`, `rature_marginale`.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | PK |
| `code` | text | Identifiant stable, unique (ex. `mention_marginale`). |
| `label` | text | Libellé affiché. |
| `ordre` | integer | Ordre d'affichage. |

## `transcription_zones`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | PK |
| `transcription_id` | uuid | FK → `rebond.transcriptions`, `CASCADE`. |
| `zone_type_id` | uuid | FK → `ref_transcription_zone_types`, `RESTRICT`. |
| `contenu` | text | Le texte relevé pour cette occurrence (ex. le texte d'une mention marginale précise). |
| `ordre` | integer | Ordre manuel, optionnel. |
| `created_at` / `created_by` | timestamptz / uuid | — |
| `updated_at` / `updated_by` | timestamptz / uuid | `updated_at` maintenu par `trg_transcription_zones_touch`. |

## Rôle de "brouillon" dans le modèle brouillon/version (2026-08-08)

Ces lignes sont le brouillon vivant des zones (écriture immédiate à
l'ajout/suppression, cf. `handleAddZone`/`handleDeleteZone` dans
`TranscriptionEditorPage.tsx`) — `rebond.transcription_versions.zones_snapshot`
en garde un instantané figé à chaque "Enregistrer une version". Restaurer
une version (`applyVersionToDraft`, service `replaceZones`) **remplace
intégralement** les lignes de cette table pour la transcription concernée :
suppression totale puis réinsertion depuis le snapshot, pas de diff fin par
zone. Voir `transcription_versions.md` pour le modèle complet.

## Écart volontaire vs `rebond_deprecated`

L'ancien modèle (`ec_transcription_annotations`-adjacent, câblé en dur dans
`TranscriptionTab.tsx`) affichait un compteur "X relevé(s) / Y attendu(s)",
le total attendu venant de `citations.marginalia` (renseigné pendant l'étape
"Décrire" du patrimoine documentaire, uniquement pour les citations liées à
un acte/une table d'état civil). Ce lot ne reprend **pas** cette
comparaison : `rebond.transcription_zones` est volontairement autonome,
sans dépendance vers `citations`, pour rester valable sur tous les types de
documents. Seul le compte réel (nombre de lignes) est affiché, sans total
attendu. À réévaluer si le compteur "attendu" s'avère manquer à l'usage.
