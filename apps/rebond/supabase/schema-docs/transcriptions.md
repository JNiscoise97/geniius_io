# `rebond.transcriptions`

Contenu de transcription (texte riche, format JSON Tiptap) d'un exemplaire —
table de l'**atelier documentaire**, générique à tous les types de documents
(état civil, foncier, notarial, annuaire, paroissial), pas seulement les
actes.

Distincte de `rebond.etat_civil_transcriptions` : cette dernière porte les
métadonnées de transcription spécifiques à un acte d'état civil (langue,
écriture, complétude, réserve, validation…) mais n'a pas de colonne de
contenu — le texte réel vit dans `public.ec_transcription_versions`, pas
encore migrée. `rebond.transcriptions` ne cherche pas à remplacer cette
chaîne ; c'est un stockage volontairement simple pour démarrer l'atelier
documentaire sans dépendre de la migration du modèle état civil.

## Colonnes

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | PK |
| `exemplaire_id` | uuid | FK → `rebond.exemplaires`, `CASCADE`. Unique : une seule transcription par exemplaire (pas de versioning dans ce lot). |
| `contenu` | jsonb | Document Tiptap (JSON), édité dans l'atelier documentaire. |
| `statut` | text | `en_cours` \| `termine`. |
| `source_lecture_kind` | text | `image_originale` \| `microfilm` \| `transcription_secondaire` \| `autre`. Sur quoi la transcription a été faite. |
| `langue_ref` | uuid | FK → `ref_langues`. |
| `ecriture_ref` | uuid | FK → `ref_ecritures`. Style d'écriture. |
| `handwriting_legibility_ref` | uuid | FK → `ref_handwriting_legibility`. |
| `completeness` | text | `complete` \| `partielle` \| `fragment`. |
| `completeness_note` | text | Explication libre si non complète (pas d'enum fermé de raisons). |
| `reserve_level` | text | `aucune` \| `mineure` \| `majeure`. |
| `reserve_reason` | text | Explication libre de la réserve. |
| `marque_transcrit_par` | uuid | FK → `auth.users`. Qui a cliqué "Marquer comme transcrit" (dernier en date, pas un historique multi-entrées). |
| `marque_transcrit_par_email` | text | Snapshot de l'email au moment du marquage (pas de table de profils pour résoudre l'id après coup). |
| `marque_transcrit_le` | timestamptz | Quand. |
| `created_at` / `created_by` | timestamptz / uuid | — |
| `updated_at` / `updated_by` | timestamptz / uuid | `updated_at` maintenu par `trg_transcriptions_touch`. |

## Relations

- `exemplaire_id` → `rebond.exemplaires`, `ON DELETE CASCADE`.
- `langue_ref` → `rebond.ref_langues`, `SET NULL`.
- `ecriture_ref` → `rebond.ref_ecritures`, `SET NULL`.
- `handwriting_legibility_ref` → `rebond.ref_handwriting_legibility`, `SET NULL`.
- `marque_transcrit_par` → `auth.users`, `SET NULL`.

## Verrouillage à la marque "transcrit" (atelier documentaire)

Ajouté en session (2026-08-07). Cliquer "Marquer comme transcrit" pose
`statut = 'termine'` + `marque_transcrit_par`/`_email`/`_le`, et verrouille
l'édition côté UI (contenu, zones, qualité, nouveaux commentaires) — pas de
colonne dédiée pour le verrou lui-même, c'est déduit de `statut === 'termine'`
côté client. Déverrouiller (cadenas + confirmation) repasse `statut` à
`en_cours` mais **ne réinitialise pas** `marque_transcrit_par`/`_le` : ces
colonnes gardent la trace de la dernière personne à avoir marqué la
transcription comme terminée, même si elle est rouverte pour correction.

## "Qualité de la transcription" — écart volontaire vs l'ancien modèle

Ajouté en session (2026-08-07), directement sur `rebond.transcriptions`
(relation 1:1, pas de version à part) plutôt que dans une table dédiée.
Simplifié par rapport à l'ancien `ec_transcriptions` (9 champs) :
- pas de champ "confiance dans la langue" (peu utile en pratique) ;
- pas d'enum fermé de "raison d'incomplétude" — `completeness_note` en
  texte libre couvre le besoin sans figer une liste de raisons.

## Fonctions et triggers

- `trg_transcriptions_touch` (`BEFORE UPDATE`) : réutilise
  `public.fn_touch_updated_at()` (schéma-agnostique, même fonction que
  `rebond.etat_civil_transcriptions`).

## Pourquoi une table séparée de `etat_civil_transcriptions`

Décision prise en session (2026-08-07) : brancher l'atelier documentaire sur
la chaîne `etat_civil_transcriptions` + `ec_transcription_versions` aurait
limité le module aux actes d'état civil et dépendu d'une table (`versions`)
pas encore migrée vers `rebond`. Une table neuve, simple, générique à
`exemplaires` permet de couvrir tous les types de documents dès la première
version.
