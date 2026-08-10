# Domaine Hypothèques (`rebond.hypotheques_*`, `rebond.ref_hypotheques_*`)

Conservation des hypothèques — régime antérieur à la réforme de 1955
(publicité foncière). Conçu et créé le 2026-08-10, en même temps que le
premier document réel de ce type traité dans Patrimoine documentaire. Écart
volontaire à la convention du reste de ce dossier : un seul fichier pour tout
le domaine (9 tables), plutôt qu'un fichier par table comme `etat_civil_*` —
ces tables ne se comprennent qu'ensemble, les fragmenter n'aiderait pas.

## Hiérarchie

```
region ("Guadeloupe" | "La Réunion")      — colonne, pas une table
└─ hypotheques_conservations               — niveau territorial/archivistique
   └─ hypotheques_bureaux                  — l'office (= etat_civil_bureaux)
      └─ hypotheques_registres             — un volume physique (= etat_civil_registres)
         ├─ famille "formalites" (le registre porte des actes)
         │  └─ hypotheques_actes           — un acte (= etat_civil_actes)
         └─ famille "ordre" (le registre est un instrument de recherche)
            ├─ type table_alphabetique     → hypotheques_table_entrees
            │                                 └─ hypotheques_table_entree_refs
            └─ type repertoire_formalites  → hypotheques_repertoire_entrees
```

## Pourquoi deux niveaux (conservation ET bureau)

Décision explicite de l'utilisateur (2026-08-10), malgré des cotes d'archives
quasi identiques entre "Conservation de Basse-Terre" et "Bureau de
Basse-Terre" au FRAD971 (suggérant le même office réel, juste classé à deux
niveaux d'arrangement archivistique) : les deux niveaux sont gardés séparés
en base, au cas où une conservation couvrirait un jour plusieurs bureaux.
Quand la source ne distingue pas les deux (cas de Saint-Paul/Saint-Pierre à
La Réunion, où seule la Conservation apparaît), un bureau est quand même créé
au même nom que sa conservation — convention actée, pour ne jamais avoir
qu'un seul chemin de parenté (`bureau_id`) à interroger en aval.

## `ref_hypotheques_type_registre` — deux familles, pas deux référentiels

Une seule table, distinguée par la colonne `famille` :
- **`formalites`** : `depot`, `transcription`, `inscription` — les registres
  LÉGAUX, qui portent les actes eux-mêmes (voir "Registre des formalités"
  dans les échanges avec l'utilisateur — le régime hypothécaire d'avant 1955
  distingue le dépôt du document, sa transcription si c'est une mutation de
  propriété, et son inscription si c'est une sûreté).
- **`ordre`** : `table_alphabetique`, `repertoire_formalites` — les
  REGISTRES D'ORDRE, des instruments de recherche (pas des actes). Une
  "table alphabétique générale" et une "table alphabétique des noms les plus
  courants" (vues en usage réel sur les conservations de La Réunion) restent
  toutes deux `table_alphabetique` — la nuance vit dans le libellé du
  registre, pas un sous-type contrôlé de plus (même doctrine que le reste du
  projet : ne pas fragmenter un référentiel sans besoin structurel prouvé).

`hypotheques_registres.type_registre_ref` est une FK directe (pas de pivot
many-to-many comme `etat_civil_registres_type_acte`) : un registre
hypothécaire a un seul type, jamais plusieurs formalités mélangées. Le label
se calcule donc directement à l'insertion (`set_hypotheques_registre_label`),
sans second appel RPC après coup comme pour `etat_civil_registres`.

## `numero_volume` remplace `annee`

Les hypothèques s'organisent par numérotation de volume continue (ex. "vol.
593"), pas par année comme l'état civil. `periode_debut`/`periode_fin`
(années, pas de dates précises) restent un repli de tri/affichage, pour la
future hiérarchie de l'atelier documentaire (comme `etat_civil_registres.annee`
aujourd'hui). La tranche de reliure physique ("Volumes 589-594", qui regroupe
plusieurs registres dans un même carton) n'est volontairement PAS modélisée —
aucun équivalent non plus côté état civil pour ce genre de regroupement
physique.

## `ref_hypotheques_type_acte` — spécifique aux transcriptions

`mutation` / `saisie_immobiliere` ne qualifient QUE les actes d'un registre
de type `transcription` — décision explicite de l'utilisateur : les dépôts
et les inscriptions n'ont pas ce sous-type, `hypotheques_actes.type_acte_ref`
reste `null` pour eux.

## Contenu structuré des registres d'ordre

Contrairement aux tables décennales d'état civil (qui restent des
`unites_documentaires` génériques, pas de structuration ligne par ligne),
l'utilisateur a demandé de structurer le contenu des registres d'ordre dès
ce premier lot :

- `hypotheques_repertoire_entrees` : une ligne = une formalité indexée dans
  un volume de répertoire (case, type de formalité, description courte,
  renvoi optionnel vers l'acte réel `hypotheques_actes` une fois créé/lié).
  `type_formalite_ref` n'est **pas contraint en base** à la famille
  `formalites` de `ref_hypotheques_type_registre` (Postgres ne permet pas une
  FK conditionnelle simple sur une autre colonne) — convention applicative à
  respecter, même choix déjà fait pour `etat_civil_repertoires.type_acte_ids`
  (voir ce fichier, "Note non corrigée").
- `hypotheques_table_entrees` : une ligne = un nom dans une table
  alphabétique.
- `hypotheques_table_entree_refs` : un nom peut avoir **plusieurs** renvois
  vers le répertoire (décidé explicitement, "la ou les références") — d'où
  une table de jointure séparée plutôt qu'une colonne unique sur
  `hypotheques_table_entrees`. `repertoire_entree_id` reste nullable : le
  renvoi peut être saisi en texte libre (`volume_brut`/`case_brute`) avant
  que la ligne de répertoire correspondante n'ait été elle-même créée en
  base — même logique de résolution différée que `object_entity_id`/
  `value_text` dans le module Extraction.

## Rattachement au patrimoine documentaire et citations

`hypotheques_registres.unite_documentaire_id` (nullable) suit exactement le
même pattern que `etat_civil_registres`/`etat_civil_repertoires`. Le wizard
"J'ai trouvé un document" (`ReferenceWizardPage.tsx`) devra utiliser
`citations.target_type = 'hyp_acte'` pour pointer un exemplaire vers un
`hypotheques_actes`, comme `ec_acte` pour l'état civil — `target_type` est un
simple texte non contraint (voir `citations.md`), aucune migration nécessaire
pour ajouter ce nouveau code, seulement du code frontend.

## RLS et triggers

Même politique ouverte anon+authenticated que tout `rebond.*`
(20260806100129). `updated_at` via `public.fn_set_updated_at()` (schéma-
agnostique, déjà réutilisée pour `unites_documentaires`/`exemplaires`/
`citations`/`corpus`) sur toutes les tables. Pas de trigger d'audit
(`public.fn_audit_trigger`) : réservé aux tables migrées depuis des données
`public.*` legacy (`etat_civil_bureaux`/`registres`/`actes`) — ces tables
`hypotheques_*` sont neuves, comme `unites_documentaires`/`exemplaires`/
`citations`/`corpus` qui n'ont pas non plus ce trigger.

## Suite (pas encore fait)

- Câbler le wizard `ReferenceWizardPage.tsx` : ajouter `HYPOTHEQUES` à
  `STRUCTURED_TABLE_SERIES` et `SERIE_TARGET_TYPE` (`hyp_acte`), construire
  le flux de saisie (conservation/bureau/registre/acte) équivalent à la
  branche état civil.
- Construire la vue hiérarchique équivalente à celle de l'atelier
  documentaire (`AtelierDocumentairePage.tsx`) pour ce domaine, une fois un
  volume réel de documents transcrits.
- Tester le circuit complet (import → description → transcription →
  extraction) sur le vrai document trouvé par l'utilisateur (Basse-Terre,
  transcription du 1er mars 1945 vol 593 n°2) avant de considérer ce domaine
  validé en usage réel — même prudence que pour Extraction/Entités.
