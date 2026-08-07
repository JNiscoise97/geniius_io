# `rebond.transcription_commentaires`

Commentaires ancrés à un passage précis du texte d'une transcription — pas
des mentions (aucun lien vers une entité généalogique), de simples
annotations libres façon "commentaire en marge".

## Ancrage : marque Tiptap, pas relocalisation par citation

L'ancrage se fait en intégrant l'`id` du commentaire **directement dans le
document Tiptap**, sous forme d'une marque (`mark`) personnalisée
(`commentaire`, voir `src/features/atelier/tiptap/CommentMark.ts`) posée sur
la sélection de texte au moment de la création du commentaire. Le passage
commenté porte donc littéralement l'attribut `data-comment-id` dans le JSON
du document.

Choix fait en session (2026-08-07), en comparaison explicite avec l'ancien
système de `rebond_deprecated` (`ec_transcription_annotations` /
`ec_transcription_notes`) qui ancrait par `quote` + `prefix`/`suffix` et
relocalisait par recherche heuristique après chaque édition
(`relocateByQuote`) — fragile (gère des cas "non retrouvé" / "retrouvé
ailleurs"). La marque intégrée au document évite cette classe de bugs : le
commentaire reste anchoré exactement au texte tant que ce texte existe dans
le document, sans recherche a posteriori. En contrepartie, si le passage
commenté est supprimé de l'éditeur, la marque disparaît avec lui — le
commentaire n'est alors plus visible dans le document mais la ligne reste en
base (pas de nettoyage automatique dans ce lot).

## Colonnes

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | PK. C'est cette valeur qui est embarquée dans l'attribut `data-comment-id` de la marque Tiptap. |
| `transcription_id` | uuid | FK → `rebond.transcriptions`, `CASCADE`. |
| `contenu` | text | Le texte du commentaire. |
| `statut` | text | `ouvert` \| `resolu`. |
| `created_at` / `created_by` | timestamptz / uuid | — |
| `resolved_at` / `resolved_by` | timestamptz / uuid | Renseignés au passage à `resolu`. |

## Relations

- `transcription_id` → `rebond.transcriptions`, `ON DELETE CASCADE`.

## Pourquoi pas de mentions

Décidé explicitement en session : contrairement à l'ancien
`ec_transcription_tags` (tags liés à un acteur/lieu/date), ce lot ne couvre
que le commentaire libre — pas d'extraction ou de liaison à des entités
généalogiques.
