# Schéma `rebond`

Ce répertoire historise toutes les opérations SQL réalisées sur le nouveau schéma
`rebond` du projet Supabase `bokjqorxzjxfqcignhci` — par opposition au schéma
`public` legacy, où vivent encore toutes les tables historiques de l'ancienne
app (`ref_unites_documentaires`, `corpus`, `citations`, etc.).

Objectif : reconstruire proprement la base, table par table, plutôt que de
continuer à empiler des correctifs sur le schéma `public`. Chaque table migrée
passe par le même processus :

1. Revue de conception (cohérence avec les tables déjà migrées)
2. Documentation dans `schema-docs/<table>.md`
3. Script de création dans `migrations/<timestamp>_create_<table>.sql`
4. Script de migration des données `public.<table>` → `rebond.<table>`
5. Bascule du code d'`apps/rebond` sur `rebond.<table>`

## Structure

- `migrations/` — scripts SQL numérotés chronologiquement (convention identique
  à `supabase/migrations/` à la racine du repo, pour rester compatible avec le
  CLI Supabase si on décide de le lier plus tard). Chaque fichier est
  idempotent-safe autant que possible (`IF NOT EXISTS` sur ce qui le permet).
- `schema-docs/` — un fichier `.md` par table : à quoi elle sert, ses colonnes,
  ses relations, et les écarts volontaires par rapport à sa définition
  d'origine dans `public`.

## État d'avancement

| Table `public` | Table `rebond` | Créée | Données migrées | Code branché |
|---|---|---|---|---|
| `ref_institution_type` | `rebond.ref_institution_type` | ✅ | ✅ (33/33 lignes) | ✅ |
| `ref_depot_type` | `rebond.ref_depot_type` | ✅ | ✅ (4/4 lignes) | ✅ |
| `ref_mode_acces` | `rebond.ref_mode_acces` | ✅ | ✅ (3/3 lignes) | ✅ |
| `ref_plateforme_kind` | `rebond.ref_plateforme_kind` | ✅ | ✅ (23/23 lignes) | ✅ |
| `ref_plateformes` | `rebond.ref_plateformes` | ✅ | ✅ (4/4 lignes) | ✅ |
| `ref_institutions` | `rebond.ref_institutions` | ✅ | ✅ (3/3 lignes) | ✅ |
| `ref_depots` | `rebond.ref_depots` | ✅ | ✅ (5/5 lignes) | ✅ |
| `ref_pagination_type` | `rebond.ref_pagination_type` | ✅ | ✅ (10/10 lignes) | ✅ |
| `ref_physical_condition` | `rebond.ref_physical_condition` | ✅ | ✅ (6/6 lignes) | ✅ |
| `ref_repro_quality` | `rebond.ref_repro_quality` | ✅ | ✅ (6/6 lignes) | ✅ |
| `ref_document_damage_kinds` | `rebond.ref_document_damage_kinds` | ✅ | ✅ (15/15 lignes) | ✅ |
| `ref_langues` | `rebond.ref_langues` | ✅ | ✅ (2/2 lignes) | ✅ |
| `ref_ecritures` | `rebond.ref_ecritures` | ✅ | ✅ (3/3 lignes) | ✅ |
| `ref_handwriting_legibility` | `rebond.ref_handwriting_legibility` | ✅ | ✅ (6/6 lignes) | ✅ |
| `ref_document_readability_features` | `rebond.ref_document_readability_features` | ✅ | ✅ (54/54 lignes) | ✅ |
| `ref_ec_type_acte` | `rebond.ref_etat_civil_type_acte` **(renommée)** | ✅ | ✅ (21/21 lignes) | ✅ |
| `etat_civil_bureaux` | `rebond.etat_civil_bureaux` | ✅ | ✅ (48/48 lignes) | ✅ (sauf `store/etatcivil.ts`, voir note) |
| `etat_civil_registres` | `rebond.etat_civil_registres` | ✅ | ✅ (306/306 lignes) | ✅ (sauf `store/etatcivil.ts`) |
| `etat_civil_registres_type_acte` | `rebond.etat_civil_registres_type_acte` | ✅ | ✅ (384/384 lignes) | ✅ |
| `etat_civil_actes` | `rebond.etat_civil_actes` | ✅ | ✅ (4197/4197 lignes) | ✅ (sauf `store/etatcivil.ts`) |
| `ec_tables` | `rebond.etat_civil_repertoires` **(renommée)** | ✅ | ✅ (2/2 lignes) | ✅ |
| `actes` | `rebond.notariat_actes` **(renommée)** | ✅ | ✅ (231/231 lignes) | ✅ |
| `ref_role_document` | `rebond.ref_role_document` | ✅ | ✅ (3/3 lignes) | ✅ |
| `ref_type_unite` | `rebond.ref_type_unite` | ✅ | ✅ (25/25 lignes) | ✅ |
| `ref_acces_numeriques` | `rebond.ref_acces_numeriques` | ✅ | ✅ (11/11 lignes) | ✅ |
| `ref_series_documentaires` | `rebond.ref_series_documentaires` | ✅ | ✅ (22/22 lignes) | ✅ |
| `ref_unites_documentaires` | `rebond.unites_documentaires` **(renommée)** | ✅ | ✅ (19/19 lignes) | ✅ |
| `ref_exemplaires` | `rebond.exemplaires` **(renommée)** | ✅ | ✅ (22/22 lignes) | ✅ |
| `citations` | `rebond.citations` | ✅ | ✅ (32/32 lignes) | ✅ |
| `corpus` | `rebond.corpus` | ✅ | ✅ (0/0 lignes) | ✅ |
| `corpus_unites` | `rebond.corpus_unites` | ✅ | ✅ (0/0 lignes) | ✅ |
| `ref_unites_documentaires_bureaux` | `rebond.unites_documentaires_bureaux` **(renommée)** | ✅ | ✅ (4/4 lignes) | — (utilisée uniquement via `v_exemplaires_pick`) |
| `ref_unites_documentaires_types_actes` | `rebond.unites_documentaires_types_actes` **(renommée)** | ✅ | ✅ (5/5 lignes) | — (idem) |
| `v_sources` (vue) | `rebond.v_sources` | ✅ | — (vue) | ✅ |
| `v_exemplaires_pick` (vue) | `rebond.v_exemplaires_pick` | ✅ | — (vue) | ✅ |
| `ref_natures` | `rebond.ref_natures` | ✅ | ✅ (10/10 lignes) | ✅ |
| `ref_supports` | `rebond.ref_supports` | ✅ | ✅ (3/3 lignes) | ✅ |
| `ref_registre_fonction` | `rebond.ref_etat_civil_registre_fonction` **(renommée)** | ✅ | ✅ (7/7 lignes) | ✅ |
| `ref_registre_mode` | `rebond.ref_etat_civil_registre_mode` **(renommée)** | ✅ | ✅ (10/10 lignes) | ✅ |
| `ref_registre_norme` | `rebond.ref_etat_civil_registre_norme` **(renommée)** | ✅ | ✅ (7/7 lignes) | ✅ |
| `ref_registre_ordre_numerotation` | `rebond.ref_etat_civil_registre_ordre_numerotation` **(renommée)** | ✅ | ✅ (9/9 lignes) | ✅ |
| `ref_registre_pagination` | `rebond.ref_etat_civil_registre_pagination` **(renommée)** | ✅ | ✅ (6/6 lignes) | ✅ |
| `ref_registre_regime_fiscal_support` | `rebond.ref_etat_civil_registre_regime_fiscal_support` **(renommée)** | ✅ | ✅ (5/5 lignes) | ✅ |
| `ref_registre_statut_juridique` | `rebond.ref_etat_civil_registre_statut_juridique` **(renommée)** | ✅ | ✅ (7/7 lignes) | ✅ |
| `ref_registre_support` | `rebond.ref_etat_civil_registre_support` **(renommée)** | ✅ | ✅ (7/7 lignes) | ✅ |
| `ref_auteur_institutionnel` | `rebond.ref_auteur_institutionnel` | ✅ | ✅ (87/87 lignes) | ✅ |
| `ref_type_acces` | `rebond.ref_type_acces` | ✅ | ✅ (6/6 lignes) | ✅ |
| `notaire_registres` | `rebond.notariat_notaire_annees` **(renommée)** | ✅ | ✅ (124/124 lignes) | ✅ (rien à brancher, aucun call site) |
| `ref_transcription_status` | `rebond.ref_etat_civil_transcription_status` **(renommée)** | ✅ | ✅ (6/6 lignes) | ✅ |
| `notaires` | `rebond.notariat_notaires` **(renommée)** | ✅ | ✅ (108/108 lignes) | ✅ (rien à brancher, aucun call site) |
| `ec_transcriptions` | `rebond.etat_civil_transcriptions` **(renommée)** | ✅ | ✅ (7/7 lignes) | ✅ (rien à brancher, aucun call site) |

**52 tables/vues migrées.** `etat_civil_registres` n'a plus aucune FK
cross-schema (ses 8 colonnes `registre_*_ref` + `unite_documentaire_id`
pointent maintenant toutes en interne à `rebond`). `rebond.create_registre_label`
mise à jour, plus aucune trace de cross-schema dans cette fonction non plus.
`unites_documentaires.producteur_ref`, `etat_civil_actes.auteur_institutionnel_ref`
et `ref_acces_numeriques.type_acces_id` repointées vers `rebond.ref_auteur_institutionnel`/
`rebond.ref_type_acces`. `notariat_actes.notaire_registre_id` renommée en
`notaire_annee_id` et repointée vers `rebond.notariat_notaire_annees`, dont
le `notaire_id` est à son tour repointé vers `rebond.notariat_notaires` dans
ce même lot (plus aucune FK cross-schema sur toute la chaîne notariat).
`etat_civil_transcriptions.acte_id`/`langue_ref`/`handwriting_legibility_ref`/
`status` repointées vers `rebond` ; le reste de ses FK (citations, gabarit,
conventions, version validée, et 4 référentiels de transcription) reste
cross-schema vers `public.*`, tables pas encore migrées. Fonction
`rebond.fn_ec_transcriptions_validated_version_belongs()` dupliquée
(référence en dur `public.ec_transcription_versions`, à repointer quand cette
table migrera). `public.fn_touch_updated_at()` réutilisée telle quelle —
troisième fonction "touch updated_at" identique en comportement à
`fn_set_updated_at()`/`set_updated_at()`, doublon pré-existant côté `public`.

## Ce qui reste en `public` (cross-schema depuis rebond)

Tables jamais fournies dans un lot, référencées en cross-schema depuis des
tables déjà migrées — fonctionnel, à traiter si/quand elles sont migrées :

- `etat_civil_acte_citations` — depuis `etat_civil_transcriptions.acte_source_id`/`acte_citation_id`
- `ec_transcription_gabarits` — depuis `etat_civil_transcriptions.gabarit_id`
- `ec_transcription_conventions` — depuis `etat_civil_transcriptions.conventions_id`
- `ec_transcription_versions` — depuis `etat_civil_transcriptions.validated_version_id` et la fonction dupliquée
- `ref_completude_transcription` — depuis `etat_civil_transcriptions.completeness_ref`
- `ref_handwriting_style` — depuis `etat_civil_transcriptions.handwriting_style_ref`
- `ref_confiance` — depuis `etat_civil_transcriptions.language_confidence_ref`
- `ref_niveau_reserve` — depuis `etat_civil_transcriptions.reserve_level_ref`
- `ref_support_lecture` — depuis `etat_civil_transcriptions.source_lecture_kind_ref`

**Renommage de colonnes** : `unites_documentaires.statut` → `statut_source`,
`workflow_statut` → `statut_document` (les deux ne cohabitaient pas par
accident — chacune n'a de sens que pour un rôle de la ligne, source ou
document ; renommées pour l'expliciter). Le code lit ces colonnes via alias
SQL (`statut:statut_source`) pour préserver exactement la même forme JSON
côté app — aucun changement dans `usePatrimoine.ts` ni dans les composants.

**Fonctions dupliquées (schéma-conscientes)** : `rebond.create_registre_label`,
`rebond.set_registre_label` (trigger `BEFORE INSERT/UPDATE` sur
`etat_civil_registres`), `rebond.get_bureau_stats`. `public.fn_audit_trigger`,
`public.fn_set_updated_at` et `public.fn_set_unite_titre_norm` réutilisées
telles quelles (schéma-agnostiques, `fn_set_unite_titre_norm` vérifiée sur
son code source, les deux autres supposées).

**FK corrigées** (pointaient vers `public.ref_unites_documentaires`/
`public.ref_exemplaires`, maintenant vers `rebond.*`) :
`etat_civil_registres.unite_documentaire_id`,
`etat_civil_repertoires.unite_documentaire_id`,
`notariat_actes.unite_documentaire_id`, `ref_acces_numeriques.exemplaire_id`.

**Tous les blocages précédents sont résolus.** `v_sources` et
`v_exemplaires_pick` dupliquées pour `rebond` (schéma-conscientes, cross-schema
restant uniquement vers `public.ref_natures`/`public.ref_supports`, pas
encore migrées). `v_sources.conditions_communication`, codée en dur à `null`
dans l'originale (bug/oubli), corrigée pour être réellement branchée sur
`ref_depots.conditions_communication` — changement de comportement assumé,
sur demande explicite. `corpus_unites` migrée, `fetchCorpus()` branché.
`fetchSources()`, `fetchCitationsWithExemplaires()`, `fetchCorpus()` tous
branchés sur `rebond`. **`patrimoine.service.ts` n'utilise plus du tout le
client `public`** — toutes ses tables sont maintenant dans `rebond`.

`store/etatcivil.ts` (bureaux + stats pour `ReferenceWizardPage`) débloqué et
branché sur `rebond` — plus aucune table de ce lot bloquée.

Scripts exécutés manuellement via l'éditeur SQL du dashboard Supabase, schéma
`rebond` ajouté aux "Exposed schemas" de l'API. Comptages vérifiés identiques
entre `public.*` et `rebond.*` pour toutes les tables listées (via l'API REST,
clé service_role).

## Tables nouvelles (sans équivalent `public`)

Tables créées directement dans `rebond`, sans donnée `public` à migrer :

| Table | Créée | Code branché |
|---|---|---|
| `rebond.transcriptions` | ✅ | ✅ (atelier documentaire) |
| `rebond.transcription_versions` | ✅ | ✅ (atelier documentaire) |
| `rebond.transcription_commentaires` | ✅ | ✅ (atelier documentaire) |
| `rebond.ref_transcription_zone_types` | ✅ | ✅ (atelier documentaire) |
| `rebond.transcription_zones` | ✅ | ✅ (atelier documentaire) |

`rebond.transcriptions` — contenu (Tiptap JSON) par exemplaire, générique à
tous les types de documents. Voir `schema-docs/transcriptions.md` pour le
détail et pourquoi elle ne réutilise pas `etat_civil_transcriptions`.

`rebond.transcription_versions` — historique de versions nommées
(checkpoints explicites, pas à chaque auto-save). `rebond.transcription_commentaires` —
commentaires ancrés au texte via une marque Tiptap plutôt que par
relocalisation de citation. Voir `schema-docs/transcription_versions.md` et
`schema-docs/transcription_commentaires.md`.

`rebond.transcription_zones` (+ `ref_transcription_zone_types`) — "zones
spécifiques" (mentions marginales, signatures, ratures marginales),
génériques à tous les types de documents contrairement à l'ancien modèle de
`rebond_deprecated`. Voir `schema-docs/transcription_zones.md`.

## Comment le code choisit le bon schéma

Deux cas de figure :

- **Tables interrogées par leur nom en dur** (`ref_institutions`,
  `ref_depots`...) : le call site est édité directement, `supabase.from(...)`
  → `supabaseRebond.from(...)`, table migrée par table migrée.
- **Tables du catalogue générique `RefSinglePickerSmart`** (celles listées
  dans `src/types/referentiel.ts::REF_TABLES`, ex. `ref_langues`,
  `ref_physical_condition`...) : le nom de la table est une prop dynamique,
  impossible de choisir le client statiquement. `RefSinglePickerSmart` passe
  par `resolveRefTableClient(table)`
  (`apps/rebond/src/lib/supabase/refSchemaRouting.ts`), qui maintient la
  liste des tables déjà basculées vers `rebond` et retombe sur `public` pour
  le reste. **À mettre à jour à chaque nouvelle table de ce catalogue migrée.**

Code branché sur un second client Supabase dédié au schéma `rebond`
(`apps/rebond/src/lib/supabase/rebondSchemaClient.ts`, exporté comme
`supabaseRebond`), utilisé pour toutes les tables migrées listées ci-dessus —
tout le reste continue de passer par le client par défaut (`supabase`, schéma
`public`), le temps que les autres tables soient
migrées à leur tour.
