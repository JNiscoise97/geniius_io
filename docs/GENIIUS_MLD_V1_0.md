# GENIIUS — MLD V1.0

## Modèle logique de données relationnel dérivé du MCD V1.1 et du Dictionnaire V1.1 consolidé

- **Statut :** modèle logique de référence — première version, à soumettre à validation
- **Date :** 7 octobre 2026
- **Sources :** MCD V1.1 canonique (`docs/geniius_io_MCD_V1.md`) ; Dictionnaire de données V1.1 consolidé (`docs/GENIIUS_DICTIONNAIRE_DONNEES_V1_1_CONSOLIDE.md`), en particulier l'annexe G (traçabilité), l'annexe H (registre MLD-01 à MLD-15) et les annexes C et D
- **Position dans la feuille de route :** étape suivant le dictionnaire, précède le modèle physique (MPD)

---

# 0. Objet et règles du document

## 0.1 Ce que fait ce MLD

Il traduit chaque entité, association et attribut du dictionnaire en **tables relationnelles** : clés primaires et étrangères, tables d'association, spécialisations, contraintes d'unicité et de vérification, historisation, représentation des assertions, des dépendances, des espaces et des droits.

Il **tranche** les quinze décisions `MLD-01` à `MLD-15` de l'annexe H du dictionnaire (§ 2).

## 0.2 Ce qu'il ne fait pas

Il reste **logique** : les types sont des types relationnels génériques (`uuid`, `text`, `int`, `date`, `ts`…), pas des types d'un SGBD. Les décisions `MPD-01` à `MPD-06` (index, caches, seuil de petit effectif, délai de propagation, chiffrement, moteur d'autorisation) et `EXT-01` à `EXT-03` restent ouvertes ; le MLD indique seulement ce qu'elles doivent respecter. La cible pressentie est PostgreSQL (le MCD § 28 mentionne Supabase), sans que le modèle en dépende.

## 0.3 Règle de traçabilité (annexe G du dictionnaire)

Chaque table, colonne et contrainte se rattache à une entité ou association du MCD, à une règle `DD-*`, `DI-*`, `TI-*`, à un écart `†`, à une obligation `OB-*`, ou à une décision `MLD-*` de ce document. Les structures **propres au MLD** (sans équivalent conceptuel direct) sont marquées **‡** et récapitulées au § 26. La matrice complète de traçabilité est au § 25.

## 0.4 Règles de non-régression (annexe G.3 du dictionnaire)

Le MLD ne peut pas : transformer une assertion en attribut intrinsèque d'une entité ; aplatir `DATE_HIST` ; confondre `COMPTE`, `ACTEUR_GENIIUS` et `PERSONNE` ; confondre acquisition, production et justification ; fusionner filiation, référence et rapprochement dans un lien générique ; supprimer l'historique d'une version, d'une évaluation ou d'une provenance ; calculer sur le graphe complet puis masquer ; utiliser une suppression en cascade qui détruit une preuve, une provenance ou une citation ; transformer un import en validation ; traiter un score comme une probabilité historique. Le § 24 vérifie chacune de ces règles contre le schéma.

---

# 1. Principes de traduction

| # | Principe | Conséquence dans le schéma |
|---|---|---|
| L1 | **Socle étroit, données typées** | La table `objet` ne porte que l'identité, l'espace, la version courante et les métadonnées de gouvernance. Aucune colonne métier, aucun JSON de contenu. Chaque entité a sa table avec ses colonnes typées. |
| L2 | **Héritage par tables de classes** | Chaque entité spécialisée a sa table, dont la clé primaire est aussi clé étrangère vers la table de son parent. Un discriminant `type_objet` vérifié par une clé étrangère composite garantit l'exclusivité des spécialisations. |
| L3 | **Les liens restent typés** | Une association a sa propre table, avec des clés étrangères vers les tables qu'elle relie. Le lien vers `objet` n'est utilisé que lorsque le MCD relie réellement « n'importe quel objet » ; il est alors restreint par une liste de types vérifiée. |
| L4 | **Historique relationnel** | Toute table versionnée a une table miroir `_hist`, interrogeable en SQL comme la table courante. L'état figé d'une version est l'ensemble de ses lignes `_hist`, pas un document sérialisé. |
| L5 | **Associations versionnées par leur propriétaire** | Une association qui fait partie de l'état d'un objet porte les numéros de version de début et de fin de ce propriétaire. Rien n'est supprimé : une association retirée est close. |
| L6 | **Pas de suppression destructrice** | Toutes les clés étrangères sont `RESTRICT`. Une suppression d'objet est une purge en place (tombstone). La cascade n'existe que pour les données personnelles techniques d'un compte. |
| L7 | **Contraintes d'abord déclaratives** | Ce qui peut s'écrire en `NOT NULL`, `UNIQUE`, `CHECK` ou clé étrangère l'est. Le reste est une contrainte procédurale numérotée (`CP-*`, § 21), rattachée à sa règle `DI-*` ou `OB-*`. |
| L8 | **Lecture filtrée** | Aucune lecture applicative n'accède directement aux tables : elle passe par le graphe accessible du contexte (§ 22). Les vues de synthèse sont dérivées et contextuelles (§ 23). |

---

# 2. Décisions MLD tranchées (annexe H du dictionnaire)

## MLD-01 — Stratégie d'héritage `OBJET`

**Décision : héritage par tables de classes (« class table inheritance »), avec socle étroit et discriminant contrôlé.**

- `objet` contient : `id`, `type_objet`, `espace_id`, `version_courante`, `date_creation`, les métadonnées de gouvernance du dictionnaire (`etat_cycle_vie`, `etat_examen`, `statut_validation`, `visibilite`, `decouvrabilite`, `licence_code`, `libelle_technique`) et l'état de purge. Rien d'autre.
- Chaque entité **Obj. ✓** a une table de même nom, dont `id` est à la fois clé primaire et clé étrangère vers la table de son parent (`objet`, ou un parent intermédiaire comme `entite_historique`).
- Chaque table porte une colonne `type_objet` contrainte : constante (`CHECK type_objet = 'PERSONNE'`) pour une feuille, liste fermée pour un parent abstrait (`CHECK type_objet IN ('PERSONNE', 'LIEU', …)`). La clé étrangère composite `(id, type_objet) → objet(id, type_objet)` interdit qu'un même identifiant soit à la fois une `PERSONNE` et un `LIEU`.
- **Exception justifiée — table unique pour `INTERPRETATION`.** Ses six spécialisations n'ajoutent que quelques colonnes, ne sont pas cibles de clés étrangères distinctes et partagent toutes leurs associations. Elles vivent dans une seule table `interpretation` dont les colonnes propres sont contrôlées par `CHECK` selon `type_objet`.
- **Les profils d'assertion** suivent la règle générale : une table d'extension 1:1 pour les profils qui ont des attributs propres (`assertion_relation`, `assertion_presence`, `assertion_situation`), aucune table pour les autres.

**Alternatives écartées.**

| Alternative | Raison du rejet |
|---|---|
| Table universelle `objet(id, type, json)` | Perd le typage, les clés étrangères, les contraintes et l'indexation ; rend les droits et l'historique opaques (annexe H, MLD-01) |
| Une table par feuille sans table mère | Impossible de référencer « n'importe quel objet » (dépendances, droits, arguments, citations) par une vraie clé étrangère |
| Table unique par famille (toutes les entités historiques ensemble) | Des dizaines de colonnes nullables sans signification pour la plupart des lignes ; contraintes illisibles |

## MLD-02 — Stockage des états versionnés

**Décision : tables courantes + tables d'historique miroir, registre `version_objet`, manifestes relationnels.**

- Chaque table versionnée `T` a une table `T_hist` : mêmes colonnes, plus `numero`, clé primaire `(id, numero)`, clé étrangère `(id, numero) → version_objet(objet_id, numero)`.
- La table `T` contient l'état à la version courante ; une écriture insère d'abord la nouvelle ligne `T_hist` puis met à jour `T` (CP-01, CP-02). Les lignes `_hist` ne sont jamais modifiées, sauf purge légale.
- `version_objet` est le registre : numéro, validité épistémique, nature du changement, motif, activité productrice, empreinte, statut du contenu.
- L'`etat_fige` du dictionnaire est réalisé par l'ensemble des lignes `_hist` de même `(id, numero)` dans toute la hiérarchie de tables de l'objet, plus les associations dont il est propriétaire et qui sont valides à ce numéro. La sérialisation n'est produite qu'à l'export ; `empreinte_etat` est calculée sur cette sérialisation canonique.
- **Manifestes des conteneurs (DD-01)** : table `version_composant` reliant une version de conteneur aux versions de ses composants.
- Les tables de **journal** (`activite`, `contexte_evaluation`, `notification`…) sont en insertion seule, sans historique.

**Alternatives écartées.** Snapshot JSON dans `version_objet` (réintroduit la table opaque, empêche « que pensions-nous en 2029 ? » en SQL) ; deltas (reconstruction coûteuse, fragile à la purge) ; clé `(id, numero)` dans les tables courantes (rend toutes les clés étrangères instables).

## MLD-03 — Représentation de `DATE_HIST`

**Décision : groupe de six colonnes structurées**, préfixé par le nom de l'attribut :

| Colonne | Type | Rôle |
|---|---|---|
| `<x>_expr` | `text` | `expression_originale` (verbatim) |
| `<x>_type` | `code` | `type_date` |
| `<x>_cal_id` | `uuid` → `concept` | `calendrier` |
| `<x>_min` | `date` | `borne_min` = **premier jour** de la période désignée |
| `<x>_max` | `date` | `borne_max` = **dernier jour** de la période désignée |
| `<x>_prec` | `code` | `precision` (jour, mois, année, décennie, siècle) |

« 1840 » se stocke `min = 1840-01-01`, `max = 1840-12-31`, `prec = année` : la précision dit comment lire les bornes, et l'affichage n'en montre jamais plus (DD-10). Les cohérences de DD-10 sont des `CHECK` (§ 3.4). Une `PERIODE_HIST` est deux groupes `<x>_debut_*` et `<x>_fin_*`. Les bornes sont des `date` interrogeables et indexables (« présents à Dolé entre 1790 et 1810 »).

Au MPD, le groupe peut devenir un type composite sans changer le modèle.

## MLD-04 — Représentation de `VALEUR`

**Décision : groupe de cinq colonnes** `<x>_orig` (`text`, obligatoire si le groupe est renseigné), `<x>_norm` (`num`), `<x>_unite_id` et `<x>_monnaie_id` (→ `concept`), `<x>_type` (`code`). Une conversion est une assertion dérivée (RG-G03), jamais une mise à jour de `_norm`.

## MLD-05 — Représentation de `GEOM`

**Décision.**
- **Géographique** (`geometrie.geom`) : colonne géométrique (PostGIS au MPD), plus `geom_systeme` et `geom_forme`. Les géométries concurrentes sont des lignes distinctes de `geometrie` ; une localisation relative n'a **pas** de géométrie mais des assertions de relation spatiale.
- **Image** (`zone`) : colonnes entières `x`, `y`, `largeur`, `hauteur` pour les rectangles, colonne `polygone_image` pour les autres formes, `debut_ms` et `fin_ms` pour les plages temporelles. Le repère est la `vue` (DD-16).

## MLD-06 — Associations gouvernables

**Décision : socle commun `lien` + tables spécialisées**, sur le modèle de `objet`.
- `lien` (`id`, `type_lien`, `espace_id`, `visibilite`, `etat_lien`, `version_courante`, `date_creation`, purge) permet de cibler un lien par une règle d'accès (`regle_acces.cible_lien_id`).
- Chaque lien réifié (DD-09) a sa table spécialisée, avec ses propres clés étrangères typées : `dependance`, `filiation`, `reference_inter_espace`, `responsabilite`, `credit`. Ils restent **cinq tables distinctes** : une filiation n'est jamais stockée comme une référence ou un rapprochement (annexe G.3).
- Les liens sont versionnés comme les objets (`lien_version`, tables `_hist`).
- La monotonie de visibilité (TI-10) est la contrainte procédurale CP-12.

## MLD-07 — `DEPENDANCE`

**Décision : une table unique `dependance` avec la colonne `categorie`** (`production`, `justification`, `raisonnement`) et des `CHECK` par catégorie. Les trois catégories ont les mêmes extrémités et presque les mêmes attributs ; une table unique permet de parcourir le graphe de dépendances d'un seul tenant, tandis que les index partiels par catégorie les gardent requêtables séparément (vues `v_dependance_production`, `v_dependance_justification`, `v_dependance_raisonnement`).

## MLD-08 — Référentiels et concepts

**Décision.**
- `referentiel` et `concept` sont des objets (versionnés, gouvernés par espace). `concept.code` est unique par référentiel.
- Toute colonne `REF_CONCEPT` du dictionnaire devient une clé étrangère `<x>_id → concept(id)`. La **version** du concept en vigueur à une date se lit dans `concept_hist`.
- La signature des prédicats est relationnelle : `concept_predicat` (profil, cible attendue, type de valeur), `concept_predicat_sujet` et `concept_predicat_cible` (types admis).
- Accessibilité : un objet ne peut référencer qu'un concept actif d'un référentiel commun, d'un référentiel communautaire de l'une des communautés de son espace, ou d'un référentiel de son propre espace (CP-08).
- Les énumérations **fermées** (`CODE`) sont des `CHECK … IN (…)` ; elles changent avec une nouvelle version du dictionnaire.

## MLD-09 — Assertions

**Décision : une table `assertion` typée et réifiée**, et non des attributs sur les entités.
- Colonnes : sujet (`sujet_id`, `sujet_type`), prédicat (`predicat_id` → `concept`), cible optionnelle (`cible_id`, `cible_type`), rôle, lieu, assertion parente, statut épistémique, `temps` (groupe `DATE_HIST`), `valeur` (groupe `VALEUR`), `libelle_source`, `calcul_id` pour les dérivées.
- Sujet et cible sont des clés étrangères composites vers `objet(id, type_objet)`, restreintes par `CHECK` aux types admis par le MCD ; la conformité fine à la signature du prédicat est CP-07.
- Tables d'extension 1:1 pour les profils : `assertion_relation`, `assertion_presence`, `assertion_situation`.
- Tables d'ancrage : `assertion_zone` (ANCRER), `assertion_mention` (FONDER), `assertion_reponse` (ISSUE_DE), `assertion_source_externe` (SOURCER_EXT).
- **Aucune** colonne `date_naissance`, `profession`, `residence`, `sexe` ou `nom` n'existe sur `personne`. Les fiches « pratiques » sont des **vues contextuelles** (`v_fiche_entite`, § 23) construites à partir de `selection_contexte` et des assertions accessibles.

Ce n'est pas un modèle « entité–attribut–valeur » non typé : le prédicat est un concept gouverné avec signature, la valeur a un type contrôlé, et les profils ont leurs colonnes. C'est la traduction directe de l'invariant P1 du MCD.

## MLD-10 — Nullabilité et états d'absence

**Décision.**

| Dictionnaire | MLD |
|---|---|
| `1` | `NOT NULL` ; pour une colonne de contenu purgeable : `CHECK (est_purge OR x IS NOT NULL)` |
| `0..1` | `NULL` autorisé ; `NULL` = « non renseigné » (TI-07) |
| `C` | `NULL` autorisé + `CHECK` exprimant la condition dans les deux sens (obligatoire si…, interdit sinon) |
| `0..n`, `1..n` | Table enfant (jamais de tableau ni de liste dans une colonne) ; `1..n` contrôlé par CP-05 en fin de transaction |
| Inexistence, inconnu motivé | Ligne de `lacune`, assertion de polarité négative ou `recherche_effectuee` — jamais une valeur |
| Valeurs sentinelles (TI-08) | Domaine `texte_libre` : `CHECK (btrim(x) <> '' AND lower(btrim(x)) NOT IN ('inconnu','inconnue','x','nn','n.','?','-'))` ; dates : CP-14 |

**Colonnes de contenu purgeable.** Dans une table d'objet, toute colonne qui n'est ni clé, ni discriminant, ni code de gouvernance, ni horodatage système est purgeable. C'est pourquoi les obligations `1` de ces colonnes sont écrites `CHECK (est_purge OR …)` plutôt que `NOT NULL` (MLD-15).

## MLD-11 — Réconciliation d'import

**Décision.**
- `lignee_import` ‡ : regroupe les imports successifs d'une même source dans un espace (même arbre GEDCOM réexporté).
- `cle_import` ‡ : pour chaque enregistrement source, la clé d'origine (`@I12@` en GEDCOM), son empreinte normalisée et l'objet GENIIUS créé ou reconnu. Unicité `(lignee_id, cle_source, objet_id)`.
- Un réimport rapproche par lignée et clé source, puis par identifiant externe, puis par empreinte de fichier ; chaque cas produit une ligne `reconciliation_import`. Aucune « mise à jour silencieuse » : une différence produit `local modifié - à comparer` ou `Core évolué - lien proposé`, puis une nouvelle version **seulement** après décision humaine (DI-P08, OB-10).
- Un même GEDCOM réimporté ne crée pas de nouvelles assertions pour les enregistrements identiques (`identique - reconnecté`) : pas de second « ensemble de preuves » (test 7).

## MLD-12 — Références persistantes

**Décision.** `reference_persistante` porte la cible (`cible_id` → `objet`), la version figée optionnelle (`(cible_id, cible_numero)` → `version_objet`), la zone optionnelle et le fragment. L'objet cible n'est jamais supprimé physiquement (MLD-15), donc la clé étrangère reste valide : la résolution lit `objet.etat_cycle_vie` et renvoie une tombstone si l'objet est purgé. `ark` est unique et attribué par CP-17 à la publication. La présentation fusionnée d'un `rapprochement` ne change pas la résolution : chaque identifiant résout vers lui-même, avec mention de la fusion.

## MLD-13 — Politiques d'accès

**Décision.**
- `regle_acces` : une cible parmi trois clés étrangères exclusives (`cible_objet_id`, `cible_espace_id`, `cible_lien_id`), un bénéficiaire parmi (`beneficiaire_acteur_id`, `beneficiaire_groupe_id`, `role_beneficiaire`, public), `effet` (autoriser, interdire), `objet_protege` (contenu, existence), période.
- Les appartenances (`appartenance_espace`, `attribution_role`, `membre_groupe`) sont versionnées par l'espace ou le groupe. Les habilitations administratives et scientifiques sont indépendantes et cumulables ; seule une appartenance scientifique ouvre la lecture des objets `projet` (CP-25).
- L'évaluation (`acces(contexte, cible, action)`) suit l'ordre fixé au § 22 : existence protégée → interdiction → autorisation explicite → visibilité par défaut. L'interdiction l'emporte toujours (DD-18).
- La relation dérivée `droit_effectif` ‡ (§ 22.2) est la forme logique de ce calcul ; sa matérialisation et son moteur (RLS, service de politiques) relèvent de MPD-02 et MPD-06.

## MLD-14 — Dépendances sémantiques des publications et des exports

**Décision : manifestes relationnels.**
- `publication_exposition` : les versions exposées par chaque version de publication, avec le mode d'exposition.
- `export_element` ‡ : objets, versions, liens et fichiers effectivement inclus dans un export ; `export_dependance_externe` ‡ : références vers des objets non inclus mais cités, **uniquement** s'ils sont accessibles dans le contexte de l'export.
- Les éléments exclus pour raison de droits ne sont **pas** listés dans le manifeste, ni comptés dans les compteurs exposés (DI-P05, test 11). Leur exclusion est tracée dans `export_exclusion` ‡, de confidentialité `I`.
- Le manifeste sérialisé est **produit** à partir de ces tables ; seule son empreinte est stockée.

## MLD-15 — Purge et tombstones

**Décision : purge en place, jamais de suppression physique d'un objet.**
- La ligne `objet` subsiste avec `etat_cycle_vie = 'supprimé'`, `est_purge = vrai`, `date_purge`.
- Dans chaque table de la hiérarchie de l'objet et dans ses `_hist`, les colonnes de contenu purgeable sont mises à `NULL` et `est_purge = vrai` ; les clés, discriminants, codes de gouvernance et horodatages restent.
- `version_objet.statut_contenu = 'purgé'`, `empreinte_etat` recalculée.
- Les associations dont l'objet est propriétaire sont closes ; celles qui le visent restent (elles pointent une tombstone) et les dépendances aval passent à « preuve n'est plus disponible » (DD-13).
- Les fichiers binaires associés sont effacés physiquement ; la ligne `fichier` reste avec `est_purge`.
- Seules les données personnelles techniques non-objets (`historique_navigation`, `notification`, inbox non rattachée, coordonnées du compte) sont supprimées physiquement, en cascade depuis `compte`.

---

# 3. Conventions du schéma

## 3.1 Nommage

- Tables et colonnes en `snake_case`, sans accent, au singulier ; une table par entité porte le nom de l'entité en minuscules.
- Clé primaire `id` (`uuid` v7, DD-02) ; clé étrangère `<rôle>_id` ; pour une référence à une version : couple `<rôle>_id`, `<rôle>_numero`.
- Tables d'association : `<propriétaire>_<cible>` (ex. `assertion_zone`).
- Tables d'historique : `<table>_hist`.

## 3.2 Types logiques

| Type MLD | Type du dictionnaire | Remarque |
|---|---|---|
| `uuid` | `IDENT` | v7 |
| `text` | `TEXTE_COURT`, `TEXTE_LONG`, `TEXTE_SOURCE`, `URI` | Longueur et verbatim contrôlés par CP-14 et par l'application |
| `code` | `CODE` | `CHECK … IN (…)` sur la liste fermée du dictionnaire |
| `→ concept` | `REF_CONCEPT` | Clé étrangère `<x>_id` |
| `bool`, `int`, `num` | `BOOLEEN`, `ENTIER`, `DECIMAL` | — |
| `ts` | `HORODATAGE` | UTC |
| `date` | Bornes de `DATE_HIST` | Grégorien proleptique |
| `geom` | `GEOM` géographique | MPD : PostGIS |
| `lang`, `script` | `LANGUE`, `ECRITURE` | `text` contrôlé (BCP 47, ISO 15924) |
| `hash` | `EMPREINTE` | `text` de 64 caractères hexadécimaux |
| `json` | — | **Autorisé seulement** pour des paramètres techniques et des résultats de calcul (`parametres_decisifs`, `parametres`, `parametres_effectifs`, `resultat.contenu`) ; jamais pour un état d'objet ni une donnée historique |

## 3.3 Notation des tables

Chaque table est donnée en **DDL logique** :

```text
nom_table  [nature]                         -- entité du dictionnaire
  colonne          type        contraintes  -- commentaire
  ...
  PK (…)   FK (…) → table(…)   UQ (…)   CK (…)
```

**Natures de table :**

| Nature | Sens |
|---|---|
| `[V]` | Table d'objet versionnée : table `_hist` miroir (MLD-02) |
| `[F]` | Table d'objet figée : une seule version, jamais modifiée hors purge |
| `[L]` | Table de lien réifié, versionnée (MLD-06) |
| `[A:p]` | Association versionnée par son propriétaire `p` (colonnes `v_debut`, `v_fin`) |
| `[N]` | Journal, insertion seule |
| `[T]` | Table technique ou de référence, hors objet |

**Contraintes :** `NN` non nul ; `NN*` non nul hors purge (`CHECK (est_purge OR x IS NOT NULL)`) ; `PK`, `FK`, `UQ`, `CK` ; `UQ…WHERE` unicité partielle ; `DEF` clé étrangère différée en fin de transaction.

**Macros** (développées une fois ici, utilisées ensuite) :

| Macro | Développement |
|---|---|
| `⟨OBJ 'T'⟩` | `id uuid PK` ; `type_objet code NN CK = 'T'` ; `FK (id, type_objet) → objet(id, type_objet)` ; `est_purge bool NN default faux` |
| `⟨OBJ {T1,T2,…}⟩` | Idem pour une table parente abstraite : `CK type_objet IN (T1, T2, …)` |
| `⟨SOUS p 'T'⟩` | `id uuid PK` ; `FK (id) → p(id)` ; `type_objet code NN CK = 'T'` ; `FK (id, type_objet) → objet(id, type_objet)` ; `est_purge bool NN` |
| `⟨LIEN 't'⟩` | `id uuid PK` ; `type_lien code NN CK = 't'` ; `FK (id, type_lien) → lien(id, type_lien)` |
| `⟨VA p⟩` | `v_debut int NN` ; `v_fin int` ; `FK (p_id, v_debut) → version_objet(objet_id, numero)` ; `FK (p_id, v_fin) → version_objet(objet_id, numero)` ; `CK (v_fin IS NULL OR v_fin > v_debut)` |
| `⟨dh x⟩` | `x_expr text`, `x_type code`, `x_cal_id → concept`, `x_min date`, `x_max date`, `x_prec code` (MLD-03) |
| `⟨ph x⟩` | `⟨dh x_debut⟩` + `⟨dh x_fin⟩` |
| `⟨val x⟩` | `x_orig text`, `x_norm num`, `x_unite_id → concept`, `x_monnaie_id → concept`, `x_type code` (MLD-04) |
| `⟨REF x⟩` | `x_id uuid FK → concept(id)` |

**Référence typée à un objet quelconque :** `x_id uuid` + `x_type code` + `FK (x_id, x_type) → objet(id, type_objet)` + `CK x_type IN (…)`. Notée `x → objet{T1, T2, …}`.

## 3.4 Contraintes de groupe `DATE_HIST` (DD-10)

Pour tout groupe `⟨dh x⟩` renseigné (`x_type IS NOT NULL`) :

```text
CK (x_type IS NULL) = (x_cal_id IS NULL)                         -- groupe complet ou vide
CK x_min IS NULL OR x_max IS NULL OR x_min <= x_max
CK x_type <> 'exacte'                OR (x_min IS NOT NULL AND x_max IS NOT NULL AND x_prec IS NOT NULL)
CK x_type NOT IN ('approximative','vers','intervalle') OR (x_min IS NOT NULL AND x_max IS NOT NULL AND x_min < x_max)
CK x_type <> 'avant'                 OR (x_min IS NULL AND x_max IS NOT NULL)
CK x_type <> 'après'                 OR (x_min IS NOT NULL AND x_max IS NULL)
CK x_type NOT IN ('calculée','déduite','estimée') OR (x_min IS NOT NULL OR x_max IS NOT NULL)
CK x_type <> 'inconnue'              OR (x_min IS NULL AND x_max IS NULL AND x_prec IS NULL)
```

La règle « `approximative` et `vers` exigent `min < max` » empêche mécaniquement de stocker « vers 1840 » comme une date unique (DD-10). L'obligation de `x_expr` pour une date issue d'une source ou d'une saisie est CP-14 (elle dépend de la provenance).

## 3.5 Règles de suppression

| Cas | Règle |
|---|---|
| Toute clé étrangère vers une table d'objet, de lien, de version, d'activité ou de concept | `ON DELETE RESTRICT` |
| `compte` → `historique_navigation`, `notification`, `compte_categorie_sollicitation`, `blocage`, `lien_compte_acteur` | `ON DELETE CASCADE` (données personnelles techniques, MLD-15) |
| Tables `_hist`, `version_objet`, `activite`, journaux | Aucune suppression ; purge par mise à `NULL` des colonnes de contenu (CP-16) |

---

# 4. Domaine A — Socle transversal

## 4.1 Le socle `objet`

```text
objet  [V]                                         -- OBJET (super-type abstrait)
  id                 uuid   PK
  type_objet         code   NN   CK IN (liste des entités Obj. ✓, § 25)
  espace_id          uuid   NN   FK → espace(id) DEF        -- CONTENIR (1,1), figé (DI-A01)
  version_courante   int    NN                              -- CP-02
  date_creation      ts     NN
  etat_cycle_vie     code   NN   CK IN D-01  default 'actif'
  etat_examen        code   NN   CK IN D-02
  statut_validation  code   NN   CK IN D-03  default 'proposée' -- dérivé (CP-10)
  visibilite         code   NN   CK IN D-04  default 'privé'
  decouvrabilite     code   NN   CK IN D-05  default 'non découvrable'
  licence_code       text        FK → licence(code)         -- SOUS_LICENCE (0,1)
  libelle_technique  text                                   -- TI-09
  est_purge          bool   NN   default faux               -- MLD-15
  date_purge         ts
  UQ (id, type_objet)                                       -- cible des FK composites (MLD-01)
  FK (id, version_courante) → version_objet(objet_id, numero) DEF
  CK decouvrabilite <> 'indexable Web' OR visibilite = 'public indexable'   -- DI-A04
  CK est_purge = (date_purge IS NOT NULL)
  CK NOT est_purge OR etat_cycle_vie = 'supprimé'
```

Un `espace` est lui-même un objet : sa ligne `objet` a pour `espace_id` son propre identifiant (auto-contenance, clé différée). Cette convention évite un espace « racine » artificiel.

Les transitions de `etat_cycle_vie` (DI-A03) et le plafond de visibilité de l'espace (DI-A05) sont CP-03 et CP-11.

## 4.2 Versions, activités, manifestes

```text
version_objet  [N]                                 -- VERSION_OBJET
  objet_id             uuid  NN  FK → objet(id)          -- AVOIR_VERSION (1,1)
  numero               int   NN  CK numero >= 1        -- PRECEDER : ordre des numéros
  date_debut_validite  ts    NN
  date_fin_validite    ts                                   -- NULL = version courante
  nature_changement    code  NN  CK IN {création, correction technique, changement scientifique,
                                         changement de statut, changement de gouvernance, restriction}
  motif                text
  activite_id          uuid  NN  FK → activite(id)          -- PRODUIRE (1,1)
  empreinte_etat       hash  NN
  statut_contenu       code  NN  CK IN {intact, restreint, purgé}  default 'intact'
  PK (objet_id, numero)
  UQ (objet_id) WHERE date_fin_validite IS NULL             -- une seule version courante (DI-A07)
  CK date_fin_validite IS NULL OR date_fin_validite >= date_debut_validite
  CK (numero = 1) = (nature_changement = 'création')
  CK nature_changement NOT IN ('changement scientifique','restriction','changement de gouvernance')
     OR motif IS NOT NULL                                   -- DI-A08

version_composant  [N] ‡                           -- manifeste des conteneurs (DD-01)
  conteneur_id      uuid  NN
  conteneur_numero  int   NN
  composant_id      uuid  NN
  composant_numero  int   NN
  PK (conteneur_id, conteneur_numero, composant_id)
  FK (conteneur_id, conteneur_numero) → version_objet(objet_id, numero)
  FK (composant_id, composant_numero) → version_objet(objet_id, numero)

activite  [N]                                      -- ACTIVITE
  id                            uuid  PK
  type_activite                 code  NN  CK IN D-06
  date_debut                    ts    NN
  date_fin                      ts
  mode                          code  NN  CK IN {manuel, assisté, automatique}
  declenchement                 code  NN  CK IN {explicite, planifié, automatique léger}
  moteur                        text
  version_moteur                text
  parametres_decisifs           json
  ia_generative                 bool  NN
  intervention_humaine          code  NN  CK IN {aucune, examen, correction, validation}
  mode_lecture                  code  NN  CK IN {assistée, indépendante/aveugle, sans objet}
  fournisseur                   text                        -- DD-15
  perimetre_donnees_transmises  text
  acteur_id                     uuid      FK → acteur_geniius(id)   -- REALISER (0,1)
  CK date_fin IS NULL OR date_fin >= date_debut                     -- DI-A13
  CK NOT ia_generative OR (moteur IS NOT NULL AND version_moteur IS NOT NULL)  -- DI-A10
  CK mode <> 'automatique' OR moteur IS NOT NULL                     -- DI-A11
  CK mode <> 'manuel' OR acteur_id IS NOT NULL                       -- DI-A11
  CK (moteur IS NULL) = (version_moteur IS NULL)
  CK (fournisseur IS NULL) = (perimetre_donnees_transmises IS NULL)  -- DI-A12

activite_entree  [N]                               -- UTILISER_ENTREE
  activite_id   uuid  NN  FK → activite(id)
  objet_id      uuid  NN
  numero        int   NN
  role_entree   text
  PK (activite_id, objet_id, numero)
  FK (objet_id, numero) → version_objet(objet_id, numero)

activite_methode  [N]                              -- APPLIQUER
  activite_id     uuid  NN  FK → activite(id)
  methode_id      uuid  NN
  methode_numero  int   NN
  PK (activite_id, methode_id)
  FK (methode_id, methode_numero) → version_objet(objet_id, numero)
  FK (methode_id) → methode(id)
```

## 4.3 Le socle `lien` et les liens réifiés (MLD-06, MLD-07)

```text
lien  [L]                                          -- socle des liens gouvernables (DD-09)
  id                uuid  PK
  type_lien         code  NN  CK IN {dependance, filiation, reference_inter_espace,
                                     responsabilite, credit}
  espace_id         uuid  NN  FK → espace(id)               -- espace de gouvernance du lien
  visibilite        code  NN  CK IN D-04                    -- CP-12 : ≤ extrémités (TI-10)
  etat_lien         code  NN  CK IN {actif, retiré}  default 'actif'
  version_courante  int   NN
  date_creation     ts    NN
  est_purge         bool  NN  default faux
  UQ (id, type_lien)

lien_version  [N] ‡                                -- registre des versions de liens
  lien_id         uuid  NN  FK → lien(id)
  numero          int   NN
  date_debut      ts    NN
  date_fin        ts
  activite_id     uuid  NN  FK → activite(id)
  PK (lien_id, numero)
  UQ (lien_id) WHERE date_fin IS NULL

dependance  [L]                                    -- DEPENDANCE (3 catégories)
  ⟨LIEN 'dependance'⟩
  aval_id           uuid  NN  FK → objet(id)                -- DEPENDRE aval
  amont_id          uuid  NN  FK → objet(id)                -- DEPENDRE amont
  amont_numero      int                                     -- UTILISER_VERSION
  categorie         code  NN  CK IN {production, justification, raisonnement}
  type_dependance   code  NN  CK IN D-07
  ⟨REF role_probatoire⟩
  sens              code      CK IN {appui, contre, contexte}
  etat_impact       code  NN  CK IN {inchangé, potentiellement affecté, à réexaminer,
                                     invalidé, à recalculer}  default 'inchangé'
  date_signalement  ts
  cycle_detecte     bool  NN  default faux                  -- CP-09
  FK (amont_id, amont_numero) → version_objet(objet_id, numero)
  CK aval_id <> amont_id                                                     -- DI-A14
  CK categorie <> 'production'    OR amont_numero IS NOT NULL                -- DI-A15
  CK categorie <> 'justification' OR (amont_numero IS NOT NULL AND role_probatoire_id IS NOT NULL)
  CK (categorie = 'raisonnement') = (sens IS NOT NULL)
  CK (etat_impact = 'inchangé') = (date_signalement IS NULL)
  -- unicité (aval, amont, categorie, type_dependance) parmi les liens actifs : CP-15

filiation  [L]                                     -- FILIATION
  ⟨LIEN 'filiation'⟩
  objet_derive_id    uuid  NN  FK → objet(id)
  origine_id         uuid  NN
  origine_numero     int   NN
  type_filiation     code  NN  CK IN {contribution, import, échange Tree↔Tree, restauration, réutilisation}
  etat_divergence    code  NN  CK IN {alignés, divergents, mise à jour proposée,
                                      mise à jour importée, divergence assumée}
  date_constat       ts    NN
  operation_flux_id  uuid      FK → operation_flux(id)      -- RESULTER (0,1) = PRODUIRE_FILIATION
  import_id          uuid      FK → import(id)
  FK (origine_id, origine_numero) → version_objet(objet_id, numero)
  CK objet_derive_id <> origine_id                                           -- DI-A19
  CK type_filiation = 'réutilisation' OR operation_flux_id IS NOT NULL OR import_id IS NOT NULL  -- DI-A20

reference_inter_espace  [L]                        -- REFERENCE_INTER_ESPACE (ex-REFERENCER)
  ⟨LIEN 'reference_inter_espace'⟩
  espace_referent_id  uuid  NN  FK → espace(id)
  objet_cible_id      uuid  NN  FK → objet(id)
  date                ts    NN
  motif               text
  etat_courant        code  NN  CK IN {active, cible révisée, redirigée, retirée,
                                       inaccessible, non résolue}           -- dérivé (CP-10)
  UQ (espace_referent_id, objet_cible_id) WHERE etat_courant <> 'retirée'
  -- DI-A23 (espace référent ≠ espace de la cible) : CP-04

etat_reference_externe  [N]                        -- ETAT_REFERENCE_EXTERNE
  id                     uuid  PK
  reference_id           uuid  NN  FK → reference_inter_espace(id)   -- DECRIRE_ETAT
  etat                   code  NN  CK IN {active, cible révisée, redirigée, retirée,
                                          inaccessible, non résolue}
  date                   ts    NN
  motif                  text
  redirection_objet_id   uuid      FK → objet(id)                     -- REDIRIGER_VERS
  CK (etat = 'redirigée') = (redirection_objet_id IS NOT NULL)        -- DI-A26
```

Les tables `dependance_hist`, `filiation_hist`, `reference_inter_espace_hist`, `responsabilite_hist`, `credit_hist` et `lien_hist` suivent MLD-02 avec la clé `(id, numero)` → `lien_version`.

## 4.4 Justification, acquisition, références, identifiants externes

```text
base_justificative  [V]                            -- BASE_JUSTIFICATIVE (conteneur)
  ⟨OBJ 'BASE_JUSTIFICATIVE'⟩
  objet_justifie_id  uuid  NN  FK → objet(id)               -- JUSTIFIER (1,1)
  portee             code  NN  CK IN {publique, communautaire, projet, privée}
  date               ts    NN
  statut             code  NN  CK IN {en vigueur, remplacée, insuffisante, à réexaminer}
  UQ (objet_justifie_id, portee) WHERE statut = 'en vigueur'

base_justificative_preuve  [A:base_justificative]  -- INVOQUER_PREUVE
  base_justificative_id  uuid  NN  FK → base_justificative(id)
  dependance_id          uuid  NN  FK → dependance(id)
  ⟨VA base_justificative⟩
  PK (base_justificative_id, dependance_id, v_debut)
  -- DI-A27 (même aval, catégorie justification), DI-A29 : CP-09

acquisition_information  [V]                       -- ACQUISITION_INFORMATION
  ⟨OBJ 'ACQUISITION_INFORMATION'⟩
  mode                   code  NN  CK IN {import fichier, saisie, transmission orale,
                                          réutilisation inter-espace, reprise d'un tiers,
                                          capture inbox, collecte Connect}
  date                   ts    NN
  ⟨dh date_connaissance⟩
  fournisseur            text                                -- confidentialité R
  transformation         text
  import_id              uuid      FK → import(id)           -- LOT (0,1)
  fournisseur_acteur_id  uuid      FK → acteur_geniius(id)   -- FOURNIR (0,1)
  CK mode <> 'import fichier' OR import_id IS NOT NULL      -- DI-A31

acquisition_objet  [N]                             -- ACQUERIR
  acquisition_id  uuid  NN  FK → acquisition_information(id)
  objet_id        uuid  NN  FK → objet(id)
  PK (acquisition_id, objet_id)

acquisition_documentaire  [V]                      -- ACQUISITION_DOCUMENTAIRE
  ⟨OBJ 'ACQUISITION_DOCUMENTAIRE'⟩
  mode                   code  NN  CK IN {don, dépôt, photographie personnelle, téléchargement,
                                          transmission familiale, achat, prêt,
                                          numérisation institutionnelle reçue, autre}
  mode_precision         text                                -- TI-06
  ⟨dh date⟩                                                  -- NN* sur date_type
  detenteur_fournisseur  text
  conditions             text
  CK (mode = 'autre') = (mode_precision IS NOT NULL)

acquisition_documentaire_objet  [N]                -- ACQUERIR_DOC
  acquisition_id  uuid  NN  FK → acquisition_documentaire(id)
  objet_id        uuid  NN
  objet_type      code  NN  CK IN {DOCUMENT, EXEMPLAIRE, REPRODUCTION}
  fichier_id      uuid      FK → fichier(id)
  PK (acquisition_id, objet_id)
  FK (objet_id, objet_type) → objet(id, type_objet)

reference_persistante  [V]                         -- REFERENCE_PERSISTANTE
  ⟨OBJ 'REFERENCE_PERSISTANTE'⟩
  identifiant    text  NN  UQ
  ark            text      UQ                                -- CP-17
  mode           code  NN  CK IN {courant, figé}
  fragment       text
  cible_id       uuid  NN  FK → objet(id)                    -- VISER
  cible_numero   int                                         -- FIGER_SUR
  zone_id        uuid      FK → zone(id)                     -- POINTER_FRAGMENT
  FK (cible_id, cible_numero) → version_objet(objet_id, numero)
  CK (mode = 'figé') = (cible_numero IS NOT NULL)            -- DI-A34

identifiant_externe  [A:objet]                     -- IDENTIFIANT_EXTERNE
  id            uuid  PK
  objet_id      uuid  NN  FK → objet(id)                     -- IDENTIFIER_EXT
  ⟨REF systeme⟩                                              -- NN
  valeur        text  NN
  type          code  NN  CK IN {identifiant officiel, lien externe déclaré, correspondance candidate}
  statut        code  NN  CK IN {actif, obsolète, contesté}
  date_constat  ts    NN
  ⟨VA objet⟩
  UQ (objet_id, systeme_id, valeur) WHERE v_fin IS NULL
```

---

# 5. Domaine B — Espaces, comptes, droits, gouvernance

## 5.1 Espaces

```text
espace  [V]                                        -- ESPACE
  ⟨OBJ {ESPACE, PROJET, COMMUNAUTE, ESPACE_ORGANISATION}⟩
  type_espace         code  NN  CK IN D-09
  nom                 text  NN*
  regime_gouvernance  text
  visibilite_max      code  NN  CK IN D-04
  UQ (type_espace) WHERE type_espace = 'Core partagé'        -- DD-17
  CK type_espace NOT IN ('communauté','Core partagé') OR regime_gouvernance IS NOT NULL OR est_purge
  CK type_espace <> 'personnel' OR visibilite_max = 'privé'

communaute  [V]                                    -- COMMUNAUTE ⊂ ESPACE
  ⟨SOUS espace 'COMMUNAUTE'⟩
  objet_focal  text  NN*
  charte       text  NN*

espace_organisation  [V]                           -- ESPACE_ORGANISATION ⊂ ESPACE
  ⟨SOUS espace 'ESPACE_ORGANISATION'⟩
  ⟨REF nature_structure⟩                                     -- NN
  forme_juridique  text
```

`projet` (⊂ `espace`) est au § 14.1. La date de création de l'espace est `objet.date_creation`.

## 5.2 Comptes, acteurs et leurs liens (DD-07)

```text
compte  [T]                                        -- COMPTE (ex-UTILISATEUR) ; confidentialité I
  id                            uuid  PK
  identite_civile               text
  email                         text  NN
  niveau_verification_identite  code  NN  CK IN {aucun, standard, renforcé}
  date_inscription              ts    NN
  etat_compte                   code  NN  CK IN {actif, suspendu, fermé, supprimé}
  espace_personnel_id           uuid  NN  UQ  FK → espace(id)     ‡ espace personnel du compte
  UQ (lower(email)) WHERE etat_compte IN ('actif','suspendu')

compte_categorie_sollicitation  [T]                -- COMPTE.categories_sollicitation_acceptees (0..n)
  compte_id  uuid  NN  FK → compte(id) ON DELETE CASCADE
  categorie  code  NN  CK IN {source, vérification, photo-identification, avis,
                              mission d'archives, collaboration}
  PK (compte_id, categorie)

acteur_geniius  [V]                                -- ACTEUR_GENIIUS
  ⟨OBJ 'ACTEUR_GENIIUS'⟩
  nature_acteur          code  NN  CK IN {personne, organisation}
  nom_attribution        text  NN*
  mode_affichage_public  code  NN  CK IN {nom réel, pseudonyme stable, masqué}
  pseudonyme             text
  statut                 code  NN  CK IN {actif, inactif, décédé, dissous}
  UQ (lower(pseudonyme)) WHERE pseudonyme IS NOT NULL                -- DI-B08 (jamais réattribué : CP-06)
  CK mode_affichage_public <> 'pseudonyme stable' OR pseudonyme IS NOT NULL OR est_purge

lien_compte_acteur  [T]                            -- LIEN_COMPTE_ACTEUR ; confidentialité I
  compte_id            uuid  NN  FK → compte(id) ON DELETE CASCADE
  acteur_id            uuid  NN  FK → acteur_geniius(id)
  date_debut           ts    NN
  date_fin             ts
  niveau_verification  code  NN  CK IN {déclaré, vérifié}
  PK (compte_id, acteur_id, date_debut)
  -- DI-B07 (un compte actif par acteur « personne ») : CP-06

lien_compte_personne  [V]                          -- LIEN_COMPTE_PERSONNE (ex-REVENDICATION) ; R
  ⟨OBJ 'LIEN_COMPTE_PERSONNE'⟩
  compte_id    uuid  NN  FK → compte(id)
  personne_id  uuid  NN  FK → personne(id)
  methode      text  NN*
  date         ts    NN
  statut       code  NN  CK IN {déclaré, vérifié, révoqué}
  niveau       code  NN  CK IN {standard, renforcé}
  UQ (personne_id) WHERE statut = 'vérifié'

groupe  [V]                                        -- GROUPE
  ⟨OBJ 'GROUPE'⟩
  nom          text  NN*
  type_groupe  code  NN  CK IN {famille, cercle invité, équipe, autre}

membre_groupe  [A:groupe]                          -- MEMBRE_GROUPE
  groupe_id   uuid  NN  FK → groupe(id)
  acteur_id   uuid  NN  FK → acteur_geniius(id)
  date_debut  ts    NN
  date_fin    ts
  ⟨VA groupe⟩
  PK (groupe_id, acteur_id, v_debut)

appartenance_espace  [A:espace]                    -- APPARTENIR
  espace_id    uuid  NN  FK → espace(id)
  acteur_id    uuid  NN  FK → acteur_geniius(id)
  role_espace  code  NN  CK IN {propriétaire, administrateur, responsable scientifique,
                                collaborateur, invité, lecteur}
  nature_habilitation  code  NN  CK IN {administrative, scientifique}      ‡ CP-25
  lecture_scientifique bool  NN                                            ‡ CP-25
  date_debut   ts    NN
  date_fin     ts
  ⟨VA espace⟩
  PK (espace_id, acteur_id, role_espace, v_debut)
  CK (nature_habilitation = 'administrative') = (role_espace IN ('propriétaire','administrateur'))
  CK lecture_scientifique = (role_espace IN ('responsable scientifique','collaborateur','lecteur'))
  -- un acteur cumule les deux habilitations par deux lignes distinctes (PK incluant role_espace)
  -- DI-B02, DI-B04 : CP-06 ; séparation administration / science : CP-25

attribution_role  [A:espace]                       -- ATTRIBUER_ROLE
  espace_id         uuid  NN  FK → espace(id)
  acteur_id         uuid  NN  FK → acteur_geniius(id)
  role_gouvernance  code  NN  CK IN {contributeur, validateur, référent communautaire,
                                     modérateur, administrateur technique}
  procedure         text  NN
  date              ts    NN
  domaine_id        uuid      FK → domaine_expertise(id)
  ⟨VA espace⟩
  PK (espace_id, acteur_id, role_gouvernance, v_debut)
```

## 5.3 Règles d'accès et décisions de diffusion (MLD-13)

```text
regle_acces  [V]                                   -- REGLE_ACCES
  ⟨OBJ 'REGLE_ACCES'⟩
  cible_type              code  NN  CK IN {objet, espace, lien}
  cible_objet_id          uuid      FK → objet(id)            -- PORTER_SUR_OBJET
  cible_espace_id         uuid      FK → espace(id)           -- PORTER_SUR_ESPACE
  cible_lien_id           uuid      FK → lien(id)             -- PORTER_SUR_LIEN †
  action                  code  NN  CK IN D-10
  effet                   code  NN  CK IN {autoriser, interdire}
  objet_protege           code  NN  CK IN {contenu, existence}  default 'contenu'
  type_beneficiaire       code  NN  CK IN {acteur, groupe, rôle d'espace, public}
  beneficiaire_acteur_id  uuid      FK → acteur_geniius(id)   -- BENEFICIER
  beneficiaire_groupe_id  uuid      FK → groupe(id)
  role_beneficiaire       code      CK IN rôles d'APPARTENIR
  date_debut              ts    NN
  date_fin                ts
  condition               text
  sensibilite             code  NN  CK IN {normale, sensible, très sensible}
  CK num_nonnulls(cible_objet_id, cible_espace_id, cible_lien_id) = 1          -- DI-B10
  CK (cible_type = 'objet')  = (cible_objet_id  IS NOT NULL)
  CK (cible_type = 'espace') = (cible_espace_id IS NOT NULL)
  CK (cible_type = 'lien')   = (cible_lien_id   IS NOT NULL)
  CK (type_beneficiaire = 'acteur')         = (beneficiaire_acteur_id IS NOT NULL)
  CK (type_beneficiaire = 'groupe')         = (beneficiaire_groupe_id IS NOT NULL)
  CK (type_beneficiaire = 'rôle d''espace') = (role_beneficiaire IS NOT NULL)
  CK date_fin IS NULL OR date_fin > date_debut

contexte_evaluation  [N]                           -- CONTEXTE_EVALUATION
  id          uuid  PK
  acteur_id   uuid      FK → acteur_geniius(id)               -- confidentialité I
  audience    code  NN  CK IN D-04
  espace_id   uuid  NN  FK → espace(id)
  projet_id   uuid      FK → projet(id)
  role        code
  instant     ts    NN
  operation   code  NN  CK IN {consultation, recherche, traversée, suggestion, agrégation, comptage,
                               calcul, export, publication, notification, API}
  finalite    text
  canal       code  NN  CK IN {interface, API, export, notification, page publique}

decision_applicabilite_droit  [V]                  -- DECISION_APPLICABILITE_DROIT
  ⟨OBJ 'DECISION_APPLICABILITE_DROIT'⟩
  restriction_id        uuid                                  -- RESTRICTION_AMONT †
  restriction_type      code      CK IN {EMBARGO, CONSENTEMENT, REGLE_ACCES}
  restriction_licence   text      FK → licence(code)          -- une licence n'est pas un objet
  derive_id             uuid  NN  FK → objet(id)              -- DERIVE_CONCERNE †
  decision              code  NN  CK IN {applicable, partiellement applicable, non applicable,
                                         indéterminée, à réexaminer}
  fondement             text  NN*
  date                  ts    NN
  FK (restriction_id, restriction_type) → objet(id, type_objet)
  CK num_nonnulls(restriction_id, restriction_licence) = 1
  CK (restriction_id IS NULL) = (restriction_type IS NULL)
  -- DI-B15 (le dérivé dépend de l'objet restreint) : CP-13

evaluation_diffusabilite  [V]                      -- EVALUATION_DIFFUSABILITE
  ⟨OBJ 'EVALUATION_DIFFUSABILITE'⟩
  objet_evalue_id      uuid  NN  FK → objet(id)               -- EVALUER_OBJET †
  objet_evalue_numero  int
  contexte_id          uuid  NN  FK → contexte_evaluation(id) -- EVALUER_DANS †
  decision             code  NN  CK IN {diffusable, diffusable avec provenance masquée,
                                        existence seulement, autorisation requise, non diffusable}
  motif                text  NN*
  risque_inference     code  NN  CK IN {faible, modéré, élevé, non évalué}
  date                 ts    NN
  FK (objet_evalue_id, objet_evalue_numero) → version_objet(objet_id, numero)
  CK risque_inference <> 'élevé' OR decision <> 'diffusable'               -- DI-B17
```

## 5.4 Licences, embargos, classification, masquage

```text
licence  [T]                                       -- LICENCE (référentiel)
  code                 text  PK
  libelle              text  NN
  redistribution       bool  NN
  modification         bool  NN
  usage_commercial     bool  NN
  attribution_requise  bool  NN

embargo  [V]                                       -- EMBARGO
  ⟨OBJ 'EMBARGO'⟩
  objet_cible_id   uuid  NN  FK → objet(id)                   -- RESTREINDRE
  portee           code  NN  CK IN {média, transcription, information, usage, existence même}
  ⟨dh date_fin⟩
  condition_levee  text
  motif            text  NN*
  statut           code  NN  CK IN {actif, levé, expiré}
  CK date_fin_type IS NOT NULL OR condition_levee IS NOT NULL OR est_purge  -- DI-B19

classification  [T]                                -- CLASSIFICATION (référentiel)
  code     text  PK
  libelle  text  NN

objet_classification  [A:objet]                    -- CLASSER
  objet_id             uuid  NN  FK → objet(id)
  classification_code  text  NN  FK → classification(code)
  origine              code  NN  CK IN {déclarée, déduite}
  ⟨VA objet⟩
  PK (objet_id, classification_code, v_debut)

masquage  [V]                                      -- MASQUAGE
  ⟨OBJ 'MASQUAGE'⟩
  objet_original_id  uuid  NN  FK → objet(id)
  objet_public_id    uuid  UQ  FK → objet(id)                  -- MASQUER (0,1)
  type               code  NN  CK IN {masquage, pseudonymisation, anonymisation}
  pseudonyme_attribue text
  perimetre          text  NN*
  date               ts    NN
  CK type <> 'pseudonymisation' OR pseudonyme_attribue IS NOT NULL OR est_purge
  CK objet_public_id IS NULL OR objet_public_id <> objet_original_id
  -- DI-B22 (absence de chemin public pour l'anonymisation) : CP-13
```

## 5.5 Consentements, volontés, gouvernance, intérêts, financement, abonnement

```text
consentement  [V]                                  -- CONSENTEMENT ; confidentialité R
  ⟨OBJ 'CONSENTEMENT'⟩
  personne_id          uuid  NN  FK → personne(id)            -- CONSENTIR
  objet_concerne_id    uuid      FK → objet(id)
  espace_concerne_id   uuid      FK → espace(id)
  portee               code  NN  CK IN {enregistrement, transcription, usage familial, usage projet,
                                        publication, usage posthume, biométrie}
  decision             code  NN  CK IN {accordé, refusé, retiré}
  texte_version        text  NN
  horodatage           ts    NN
  mode_recueil         code  NN  CK IN {écrit signé, oral enregistré, électronique, représentant légal}
  CK num_nonnulls(objet_concerne_id, espace_concerne_id) <= 1

volonte_numerique  [V]                             -- VOLONTE_NUMERIQUE ; R
  ⟨OBJ 'VOLONTE_NUMERIQUE'⟩
  acteur_id                uuid  NN  FK → acteur_geniius(id)  -- EXPRIMER
  action                   code  NN  CK IN {conserver, transmettre, publier, remettre, supprimer,
                                            transmettre les enregistrements}
  perimetre                text  NN*
  beneficiaire             text
  condition_declenchement  text  NN*

transfert_gouvernance  [V]                         -- TRANSFERT_GOUVERNANCE
  ⟨OBJ 'TRANSFERT_GOUVERNANCE'⟩
  espace_transfere_id     uuid  NN  FK → espace(id)          -- TRANSFERER
  cedant_acteur_id        uuid  NN  FK → acteur_geniius(id)
  cessionnaire_acteur_id  uuid  NN  FK → acteur_geniius(id)
  date                    ts    NN
  perimetre               text  NN*
  exclusions              text
  conditions              text
  autorisation            text  NN*
  CK cedant_acteur_id <> cessionnaire_acteur_id

designation_garde  [V]                             -- DESIGNATION_GARDE ; R
  ⟨OBJ 'DESIGNATION_GARDE'⟩
  objet_cible_id        uuid  NN  FK → objet(id)              -- DESIGNER
  designe_acteur_id     uuid      FK → acteur_geniius(id)
  designe_personne_id   uuid      FK → personne(id)
  role                  code  NN  CK IN D-11
  condition_effet       code  NN  CK IN {immédiat, décès, date, autre}
  condition_precision   text
  ⟨dh date_effet⟩
  statut                code  NN  CK IN {prévue, effective, révoquée}
  CK num_nonnulls(designe_acteur_id, designe_personne_id) = 1                -- DI-B27
  CK (condition_effet = 'autre') = (condition_precision IS NOT NULL)
  CK condition_effet <> 'date' OR date_effet_type IS NOT NULL

lien_interet  [V]                                  -- LIEN_INTERET
  ⟨OBJ 'LIEN_INTERET'⟩
  acteur_id          uuid  NN  FK → acteur_geniius(id)        -- DECLARER_INTERET
  objet_concerne_id  uuid  NN  FK → objet(id)
  type               code  NN  CK IN {valide sa propre famille, propriétaire du fonds,
                                      membre du projet évalué, participant à l'événement,
                                      financeur, autre}
  type_precision     text
  date_declaration   ts    NN
  CK (type = 'autre') = (type_precision IS NOT NULL)

financement  [V]                                   -- FINANCEMENT
  ⟨OBJ 'FINANCEMENT'⟩
  projet_id                  uuid  NN  FK → projet(id)        -- FINANCER
  financeur_organisation_id  uuid      FK → organisation(id)
  type                       code  NN  CK IN {autofinancement, association, université, collectivité,
                                              subvention, mécénat, crowdfunding}
  ⟨val montant⟩
  ⟨ph periode⟩
  obligations                text
  CK montant_orig IS NULL OR montant_monnaie_id IS NOT NULL

abonnement  [T]                                    -- ABONNEMENT ; I
  id                    uuid  PK
  titulaire_compte_id   uuid      FK → compte(id)           -- SOUSCRIRE
  titulaire_espace_id   uuid      FK → espace(id)
  offre                 text  NN
  quotas                text  NN
  credits_calcul        int       CK credits_calcul >= 0
  date_debut            ts    NN
  date_fin              ts
  CK num_nonnulls(titulaire_compte_id, titulaire_espace_id) = 1
  -- RG-B05 : aucune clé étrangère d'acte_evaluation, badge ou attribution_role vers abonnement

blocage  [T]                                       -- BLOQUER ; I
  compte_id         uuid  NN  FK → compte(id) ON DELETE CASCADE
  compte_bloque_id  uuid  NN  FK → compte(id) ON DELETE CASCADE
  date              ts    NN
  PK (compte_id, compte_bloque_id)
  CK compte_id <> compte_bloque_id
```

---

# 6. Domaine C — Sources et hiérarchie documentaire

## 6.1 Documents, exemplaires, unités archivistiques

```text
document  [V]                                      -- DOCUMENT
  ⟨OBJ 'DOCUMENT'⟩
  titre_forge        text  NN*
  titre_original     text                                     -- verbatim
  ⟨REF nature⟩                                                -- NN
  ⟨REF type_documentaire⟩
  ⟨dh date_production⟩
  statut_existence   code  NN  CK IN D-13
  accessibilite      code  NN  CK IN {accessible, restreint, inaccessible, inconnue}
  description        text
  etat_provenance    code  NN  CK IN D-14
  -- DI-C01 (prescrit → attesté seulement par assertion), DI-C02, DI-C04 : CP-13

document_langue  [A:document]                      -- DOCUMENT.langues (0..n)
  document_id  uuid  NN  FK → document(id)
  langue       lang  NN
  ⟨VA document⟩
  PK (document_id, langue, v_debut)

exemplaire  [V]                                    -- EXEMPLAIRE
  ⟨OBJ 'EXEMPLAIRE'⟩
  document_id             uuid  NN  FK → document(id)         -- INCARNER (1,1)
  ⟨REF type_exemplaire⟩                                       -- NN
  description_materielle  text
  etat_conservation       text
  nb_pages_declare        int   CK nb_pages_declare >= 1

unite_archivistique  [V]                           -- UNITE_ARCHIVISTIQUE
  ⟨OBJ 'UNITE_ARCHIVISTIQUE'⟩
  niveau                       code  NN  CK IN {fonds, série, sous-série, article/cote,
                                                registre, dossier, pièce}
  intitule                     text  NN*
  ⟨ph dates_extremes⟩
  description                  text
  organisation_conservatrice_id uuid     FK → organisation(id) -- CONSERVER (0,1), historisé par _hist

classement_unite  [A:unite_archivistique]          -- CLASSER_DANS (propriétaire : enfant)
  unite_archivistique_id  uuid  NN  FK → unite_archivistique(id)     -- enfant
  parent_id               uuid  NN  FK → unite_archivistique(id)
  type_ordre              code  NN  CK IN D-18
  rang                    int
  ⟨ph periode⟩
  ⟨VA unite_archivistique⟩
  PK (unite_archivistique_id, parent_id, type_ordre, v_debut)
  CK unite_archivistique_id <> parent_id
  -- absence de cycle par type d'ordre (DI-C06) : CP-09

localisation_exemplaire  [A:exemplaire]            -- LOCALISER
  exemplaire_id  uuid  NN  FK → exemplaire(id)
  unite_id       uuid  NN  FK → unite_archivistique(id)
  type_ordre     code  NN  CK IN D-18
  rang           int
  ⟨ph periode⟩
  ⟨VA exemplaire⟩
  PK (exemplaire_id, unite_id, type_ordre, v_debut)

composition_documentaire  [A:objet] †              -- COMPOSER_DOC (propriétaire : contenant)
  contenant_id      uuid  NN
  contenant_type    code  NN  CK IN {DOCUMENT, EXEMPLAIRE}
  contenu_id        uuid  NN
  contenu_type      code  NN  CK IN {DOCUMENT, EXEMPLAIRE}
  type_composition  code  NN  CK IN {album → photographie, dossier → pièce, registre → cahier,
                                     document inclus}
  rang              int
  type_ordre        code  NN  CK IN D-18
  v_debut           int   NN
  v_fin             int
  PK (contenant_id, contenu_id, type_ordre, v_debut)
  FK (contenant_id, contenant_type) → objet(id, type_objet)
  FK (contenu_id, contenu_type) → objet(id, type_objet)
  FK (contenant_id, v_debut) → version_objet(objet_id, numero)
  CK contenant_id <> contenu_id
```

## 6.2 Cotes, accès en ligne, pages

```text
identifiant_documentaire  [V]                      -- IDENTIFIANT_DOCUMENTAIRE
  ⟨OBJ 'IDENTIFIANT_DOCUMENTAIRE'⟩
  porteur_id             uuid  NN                             -- COTER
  porteur_type           code  NN  CK IN {DOCUMENT, EXEMPLAIRE, UNITE_ARCHIVISTIQUE}
  valeur                 text  NN*                            -- verbatim
  type                   code  NN  CK IN {cote actuelle, ancienne cote, identifiant historique,
                                          numéro d'acte, ARK, autre}
  institution_emettrice  text
  ⟨dh date_debut⟩
  ⟨dh date_fin⟩
  FK (porteur_id, porteur_type) → objet(id, type_objet)
  UQ (porteur_id, coalesce(institution_emettrice, ''))
     WHERE type = 'cote actuelle' AND date_fin_type IS NULL   -- DI-C08

localisation_en_ligne  [V]                         -- LOCALISATION_EN_LIGNE
  ⟨OBJ 'LOCALISATION_EN_LIGNE'⟩
  porteur_id        uuid  NN                                  -- ACCEDER
  porteur_type      code  NN  CK IN {DOCUMENT, REPRODUCTION}
  adresse           text  NN*
  type              code  NN  CK IN {URL, ARK, DOI, manifeste IIIF, autre}
  plateforme        text
  date_debut        ts    NN
  date_fin          ts
  etat_acces        code  NN  CK IN D-15
  date_observation  ts    NN
  FK (porteur_id, porteur_type) → objet(id, type_objet)

page  [V]                                          -- PAGE
  ⟨OBJ 'PAGE'⟩
  exemplaire_id  uuid  NN  FK → exemplaire(id)                -- COMPORTER (1,1)
  numero         text
  folio          text
  face           code  NN  CK IN {recto, verso, sans objet}
  rang           int   NN  CK rang >= 1
  etat           code  NN  CK IN {présente, absente, endommagée}
  UQ (exemplaire_id, rang)
```

## 6.3 Reproductions, fichiers, vues, zones

```text
reproduction  [V]                                  -- REPRODUCTION
  ⟨OBJ 'REPRODUCTION'⟩
  exemplaire_source_id      uuid      FK → exemplaire(id)     -- REPRODUIRE
  reproduction_parente_id   uuid      FK → reproduction(id)   -- DERIVER_DE
  ⟨REF type⟩                                                  -- NN
  ⟨dh date⟩
  qualite                   code      CK IN {excellente, bonne, moyenne, médiocre}
  pages_manquantes          text
  support                   text
  produite_par_ia           bool  NN
  original_recuperable      bool  NN
  CK num_nonnulls(exemplaire_source_id, reproduction_parente_id) = 1         -- DI-C10
  CK reproduction_parente_id IS NULL OR reproduction_parente_id <> id
  -- lignée sans cycle : CP-09 ; DI-C11 (types IA ⇒ original récupérable) : CP-07

fichier  [T]                                       -- FICHIER
  id                    uuid  PK
  empreinte             hash  NN  UQ                          -- DI-C13
  format                text  NN
  taille                int   NN  CK taille > 0
  emplacement_stockage  text                                  -- I ; NULL après purge
  date_depot            ts    NN
  est_purge             bool  NN  default faux
  CK est_purge OR emplacement_stockage IS NOT NULL

reproduction_fichier  [A:reproduction]             -- STOCKER
  reproduction_id  uuid  NN  FK → reproduction(id)
  fichier_id       uuid  NN  FK → fichier(id)
  role             code  NN  CK IN {master, dérivé, vignette}
  ⟨VA reproduction⟩
  PK (reproduction_id, fichier_id, v_debut)
  UQ (reproduction_id) WHERE role = 'master' AND v_fin IS NULL

vue  [V]                                           -- VUE
  ⟨OBJ 'VUE'⟩
  reproduction_id  uuid  NN  FK → reproduction(id)            -- DECOMPOSER (1,1)
  rang             int   NN  CK rang >= 1
  type             code  NN  CK IN {image, piste audio, piste vidéo}
  duree            int                                        -- ms
  largeur_px       int   CK largeur_px > 0
  hauteur_px       int   CK hauteur_px > 0
  UQ (reproduction_id, rang)
  CK (type = 'image') = (largeur_px IS NOT NULL AND hauteur_px IS NOT NULL)
  CK (type = 'image') <> (duree IS NOT NULL)

vue_page  [A:vue]                                  -- MONTRER
  vue_id   uuid  NN  FK → vue(id)
  page_id  uuid  NN  FK → page(id)
  ⟨VA vue⟩
  PK (vue_id, page_id, v_debut)

zone  [V]                                          -- ZONE
  ⟨OBJ 'ZONE'⟩
  vue_id          uuid  NN  FK → vue(id)                      -- DELIMITER (1,1)
  page_id         uuid      FK → page(id)                     -- SITUER (0,1)
  type_geometrie  code  NN  CK IN {rectangle, polygone, ligne, point, plage temporelle, vue entière}
  x               int   CK x >= 0
  y               int   CK y >= 0
  largeur         int   CK largeur > 0
  hauteur         int   CK hauteur > 0
  polygone_image  text                                        -- coordonnées pixels (MLD-05)
  debut_ms        int   CK debut_ms >= 0
  fin_ms          int
  libelle         text
  CK (type_geometrie = 'rectangle') = (x IS NOT NULL AND y IS NOT NULL AND largeur IS NOT NULL AND hauteur IS NOT NULL)
  CK type_geometrie NOT IN ('polygone','ligne','point') OR polygone_image IS NOT NULL OR est_purge
  CK (type_geometrie = 'plage temporelle') = (debut_ms IS NOT NULL AND fin_ms IS NOT NULL)
  CK fin_ms IS NULL OR fin_ms > debut_ms                                     -- DI-C15
  -- contenance dans la vue (DI-C14), page montrée par la vue : CP-13

alignement_reproduction  [A:vue] †                 -- ALIGNEMENT_REPRODUCTION (propriétaire : vue cible)
  id              uuid  PK
  vue_source_id   uuid  NN  FK → vue(id)
  vue_cible_id    uuid  NN  FK → vue(id)
  transformation  text  NN
  methode         text
  statut          code  NN  CK IN {proposé, vérifié}
  v_debut         int   NN
  v_fin           int
  FK (vue_cible_id, v_debut) → version_objet(objet_id, numero)
  CK vue_source_id <> vue_cible_id
```

## 6.4 Responsabilités, citations, albums, prescriptions, sources déclarées

```text
responsabilite  [L]                                -- RESPONSABILITE (lien réifié)
  ⟨LIEN 'responsabilite'⟩
  objet_id      uuid  NN                                      -- RESPONSABILITE_SUR
  objet_type    code  NN  CK IN {DOCUMENT, EXEMPLAIRE, REPRODUCTION, ASSERTION}
  porteur_id    uuid  NN                                      -- TENUE_PAR
  porteur_type  code  NN  CK IN {PERSONNE, ORGANISATION}      -- DI-C16
  ⟨REF role⟩                                                  -- NN
  certitude     code  NN  CK IN D-19
  FK (objet_id, objet_type) → objet(id, type_objet)
  FK (porteur_id, porteur_type) → objet(id, type_objet)

citation_documentaire  [V]                         -- CITATION_DOCUMENTAIRE
  ⟨OBJ 'CITATION_DOCUMENTAIRE'⟩
  document_citant_id  uuid  NN  FK → document(id)
  document_cite_id    uuid  NN  FK → document(id)
  type                code  NN  CK IN {présenté, cité, annexé, résumé, reproduit, copie de,
                                       probablement utilisé, concordant}
  certitude           code  NN  CK IN D-19
  CK document_citant_id <> document_cite_id                                  -- DI-C17

citation_documentaire_zone  [A:citation_documentaire]   -- ancrage de CITER_DOC
  citation_documentaire_id  uuid  NN  FK → citation_documentaire(id)
  zone_id                   uuid  NN  FK → zone(id)
  ⟨VA citation_documentaire⟩
  PK (citation_documentaire_id, zone_id, v_debut)

emplacement  [V]                                   -- EMPLACEMENT
  ⟨OBJ 'EMPLACEMENT'⟩
  page_id     uuid  NN  FK → page(id)                         -- OFFRIR (1,1)
  position    text  NN*
  etat        code  NN  CK IN {occupé, vide, trace de retrait}
  type_ordre  code  NN  CK IN D-18

occupation_emplacement  [A:emplacement]            -- OCCUPER
  emplacement_id  uuid  NN  FK → emplacement(id)
  exemplaire_id   uuid  NN  FK → exemplaire(id)
  type_ordre      code  NN  CK IN D-18
  ⟨ph periode⟩
  ⟨VA emplacement⟩
  PK (emplacement_id, exemplaire_id, type_ordre, v_debut)

prescription  [V]                                  -- PRESCRIPTION
  ⟨OBJ 'PRESCRIPTION'⟩
  norme_id                 uuid  NN  FK → norme(id)           -- PRESCRIRE (1,1)
  document_attendu_id      uuid      FK → document(id)        -- PRESCRIRE (0,1)
  territoire_lieu_id       uuid      FK → lieu(id)            -- CONCERNER_TERRITOIRE †
  ⟨ph periode⟩                                                -- NN* sur periode_debut_type
  ⟨REF type_document_attendu⟩                                 -- NN

source_externe_declaree  [V]                       -- SOURCE_EXTERNE_DECLAREE
  ⟨OBJ 'SOURCE_EXTERNE_DECLAREE'⟩
  libelle_importe         text  NN*                           -- verbatim
  etat                    code  NN  CK IN {non résolue, déclarée, rapprochée, identifiée}
  acquisition_id          uuid  NN  FK → acquisition_information(id)  -- DECLARER_SOURCE †
  document_identifie_id   uuid      FK → document(id)                 -- IDENTIFIER_SOURCE †
  CK (etat = 'identifiée') = (document_identifie_id IS NOT NULL)             -- DI-C20
```

---

# 7. Domaine D — Lecture : transcription, annotation, mention, traces

```text
transcription  [V]                                 -- TRANSCRIPTION (conteneur)
  ⟨OBJ 'TRANSCRIPTION'⟩
  porteur_id               uuid  NN                           -- TRANSCRIRE
  porteur_type             code  NN  CK IN {DOCUMENT, EXEMPLAIRE}
  transcription_source_id  uuid      FK → transcription(id)   -- TRADUIRE (0,1)
  couche                   code  NN  CK IN D-20
  langue                   lang  NN
  ecriture                 script NN
  mode_lecture             code  NN  CK IN {assistée, indépendante/aveugle}
  statut                   code  NN  CK IN {en cours, achevée selon protocole, abandonnée}
  FK (porteur_id, porteur_type) → objet(id, type_objet)
  CK (couche = 'traduction') = (transcription_source_id IS NOT NULL)         -- DI-D01
  -- DI-D02 (lecture aveugle) : CP-19 ; DI-D03 : CP-13

segment  [V]                                       -- SEGMENT
  ⟨OBJ 'SEGMENT'⟩
  transcription_id     uuid  NN  FK → transcription(id)       -- SEGMENTER (1,1)
  rang                 int   NN  CK rang >= 1
  texte                text                                   -- verbatim (TI-03)
  type                 code  NN  CK IN {mot, ligne, paragraphe, marge, interligne}
  incertitude_lecture  code  NN  CK IN {certaine, probable, douteuse, illisible}
  UQ (transcription_id, rang)
  CK texte IS NOT NULL OR incertitude_lecture = 'illisible' OR est_purge     -- DI-D05

segment_zone  [A:segment]                          -- ALIGNER
  segment_id  uuid  NN  FK → segment(id)
  zone_id     uuid  NN  FK → zone(id)
  ⟨VA segment⟩
  PK (segment_id, zone_id, v_debut)

annotation  [V]                                    -- ANNOTATION
  ⟨OBJ 'ANNOTATION'⟩
  ⟨REF type⟩                                                  -- NN
  contenu                      text  NN*
  visible_publiquement         bool  NN
  ⟨dh date_trace⟩
  communaute_signalante_id     uuid  FK → communaute(id)      -- SIGNALER_CONTEXTE

annotation_ancrage  [A:annotation]                 -- ANCRER_ANNOTATION
  id             uuid  PK
  annotation_id  uuid  NN  FK → annotation(id)
  zone_id        uuid      FK → zone(id)
  segment_id     uuid      FK → segment(id)
  ⟨VA annotation⟩
  CK num_nonnulls(zone_id, segment_id) = 1
  UQ (annotation_id, zone_id, segment_id) WHERE v_fin IS NULL
  -- au moins un ancrage actif (1,n) : CP-05

mention  [V]                                       -- MENTION
  ⟨OBJ 'MENTION'⟩
  texte_exact           text                                  -- verbatim
  nature                code  NN  CK IN D-22
  categorie_pressentie  code  NN  CK IN {personne, lieu, organisation, objet, bien, événement,
                                         collectif, date, montant, autre}
  statut_resolution     code  NN  CK IN D-23  default 'non traitée'
  CK texte_exact IS NOT NULL OR nature IN ('visuelle','vocale','signature','main d''écriture')
     OR est_purge                                                            -- DI-D08
  -- DI-D07 (cohérence avec les propositions) : CP-10

mention_ancrage  [A:mention]                       -- LOCALISER_MENTION
  id          uuid  PK
  mention_id  uuid  NN  FK → mention(id)
  zone_id     uuid      FK → zone(id)
  segment_id  uuid      FK → segment(id)
  ⟨REF role_probatoire⟩
  ⟨VA mention⟩
  CK num_nonnulls(zone_id, segment_id) = 1
  -- au moins un ancrage actif (1,n) : CP-05

regroupement_traces  [V]                           -- REGROUPEMENT_TRACES
  ⟨OBJ 'REGROUPEMENT_TRACES'⟩
  type    code  NN  CK IN {individu visuel, cluster vocal, main d'écriture, signature récurrente}
  code    text  NN
  statut  code  NN  CK IN {proposé, examiné, contesté}
  -- unicité du code par espace : CP-15 ; consentement biométrique (DI-B25) : CP-13

mention_regroupement  [A:regroupement_traces]      -- REGROUPER
  regroupement_traces_id  uuid  NN  FK → regroupement_traces(id)
  mention_id              uuid  NN  FK → mention(id)
  degre                   code  NN  CK IN {proposé, probable, examiné}
  ⟨VA regroupement_traces⟩
  PK (regroupement_traces_id, mention_id, v_debut)
```

---

# 8. Domaine E — Entités historiques

## 8.1 Hiérarchie

```text
objet
 └─ entite_historique            {PERSONNE, LIEU, ORGANISATION, FONCTION, FAMILLE, COLLECTIF_HISTORIQUE,
     │                            OBJET_MATERIEL, BIEN, NORME, EVENEMENT, VOYAGE, PHENOMENE, TRADITION}
     ├─ personne    ├─ lieu        ├─ organisation   ├─ fonction    ├─ famille
     ├─ collectif_historique       ├─ objet_materiel ├─ bien        ├─ norme
     ├─ evenement  {EVENEMENT, VOYAGE}
     │   └─ voyage
     ├─ phenomene  └─ tradition
```

Une table existe pour chaque spécialisation, même sans colonne propre (`organisation`, `objet_materiel`, `phenomene`, `voyage`) : elle sert de cible typée aux clés étrangères (`financement.financeur_organisation_id → organisation`, `etape_voyage.moyen_id → objet_materiel`).

## 8.2 Tables

```text
entite_historique  [V]                             -- ENTITE_HISTORIQUE (abstraite)
  ⟨OBJ {PERSONNE, LIEU, ORGANISATION, FONCTION, FAMILLE, COLLECTIF_HISTORIQUE, OBJET_MATERIEL,
        BIEN, NORME, EVENEMENT, VOYAGE, PHENOMENE, TRADITION}⟩
  ⟨REF type_entite⟩                                           -- TYPER (1,1) ; NN ; DI-E01 : CP-08
  libelle_travail         text  NN*                           -- TI-09 ; domaine texte_libre (TI-08)
  note_individualisation  text                                -- Core partagé : NN (DD-04) : CP-13
  -- densite_documentaire : dérivée, non stockée (vue v_densite_documentaire, § 23)

personne  [V]                                      -- PERSONNE
  ⟨SOUS entite_historique 'PERSONNE'⟩
  mode_individualisation  code  NN  CK IN {nommée, prénom seul, surnom/désignation, anonyme individualisée}
  regime_protection       code  NN  CK IN {vivant attesté, raisonnablement présumé vivant,
                                           décédé attesté, statut vital inconnu}
  mineur_protege          bool  NN
  ⟨dh date_reevaluation_protection⟩
  CK NOT mineur_protege OR date_reevaluation_protection_type IS NOT NULL OR est_purge  -- DI-E07
  -- AUCUNE colonne de nom, sexe, date, lieu, profession : tout passe par assertion (RG-E01, MLD-09)

lieu  [V]                                          -- LIEU
  ⟨SOUS entite_historique 'LIEU'⟩
  ⟨REF couche_spatiale⟩                                       -- NN
  existence_actuelle  code  NN  CK IN {existe, disparu, inconnu}

organisation    [V]   ⟨SOUS entite_historique 'ORGANISATION'⟩      -- ORGANISATION
objet_materiel  [V]   ⟨SOUS entite_historique 'OBJET_MATERIEL'⟩    -- OBJET_MATERIEL
phenomene       [V]   ⟨SOUS entite_historique 'PHENOMENE'⟩         -- PHENOMENE

fonction  [V]                                      -- FONCTION
  ⟨SOUS entite_historique 'FONCTION'⟩
  intitule_generique  text  NN*

famille  [V]                                       -- FAMILLE
  ⟨SOUS entite_historique 'FAMILLE'⟩
  critere_definition  text  NN*

collectif_historique  [V]                          -- COLLECTIF_HISTORIQUE
  ⟨SOUS entite_historique 'COLLECTIF_HISTORIQUE'⟩
  ⟨REF nature⟩                                                -- NN
  ⟨val effectif_declare⟩
  ⟨dh date_observation⟩
  composition_connue  code  NN  CK IN {complète, partielle, inconnue}
  -- date_observation obligatoire si nature = foyer : CP-07 (la nature est un concept)

bien  [V]                                          -- BIEN
  ⟨SOUS entite_historique 'BIEN'⟩
  ⟨REF nature⟩                                                -- NN

norme  [V]                                         -- NORME
  ⟨SOUS entite_historique 'NORME'⟩
  ⟨REF nature⟩                                                -- NN

evenement  [V]                                     -- EVENEMENT (nature par TYPER)
  id           uuid  PK  FK → entite_historique(id)
  type_objet   code  NN  CK IN {EVENEMENT, VOYAGE}
  FK (id, type_objet) → objet(id, type_objet)
  est_purge    bool  NN
  mode_realite code  NN  CK IN D-25

voyage  [V]                                        -- VOYAGE ⊂ EVENEMENT
  ⟨SOUS evenement 'VOYAGE'⟩

etape_voyage  [V]                                  -- ETAPE_VOYAGE
  ⟨OBJ 'ETAPE_VOYAGE'⟩
  voyage_id   uuid  NN  FK → voyage(id)                       -- ETAPE (1,1)
  lieu_id     uuid      FK → lieu(id)                         -- A_LIEU
  moyen_id    uuid      FK → objet_materiel(id)               -- MOYEN
  rang        int   NN  CK rang >= 1
  ⟨dh date⟩
  statut      code  NN  CK IN {attestée, reconstruite, hypothétique}
  UQ (voyage_id, rang)
  -- DI-E08 (attestée ⇒ assertion ancrée) : CP-13

tradition  [V]                                     -- TRADITION
  ⟨SOUS entite_historique 'TRADITION'⟩
  origine_connue  code  NN  CK IN {connue, supposée, inconnue}

recit  [V]                                         -- RECIT
  ⟨OBJ 'RECIT'⟩
  evenement_id        uuid  NN  FK → evenement(id)            -- RACONTER (1,1)
  document_source_id  uuid      FK → document(id)             -- SOURCE_DU_RECIT
  point_de_vue        code  NN  CK IN {accusé, victime, témoin, police, tribunal, presse,
                                       famille, chercheur, autre}
  resume              text

recit_assertion  [A:recit]                         -- COMPOSER_RECIT
  recit_id      uuid  NN  FK → recit(id)
  assertion_id  uuid  NN  FK → assertion(id)
  rang          int   NN
  ⟨VA recit⟩
  PK (recit_id, assertion_id, v_debut)
  UQ (recit_id, rang) WHERE v_fin IS NULL
```

---

# 9. Domaine F — Identification et identité

```text
proposition_identification  [V]                    -- PROPOSITION_IDENTIFICATION
  ⟨OBJ 'PROPOSITION_IDENTIFICATION'⟩
  mention_id       uuid  FK → mention(id)                     -- IDENTIFIER
  regroupement_id  uuid  FK → regroupement_traces(id)
  entite_id        uuid  FK → entite_historique(id)           -- VERS_ENTITE
  position_id      uuid  FK → position(id)                    -- VERS_POSITION
  plausibilite     code  NN  CK IN D-19
  verdict          code  NN  CK IN {même entité, entité distincte, indéterminé}  default 'indéterminé'
  justification    text
  CK num_nonnulls(mention_id, regroupement_id) = 1                           -- DI-F01
  CK num_nonnulls(entite_id, position_id) = 1
  -- DI-F02 (unicité source/cible parmi non rejetées) : CP-15 ; DI-F03 (forte ⇒ argument) : CP-13

position  [V]                                      -- POSITION (abstraite)
  ⟨OBJ {POSITION_RELATIONNELLE, ELEMENT_RECONSTRUIT}⟩
  description  text  NN*
  rang         int   CK rang >= 1
  statut       code  NN  CK IN {ouverte, résolue, déclarée inconnue}
  -- DI-F05 (résolue ⇒ candidature retenue) : CP-10

position_relationnelle  [V]                        -- POSITION_RELATIONNELLE
  ⟨SOUS position 'POSITION_RELATIONNELLE'⟩
  nature                code  NN  CK IN {un parmi des candidats, membre non individualisé d'un collectif,
                                         position impliquée par un compte, position manquante}
  effectif_implique     int   CK effectif_implique >= 1
  reference_entite_id   uuid  FK → entite_historique(id)      -- REFERENCE
  ⟨REF relation_type⟩                                         -- RELATION_TYPE
  collectif_id          uuid  FK → collectif_historique(id)   -- MEMBRE_DE
  CK nature <> 'membre non individualisé d''un collectif' OR collectif_id IS NOT NULL

candidature  [V]                                   -- CANDIDATURE
  ⟨OBJ 'CANDIDATURE'⟩
  position_id   uuid  NN  FK → position(id)                   -- CANDIDAT_POUR
  entite_id     uuid  NN  FK → entite_historique(id)          -- CANDIDAT
  plausibilite  code  NN  CK IN D-19
  statut        code  NN  CK IN {en lice, écartée provisoirement, rejetée, retenue}
  motif         text
  UQ (position_id, entite_id)                                                -- DI-F07
  UQ (position_id) WHERE statut = 'retenue'                                  -- DI-F08
  CK statut NOT IN ('écartée provisoirement','rejetée') OR motif IS NOT NULL OR est_purge

rapprochement  [V]                                 -- RAPPROCHEMENT
  ⟨OBJ 'RAPPROCHEMENT'⟩
  entite_a_id             uuid  NN  FK → entite_historique(id)   -- RAPPROCHER (A)
  entite_b_id             uuid  NN  FK → entite_historique(id)   -- RAPPROCHER (B)
  verdict                 code  NN  CK IN {même entité, entités distinctes, indéterminé}
  presentation_fusionnee  bool  NN  default faux
  portee                  code  NN  CK IN {intra-espace, privé→Core partagé, Tree↔Tree, inter-espaces}
  justification           text  NN*
  CK entite_a_id < entite_b_id                                ‡ ordre canonique d'une paire symétrique
  CK NOT presentation_fusionnee OR verdict = 'même entité'                   -- DI-F10
  -- même spécialisation (DI-F09), validation requise pour la fusion : CP-13
  -- plusieurs rapprochements successifs d'une même paire coexistent (historique des verdicts)

selection_contexte  [V]                            -- SELECTION_CONTEXTE (ex-CHOIX_AFFICHAGE)
  ⟨OBJ 'SELECTION_CONTEXTE'⟩
  espace_contexte_id  uuid  NN  FK → espace(id)                -- SELECTIONNER †
  entite_id           uuid  NN  FK → entite_historique(id)
  assertion_id        uuid  NN  FK → assertion(id)
  predicat_id         uuid  NN  FK → concept(id)              ‡ copie du prédicat de l'assertion
  usage               code  NN  CK IN {affichage, export, calcul, publication, arbre}
  motif               text
  UQ (espace_contexte_id, entite_id, usage, predicat_id)                     -- DI-F14
  -- sujet de l'assertion = entité, prédicat copié conforme (DI-F13) : CP-07

position_epistemique  [V]                          -- POSITION_EPISTEMIQUE
  ⟨OBJ 'POSITION_EPISTEMIQUE'⟩
  contexte_espace_id       uuid  FK → espace(id)               -- ADOPTER †
  contexte_publication_id  uuid  FK → publication(id)
  objet_vise_id            uuid  NN  FK → objet(id)            -- PORTER_SUR_PROPOSITION †
  position                 code  NN  CK IN {adoptée, rejetée, indéterminée, contestée, à réexaminer}
  justification            text  NN*
  date                     ts    NN
  CK num_nonnulls(contexte_espace_id, contexte_publication_id) = 1
  UQ (coalesce(contexte_espace_id, contexte_publication_id), objet_vise_id)  -- DI-F16
```

---

# 10. Domaine G — Assertions, valeurs et interprétations (MLD-09)

## 10.1 Schéma des assertions

```text
assertion  [V]                                     -- ASSERTION ; profils ASSERTION_ATTRIBUT, PARTICIPATION, EXISTENCE_DOCUMENTAIRE sans extension
  ⟨OBJ 'ASSERTION'⟩
  profil                 code  NN  CK IN {attribut, relation, participation, présence,
                                          situation, existence documentaire}
  predicat_id            uuid  NN  FK → concept(id)            -- PREDICAT (1,1)
  sujet_id               uuid  NN                              -- SUJET (1,1)
  sujet_type             code  NN  CK IN {PERSONNE, LIEU, ORGANISATION, FONCTION, FAMILLE,
                                          COLLECTIF_HISTORIQUE, OBJET_MATERIEL, BIEN, NORME,
                                          EVENEMENT, VOYAGE, PHENOMENE, TRADITION, DOCUMENT,
                                          POSITION_RELATIONNELLE, ELEMENT_RECONSTRUIT}
  cible_id               uuid                                  -- CIBLE (0,1)
  cible_type             code      CK IN (types d'entité historique)
  role_id                uuid      FK → concept(id)            -- ROLE (0,1)
  lieu_id                uuid      FK → lieu(id)               -- LIEU_DE (0,1)
  assertion_parente_id   uuid      FK → assertion(id)          -- SOUS_ASSERTION (0,1)
  rang_composante        int
  libelle_source         text                                  -- verbatim
  niveau                 code  NN  CK IN {attestée, normalisée, interprétée}
  nature                 code  NN  CK IN {attestée, dérivée, synthétique, choisie pour affichage}
  modalite               code  NN  CK IN D-30
  polarite               code  NN  CK IN {positive, négative}  default 'positive'
  plausibilite           code  NN  CK IN D-19
  ⟨dh temps⟩                                                   -- temps historique
  ⟨val valeur⟩
  etat_provenance        code  NN  CK IN D-14
  calcul_id              uuid      FK → calcul(id)             -- DERIVER (0,1)
  FK (sujet_id, sujet_type) → objet(id, type_objet)
  FK (cible_id, cible_type) → objet(id, type_objet)
  CK (cible_id IS NULL) = (cible_type IS NULL)
  CK (nature = 'dérivée') = (calcul_id IS NOT NULL)                          -- DI-G03
  CK niveau <> 'attestée' OR libelle_source IS NOT NULL OR est_purge         -- DI-G06
  CK assertion_parente_id IS NULL OR assertion_parente_id <> id
  CK valeur_type IS NULL OR valeur_orig IS NOT NULL OR est_purge
  -- signature du prédicat (sujet, cible, valeur, profil) : CP-07 (OB-13)
  -- nature attestée ⇒ ancrage, fondement, réponse ou source externe (DI-G02) : CP-05
  -- polarité négative ⇒ source (DI-G05) ; déclaré par un tiers ⇒ responsabilité (DI-G04) : CP-13
```

**Profils avec attributs propres** (tables d'extension 1:1) :

```text
assertion_relation  [V]                            -- profil RELATION
  assertion_id  uuid  PK  FK → assertion(id)
  ⟨REF famille_relation⟩                                       -- NN
  ⟨REF modele_parente⟩
  ⟨REF referentiel_spatial⟩
  statut_causal  code  CK IN {attestée par la source, proposée par un chercheur}
  -- modèle de parenté obligatoire pour une parenté, statut causal pour une causalité : CP-07

assertion_presence  [V]                            -- profil PRESENCE
  assertion_id   uuid  PK  FK → assertion(id)
  type_presence  code  NN  CK IN {présence attestée, déplacement attesté, trajet reconstruit}

assertion_situation  [V]                           -- profil SITUATION
  assertion_id  uuid  PK  FK → assertion(id)
  ⟨dh debut⟩
  ⟨dh fin⟩
  continuite    code  NN  CK IN {points attestés seulement, continuité hypothétique, continuité attestée}
  ⟨REF type_droit⟩                                             -- si la cible est un BIEN (DROIT_SUR)
  CK debut_min IS NULL OR fin_max IS NULL OR debut_min <= fin_max
```

`CP-07` garantit qu'une assertion de profil `relation` a exactement une ligne `assertion_relation` (et réciproquement), et de même pour `présence` et `situation`. Les profils `attribut`, `participation` et `existence documentaire` n'ont pas de table d'extension. L'association `DROIT_SUR` du MCD est la **cible** d'une situation dont le prédicat est `detient_droit_sur` (cible de type `BIEN`) ; elle ne demande pas de table propre.

**Ancrages et fondements** (propriétaire : l'assertion) :

```text
assertion_zone  [A:assertion]                      -- ANCRER
  assertion_id  uuid  NN  FK → assertion(id)
  zone_id       uuid  NN  FK → zone(id)
  ⟨REF role_probatoire⟩                                        -- NN
  rang          int
  ⟨VA assertion⟩
  PK (assertion_id, zone_id, v_debut)

assertion_mention  [A:assertion]                   -- FONDER
  assertion_id  uuid  NN  FK → assertion(id)
  mention_id    uuid  NN  FK → mention(id)
  ⟨REF role_probatoire⟩                                        -- NN
  ⟨VA assertion⟩
  PK (assertion_id, mention_id, v_debut)

assertion_reponse  [A:assertion]                   -- ISSUE_DE
  assertion_id  uuid  NN  FK → assertion(id)
  reponse_id    uuid  NN  FK → reponse(id)
  ⟨VA assertion⟩
  PK (assertion_id, reponse_id, v_debut)

assertion_source_externe  [A:assertion]            -- SOURCER_EXT †
  assertion_id               uuid  NN  FK → assertion(id)
  source_externe_declaree_id uuid  NN  FK → source_externe_declaree(id)
  ⟨VA assertion⟩
  PK (assertion_id, source_externe_declaree_id, v_debut)
```

**Pourquoi ce n'est pas un EAV.** Un modèle entité–attribut–valeur stocke n'importe quelle chaîne comme « attribut » et n'importe quelle valeur sans type. Ici : le prédicat est un `concept` gouverné et versionné, porteur d'une signature (`concept_predicat`) ; la valeur est un groupe typé avec unité et monnaie ; la cible est une clé étrangère typée ; les profils ont leurs colonnes ; la conformité est vérifiée à l'écriture (CP-07). Les requêtes fréquentes (« toutes les assertions de naissance de cette personne ») sont des accès par `(sujet_id, predicat_id)`, indexables au MPD.

## 10.2 Expressions, interprétations, lacunes, erreurs, transmissions

```text
expression_assertion  [V]                          -- EXPRESSION_ASSERTION
  ⟨OBJ 'EXPRESSION_ASSERTION'⟩
  assertion_id            uuid  NN  FK → assertion(id)         -- EXPRIMER_ASSERTION †
  expression_source_id    uuid      FK → expression_assertion(id) -- TRADUIRE_EXPRESSION †
  texte                   text  NN*
  langue                  lang  NN
  nature                  code  NN  CK IN {formulation source, transcription normalisée,
                                           traduction, reformulation}
  CK (nature = 'traduction') = (expression_source_id IS NOT NULL)

expression_segment  [A:expression_assertion]       -- EXTRAITE_DE †
  expression_assertion_id  uuid  NN  FK → expression_assertion(id)
  segment_id               uuid  NN  FK → segment(id)
  ⟨VA expression_assertion⟩
  PK (expression_assertion_id, segment_id, v_debut)
  -- formulation source ⇒ au moins un segment (DI-G11) : CP-05

interpretation  [V]                                -- INTERPRETATION (table unique, MLD-01)
  ⟨OBJ {HYPOTHESE, CONCLUSION, PHASE_TRAJECTOIRE, SYNTHESE, NARRATION, ESTIMATION}⟩
  enonce              text  NN*
  raisonnement        text
  certitude           code  NN  CK IN D-19
  questions_ouvertes  text
  etat_provenance     code  NN  CK IN D-14
  titre               text                                    -- PHASE_TRAJECTOIRE
  ⟨ph periode⟩                                                -- PHASE_TRAJECTOIRE
  mode                code  CK IN {manuelle, proposée}        -- PHASE_TRAJECTOIRE
  portee              code  CK IN {documentaire stricte, projet, communautaire, Tree, chercheur}  -- SYNTHESE
  regle_construction  text                                    -- SYNTHESE
  texte               text                                    -- NARRATION
  generee_par_ia      bool                                    -- NARRATION
  CK type_objet NOT IN ('HYPOTHESE','CONCLUSION','ESTIMATION') OR raisonnement IS NOT NULL OR est_purge
  CK (type_objet = 'PHASE_TRAJECTOIRE') = (mode IS NOT NULL)
  CK type_objet <> 'PHASE_TRAJECTOIRE' OR ((titre IS NOT NULL AND periode_debut_type IS NOT NULL) OR est_purge)
  CK (type_objet = 'SYNTHESE') = (portee IS NOT NULL)
  CK type_objet <> 'SYNTHESE' OR regle_construction IS NOT NULL OR est_purge
  CK (type_objet = 'NARRATION') = (generee_par_ia IS NOT NULL)
  CK type_objet <> 'NARRATION' OR texte IS NOT NULL OR est_purge
  CK type_objet = 'PHASE_TRAJECTOIRE' OR (titre IS NULL AND periode_debut_type IS NULL)
  CK type_objet = 'SYNTHESE' OR regle_construction IS NULL
  CK type_objet = 'NARRATION' OR texte IS NULL
  -- conclusion partagée ⇒ base justificative (DI-G12) : CP-13 ; narration jamais preuve (DI-G13) : CP-07

interpretation_appui  [A:interpretation]           -- S_APPUYER
  interpretation_id  uuid  NN  FK → interpretation(id)
  objet_id           uuid  NN  FK → objet(id)
  sens               code  NN  CK IN {appui, contre, contexte}
  ⟨VA interpretation⟩
  PK (interpretation_id, objet_id, v_debut)
  -- doublé d'une dépendance de production (DD) : CP-18

interpretation_entite  [A:interpretation]          -- PORTER_SUR
  interpretation_id  uuid  NN  FK → interpretation(id)
  entite_id          uuid  NN  FK → entite_historique(id)
  ⟨VA interpretation⟩
  PK (interpretation_id, entite_id, v_debut)

interpretation_question  [A:interpretation]        -- REPONDRE
  interpretation_id  uuid  NN  FK → interpretation(id)
  question_id        uuid  NN  FK → question(id)
  ⟨VA interpretation⟩
  PK (interpretation_id, question_id, v_debut)

lacune  [V]                                        -- LACUNE
  ⟨OBJ 'LACUNE'⟩
  objet_concerne_id  uuid  NN  FK → objet(id)                 -- QUALIFIER_VIDE
  type_vide          code  NN  CK IN D-31
  ⟨REF dimension⟩
  perimetre          text
  CK type_vide NOT IN ('recherche partielle','recherche exhaustive sans résultat') OR perimetre IS NOT NULL OR est_purge
  -- DI-G16 : CP-05

lacune_recherche  [A:lacune]                       -- JUSTIFIER (lacune)
  lacune_id             uuid  NN  FK → lacune(id)
  recherche_effectuee_id uuid NN  FK → recherche_effectuee(id)
  ⟨VA lacune⟩
  PK (lacune_id, recherche_effectuee_id, v_debut)

erreur_propagee  [V]                               -- ERREUR_PROPAGEE
  ⟨OBJ 'ERREUR_PROPAGEE'⟩
  origine_objet_id  uuid  FK → objet(id)                      -- ORIGINE (0,1)
  description       text  NN*
  etat              code  NN  CK IN {suspectée, établie, corrigée}

erreur_reprise  [A:erreur_propagee]                -- REPRENDRE
  erreur_propagee_id  uuid  NN  FK → erreur_propagee(id)
  objet_id            uuid  NN  FK → objet(id)
  transformation      text
  ⟨VA erreur_propagee⟩
  PK (erreur_propagee_id, objet_id, v_debut)

transmission  [V]                                  -- TRANSMISSION (lignée informationnelle)
  ⟨OBJ 'TRANSMISSION'⟩
  contenu_objet_id  uuid  NN  FK → objet(id)                  -- CONTENU
  emetteur_id       uuid      FK → entite_historique(id)      -- EMETTEUR
  recepteur_id      uuid      FK → entite_historique(id)      -- RECEPTEUR
  niveau            code  NN  CK IN D-32
  mode              code  NN  CK IN {oral, manuscrit, imprimé, image, numérique, autre}
  ⟨dh date⟩
  CK emetteur_id IS NULL OR recepteur_id IS NULL OR emetteur_id <> recepteur_id
```

---

# 11. Domaine H — Validation, débat, crédit, réputation

```text
acte_evaluation  [F]                               -- ACTE_EVALUATION (jamais modifié)
  ⟨OBJ 'ACTE_EVALUATION'⟩
  acteur_id              uuid  NN  FK → acteur_geniius(id)    -- EVALUER
  objet_evalue_id        uuid  NN                             -- PORTER_SUR_VERSION
  objet_evalue_numero    int   NN
  type                   code  NN  CK IN D-33
  date                   ts    NN
  justification          text
  processus_applicable   text  NN
  independance           code  NN  CK IN {indépendance déclarée, lien connu, inconnue}  -- CP-10
  role_au_moment         code  NN
  FK (objet_evalue_id, objet_evalue_numero) → version_objet(objet_id, numero)
  CK type NOT IN ('contestation','demande de réexamen') OR justification IS NOT NULL OR est_purge  -- DI-H03
  -- DI-H01 (validateur vérifié sur le Core) : CP-06

argument  [V]                                      -- ARGUMENT
  ⟨OBJ 'ARGUMENT'⟩
  objet_vise_id  uuid  NN  FK → objet(id)                     -- ARGUMENTER
  sens           code  NN  CK IN {pour, contre, contexte}
  nature         code  NN  CK IN {critère compatible, critère incompatible, indice,
                                  preuve discriminante, méthodologique}
  enonce         text  NN*

argument_preuve  [A:argument]                      -- ETAYER
  argument_id  uuid  NN  FK → argument(id)
  objet_id     uuid  NN
  objet_type   code  NN  CK objet_type NOT IN ('BADGE','LIEN_EXPLORATOIRE','NARRATION')  -- DI-H05, DI-A16
  ⟨VA argument⟩
  PK (argument_id, objet_id, v_debut)
  FK (objet_id, objet_type) → objet(id, type_objet)

argument_acte  [N]                                 -- INVOQUER
  argument_id         uuid  NN  FK → argument(id)
  acte_evaluation_id  uuid  NN  FK → acte_evaluation(id)
  PK (argument_id, acte_evaluation_id)

proposition_modification  [V]                      -- PROPOSITION_MODIFICATION
  ⟨OBJ 'PROPOSITION_MODIFICATION'⟩
  proposant_acteur_id  uuid  NN  FK → acteur_geniius(id)    -- PROPOSER
  decideur_acteur_id   uuid      FK → acteur_geniius(id)
  cible_id             uuid  NN
  cible_numero         int   NN                               -- CIBLER_VERSION
  contenu_propose      text  NN*
  justification        text  NN*
  statut               code  NN  CK IN {soumise, en discussion, acceptée, refusée, retirée}
  FK (cible_id, cible_numero) → version_objet(objet_id, numero)
  CK statut NOT IN ('acceptée','refusée') OR decideur_acteur_id IS NOT NULL

conflit_edition  [V]                               -- CONFLIT_EDITION
  ⟨OBJ 'CONFLIT_EDITION'⟩
  base_id      uuid  NN                                    -- BASE
  base_numero  int   NN
  etat         code  NN  CK IN {ouvert, résolu par choix, résolu par fusion compatible,
                                indétermination conservée}
  FK (base_id, base_numero) → version_objet(objet_id, numero)

conflit_proposition  [N]                           -- OPPOSER
  conflit_edition_id           uuid  NN  FK → conflit_edition(id)
  proposition_modification_id  uuid  NN  UQ  FK → proposition_modification(id)   -- (0,1)
  PK (conflit_edition_id, proposition_modification_id)
  -- au moins deux propositions (DI-H08) : CP-05

discussion  [V]                                    -- DISCUSSION
  ⟨OBJ 'DISCUSSION'⟩
  objet_rattache_id  uuid  FK → objet(id)                     -- RATTACHER_DISCUSSION
  titre              text  NN*
  statut             code  NN  CK IN {ouverte, close, archivée}

message  [N]                                       -- MESSAGE
  id                uuid  PK
  discussion_id     uuid  NN  FK → discussion(id)          -- CONTENIR_MESSAGE
  auteur_acteur_id  uuid  NN  FK → acteur_geniius(id)
  date              ts    NN
  texte             text                                      -- NULL après purge
  masque            bool  NN  default faux                    ‡ effet d'une modération
  est_purge         bool  NN  default faux

acte_moderation  [N]                               -- ACTE_MODERATION
  id                    uuid  PK
  moderateur_acteur_id  uuid  NN  FK → acteur_geniius(id)  -- MODERER
  cible_objet_id        uuid      FK → objet(id)
  cible_acteur_id       uuid      FK → acteur_geniius(id)
  cible_message_id      uuid      FK → message(id)            ‡
  type                  code  NN  CK IN {masquage, avertissement, suspension, rétablissement}
  motif                 text  NN
  date                  ts    NN
  recours               text
  CK num_nonnulls(cible_objet_id, cible_acteur_id, cible_message_id) = 1
  -- RG-H05 : aucune clé étrangère vers acte_evaluation ni argument

credit  [L]                                        -- CREDITER (lien réifié)
  ⟨LIEN 'credit'⟩
  objet_id     uuid  NN  FK → objet(id)
  acteur_id    uuid      FK → acteur_geniius(id)
  personne_id  uuid      FK → personne(id)
  role_credit  code  NN  CK IN D-34
  CK num_nonnulls(acteur_id, personne_id) = 1
  -- unicité (objet, bénéficiaire, rôle) parmi les liens actifs : CP-15

domaine_expertise  [T]                             -- DOMAINE_EXPERTISE
  id              uuid  PK
  ⟨REF theme⟩                                                 -- NN
  ⟨ph periode⟩
  territoire      text
  langue          lang
  ⟨REF type_source⟩

badge  [V]                                         -- BADGE
  ⟨OBJ 'BADGE'⟩
  acteur_id             uuid  NN  FK → acteur_geniius(id)     -- OBTENIR
  domaine_id            uuid      FK → domaine_expertise(id)
  famille               code  NN  CK IN {expérience constatée, qualification attribuée}
  libelle               text  NN
  critere_ou_procedure  text  NN
  date_attribution      ts    NN
  date_revocation       ts

declaration_profil  [V]                            -- DECLARATION_PROFIL
  ⟨OBJ 'DECLARATION_PROFIL'⟩
  acteur_id                uuid  NN  FK → acteur_geniius(id)  -- DECLARER_PROFIL
  domaine_id               uuid      FK → domaine_expertise(id)
  type                     code  NN  CK IN {intérêt, compétence}
  disponible_sollicitation bool  NN  default faux
  -- l'attribut « visibilite » du dictionnaire est objet.visibilite (pas de doublon)

demande  [V]                                       -- DEMANDE
  ⟨OBJ 'DEMANDE'⟩
  emetteur_acteur_id      uuid  NN  FK → acteur_geniius(id)   -- EMETTRE
  destinataire_acteur_id  uuid  NN  FK → acteur_geniius(id)   -- RECEVOIR
  objet_concerne_id       uuid      FK → objet(id)
  categorie               code  NN  CK IN {source, vérification, photo-identification, avis,
                                           mission d'archives, collaboration}
  message                 text  NN*
  identite_revelee        bool  NN  default faux
  statut                  code  NN  CK IN {envoyée, acceptée, refusée, close}
  CK emetteur_acteur_id <> destinataire_acteur_id
  -- DI-H10 (catégorie acceptée, pas de blocage) : CP-06
```

---

# 12. Domaine I — Reconstruction et cohérence documentaire

```text
reconstruction  [V]                                -- RECONSTRUCTION (conteneur)
  ⟨OBJ 'RECONSTRUCTION'⟩
  document_id  uuid  NN  FK → document(id)                    -- RECONSTRUIRE (1,1) ; DI-I01 : CP-13
  titre        text  NN*
  methode      text  NN*
  statut       code  NN  CK IN {proposée, en discussion, validée, abandonnée}

reconstruction_concurrence  [N]                    -- CONCURRENCER
  reconstruction_a_id  uuid  NN  FK → reconstruction(id)
  reconstruction_b_id  uuid  NN  FK → reconstruction(id)
  PK (reconstruction_a_id, reconstruction_b_id)
  CK reconstruction_a_id < reconstruction_b_id                ‡ paire symétrique ordonnée
  -- même document cible : CP-13

element_reconstruit  [V]                           -- ELEMENT_RECONSTRUIT ⊂ POSITION
  ⟨SOUS position 'ELEMENT_RECONSTRUIT'⟩
  reconstruction_id   uuid  NN  FK → reconstruction(id)       -- STRUCTURER (1,1)
  parent_element_id   uuid      FK → element_reconstruit(id)  -- CONTENIR_ELEMENT (0,1)
  niveau              code  NN  CK IN {volume, section, colonne, page, entrée}
  numero              text
  statut_contenu      code  NN  CK IN {attesté par une trace, reconstruit (hypothèse), inconnu}
  UQ (reconstruction_id, coalesce(parent_element_id, '00000000-0000-0000-0000-000000000000'), niveau, numero)
     WHERE numero IS NOT NULL                                 -- DI-I06 (la constante est technique)
  CK parent_element_id IS NULL OR parent_element_id <> id
  -- DI-I03 (attesté ⇒ appui), parent dans la même reconstruction, absence de cycle : CP-05, CP-09

element_appui  [A:element_reconstruit]             -- APPUYER
  element_reconstruit_id  uuid  NN  FK → element_reconstruit(id)
  mention_id              uuid  NN  FK → mention(id)
  apport                  code  NN  CK IN {cite le numéro, cite le nom, cite la parenté, cite une information}
  ⟨REF role_probatoire⟩                                       -- NN
  ⟨VA element_reconstruit⟩
  PK (element_reconstruit_id, mention_id, v_debut)
  -- crée la dépendance de production correspondante (DI-I05) : CP-18

anomalie_documentaire  [V]                         -- ANOMALIE_DOCUMENTAIRE
  ⟨OBJ 'ANOMALIE_DOCUMENTAIRE'⟩
  porteur_id    uuid  NN                                      -- PRESENTER
  porteur_type  code  NN  CK IN {UNITE_ARCHIVISTIQUE, DOCUMENT}
  type          code  NN  CK IN D-35
  description   text  NN*
  detectee_par  code  NN  CK IN {moteur de règles, humain}
  statut        code  NN  CK IN {signalée, en examen, expliquée, sans explication}
  FK (porteur_id, porteur_type) → objet(id, type_objet)

anomalie_explication  [A:anomalie_documentaire]    -- EXPLIQUER
  anomalie_documentaire_id  uuid  NN  FK → anomalie_documentaire(id)
  interpretation_id         uuid  NN  FK → interpretation(id)
  ⟨VA anomalie_documentaire⟩
  PK (anomalie_documentaire_id, interpretation_id, v_debut)
```

---

# 13. Domaine J — Journal (mémoire)

```text
session_memoire  [V]                               -- SESSION_MEMOIRE
  ⟨OBJ 'SESSION_MEMOIRE'⟩
  type                   code  NN  CK IN {auto-mémoire, entretien d'un tiers, discussion collective,
                                          capture libre, réponse de campagne}
  ⟨dh date⟩                                                   -- NN* sur date_type
  lieu_texte             text                                 -- R
  lieu_id                uuid      FK → lieu(id)
  mode                   code  NN  CK IN {présentiel, téléphone, visio, écrit, audio seul}
  contexte               text                                 -- R
  statut_temoin          code  NN  CK IN {personne concernée, témoin direct, témoin indirect, inconnu}
  document_produit_id    uuid  UQ  FK → document(id)          -- PRODUIRE_DOC (0,1)
  campagne_id            uuid      FK → campagne_memoire(id)  -- DANS_CAMPAGNE
  interviewer_acteur_id  uuid      FK → acteur_geniius(id)    -- INTERVIEWER
  -- au moins un témoin (DI-J01) : CP-05 ; consentement (DI-J02) : CP-13

session_temoin  [A:session_memoire]                -- TEMOIN (1,n)
  session_memoire_id  uuid  NN  FK → session_memoire(id)
  personne_id         uuid  NN  FK → personne(id)
  ⟨VA session_memoire⟩
  PK (session_memoire_id, personne_id, v_debut)

session_present  [A:session_memoire]               -- PRESENT
  session_memoire_id  uuid  NN  FK → session_memoire(id)
  personne_id         uuid  NN  FK → personne(id)
  role                code  NN  CK IN {présent, intervenant, traducteur}
  ⟨VA session_memoire⟩
  PK (session_memoire_id, personne_id, v_debut)

echange  [V]                                       -- ECHANGE
  ⟨OBJ 'ECHANGE'⟩
  session_memoire_id    uuid  NN  FK → session_memoire(id)    -- DEROULER (1,1)
  question_id           uuid      FK → question(id)           -- POSER_QUESTION (0,1)
  rang                  int   NN  CK rang >= 1
  question_texte_exact  text                                  -- verbatim
  caractere_question    code  NN  CK IN {ouverte, fermée, suggestive, inconnu}
  UQ (session_memoire_id, rang)                                              -- DI-J05
  CK question_texte_exact IS NOT NULL OR caractere_question = 'inconnu' OR est_purge  -- DI-J04

echange_zone  [A:echange]                          -- MINUTE
  echange_id  uuid  NN  FK → echange(id)
  zone_id     uuid  NN  FK → zone(id)
  ⟨VA echange⟩
  PK (echange_id, zone_id, v_debut)

reponse  [V]                                       -- REPONSE ; R
  ⟨OBJ 'REPONSE'⟩
  echange_id          uuid  NN  FK → echange(id)              -- OBTENIR (1,1)
  phase               code  NN  CK IN {spontanée, après indice}
  texte               text                                    -- verbatim
  etat_memoire        code  NN  CK IN D-36
  mode_connaissance   code  NN  CK IN D-37  default 'inconnu'
  reponse_revisee_id  uuid  UQ  FK → reponse(id)              -- REVISER (0,1)
  nature_revision     code      CK IN {nouvelle déclaration, précision, rétractation}
  CK (reponse_revisee_id IS NULL) = (nature_revision IS NULL)
  CK reponse_revisee_id IS NULL OR reponse_revisee_id <> id
  CK texte IS NOT NULL OR etat_memoire IN ('jamais su','savait mais a oublié','refuse','non demandé',
     'exclu volontairement') OR est_purge                                     -- DI-J08
  -- après indice ⇒ indice antérieur dans le même échange (DI-J06) : CP-13

indice  [V]                                        -- INDICE
  ⟨OBJ 'INDICE'⟩
  echange_id       uuid  NN  FK → echange(id)                 -- MONTRER_INDICE (1,1)
  objet_montre_id  uuid      FK → objet(id)
  type             code  NN  CK IN {nom, photo, arbre, hypothèse, document, autre}
  type_precision   text
  description      text  NN*
  moment           int   CK moment >= 0
  CK (type = 'autre') = (type_precision IS NOT NULL)

relance  [V]                                       -- RELANCE
  ⟨OBJ 'RELANCE'⟩
  reponse_id        uuid  NN  FK → reponse(id)                -- REPROPOSER (1,1)
  ⟨dh date_prevue⟩                                            -- NN* sur date_prevue_type
  note_delicatesse  text
  statut            code  NN  CK IN {prévue, faite, abandonnée}

campagne_memoire  [V]                              -- CAMPAGNE_MEMOIRE
  ⟨OBJ 'CAMPAGNE_MEMOIRE'⟩
  titre  text  NN*
  phase  code  NN  CK IN {réponses indépendantes, confrontation collective, close}
  ⟨ph periode⟩
  -- irréversibilité de la confrontation (DI-J10) : CP-03 ; cloisonnement (DI-J09) : § 22

campagne_personne  [A:campagne_memoire]            -- INTERROGER
  campagne_memoire_id  uuid  NN  FK → campagne_memoire(id)
  personne_id          uuid  NN  FK → personne(id)
  statut               code  NN  CK IN {invitée, a répondu, a décliné}
  ⟨VA campagne_memoire⟩
  PK (campagne_memoire_id, personne_id, v_debut)

campagne_question  [A:campagne_memoire]            -- POSER
  campagne_memoire_id  uuid  NN  FK → campagne_memoire(id)
  question_id          uuid  NN  FK → question(id)
  portee               code  NN  CK IN {commune, personnalisée}
  ⟨VA campagne_memoire⟩
  PK (campagne_memoire_id, question_id, v_debut)

capsule  [V]                                       -- CAPSULE ; R
  ⟨OBJ 'CAPSULE'⟩
  auteur_acteur_id          uuid  NN  FK → acteur_geniius(id) -- CREER_CAPSULE
  destinataire_personne_id  uuid      FK → personne(id)
  destinataire_acteur_id    uuid      FK → acteur_geniius(id)
  destinataire_description  text
  titre                     text  NN*
  condition_type            code  NN  CK IN {date, âge du destinataire, décès de l'auteur, autre}
  condition_valeur          text  NN*
  etat                      code  NN  CK IN {scellée, délivrable, délivrée, annulée}
  CK num_nonnulls(destinataire_personne_id, destinataire_acteur_id, destinataire_description) >= 1
     OR est_purge                                                             -- DI-J11
  CK destinataire_personne_id IS NULL OR destinataire_acteur_id IS NULL

capsule_contenu  [A:capsule]                       -- CONTENIR_CAPSULE (1,n)
  capsule_id  uuid  NN  FK → capsule(id)
  objet_id    uuid  NN  FK → objet(id)
  ⟨VA capsule⟩
  PK (capsule_id, objet_id, v_debut)
```

---

# 14. Domaine K — Echo (recherche)

## 14.1 Projets, questions, pistes, recherches

```text
projet  [V]                                        -- PROJET ⊂ ESPACE
  ⟨SOUS espace 'PROJET'⟩
  intitule       text  NN*
  objet_focal    text  NN*
  perimetre      text
  etat_cycle     code  NN  CK IN D-38
  ⟨dh date_cloture⟩
  CK etat_cycle <> 'clôturé dans son périmètre' OR date_cloture_type IS NOT NULL   -- DI-K01

relation_projets  [A:projet]                       -- RELIER_PROJETS (propriétaire : projet A)
  projet_id         uuid  NN  FK → projet(id)
  projet_lie_id     uuid  NN  FK → projet(id)
  type              code  NN  CK IN {issu de, prolonge, complète, réexamine, conteste,
                                     réutilise le corpus de, sous-projet de, succède à}
  v_debut           int   NN
  v_fin             int
  PK (projet_id, projet_lie_id, type, v_debut)
  FK (projet_id, v_debut) → version_objet(objet_id, numero)
  CK projet_id <> projet_lie_id
  -- « sous-projet de » sans cycle : CP-09

question  [V]                                      -- QUESTION (Journal et Echo)
  ⟨OBJ 'QUESTION'⟩
  question_parente_id  uuid      FK → question(id)            -- SOUS_QUESTION
  libelle              text  NN*
  portee               code  NN  CK IN {recherche, mémoire}
  etat                 code  NN  CK IN D-39
  recherchabilite      code  NN  CK IN D-40
  motif_reouverture    text
  CK question_parente_id IS NULL OR question_parente_id <> id
  CK etat <> 'à réexaminer' OR motif_reouverture IS NOT NULL OR est_purge    -- DI-K04
  -- DI-K03 (protocole accompli), DI-K05, cycle : CP-13, CP-09

question_objet  [A:question]                       -- CONCERNER
  question_id  uuid  NN  FK → question(id)
  objet_id     uuid  NN  FK → objet(id)
  ⟨VA question⟩
  PK (question_id, objet_id, v_debut)

piste  [V]                                         -- PISTE
  ⟨OBJ 'PISTE'⟩
  question_id               uuid  NN  FK → question(id)       -- EXPLORER (1,1)
  origine_recherche_id      uuid      FK → recherche_effectuee(id)
  origine_anomalie_id       uuid      FK → anomalie_documentaire(id)  -- OUVRIR
  description               text  NN*
  statut                    code  NN  CK IN {à explorer, en cours, réussie, suspendue, réfutée, bloquée}
  priorite                  code      CK IN {haute, moyenne, basse}
  justification_priorite    text
  source_suggeree           text
  CK num_nonnulls(origine_recherche_id, origine_anomalie_id) <= 1
  CK priorite IS NULL OR justification_priorite IS NOT NULL OR est_purge     -- DI-K08

piste_cible  [A:piste]                             -- CIBLER
  piste_id    uuid  NN  FK → piste(id)
  objet_id    uuid  NN
  objet_type  code  NN  CK IN {UNITE_ARCHIVISTIQUE, ORGANISATION, CONCEPT}
  ⟨VA piste⟩
  PK (piste_id, objet_id, v_debut)
  FK (objet_id, objet_type) → objet(id, type_objet)

recherche_effectuee  [V]                           -- RECHERCHE_EFFECTUEE
  ⟨OBJ 'RECHERCHE_EFFECTUEE'⟩
  acteur_id            uuid  NN  FK → acteur_geniius(id)      -- CHERCHER
  question_id          uuid      FK → question(id)            -- INSTRUIRE
  piste_id             uuid      FK → piste(id)               -- SUIVRE
  item_mission_id      uuid      FK → item_mission(id)        -- REALISER_ITEM
  ⟨dh date⟩                                                   -- NN* sur date_type
  objectif             text  NN*
  termes_et_variantes  text
  niveau_consultation  code  NN  CK IN D-41
  couverture           text  NN*
  resultat             code  NN  CK IN {positif, négatif, partiel, non concluant}
  limites              text
  -- au moins un périmètre (DI-K09) : CP-05 ; DI-K10 : CP-13 ; DI-K11 : application

recherche_perimetre  [A:recherche_effectuee]       -- PERIMETRE (1,n)
  recherche_effectuee_id     uuid  NN  FK → recherche_effectuee(id)
  objet_id                   uuid  NN
  objet_type                 code  NN  CK IN {UNITE_ARCHIVISTIQUE, EXEMPLAIRE, REPRODUCTION, CORPUS, DOCUMENT}
  pages_ou_annees_couvertes  text
  ⟨VA recherche_effectuee⟩
  PK (recherche_effectuee_id, objet_id, v_debut)
  FK (objet_id, objet_type) → objet(id, type_objet)
```

## 14.2 Missions, offres, contacts

```text
mission  [V]                                       -- MISSION
  ⟨OBJ 'MISSION'⟩
  projet_id               uuid      FK → projet(id)           -- ORGANISER
  centre_organisation_id  uuid  NN  FK → organisation(id)     -- CENTRE
  objectifs               text  NN*
  ⟨dh date_prevue⟩
  ⟨ph dates_effectives⟩
  statut                  code  NN  CK IN {préparée, en cours, réalisée, annulée}
  ⟨val cout⟩
  contraintes             text
  compte_rendu            text

item_mission  [V]                                  -- ITEM_MISSION
  ⟨OBJ 'ITEM_MISSION'⟩
  mission_id       uuid  NN  FK → mission(id)                 -- PLANIFIER_ITEM
  unite_id         uuid      FK → unite_archivistique(id)
  question_id      uuid      FK → question(id)
  reproduction_id  uuid      FK → reproduction(id)            -- REALISER_ITEM
  rang             int   NN  CK rang >= 1
  priorite         code      CK IN {haute, moyenne, basse}
  statut           code  NN  CK IN D-42
  notes            text
  UQ (mission_id, rang)

intervention_mission  [A:mission]                  -- INTERVENIR
  mission_id       uuid  NN  FK → mission(id)
  acteur_id        uuid  NN  FK → acteur_geniius(id)
  role             code  NN  CK IN {commanditaire, consultant, photographe, transcripteur,
                                    interprète, validateur}
  statut           code  NN  CK IN {soi, tiers, professionnel, bénévole}
  acces_debut      ts    NN
  acces_fin        ts
  perimetre_acces  text  NN
  ⟨VA mission⟩
  PK (mission_id, acteur_id, role, v_debut)
  CK acces_fin IS NULL OR acces_fin > acces_debut
  -- règles d'accès temporaires dérivées et closes à expiration (DI-K12) : CP-20

offre_deplacement  [V]                             -- OFFRE_DEPLACEMENT
  ⟨OBJ 'OFFRE_DEPLACEMENT'⟩
  acteur_id               uuid  NN  FK → acteur_geniius(id)   -- PROPOSER_OFFRE
  centre_organisation_id  uuid  NN  FK → organisation(id)
  ⟨dh date⟩                                                   -- NN* ; date exacte
  capacite                int   CK capacite >= 1
  -- la visibilité de l'offre est objet.visibilite

offre_categorie  [A:offre_deplacement]             -- OFFRE_DEPLACEMENT.categories_acceptees (1..n)
  offre_deplacement_id  uuid  NN  FK → offre_deplacement(id)
  categorie             code  NN  CK IN {photographie d'une cote, vérification d'une mention, relevé d'index}
  ⟨VA offre_deplacement⟩
  PK (offre_deplacement_id, categorie, v_debut)

micro_mission  [V]                                 -- MICRO_MISSION
  ⟨OBJ 'MICRO_MISSION'⟩
  offre_deplacement_id  uuid  NN  FK → offre_deplacement(id)  -- ACCUEILLIR
  demandeur_acteur_id   uuid  NN  FK → acteur_geniius(id)
  consigne              text  NN*
  cible                 text
  statut                code  NN  CK IN {proposée, acceptée, réalisée, refusée}

condition_pratique  [V]                            -- CONDITION_PRATIQUE
  ⟨OBJ 'CONDITION_PRATIQUE'⟩
  organisation_id   uuid  NN  FK → organisation(id)           -- OBSERVER
  type              code  NN  CK IN {horaires, réservation, délai de communication, photo autorisée,
                                     quota, fermeture, tarif, autre}
  type_precision    text
  valeur            text  NN*
  ⟨dh date_observation⟩                                       -- NN*
  CK (type = 'autre') = (type_precision IS NOT NULL)

contact  [V]                                       -- CONTACT ; CARNET = objet.espace_id
  ⟨OBJ 'CONTACT'⟩
  nom_affiche           text  NN*                             -- R
  type                  code  NN  CK IN {institution, archiviste, association, famille, chercheur, autre}
  coordonnees_privees   text                                  -- I
  represente_entite_id  uuid  FK → entite_historique(id)      -- REPRESENTE
  represente_acteur_id  uuid  FK → acteur_geniius(id)
  CK num_nonnulls(represente_entite_id, represente_acteur_id) <= 1

interaction  [V]                                   -- INTERACTION
  ⟨OBJ 'INTERACTION'⟩
  contact_id        uuid  NN  FK → contact(id)                -- HISTORIQUE
  question_id       uuid      FK → question(id)
  mission_id        uuid      FK → mission(id)
  type              code  NN  CK IN {demande, réponse, relance, échange, note privée}
  ⟨dh date⟩                                                   -- NN*
  contenu           text  NN*                                 -- R
  ⟨dh echeance_relance⟩
```

## 14.3 Protocoles, règles, tâches, états de connaissance

```text
protocole  [V]                                     -- PROTOCOLE (conteneur)
  ⟨OBJ 'PROTOCOLE'⟩
  titre                   text  NN*
  portee                  code  NN  CK IN {personnel, équipe, communauté, pays, période, type de problème}
  conditions_application  text

critere_protocole  [V]                             -- CRITERE_PROTOCOLE
  ⟨OBJ 'CRITERE_PROTOCOLE'⟩
  protocole_id  uuid  NN  FK → protocole(id)                  -- DEFINIR (1,1)
  rang          int   NN  CK rang >= 1
  libelle       text  NN*
  ⟨REF dimension⟩
  condition     text
  UQ (protocole_id, rang)

application_protocole  [V]                         -- APPLICATION_PROTOCOLE
  ⟨OBJ 'APPLICATION_PROTOCOLE'⟩
  cible_id          uuid  NN                                  -- APPLIQUER_A
  cible_type        code  NN  CK IN {QUESTION, DOCUMENT, EXEMPLAIRE}
  protocole_id      uuid  NN  FK → protocole(id)
  protocole_numero  int   NN                                  -- version figée (DI-K15)
  statut            code  NN  CK IN {en cours, accompli selon protocole, interrompu}
  date              ts    NN
  FK (cible_id, cible_type) → objet(id, type_objet)
  FK (protocole_id, protocole_numero) → version_objet(objet_id, numero)
  -- accompli ⇒ tous les critères de la version accomplis ou non applicables (DI-K16) : CP-13

etat_critere  [A:application_protocole]            -- ETAT_CRITERE
  application_protocole_id  uuid  NN  FK → application_protocole(id)
  critere_protocole_id      uuid  NN  FK → critere_protocole(id)
  etat                      code  NN  CK IN {accompli, partiel, non fait, non applicable}
  couverture                text
  preuve_objet_id           uuid      FK → objet(id)
  ⟨VA application_protocole⟩
  PK (application_protocole_id, critere_protocole_id, v_debut)

regle_methodologique  [V]                          -- REGLE_METHODOLOGIQUE
  ⟨OBJ 'REGLE_METHODOLOGIQUE'⟩
  adoptant_acteur_id  uuid      FK → acteur_geniius(id)       -- CONTEXTE_REGLE (adoptant)
  enonce              text  NN*
  niveau              code  NN  CK IN {pattern détecté, règle proposée, règle adoptée}
  origine             code  NN  CK IN {détection automatique, corrections humaines, proposition humaine}
  portee              code  NN  CK IN D-43
  CK (niveau = 'règle adoptée') = (adoptant_acteur_id IS NOT NULL)          -- DI-K18

regle_contexte  [A:regle_methodologique]           -- CONTEXTE_REGLE
  regle_methodologique_id  uuid  NN  FK → regle_methodologique(id)
  objet_id                 uuid  NN  FK → objet(id)
  ⟨VA regle_methodologique⟩
  PK (regle_methodologique_id, objet_id, v_debut)

tache  [V]                                         -- TACHE
  ⟨OBJ 'TACHE'⟩
  projet_id          uuid  NN  FK → projet(id)                -- PLANIFIER_TACHE
  assigne_acteur_id  uuid      FK → acteur_geniius(id)
  libelle            text  NN*
  statut             code  NN  CK IN {à faire, en cours, faite, abandonnée}
  ⟨dh echeance⟩
  origine            code  NN  CK IN {manuelle, signal de dépendance, preuve inaccessible,
                                      réouverture, anomalie}

tache_objet  [A:tache]
  tache_id  uuid  NN  FK → tache(id)
  objet_id  uuid  NN  FK → objet(id)
  ⟨VA tache⟩
  PK (tache_id, objet_id, v_debut)

snapshot  [F]                                      -- SNAPSHOT (conteneur figé)
  ⟨OBJ 'SNAPSHOT'⟩
  nom          text  NN*
  date         ts    NN
  description  text
  -- contenu : version_composant (FIGER / CONTENIR_SNAP) ; nom unique par espace : CP-15

diff_connaissance  [V]                             -- DIFF_CONNAISSANCE
  ⟨OBJ 'DIFF_CONNAISSANCE'⟩
  snapshot_avant_id  uuid  FK → snapshot(id)                  -- AVANT
  snapshot_apres_id  uuid  FK → snapshot(id)                  -- APRES
  date_avant         ts
  date_apres         ts
  decouverte_id      uuid  FK → decouverte(id)                -- DECLENCHER
  resume             text  NN*
  nature             code  NN  CK IN {technique, scientifique, mixte}
  consequences       text
  CK num_nonnulls(snapshot_avant_id, date_avant) = 1
  CK num_nonnulls(snapshot_apres_id, date_apres) = 1

decouverte  [V]                                    -- DECOUVERTE
  ⟨OBJ 'DECOUVERTE'⟩
  acteur_id          uuid  NN  FK → acteur_geniius(id)
  enonce             text  NN*
  ⟨dh date⟩                                                   -- NN*
  portee_nouveaute   code  NN  CK IN D-44
  priorite_externe   code  NN  CK IN {non évaluée, antériorité connue, non revendiquée}  -- DI-K22

decouverte_version  [N]                            -- MODIFIER
  decouverte_id  uuid  NN  FK → decouverte(id)
  objet_id       uuid  NN
  numero         int   NN
  PK (decouverte_id, objet_id, numero)
  FK (objet_id, numero) → version_objet(objet_id, numero)
```

---

# 15. Domaine L — Tree

```text
arbre  [V]                                         -- ARBRE (conteneur) ; HEBERGER = objet.espace_id
  ⟨OBJ 'ARBRE'⟩
  nom              text  NN*
  origine          code  NN  CK IN {saisie, import GEDCOM, import autre}
  import_id        uuid  UQ  FK → import(id)                  -- IMPORTE_DE (0,1)
  racine_noeud_id  uuid      FK → noeud_arbre(id) DEF         -- RACINE †
  CK origine = 'saisie' OR import_id IS NOT NULL                             -- DI-L02
  -- espace ≠ Core partagé (DI-L01) : CP-04

noeud_arbre  [V]                                   -- NOEUD_ARBRE
  ⟨OBJ 'NOEUD_ARBRE'⟩
  arbre_id            uuid  NN  FK → arbre(id)                -- COMPORTER_NOEUD
  personne_id         uuid  NN  FK → personne(id)             -- REPRESENTER
  libelle_affichage   text
  position_affichage  text
  UQ (arbre_id, personne_id)                                                  -- DI-L04
  -- même espace que l'arbre (DI-L03) : CP-04

arbre_lien  [A:arbre]                              -- INCLURE_LIEN
  arbre_id      uuid  NN  FK → arbre(id)
  assertion_id  uuid  NN  FK → assertion(id)
  ⟨VA arbre⟩
  PK (arbre_id, assertion_id, v_debut)
  -- assertion de profil relation, parenté ou alliance, entre personnes de l'arbre : CP-07

operation_flux  [V]                                -- OPERATION_FLUX
  ⟨OBJ 'OPERATION_FLUX'⟩
  acteur_id          uuid  NN  FK → acteur_geniius(id)        -- EXECUTER
  espace_source_id   uuid  NN  FK → espace(id)                -- SOURCE
  espace_cible_id    uuid  NN  FK → espace(id)                -- CIBLE
  type               code  NN  CK IN D-45
  date               ts    NN
  statut             code  NN  CK IN {préparée, exécutée, annulée}
  autorisation       text  NN
  CK espace_source_id <> espace_cible_id
  -- DI-L06 à DI-L09 : CP-04, CP-03

comparaison  [V]                                   -- COMPARAISON
  ⟨OBJ 'COMPARAISON'⟩
  arbre_a_id  uuid  NN  FK → arbre(id)                       -- COMPARER (A)
  arbre_b_id  uuid  NN  FK → arbre(id)                       -- COMPARER (B)
  date        ts    NN
  perimetre   text  NN
  statut      code  NN  CK IN {en cours, terminée, expirée}
  CK arbre_a_id <> arbre_b_id

ecart  [V]                                         -- ECART
  ⟨OBJ 'ECART'⟩
  comparaison_id  uuid  NN  FK → comparaison(id)
  objet_a_id      uuid      FK → objet(id)                    -- ECART_A †
  objet_b_id      uuid      FK → objet(id)                    -- ECART_B †
  type            code  NN  CK IN {seulement dans A, seulement dans B, valeur divergente, identique}
  CK num_nonnulls(objet_a_id, objet_b_id) >= 1
```

---

# 16. Domaine M — Connect

```text
evenement_connect  [V]                             -- EVENEMENT_CONNECT
  ⟨OBJ 'EVENEMENT_CONNECT'⟩
  organisateur_acteur_id   uuid  NN  FK → acteur_geniius(id)  -- ORGANISATEUR
  lieu_id                  uuid      FK → lieu(id)            -- SE_TENIR
  evenement_documente_id   uuid      FK → evenement(id)       -- DOCUMENTER
  ⟨REF type⟩                                                  -- NN (référentiel, DD-06)
  titre                    text  NN*
  ⟨dh date⟩                                                   -- NN*
  statut                   code  NN  CK IN {en préparation, en cours, terminé, annulé}

activite_connect  [V]                              -- ACTIVITE_CONNECT
  ⟨OBJ 'ACTIVITE_CONNECT'⟩
  evenement_connect_id  uuid  NN  FK → evenement_connect(id)  -- PROPOSER_ACTIVITE
  campagne_id           uuid      FK → campagne_memoire(id)
  ⟨REF type⟩                                                  -- NN
  phase                 code  NN  CK IN {avant, pendant, après}
  consignes             text

activite_connect_objet  [A:activite_connect]
  activite_connect_id  uuid  NN  FK → activite_connect(id)
  objet_id             uuid  NN  FK → objet(id)
  ⟨VA activite_connect⟩
  PK (activite_connect_id, objet_id, v_debut)

participation_connect  [V]                         -- PARTICIPATION_CONNECT
  ⟨OBJ 'PARTICIPATION_CONNECT'⟩
  evenement_connect_id  uuid  NN  FK → evenement_connect(id)  -- INVITER
  acteur_id             uuid      FK → acteur_geniius(id)
  personne_id           uuid      FK → personne(id)
  role                  code  NN  CK IN {organisateur, animateur, participant}
  statut                code  NN  CK IN {invité, inscrit, présent, absent}
  CK num_nonnulls(acteur_id, personne_id) = 1                                -- DI-M03

contribution_connect  [V]                          -- CONTRIBUTION_CONNECT
  ⟨OBJ 'CONTRIBUTION_CONNECT'⟩
  activite_connect_id       uuid  NN  FK → activite_connect(id)       -- RECUEILLIR
  participation_connect_id  uuid  NN  FK → participation_connect(id)  -- APPORTER
  date                      ts    NN
  statut                    code  NN  CK IN {brute, qualifiée, rattachée}

contribution_objet  [N]                            -- PRODUIRE_OBJ
  contribution_connect_id  uuid  NN  FK → contribution_connect(id)
  objet_id                 uuid  NN  UQ  FK → objet(id)       -- (0,1) côté objet
  PK (contribution_connect_id, objet_id)
  -- au moins un objet produit (1,n) : CP-05
```

---

# 17. Domaine N — Atlas

```text
geometrie  [V]                                     -- GEOMETRIE
  ⟨OBJ 'GEOMETRIE'⟩
  lieu_id            uuid  NN  FK → lieu(id)                  -- LOCALISER_LIEU
  calcul_id          uuid      FK → calcul(id)                -- RECONSTRUIRE_GEOM
  type_localisation  code  NN  CK IN D-46
  geom               geom                                     -- MLD-05 ; NN*
  geom_systeme       text  NN
  geom_forme         code  NN  CK IN {point, ligne, polygone, multipolygone, zone floue}
  precision_metres   num   CK precision_metres >= 0
  ⟨ph periode⟩
  statut             code  NN  CK IN {proposée, examinée, contestée, rejetée}
  CK type_localisation NOT IN ('approximative','zone possible') OR precision_metres IS NOT NULL  -- DI-N02
  CK geom_forme <> 'zone floue' OR precision_metres IS NOT NULL
  -- précision ≤ fondements (DI-N01), interdits (DI-N04) : CP-13, CP-14

geometrie_assertion  [A:geometrie]                 -- FONDEE_SUR
  geometrie_id  uuid  NN  FK → geometrie(id)
  assertion_id  uuid  NN  FK → assertion(id)
  ⟨VA geometrie⟩
  PK (geometrie_id, assertion_id, v_debut)

carte  [V]                                         -- CARTE (conteneur) ; PRODUIRE_CARTE = objet.espace_id
  ⟨OBJ 'CARTE'⟩
  titre      text  NN*
  mode       code  NN  CK IN {dynamique, figée}
  ⟨ph periode⟩
  fraicheur  code  NN  CK IN {à jour, potentiellement obsolète}             -- dérivé (CP-10)
  CK mode = 'dynamique' OR fraicheur = 'à jour'

carte_couche  [A:carte]                            -- CARTE.couches (0..n)
  carte_id  uuid  NN  FK → carte(id)
  ⟨REF couche⟩                                                -- NN
  ⟨VA carte⟩
  PK (carte_id, couche_id, v_debut)

carte_objet  [A:carte]                             -- REPRESENTER_SUR_CARTE
  carte_id       uuid  NN  FK → carte(id)
  objet_id       uuid  NN  FK → objet(id)
  symbolisation  code  NN  CK IN {attesté, hypothétique, calculé, cooccurrence}
  ⟨VA carte⟩
  PK (carte_id, objet_id, v_debut)

carte_geometrie  [A:carte]                         -- AFFICHER
  carte_id      uuid  NN  FK → carte(id)
  geometrie_id  uuid  NN  FK → geometrie(id)
  ⟨VA carte⟩
  PK (carte_id, geometrie_id, v_debut)
```

---

# 18. Domaine O — Analyse, corpus, reproductibilité

```text
requete  [V]                                       -- REQUETE
  ⟨OBJ 'REQUETE'⟩
  definition  text  NN*
  mode        code  NN  CK IN {strict, recherche, exploratoire}
  -- l'attribut « partage » du dictionnaire est objet.visibilite

corpus  [V]                                        -- CORPUS (conteneur)
  ⟨OBJ 'CORPUS'⟩
  type         code  NN  CK IN {manuel, par critères, dynamique, figé}
  definition   text  NN*
  requete_id   uuid  FK → requete(id)                         -- DEFINIR_CORPUS
  snapshot_id  uuid  FK → snapshot(id)                        -- FIGER_CORPUS
  CK type NOT IN ('par critères','dynamique') OR requete_id IS NOT NULL      -- DI-O02
  CK type <> 'figé' OR snapshot_id IS NOT NULL                               -- DI-O01

corpus_inclusion  [A:corpus]                       -- INCLURE
  corpus_id  uuid  NN  FK → corpus(id)
  objet_id   uuid  NN  FK → objet(id)
  decision   code  NN  CK IN {inclus, exclu}
  motif      text
  mode       code  NN  CK IN {manuel, critère}
  ⟨VA corpus⟩
  PK (corpus_id, objet_id, v_debut)
  UQ (corpus_id, objet_id) WHERE v_fin IS NULL
  CK NOT (decision = 'exclu' AND mode = 'manuel') OR motif IS NOT NULL       -- DI-O03

cohorte_analytique  [V]                            -- COHORTE_ANALYTIQUE
  ⟨OBJ 'COHORTE_ANALYTIQUE'⟩
  requete_id      uuid  NN  FK → requete(id)                  -- CRITERES
  corpus_id       uuid  NN  FK → corpus(id)                   -- DANS
  libelle         text  NN*
  criteres_texte  text  NN*
  -- aucune clé étrangère depuis ou vers collectif_historique (DI-O04)

methode  [V]                                       -- METHODE
  ⟨OBJ 'METHODE'⟩
  nom                 text  NN*
  ⟨REF type⟩                                                  -- NN
  description         text  NN*
  hypotheses          text  NN*
  parametres          json
  limites             text  NN*
  algorithme          text
  version_algorithme  text  NN
  deterministe        bool  NN
  -- méthode déterministe sans IA générative (DI-O06) : CP-13

calcul  [F]                                        -- CALCUL
  ⟨OBJ 'CALCUL'⟩
  methode_id            uuid  NN  FK → methode(id)            -- APPLIQUER_METHODE
  methode_numero        int   NN
  corpus_id             uuid      FK → corpus(id)             -- SUR
  corpus_numero         int
  snapshot_id           uuid      FK → snapshot(id)           -- ETAT_CONNAISSANCE
  date_reference        ts
  activite_id           uuid  NN  UQ  FK → activite(id)       -- EXECUTER_CALCUL
  calcul_origine_id     uuid      FK → calcul(id)             -- REPRODUIRE_CALCUL
  date                  ts    NN
  nature_execution      code  NN  CK IN {calcul initial, reproduction, rerun, nouvelle analyse}
  parametres_effectifs  json
  FK (methode_id, methode_numero) → version_objet(objet_id, numero)
  FK (corpus_id, corpus_numero) → version_objet(objet_id, numero)
  CK (corpus_id IS NULL) = (corpus_numero IS NULL)
  CK num_nonnulls(snapshot_id, date_reference) = 1                           -- DI-O08
  CK (nature_execution = 'calcul initial') = (calcul_origine_id IS NULL)
  -- reproduction ⇒ mêmes versions que l'origine (DI-O07) : CP-13

calcul_referentiel  [N]                            -- MOBILISER
  calcul_id           uuid  NN  FK → calcul(id)
  referentiel_id      uuid  NN
  referentiel_numero  int   NN
  PK (calcul_id, referentiel_id)
  FK (referentiel_id, referentiel_numero) → version_objet(objet_id, numero)

resultat  [V]                                      -- RESULTAT
  ⟨OBJ 'RESULTAT'⟩
  calcul_id            uuid  NN  FK → calcul(id)              -- PRODUIRE_RESULTAT (1,1)
  type                 code  NN  CK IN {statistique calculée, entourage, cooccurrences,
                                        comparaison de trajectoires, zone plausible, intervalle dérivé,
                                        liste de candidats, indépendance, autre}
  contenu              json                                   -- NN* ; seul lieu des scores (DD-14)
  mode                 code  NN  CK IN {dynamique, figé}
  fraicheur            code  NN  CK IN {à jour, potentiellement obsolète, recalcul en cours}  -- CP-10
  date_dernier_calcul  ts    NN
  couverture           text  NN*
  CK mode = 'dynamique' OR fraicheur = 'à jour'                              -- DI-O09
```

---

# 19. Domaine P — Publication, pérennité, interopérabilité

```text
publication  [V]                                   -- PUBLICATION (conteneur) ; PUBLIER = objet.espace_id
  ⟨OBJ 'PUBLICATION'⟩
  contexte_id       uuid  NN  FK → contexte_evaluation(id)    -- EVALUER_PUBLICATION †
  titre             text  NN*
  type              code  NN  CK IN {fiche entité, chronologie, carte, corpus, conclusion, article,
                                     édition critique, page publique}
  etat              code  NN  CK IN {brouillon, publiée, corrigée, remplacée, retirée}
  date_publication  ts
  numero_edition    int   NN  CK numero_edition >= 1
  indexable         bool  NN
  CK etat = 'brouillon' OR date_publication IS NOT NULL
  -- DI-P01 (une évaluation de diffusabilité par version exposée), DI-P03 : CP-13

publication_exposition  [N]                        -- EXPOSER (manifeste de publication, MLD-14)
  publication_id      uuid  NN
  publication_numero  int   NN
  objet_id            uuid  NN
  objet_numero        int   NN
  mode_exposition     code  NN  CK IN {intégral, provenance masquée, pseudonymisé, existence seulement}
  PK (publication_id, publication_numero, objet_id)
  FK (publication_id, publication_numero) → version_objet(objet_id, numero)
  FK (objet_id, objet_numero) → version_objet(objet_id, numero)

correction_publication  [F]                        -- CORRECTION_PUBLICATION
  ⟨OBJ 'CORRECTION_PUBLICATION'⟩
  publication_id              uuid  NN  FK → publication(id)  -- CORRIGER
  publication_remplacante_id  uuid      FK → publication(id)
  type                        code  NN  CK IN {correction éditoriale mineure, erratum/corrigendum,
                                               nouvelle édition, retrait motivé}
  motif                       text  NN*
  date                        ts    NN
  CK (type = 'nouvelle édition') = (publication_remplacante_id IS NOT NULL)
  CK publication_remplacante_id IS NULL OR publication_remplacante_id <> publication_id

citation  [A:objet]                                -- CITER (propriétaire : objet citant)
  objet_citant_id           uuid  NN  FK → objet(id)
  reference_persistante_id  uuid  NN  FK → reference_persistante(id)
  type                      code  NN  CK IN {cite, s'appuie sur, discute, réfute, réutilise}
  v_debut                   int   NN
  v_fin                     int
  PK (objet_citant_id, reference_persistante_id, v_debut)
  FK (objet_citant_id, v_debut) → version_objet(objet_id, numero)

export  [F]                                        -- EXPORT
  ⟨OBJ 'EXPORT'⟩
  acteur_id         uuid  NN  FK → acteur_geniius(id)         -- EXPORTER
  contexte_id       uuid  NN  FK → contexte_evaluation(id)    -- EVALUER_EXPORT †
  format            code  NN  CK IN D-48
  version_format    text  NN
  perimetre         text  NN*
  date              ts    NN
  droits_appliques  text  NN*
  empreinte_paquet  hash  NN
  -- le manifeste est produit à partir d'export_element et export_dependance_externe (MLD-14)

export_element  [N] ‡                              -- CONTENIR_EXPORT
  id            uuid  PK
  export_id     uuid  NN  FK → export(id)
  objet_id      uuid
  objet_numero  int
  lien_id       uuid      FK → lien(id)
  fichier_id    uuid      FK → fichier(id)
  role          code  NN  CK IN {objet, lien, fichier}
  UQ (export_id, objet_id, lien_id, fichier_id)
  FK (objet_id, objet_numero) → version_objet(objet_id, numero)
  CK num_nonnulls(objet_id, lien_id, fichier_id) = 1
  CK (role = 'objet') = (objet_id IS NOT NULL)

export_dependance_externe  [N] ‡                   -- dépendances externes référencées (MCD § 18.5)
  export_id                 uuid  NN  FK → export(id)
  reference_persistante_id  uuid  NN  FK → reference_persistante(id)
  PK (export_id, reference_persistante_id)

export_exclusion  [N] ‡                            -- exclusions pour droits ; confidentialité I
  export_id  uuid  NN  FK → export(id)
  objet_id   uuid  NN  FK → objet(id)
  motif      code  NN  CK IN {embargo, consentement, règle d'accès, licence, masquage, existence protégée}
  PK (export_id, objet_id)

lignee_import  [T] ‡                               -- source suivie à travers les réimports (MLD-11)
  id                  uuid  PK
  espace_id           uuid  NN  FK → espace(id)
  source_description  text  NN
  format              text  NN

import  [F]                                        -- IMPORT
  ⟨OBJ 'IMPORT'⟩
  espace_cible_id      uuid  NN  FK → espace(id)              -- CIBLE_IMPORT
  fichier_original_id  uuid  NN  FK → fichier(id)             -- FICHIER_ORIGINAL
  lignee_id            uuid  NN  FK → lignee_import(id)       ‡
  type                 code  NN  CK IN {import externe, réimport patrimonial, restauration}
  logiciel             text
  format               text  NN
  version_format       text
  fournisseur          text                                   -- R
  date                 ts    NN
  avertissements       text
  rapport              text
  CK type = 'import externe' OR rapport IS NOT NULL OR est_purge             -- DI-P10

cle_import  [N] ‡                                  -- clés d'enregistrements sources (MLD-11)
  import_id                uuid  NN  FK → import(id)
  cle_source               text  NN                           -- ex. @I12@
  empreinte_enregistrement hash  NN
  objet_id                 uuid  NN  FK → objet(id)
  PK (import_id, cle_source, objet_id)
  -- reconnaissance par lignée : index (lignée de l'import, cle_source) au MPD

reconciliation_import  [V]                         -- RECONCILIATION_IMPORT
  ⟨OBJ 'RECONCILIATION_IMPORT'⟩
  import_id          uuid  NN  FK → import(id)                -- RECONCILIER
  objet_importe_id   uuid  NN  FK → objet(id)
  objet_existant_id  uuid      FK → objet(id)
  issue              code  NN  CK IN {nouveau, identique - reconnecté, local modifié - à comparer,
                                      Core évolué - lien proposé, incompatible - isolé}
  CK (issue = 'nouveau') = (objet_existant_id IS NULL)
  -- restauration jamais vers le Core partagé (DI-P09) : CP-04
```

---

# 20. Domaines Q et R — Organisation personnelle, veille ; référentiels

## 20.1 Domaine Q

```text
workspace  [V]                                     -- WORKSPACE (espace personnel du compte)
  ⟨OBJ 'WORKSPACE'⟩
  compte_id        uuid  NN  FK → compte(id)                  -- OUVRIR
  titre            text  NN*
  etat             code  NN  CK IN {actif, converti, archivé, supprimé}
  devenu_objet_id  uuid      FK → objet(id)                   -- DEVENIR (0,1)
  CK (etat = 'converti') = (devenu_objet_id IS NOT NULL)

epingle  [A:workspace]                             -- EPINGLER
  workspace_id  uuid  NN  FK → workspace(id)
  objet_id      uuid  NN  FK → objet(id)
  x             num
  y             num
  groupe        text
  note          text
  ⟨VA workspace⟩
  PK (workspace_id, objet_id, v_debut)

lien_exploratoire  [V]                             -- LIEN_EXPLORATOIRE
  ⟨OBJ 'LIEN_EXPLORATOIRE'⟩
  workspace_id  uuid  NN  FK → workspace(id)                  -- TRACER
  objet_a_id    uuid  NN  FK → objet(id)                      -- EXPLORER_A †
  objet_b_id    uuid  NN  FK → objet(id)                      -- EXPLORER_B †
  libelle       text
  CK objet_a_id <> objet_b_id

collection  [V]                                    -- COLLECTION
  ⟨OBJ 'COLLECTION'⟩
  titre         text  NN*
  collaborative bool  NN

collection_objet  [A:collection]                   -- RANGER
  collection_id  uuid  NN  FK → collection(id)
  objet_id       uuid  NN  FK → objet(id)
  rang           int
  ⟨VA collection⟩
  PK (collection_id, objet_id, v_debut)

tag  [V]                                           -- TAG
  ⟨OBJ 'TAG'⟩
  libelle  text  NN*
  portee   code  NN  CK IN {personnel, collaboratif}

tag_objet  [A:tag]                                 -- ETIQUETER
  tag_id    uuid  NN  FK → tag(id)
  objet_id  uuid  NN  FK → objet(id)
  ⟨VA tag⟩
  PK (tag_id, objet_id, v_debut)

inbox_item  [V]                                    -- INBOX_ITEM
  ⟨OBJ 'INBOX_ITEM'⟩
  compte_id     uuid  NN  FK → compte(id)                     -- CAPTURER
  fichier_id    uuid      FK → fichier(id)                    -- JOINDRE
  type          code  NN  CK IN {fichier, lien, note, photo, audio, vidéo, document reçu}
  contenu_brut  text
  etat          code  NN  CK IN {capturé, qualifié, rattaché, traité, archivé}
  date_capture  ts    NN
  -- rattaché ⇒ au moins un rattachement (DI-Q02) : CP-05

inbox_rattachement  [A:inbox_item]                 -- RATTACHER
  inbox_item_id  uuid  NN  FK → inbox_item(id)
  objet_id       uuid  NN  FK → objet(id)
  ⟨VA inbox_item⟩
  PK (inbox_item_id, objet_id, v_debut)

note  [V]                                          -- NOTE
  ⟨OBJ 'NOTE'⟩
  objet_annote_id  uuid  FK → objet(id)                       -- ANNOTER_NOTE
  texte            text  NN*

historique_navigation  [T]                         -- HISTORIQUE_NAVIGATION ; I ; purgeable
  id         uuid  PK
  compte_id  uuid  NN  FK → compte(id) ON DELETE CASCADE      -- NAVIGUER
  objet_id   uuid  NN  FK → objet(id)
  date       ts    NN
  session    uuid  NN

veille  [V]                                        -- VEILLE
  ⟨OBJ 'VEILLE'⟩
  compte_id          uuid  NN  FK → compte(id)                -- VEILLER
  objet_suivi_id     uuid      FK → objet(id)                 -- SUIVRE
  requete_id         uuid      FK → requete(id)               -- SURVEILLER
  type               code  NN  CK IN {suivre, surveiller}
  condition          text
  mode_notification  code  NN  CK IN {immédiat, digest, in-app, silencieux}
  active             bool  NN
  CK type <> 'suivre' OR objet_suivi_id IS NOT NULL
  CK type <> 'surveiller' OR condition IS NOT NULL OR requete_id IS NOT NULL  -- DI-Q04

notification  [T]                                  -- NOTIFICATION ; I
  id           uuid  PK
  compte_id    uuid  NN  FK → compte(id) ON DELETE CASCADE    -- RECEVOIR
  veille_id    uuid      FK → veille(id)                      -- DECLENCHER
  objet_id     uuid      FK → objet(id)
  date         ts    NN
  motif        code  NN  CK IN D-49
  explication  text  NN
  priorite     code  NN  CK IN {haute, normale, basse}
  groupe       text
  lue          bool  NN  default faux
```

## 20.2 Domaine R — Référentiels et concepts (MLD-08)

```text
referentiel  [V]                                   -- REFERENTIEL (conteneur) ; PORTER = objet.espace_id
  ⟨OBJ 'REFERENTIEL'⟩
  nom          text  NN
  niveau       code  NN  CK IN {personnel/projet, communautaire, commun GENIIUS}
  description  text
  UQ (nom) WHERE niveau = 'commun GENIIUS'                                    -- DI-R01

concept  [V]                                       -- CONCEPT
  ⟨OBJ 'CONCEPT'⟩
  referentiel_id     uuid  NN  FK → referentiel(id)           -- CONTENIR_CONCEPT
  concept_parent_id  uuid      FK → concept(id)               -- PLUS_LARGE
  code               text  NN  CK code ~ '^[a-z0-9_]+$'
  libelle            text  NN
  definition         text  NN
  nature             code  NN  CK IN {prédicat, rôle, type d'entité, type documentaire, nature d'événement,
                                      profession, statut, monnaie, unité, calendrier,
                                      système d'identifiant, autre}
  statut_promotion   code  NN  CK IN {local, proposé au commun, promu, refusé}
  actif              bool  NN  default vrai
  UQ (referentiel_id, code)
  CK concept_parent_id IS NULL OR concept_parent_id <> id
  -- parent de même nature, sans cycle (DI-R05) : CP-09 ; promotion humaine (DI-R04) : CP-06

concept_predicat  [V]                              -- signature des prédicats (DI-R03)
  concept_id        uuid  PK  FK → concept(id)
  profil_assertion  code  NN  CK IN {attribut, relation, participation, présence, situation,
                                     existence documentaire}
  attend_cible      bool  NN
  type_valeur       code  NN  CK IN {aucune, VALEUR nombre, VALEUR âge, VALEUR montant,
                                     VALEUR mesure, VALEUR texte, REF_CONCEPT}
  -- existe si et seulement si concept.nature = 'prédicat' : CP-07

concept_predicat_sujet  [A:concept]                -- types de sujet admis (1..n)
  concept_id   uuid  NN  FK → concept_predicat(concept_id)
  type_objet   code  NN
  ⟨VA concept⟩
  PK (concept_id, type_objet, v_debut)

concept_predicat_cible  [A:concept]                -- types de cible admis (0..n)
  concept_id   uuid  NN  FK → concept_predicat(concept_id)
  type_objet   code  NN
  ⟨VA concept⟩
  PK (concept_id, type_objet, v_debut)

terme_historique  [V]                              -- TERME_HISTORIQUE
  ⟨OBJ 'TERME_HISTORIQUE'⟩
  forme     text   NN*                                        -- verbatim
  langue    lang   NN
  ecriture  script NN

usage_terme  [A:terme_historique]                  -- USAGE
  terme_historique_id  uuid  NN  FK → terme_historique(id)
  concept_id           uuid  NN  FK → concept(id)
  ⟨ph periode⟩
  territoire_lieu_id   uuid      FK → lieu(id)
  corpus_id            uuid      FK → corpus(id)
  sens                 text  NN
  ⟨VA terme_historique⟩
  PK (terme_historique_id, concept_id, v_debut)

correspondance  [V]                                -- CORRESPONDANCE
  ⟨OBJ 'CORRESPONDANCE'⟩
  concept_a_id  uuid  NN  FK → concept(id)                   -- CONCEPT_A
  concept_b_id  uuid  NN  FK → concept(id)                   -- CONCEPT_B
  type          code  NN  CK IN {équivalent, plus large, plus spécifique, proche, incompatible,
                                 contesté, inconnu}
  CK concept_a_id <> concept_b_id
```

**Amorçage.** `GENIIUS-COMMUN` v1 (annexe A du dictionnaire) est chargé par une migration de données dans l'espace Core partagé, avec une activité `création` de mode `automatique` et `declenchement = explicite`. Les concepts sont des objets comme les autres : versionnés, citables, référencés par leur `id` (jamais par leur `code` dans les autres tables).

---

# 21. Historisation et contraintes procédurales

## 21.1 Mécanique d'écriture d'un objet versionné

Toute écriture applicative sur un objet `[V]` passe par une même séquence transactionnelle :

1. Créer une ligne `activite` (qui, quand, comment, avec quel moteur).
2. Créer la ligne `version_objet` (`numero` = précédent + 1, `date_debut_validite` = maintenant, nature, motif, `activite_id`) et clore la précédente (`date_fin_validite`).
3. Insérer, pour chaque table de la hiérarchie de l'objet, la ligne `_hist` du nouveau numéro.
4. Mettre à jour les tables courantes et `objet.version_courante`.
5. Clore (`v_fin` = nouveau numéro) les lignes d'association retirées ; insérer les nouvelles avec `v_debut` = nouveau numéro.
6. Pour un conteneur à un jalon (DD-01) : insérer les lignes `version_composant`.
7. Calculer `empreinte_etat` sur la sérialisation canonique de l'état (lignes `_hist` + associations valides).
8. Signaler les dépendances aval (CP-21).

Une **sauvegarde automatique** (brouillon d'interface) n'exécute pas cette séquence : elle reste côté application jusqu'à l'enregistrement explicite (DD-01).

**Lire l'état d'un objet à une date `t`** : prendre la version telle que `date_debut_validite ≤ t < coalesce(date_fin_validite, +∞)`, lire les lignes `_hist` de ce numéro, et les associations telles que `v_debut ≤ numero < coalesce(v_fin, +∞)`. C'est la réponse à « que pensions-nous en 2029 ? » (P4).

## 21.2 Catalogue des contraintes procédurales

Ces contraintes ne s'expriment pas en `CHECK` d'une seule ligne. Elles doivent être garanties par des déclencheurs, des contraintes différées ou la couche de service, et chacune doit avoir un test automatisé.

| # | Contrainte | Portée | Origine |
|---|---|---|---|
| CP-01 | Séquence d'écriture du § 21.1 ; aucune mise à jour d'une table `[V]` sans nouvelle version ; aucune modification d'une ligne `_hist`, `version_objet` ou d'un journal `[N]` hors purge | Toutes tables `[V]`, `[F]`, `[L]` | TI-01, MLD-02 |
| CP-02 | `objet.version_courante` = numéro de la version sans `date_fin_validite` ; idem pour `lien.version_courante` ; une table `[F]` n'a qu'une version | `objet`, `lien` | DI-A02, DI-A07 |
| CP-03 | Transitions d'état autorisées : `etat_cycle_vie` (DI-A03), phase de campagne irréversible (DI-J10), opération de flux `exécutée` non annulable (DI-L09), snapshot immuable (DI-K20) | Tables concernées | DI-A03, DI-J10, DI-L09, DI-K20 |
| CP-04 | Contraintes d'espace entre lignes : espace du référent ≠ espace de la cible (DI-A23) ; un arbre n'est pas dans le Core partagé (DI-L01) ; nœud et personne dans l'espace de l'arbre (DI-L03) ; règles de type d'espace des flux (DI-L06 à DI-L08) et des filiations (DI-A21) ; une restauration ne cible jamais le Core partagé (DI-P09) | Liens, Tree, flux, imports | DI-A21, DI-A23, DI-L01, DI-L03, DI-L06–08, DI-P09 |
| CP-05 | Cardinalités minimales et existences conditionnelles, contrôlées en fin de transaction : ancrage d'annotation et de mention (1,n) ; assertion `attestée` ancrée, fondée, issue d'une réponse ou d'une source externe (DI-G02) ; témoin de session (DI-J01) ; périmètre de recherche (DI-K09) ; deux propositions par conflit (DI-H08) ; élément attesté appuyé (DI-I03) ; formulation source extraite d'un segment (DI-G11) ; lacune de recherche justifiée (DI-G16) ; objets produits par une contribution Connect ; inbox rattachée (DI-Q02) ; types de sujet d'un prédicat (1,n) | Tables concernées | DI-G02, DI-G11, DI-G16, DI-H08, DI-I03, DI-J01, DI-K09, DI-Q02 |
| CP-06 | Habilitations : validateur vérifié sur le Core (DI-H01, DI-B06) ; un compte actif par acteur personne (DI-B07) ; pseudonyme jamais réattribué (DI-B08) ; espace personnel sans invité et propriétaire présent (DI-B02, DI-B04) ; demande conforme aux préférences et aux blocages (DI-H10) ; promotion de concept par acte humain (DI-R04) | Gouvernance | DI-B02–B08, DI-H01, DI-H10, DI-R04 |
| CP-07 | Cohérence de types et signatures : assertion conforme à la signature de son prédicat (sujet, cible, valeur, profil) ; table d'extension présente si et seulement si le profil l'exige ; `concept_predicat` si et seulement si `nature = prédicat` ; prédicat copié dans `selection_contexte` égal à celui de l'assertion et sujet = entité (DI-F13) ; liens d'arbre de parenté ou d'alliance ; modèle de parenté et statut causal présents quand requis ; date d'observation d'un foyer ; types IA de reproduction ⇒ original récupérable (DI-C11) ; une narration, un badge ou un lien exploratoire n'est jamais amont d'une dépendance de justification (DI-A16, DI-G13) | Assertions, référentiels | DI-G01, DI-R03, DI-F13, DI-A16, DI-G13, DI-C11, OB-13 |
| CP-08 | Accessibilité des concepts : toute colonne `→ concept` référence un concept actif d'un référentiel commun, communautaire de l'espace ou local de l'espace ; le type d'entité appartient à la branche de la spécialisation (DI-E01) | Toutes colonnes `→ concept` | MLD-08, DI-E01 |
| CP-09 | Graphes sans cycle et cycles détectés : hiérarchies archivistiques, lignées de reproduction, sous-questions, sous-projets, concepts parents, éléments reconstruits ; dépendances de production sans cycle ; cycles de raisonnement autorisés mais marqués `cycle_detecte` et exclus des justifications indépendantes (DI-A17, DI-A29) | Hiérarchies, dépendances | DI-A17, DI-A29, DI-C06, DI-R05, OB-08 |
| CP-10 | Statuts dérivés recalculés, jamais saisis (DD-11) : `statut_validation` depuis `acte_evaluation` ; `etat_courant` depuis `etat_reference_externe` ; `fraicheur` des résultats et cartes ; `independance` des actes (DI-H02) ; `statut_resolution` cohérent avec les propositions (DI-D07) ; position résolue ⇔ candidature retenue (DI-F05) | Statuts | DD-11, DI-D07, DI-F05, DI-H02 |
| CP-11 | Visibilité d'un objet ≤ `visibilite_max` de son espace | `objet` | DI-A05, DI-B03 |
| CP-12 | Visibilité d'un lien ≤ minimum des visibilités de ses extrémités (calculée à l'insertion et à toute restriction d'une extrémité) | `lien` | TI-10, DD-09, OB-06 |
| CP-13 | Règles métier inter-tables (une par règle) : DI-B15, DI-B22, DI-B25, DI-C01, DI-C02, DI-C04, DI-C14, DI-D03, DI-E02 (note d'individualisation au Core), DI-E08, DI-F03, DI-F09, DI-F10 (fusion validée), DI-G04, DI-G05, DI-G12, DI-I01, DI-J02, DI-J06, DI-K03, DI-K05, DI-K10, DI-K16, DI-N01, DI-O06, DI-O07, DI-P01, DI-P03, concurrence de reconstructions sur un même document | Règles listées | DI-* listées |
| CP-14 | Textes et dates : domaine `texte_libre` contre les sentinelles (TI-08) ; `x_expr` obligatoire pour une date issue d'une source ou d'une saisie (DD-10) ; un `TEXTE_SOURCE` ne change que par une nouvelle version motivée (TI-03) ; interdits géométriques (DI-N04, DD-16) | Toutes tables | TI-03, TI-08, DD-10, DD-16, OB-14 |
| CP-15 | Unicités non déclaratives : dépendance active (aval, amont, catégorie, type) ; proposition d'identification non rejetée (source, cible) ; code de regroupement et nom de snapshot uniques par espace ; crédit actif (objet, bénéficiaire, rôle) | Tables concernées | DI-F02, DI-K20, DI-A14 |
| CP-16 | Procédure de purge (MLD-15) : colonnes de contenu à `NULL` dans les tables courantes et `_hist`, `est_purge`, `statut_contenu`, empreinte recalculée, associations possédées closes, fichiers effacés, dépendances aval signalées | Toutes tables d'objet | DD-13, OB-12 |
| CP-17 | Attribution de l'ARK à la première publication ou citation figée externe ; jamais retiré | `reference_persistante` | DD-02, DI-A35, OB-11 |
| CP-18 | Dépendances automatiques : un appui d'élément reconstruit, un `S_APPUYER` d'interprétation et une assertion dérivée créent les dépendances de production correspondantes | `dependance` | DI-I05, DI-G03 |
| CP-19 | Lecture aveugle : pendant une transcription `indépendante/aveugle` non enregistrée, les autres lectures des mêmes zones sont absentes du graphe accessible de son auteur | Accès | DI-D02 |
| CP-20 | Accès temporaires : les interventions de mission et les comparaisons d'arbres dérivent des règles d'accès bornées, closes à expiration | `regle_acces` | DI-K12, DI-L10, OB-16 |
| CP-21 | Propagation : une nouvelle version **scientifique** d'un amont fait passer ses dépendances à `potentiellement affecté`, puis les questions concernées à `à réexaminer` et les résultats dynamiques à `potentiellement obsolète` ; asynchrone admis, délai = MPD-04 | `dependance`, `question`, `resultat`, `carte` | RG-A04, DI-A18, DI-K04, DI-O09, OB-09 |
| CP-22 | Associations versionnées `[A:p]` : `v_debut` = version courante du propriétaire à l'insertion ; retrait = `v_fin` ; jamais de suppression ; unicités appliquées aux lignes actives (`v_fin IS NULL`) | Toutes tables `[A:p]` | MLD-02, L5 |
| CP-23 | Droits du propriétaire : la création d'un objet `privé` crée, dans la même transaction, une `regle_acces` d'autorisation explicite (`voir`, `éditer`) pour l'acteur auteur ; aucun rôle d'espace ne donne de lecture implicite d'un objet `privé` | `objet`, `regle_acces` | § 22.1, CDCF § 49.2 |
| CP-24 | Habilitation exceptionnelle : toute autorisation accordée à un acteur sur un objet `privé` dont il n'est pas l'auteur, en vertu d'un rôle d'administration, exige `date_fin`, une `condition` justifiée, et la journalisation de chaque usage dans `contexte_evaluation` (`finalite` non nulle) | `regle_acces`, `contexte_evaluation` | § 22.1, OB-16 |
| CP-25 | Séparation des habilitations administratives et scientifiques : les habilitations d'administration et de participation scientifique sont indépendantes. L'attribution d'un rôle administratif ne crée pas d'appartenance scientifique et ne confère aucun accès implicite aux contenus de visibilité `projet` ou `privé`. L'accès aux objets `projet` repose sur une appartenance active autorisant explicitement la lecture scientifique (`lecture_scientifique = vrai`), sous réserve des interdictions et restrictions applicables. Un même acteur peut cumuler les deux habilitations. À la création d'un espace, le créateur reçoit les deux | `appartenance_espace`, `attribution_role`, § 22 | § 22.1, CDCF § 49.2 |

---

# 22. Modèle logique d'accès : le graphe accessible (MLD-13)

## 22.1 Visibilité par défaut

| `visibilite` | Acteurs qui voient par défaut |
|---|---|
| privé | Seuls les acteurs explicitement autorisés à consulter le contenu concerné, notamment son propriétaire lorsque ses droits effectifs le permettent, peuvent y accéder. Le rôle d'administrateur d'espace, d'organisation ou de plateforme ne confère aucun droit de lecture implicite. Tout accès exceptionnel doit reposer sur une habilitation spécifique, limitée, justifiée et auditée, conformément aux règles applicables. |
| projet | Acteurs ayant une appartenance active à l'espace avec `lecture_scientifique = vrai` (rôles `responsable scientifique`, `collaborateur`, `lecteur`), sous réserve des interdictions et restrictions applicables. Aucun rôle administratif ne donne de lecture (CP-25) ; un `invité` ne lit que ce que des règles explicites lui ouvrent. |
| famille | Membres des groupes `famille` liés à l'espace par une règle |
| cercle invité | Bénéficiaires explicites seulement |
| communauté GENIIUS | Tout acteur authentifié |
| public non indexé | Tout lecteur, sans indexation |
| public indexable | Tout lecteur, avec indexation si `decouvrabilite = indexable Web` |

**Mise en œuvre des règles `projet` et `privé`.**

- **Droits du propriétaire.** À la création d'un objet `privé`, une règle `regle_acces` d'autorisation explicite (`voir`, `éditer`) est créée pour l'acteur auteur (CP-23). Le propriétaire n'accède donc pas « par rôle » : il accède parce qu'une règle l'y autorise, et cette règle reste soumise aux interdictions, embargos et protections d'existence (§ 22.2, étapes 1, 2 et 6).
- **Administration sans lecture (CP-25).** Les habilitations administratives (`appartenance_espace` de nature `administrative` : `propriétaire`, `administrateur` ; `attribution_role` `administrateur technique`) permettent de gérer l'espace (membres, règles, cycle de vie) sans lire le contenu des objets `projet` ou `privé` (CDCF § 49.2). La lecture scientifique repose sur une appartenance distincte. Un même acteur peut cumuler les deux, par deux lignes d'`appartenance_espace`.
- **Création d'un espace.** Le créateur reçoit, dans la même transaction, une appartenance `propriétaire` (administrative) et une appartenance `responsable scientifique` (scientifique). Il peut ensuite renoncer à l'une sans perdre l'autre.
- **Accès exceptionnel.** Une habilitation exceptionnelle est une `regle_acces` d'autorisation dont `date_fin` est obligatoire, dont `condition` porte la justification et le fondement applicable, et dont chaque usage est journalisé dans `contexte_evaluation` avec une `finalite` renseignée (CP-24). Un prestataire reçoit, selon son mandat, une appartenance administrative bornée par `date_fin` et/ou des habilitations exceptionnelles limitées au périmètre autorisé.

**Synthèse des situations (CP-25).**

| Situation | Administration de l'espace | Lecture des objets `projet` | Lecture des objets `privé` |
|---|---|---|---|
| Administrateur technique uniquement | Oui | Non | Non |
| Membre scientifique uniquement | Non, sauf habilitation | Oui, selon droits effectifs | Seulement sur autorisation |
| Administrateur également membre scientifique | Oui | Oui, selon droits effectifs | Seulement sur autorisation |
| Prestataire avec accès exceptionnel | Selon mandat | Uniquement dans le périmètre autorisé | Uniquement par habilitation spécifique auditée |

## 22.2 Algorithme `acces(contexte, cible, action)`

Pour un contexte (acteur, audience, espace, instant, opération) et une cible (objet ou lien) :

1. **Existence protégée.** S'il existe une règle active `effet = interdire`, `objet_protege = existence`, visant la cible ou son espace et s'appliquant au bénéficiaire : la cible **n'existe pas** pour ce contexte. Elle est retirée du graphe avant toute autre étape.
2. **Interdiction.** S'il existe une règle active `effet = interdire` pour l'action : refus.
3. **Autorisation explicite.** S'il existe une règle active `effet = autoriser` pour l'action : accord.
4. **Visibilité par défaut** (§ 22.1) pour l'action `voir` ; refus pour les autres actions sans règle.
5. **Lien.** Un lien n'est accessible que si ses deux extrémités le sont (TI-10) et que les étapes 1 à 4 l'autorisent.
6. **Embargo et masquage.** Un objet sous embargo actif voit la portée concernée retirée (média, transcription, information…) ; un objet masqué est remplacé par sa version publique pour les lecteurs non habilités.

La relation dérivée `droit_effectif(acteur, cible_id, cible_type, action, effet, objet_protege)` ‡ est la forme ensembliste de cet algorithme. Sa matérialisation (vue, table maintenue, cache par contexte) et son moteur (politiques RLS, service de politiques) sont MPD-02 et MPD-06.

## 22.3 Graphe accessible

`graphe_accessible(contexte)` = ensemble des objets et liens pour lesquels `acces(contexte, ·, voir)` est accordé. **Toute** opération révélatrice s'exécute sur ce sous-graphe, et non sur le graphe complet suivi d'un masquage (P20, annexe G.3) :

| Opération | Règle |
|---|---|
| Recherche, traversée, suggestion | Parcours limité aux objets et liens du graphe accessible |
| Agrégation, comptage, calcul | Calculés sur le graphe accessible du **public visé** ; seuil de petit effectif (MPD-03) avant diffusion (DI-B18) |
| Export | Manifeste construit sur le graphe accessible du contexte d'export ; exclusions dans `export_exclusion` (I) |
| Notification | Créée seulement si l'événement, son existence et son contenu sont dans le graphe accessible du destinataire (DI-Q05) |
| API | Réponses identiques pour « absent » et « existence protégée » (codes, délais, compteurs, pagination) (TI-11, OB-04) |
| Campagne en phase indépendante | Les réponses des autres participants sont hors du graphe accessible de chaque participant (DI-J09) |

---

# 23. Vues de lecture (dérivées, non normatives)

Ces vues sont **calculées** et **contextuelles**. Elles servent l'interface et l'API ; elles ne sont jamais écrites et ne deviennent jamais une source de vérité.

| Vue | Contenu | Garde-fou |
|---|---|---|
| `v_objet_courant` | Jointure `objet` + table de spécialisation, version courante | Filtrée par le graphe accessible |
| `etat_objet_a(objet_id, instant)` | Fonction : numéro de version valide à l'instant, lignes `_hist` et associations correspondantes | Restrictions courantes appliquées aux versions anciennes (dictionnaire § 3.2) |
| `v_assertion` | `assertion` + profil (`assertion_relation`, `_presence`, `_situation`) + libellé du prédicat | Toutes les assertions, y compris contradictoires |
| `v_fiche_entite(espace, entite)` | Pour chaque prédicat : l'assertion retenue par `selection_contexte` (`usage = affichage`) **et** le nombre d'assertions concurrentes accessibles | Jamais de colonne « vraie » ; la sélection est affichée comme telle |
| `v_dependance_production`, `v_dependance_justification`, `v_dependance_raisonnement` | Filtres de `dependance` par catégorie | MLD-07 |
| `v_densite_documentaire` | Nombre de traces accessibles par entité | Jamais utilisée comme tri, score ou filtre par défaut (DI-E03) |
| `v_attestation_bornes` | Première et dernière attestation connues par entité | Ne crée aucun événement (RG-G11) |
| `independance(trace_a, trace_b, contexte)` | Fonction : dépendance établie / aucune dépendance connue / indépendance établie | Jamais mieux que « aucune dépendance connue » sans acte humain (DD-05) |

---

# 24. Contrôle des règles de non-régression (annexe G.3)

| Règle G.3 | Comment le schéma l'empêche |
|---|---|
| Assertion transformée en attribut intrinsèque | Aucune colonne de fait sur `personne` ni sur les autres entités historiques (§ 8.2) ; fiches = vues contextuelles (§ 23) |
| `DATE_HIST` aplatie | Groupe de six colonnes et contraintes du § 3.4 ; `approximative`/`vers` exigent `min < max` |
| `COMPTE`, `ACTEUR_GENIIUS`, `PERSONNE` confondus | Trois tables distinctes ; liens `lien_compte_acteur` (I) et `lien_compte_personne` (R) ; toutes les attributions pointent `acteur_geniius` |
| Acquisition, production, justification confondues | `acquisition_information` séparée ; `dependance.categorie` ; `base_justificative` ; une acquisition n'est jamais amont d'une justification (DI-A30, CP-07) |
| Filiation, référence, rapprochement fusionnés | Trois tables distinctes (`filiation`, `reference_inter_espace`, `rapprochement`) ; aucune table générique « lien vers » |
| Historique supprimé | Tables `_hist`, `version_objet` et journaux en insertion seule ; `RESTRICT` partout ; actes d'évaluation `[F]` |
| Calcul sur le graphe complet puis masquage | Graphe accessible (§ 22.3) obligatoire pour toute opération révélatrice |
| Cascade destructrice | Aucune cascade hors données personnelles techniques du compte (§ 3.5) ; purge en place (MLD-15) |
| Import transformé en validation | Un import crée des objets `etat_examen` non validés et des `acquisition_information` ; `statut_validation` ne dérive que des `acte_evaluation` (CP-10) |
| Score traité comme probabilité | Aucune colonne de score dans le Core ; scores seulement dans `resultat.contenu` (DD-14) ; plausibilité qualitative fermée (D-19) |

---

# 25. Matrice de traçabilité dictionnaire → MLD

Générée à partir des commentaires du schéma (chaque table et chaque colonne de liaison citent l'entité ou l'association du dictionnaire qu'elles réalisent). Elle sert de contrôle de couverture (annexe G et critère REC-17 du dictionnaire).

Bilan : **247 tables décrites** (hors tables `_hist` miroir) ; 163 entités et profils du dictionnaire, 259 associations.

## 25.1 Entités et profils

| Entité du dictionnaire | Table(s) MLD |
|---|---|
| ABONNEMENT | `abonnement` |
| ACQUISITION_DOCUMENTAIRE | `acquisition_documentaire` |
| ACQUISITION_INFORMATION | `acquisition_information` |
| ACTEUR_GENIIUS | `acteur_geniius` |
| ACTE_EVALUATION | `acte_evaluation` |
| ACTE_MODERATION | `acte_moderation` |
| ACTIVITE | `activite` |
| ACTIVITE_CONNECT | `activite_connect` |
| ANNOTATION | `annotation` |
| ANOMALIE_DOCUMENTAIRE | `anomalie_documentaire` |
| APPLICATION_PROTOCOLE | `application_protocole` |
| ARBRE | `arbre` |
| ARGUMENT | `argument` |
| ASSERTION | `assertion` |
| ASSERTION_ATTRIBUT | `assertion` |
| BADGE | `badge` |
| BASE_JUSTIFICATIVE | `base_justificative` |
| BIEN | `bien` |
| CALCUL | `calcul` |
| CAMPAGNE_MEMOIRE | `campagne_memoire` |
| CANDIDATURE | `candidature` |
| CAPSULE | `capsule` |
| CARTE | `carte`, `carte_couche` |
| CITATION_DOCUMENTAIRE | `citation_documentaire` |
| CLASSIFICATION | `classification` |
| COHORTE_ANALYTIQUE | `cohorte_analytique` |
| COLLECTIF_HISTORIQUE | `collectif_historique` |
| COLLECTION | `collection` |
| COMMUNAUTE | `communaute` |
| COMPARAISON | `comparaison` |
| COMPTE | `compte`, `compte_categorie_sollicitation` |
| CONCEPT | `concept` |
| CONDITION_PRATIQUE | `condition_pratique` |
| CONFLIT_EDITION | `conflit_edition` |
| CONSENTEMENT | `consentement` |
| CONTACT | `contact` |
| CONTEXTE_EVALUATION | `contexte_evaluation` |
| CONTRIBUTION_CONNECT | `contribution_connect` |
| CORPUS | `corpus` |
| CORRECTION_PUBLICATION | `correction_publication` |
| CORRESPONDANCE | `correspondance` |
| CRITERE_PROTOCOLE | `critere_protocole` |
| DECISION_APPLICABILITE_DROIT | `decision_applicabilite_droit` |
| DECLARATION_PROFIL | `declaration_profil` |
| DECOUVERTE | `decouverte` |
| DEMANDE | `demande` |
| DEPENDANCE | `dependance` |
| DESIGNATION_GARDE | `designation_garde` |
| DIFF_CONNAISSANCE | `diff_connaissance` |
| DISCUSSION | `discussion` |
| DOCUMENT | `document`, `document_langue` |
| DOMAINE_EXPERTISE | `domaine_expertise` |
| ECART | `ecart` |
| ECHANGE | `echange` |
| ELEMENT_RECONSTRUIT | `element_reconstruit` |
| EMBARGO | `embargo` |
| EMPLACEMENT | `emplacement` |
| ENTITE_HISTORIQUE | `entite_historique` |
| ERREUR_PROPAGEE | `erreur_propagee` |
| ESPACE | `espace`, `communaute`, `espace_organisation`, `projet` |
| ESPACE_ORGANISATION | `espace_organisation` |
| ETAPE_VOYAGE | `etape_voyage` |
| ETAT_REFERENCE_EXTERNE | `etat_reference_externe` |
| EVALUATION_DIFFUSABILITE | `evaluation_diffusabilite` |
| EVENEMENT | `evenement`, `voyage` |
| EVENEMENT_CONNECT | `evenement_connect` |
| EXEMPLAIRE | `exemplaire` |
| EXPORT | `export` |
| EXPRESSION_ASSERTION | `expression_assertion` |
| FAMILLE | `famille` |
| FICHIER | `fichier` |
| FILIATION | `filiation` |
| FINANCEMENT | `financement` |
| FONCTION | `fonction` |
| GEOMETRIE | `geometrie` |
| GROUPE | `groupe` |
| HISTORIQUE_NAVIGATION | `historique_navigation` |
| IDENTIFIANT_DOCUMENTAIRE | `identifiant_documentaire` |
| IDENTIFIANT_EXTERNE | `identifiant_externe` |
| IMPORT | `import` |
| INBOX_ITEM | `inbox_item` |
| INDICE | `indice` |
| INTERACTION | `interaction` |
| INTERPRETATION | `interpretation` |
| ITEM_MISSION | `item_mission` |
| LACUNE | `lacune` |
| LICENCE | `licence` |
| LIEN_COMPTE_ACTEUR | `lien_compte_acteur` |
| LIEN_COMPTE_PERSONNE | `lien_compte_personne` |
| LIEN_EXPLORATOIRE | `lien_exploratoire` |
| LIEN_INTERET | `lien_interet` |
| LIEU | `lieu` |
| LOCALISATION_EN_LIGNE | `localisation_en_ligne` |
| MASQUAGE | `masquage` |
| MENTION | `mention` |
| MESSAGE | `message` |
| METHODE | `methode` |
| MICRO_MISSION | `micro_mission` |
| MISSION | `mission` |
| NOEUD_ARBRE | `noeud_arbre` |
| NORME | `norme` |
| NOTE | `note` |
| NOTIFICATION | `notification` |
| OBJET | `objet` |
| OBJET_MATERIEL | `objet_materiel` |
| OFFRE_DEPLACEMENT | `offre_deplacement`, `offre_categorie` |
| OPERATION_FLUX | `operation_flux` |
| ORGANISATION | `organisation` |
| PAGE | `page` |
| PARTICIPATION_CONNECT | `participation_connect` |
| PERSONNE | `personne` |
| PHENOMENE | `phenomene` |
| PISTE | `piste` |
| POSITION | `position`, `element_reconstruit` |
| POSITION_EPISTEMIQUE | `position_epistemique` |
| POSITION_RELATIONNELLE | `position_relationnelle` |
| PRESCRIPTION | `prescription` |
| PRESENCE | `assertion_presence` |
| PROJET | `projet` |
| PROPOSITION_IDENTIFICATION | `proposition_identification` |
| PROPOSITION_MODIFICATION | `proposition_modification` |
| PROTOCOLE | `protocole` |
| PUBLICATION | `publication` |
| QUESTION | `question` |
| RAPPROCHEMENT | `rapprochement` |
| RECHERCHE_EFFECTUEE | `recherche_effectuee` |
| RECIT | `recit` |
| RECONCILIATION_IMPORT | `reconciliation_import` |
| RECONSTRUCTION | `reconstruction` |
| REFERENCE_INTER_ESPACE | `reference_inter_espace` |
| REFERENCE_PERSISTANTE | `reference_persistante` |
| REFERENTIEL | `referentiel` |
| REGLE_ACCES | `regle_acces` |
| REGLE_METHODOLOGIQUE | `regle_methodologique` |
| REGROUPEMENT_TRACES | `regroupement_traces` |
| RELANCE | `relance` |
| RELATION | `assertion_relation` |
| REPONSE | `reponse` |
| REPRODUCTION | `reproduction` |
| REQUETE | `requete` |
| RESPONSABILITE | `responsabilite` |
| RESULTAT | `resultat` |
| SEGMENT | `segment` |
| SELECTION_CONTEXTE | `selection_contexte` |
| SESSION_MEMOIRE | `session_memoire` |
| SITUATION | `assertion_situation` |
| SNAPSHOT | `snapshot` |
| SOURCE_EXTERNE_DECLAREE | `source_externe_declaree` |
| TACHE | `tache` |
| TAG | `tag` |
| TERME_HISTORIQUE | `terme_historique` |
| TRADITION | `tradition` |
| TRANSCRIPTION | `transcription` |
| TRANSFERT_GOUVERNANCE | `transfert_gouvernance` |
| TRANSMISSION | `transmission` |
| UNITE_ARCHIVISTIQUE | `unite_archivistique` |
| VEILLE | `veille` |
| VERSION_OBJET | `version_objet` |
| VOLONTE_NUMERIQUE | `volonte_numerique` |
| VOYAGE | `voyage` |
| VUE | `vue` |
| WORKSPACE | `workspace` |
| ZONE | `zone` |

## 25.2 Associations

| Association du dictionnaire | Réalisation MLD (table ou colonne) |
|---|---|
| ACCEDER | `localisation_en_ligne.porteur_id` |
| ACCUEILLIR | `micro_mission.offre_deplacement_id` |
| ACQUERIR | `acquisition_objet` |
| ACQUERIR_DOC | `acquisition_documentaire_objet` |
| ADOPTER | `position_epistemique.contexte_espace_id` |
| AFFICHER | `carte_geometrie` |
| ALIGNEMENT_REPRODUCTION | `alignement_reproduction` |
| ALIGNER | `segment_zone` |
| ANCRER | `assertion_zone` |
| ANCRER_ANNOTATION | `annotation_ancrage` |
| ANNOTER_NOTE | `note.objet_annote_id` |
| APPARTENIR | `appartenance_espace` |
| APPLIQUER | `activite_methode` |
| APPLIQUER_A | `application_protocole.cible_id` |
| APPLIQUER_METHODE | `calcul.methode_id` |
| APPORTER | `contribution_connect.participation_connect_id` |
| APPUYER | `element_appui` |
| APRES | `diff_connaissance.snapshot_apres_id` |
| ARGUMENTER | `argument.objet_vise_id` |
| ATTRIBUER_ROLE | `attribution_role` |
| AVANT | `diff_connaissance.snapshot_avant_id` |
| AVOIR_VERSION | `version_objet.objet_id` |
| A_LIEU | `etape_voyage.lieu_id` |
| BASE | `conflit_edition.base_id` |
| BENEFICIER | `regle_acces.beneficiaire_acteur_id` |
| BLOQUER | `blocage` |
| CANDIDAT | `candidature.entite_id` |
| CANDIDAT_POUR | `candidature.position_id` |
| CAPTURER | `inbox_item.compte_id` |
| CARNET | `contact` |
| CENTRE | `mission.centre_organisation_id` |
| CHERCHER | `recherche_effectuee.acteur_id` |
| CIBLE | `assertion.cible_id`, `operation_flux.espace_cible_id` |
| CIBLER | `piste_cible` |
| CIBLER_VERSION | `proposition_modification.cible_numero` |
| CIBLE_IMPORT | `import.espace_cible_id` |
| CITER | `citation` |
| CITER_DOC | `citation_documentaire_zone` |
| CLASSER | `objet_classification` |
| CLASSER_DANS | `classement_unite` |
| COMPARER | `comparaison.arbre_a_id`, `comparaison.arbre_b_id` |
| COMPORTER | `page.exemplaire_id` |
| COMPORTER_NOEUD | `noeud_arbre.arbre_id` |
| COMPOSER_DOC | `composition_documentaire` |
| COMPOSER_RECIT | `recit_assertion` |
| CONCEPT_A | `correspondance.concept_a_id` |
| CONCEPT_B | `correspondance.concept_b_id` |
| CONCERNER | `question_objet` |
| CONCERNER_TERRITOIRE | `prescription.territoire_lieu_id` |
| CONCURRENCER | `reconstruction_concurrence` |
| CONSENTIR | `consentement.personne_id` |
| CONSERVER | `unite_archivistique.organisation_conservatrice_id` |
| CONTENIR | `objet.espace_id` |
| CONTENIR_CAPSULE | `capsule_contenu` |
| CONTENIR_CONCEPT | `concept.referentiel_id` |
| CONTENIR_ELEMENT | `element_reconstruit.parent_element_id` |
| CONTENIR_EXPORT | `export_element` |
| CONTENIR_MESSAGE | `message.discussion_id` |
| CONTENIR_SNAP | `snapshot` |
| CONTENU | `transmission.contenu_objet_id` |
| CONTEXTE_REGLE | `regle_methodologique.adoptant_acteur_id`, `regle_contexte` |
| CORRIGER | `correction_publication.publication_id` |
| COTER | `identifiant_documentaire.porteur_id` |
| CREDITER | `credit` |
| CREER_CAPSULE | `capsule.auteur_acteur_id` |
| CRITERES | `cohorte_analytique.requete_id` |
| DANS | `cohorte_analytique.corpus_id` |
| DANS_CAMPAGNE | `session_memoire.campagne_id` |
| DECLARER_INTERET | `lien_interet.acteur_id` |
| DECLARER_PROFIL | `declaration_profil.acteur_id` |
| DECLARER_SOURCE | `source_externe_declaree.acquisition_id` |
| DECLENCHER | `diff_connaissance.decouverte_id`, `notification.veille_id` |
| DECOMPOSER | `vue.reproduction_id` |
| DECRIRE_ETAT | `etat_reference_externe.reference_id` |
| DEFINIR | `critere_protocole.protocole_id` |
| DEFINIR_CORPUS | `corpus.requete_id` |
| DELIMITER | `zone.vue_id` |
| DEPENDRE | `dependance.aval_id`, `dependance.amont_id` |
| DERIVER | `assertion.calcul_id` |
| DERIVER_DE | `reproduction.reproduction_parente_id` |
| DERIVE_CONCERNE | `decision_applicabilite_droit.derive_id` |
| DEROULER | `echange.session_memoire_id` |
| DESIGNER | `designation_garde.objet_cible_id` |
| DEVENIR | `workspace.devenu_objet_id` |
| DOCUMENTER | `evenement_connect.evenement_documente_id` |
| DROIT_SUR | `assertion_situation` |
| ECART_A | `ecart.objet_a_id` |
| ECART_B | `ecart.objet_b_id` |
| EMETTEUR | `transmission.emetteur_id` |
| EMETTRE | `demande.emetteur_acteur_id` |
| EPINGLER | `epingle` |
| ETAPE | `etape_voyage.voyage_id` |
| ETAT_CONNAISSANCE | `calcul.snapshot_id` |
| ETAT_CRITERE | `etat_critere` |
| ETAYER | `argument_preuve` |
| ETIQUETER | `tag_objet` |
| EVALUER | `acte_evaluation.acteur_id` |
| EVALUER_DANS | `evaluation_diffusabilite.contexte_id` |
| EVALUER_EXPORT | `export.contexte_id` |
| EVALUER_OBJET | `evaluation_diffusabilite.objet_evalue_id` |
| EVALUER_PUBLICATION | `publication.contexte_id` |
| EXECUTER | `operation_flux.acteur_id` |
| EXECUTER_CALCUL | `calcul.activite_id` |
| EXPLIQUER | `anomalie_explication` |
| EXPLORER | `piste.question_id` |
| EXPLORER_A | `lien_exploratoire.objet_a_id` |
| EXPLORER_B | `lien_exploratoire.objet_b_id` |
| EXPORTER | `export.acteur_id` |
| EXPOSER | `publication_exposition` |
| EXPRIMER | `volonte_numerique.acteur_id` |
| EXPRIMER_ASSERTION | `expression_assertion.assertion_id` |
| EXTRAITE_DE | `expression_segment` |
| FICHIER_ORIGINAL | `import.fichier_original_id` |
| FIGER | `snapshot` |
| FIGER_CORPUS | `corpus.snapshot_id` |
| FIGER_SUR | `reference_persistante.cible_numero` |
| FINANCER | `financement.projet_id` |
| FONDEE_SUR | `geometrie_assertion` |
| FONDER | `assertion_mention` |
| FOURNIR | `acquisition_information.fournisseur_acteur_id` |
| HEBERGER | `arbre` |
| HISTORIQUE | `interaction.contact_id` |
| IDENTIFIER | `proposition_identification.mention_id` |
| IDENTIFIER_EXT | `identifiant_externe.objet_id` |
| IDENTIFIER_SOURCE | `source_externe_declaree.document_identifie_id` |
| IMPORTE_DE | `arbre.import_id` |
| INCARNER | `exemplaire.document_id` |
| INCLURE | `corpus_inclusion` |
| INCLURE_LIEN | `arbre_lien` |
| INSTRUIRE | `recherche_effectuee.question_id` |
| INTERROGER | `campagne_personne` |
| INTERVENIR | `intervention_mission` |
| INTERVIEWER | `session_memoire.interviewer_acteur_id` |
| INVITER | `participation_connect.evenement_connect_id` |
| INVOQUER | `argument_acte` |
| INVOQUER_PREUVE | `base_justificative_preuve` |
| ISSUE_DE | `assertion_reponse` |
| JOINDRE | `inbox_item.fichier_id` |
| JUSTIFIER | `base_justificative.objet_justifie_id`, `lacune_recherche` |
| LIEU_DE | `assertion.lieu_id` |
| LOCALISER | `localisation_exemplaire` |
| LOCALISER_LIEU | `geometrie.lieu_id` |
| LOCALISER_MENTION | `mention_ancrage` |
| LOT | `acquisition_information.import_id` |
| MASQUER | `masquage.objet_public_id` |
| MEMBRE_DE | `position_relationnelle.collectif_id` |
| MEMBRE_GROUPE | `membre_groupe` |
| MINUTE | `echange_zone` |
| MOBILISER | `calcul_referentiel` |
| MODERER | `acte_moderation.moderateur_acteur_id` |
| MODIFIER | `decouverte_version` |
| MONTRER | `vue_page` |
| MONTRER_INDICE | `indice.echange_id` |
| MOYEN | `etape_voyage.moyen_id` |
| NAVIGUER | `historique_navigation.compte_id` |
| OBSERVER | `condition_pratique.organisation_id` |
| OBTENIR | `badge.acteur_id`, `reponse.echange_id` |
| OCCUPER | `occupation_emplacement` |
| OFFRIR | `emplacement.page_id` |
| OPPOSER | `conflit_proposition` |
| ORGANISATEUR | `evenement_connect.organisateur_acteur_id` |
| ORGANISER | `mission.projet_id` |
| ORIGINE | `erreur_propagee.origine_objet_id` |
| OUVRIR | `piste.origine_anomalie_id`, `workspace.compte_id` |
| PERIMETRE | `recherche_perimetre` |
| PLANIFIER_ITEM | `item_mission.mission_id` |
| PLANIFIER_TACHE | `tache.projet_id` |
| PLUS_LARGE | `concept.concept_parent_id` |
| POINTER_FRAGMENT | `reference_persistante.zone_id` |
| PORTER | `referentiel` |
| PORTER_SUR | `interpretation_entite` |
| PORTER_SUR_OBJET | `regle_acces.cible_objet_id` |
| PORTER_SUR_PROPOSITION | `position_epistemique.objet_vise_id` |
| PORTER_SUR_VERSION | `acte_evaluation.objet_evalue_id` |
| POSER | `campagne_question` |
| POSER_QUESTION | `echange.question_id` |
| PRECEDER | `version_objet.numero` |
| PREDICAT | `assertion.predicat_id` |
| PRESCRIRE | `prescription.norme_id`, `prescription.document_attendu_id` |
| PRESENT | `session_present` |
| PRESENTER | `anomalie_documentaire.porteur_id` |
| PRODUIRE | `version_objet.activite_id` |
| PRODUIRE_CARTE | `carte` |
| PRODUIRE_DOC | `session_memoire.document_produit_id` |
| PRODUIRE_FILIATION | `filiation.operation_flux_id` |
| PRODUIRE_OBJ | `contribution_objet` |
| PRODUIRE_RESULTAT | `resultat.calcul_id` |
| PROPOSER | `proposition_modification.proposant_acteur_id` |
| PROPOSER_ACTIVITE | `activite_connect.evenement_connect_id` |
| PROPOSER_OFFRE | `offre_deplacement.acteur_id` |
| PUBLIER | `publication` |
| QUALIFIER_VIDE | `lacune.objet_concerne_id` |
| RACINE | `arbre.racine_noeud_id` |
| RACONTER | `recit.evenement_id` |
| RANGER | `collection_objet` |
| RAPPROCHER | `rapprochement.entite_a_id`, `rapprochement.entite_b_id` |
| RATTACHER | `inbox_rattachement` |
| RATTACHER_DISCUSSION | `discussion.objet_rattache_id` |
| REALISER | `activite.acteur_id` |
| REALISER_ITEM | `recherche_effectuee.item_mission_id`, `item_mission.reproduction_id` |
| RECEPTEUR | `transmission.recepteur_id` |
| RECEVOIR | `demande.destinataire_acteur_id`, `notification.compte_id` |
| RECONCILIER | `reconciliation_import.import_id` |
| RECONSTRUIRE | `reconstruction.document_id` |
| RECONSTRUIRE_GEOM | `geometrie.calcul_id` |
| RECUEILLIR | `contribution_connect.activite_connect_id` |
| REDIRIGER_VERS | `etat_reference_externe.redirection_objet_id` |
| REFERENCE | `position_relationnelle.reference_entite_id` |
| REGROUPER | `mention_regroupement` |
| RELATION_TYPE | `position_relationnelle` |
| RELIER_PROJETS | `relation_projets` |
| REPONDRE | `interpretation_question` |
| REPRENDRE | `erreur_reprise` |
| REPRESENTE | `contact.represente_entite_id` |
| REPRESENTER | `noeud_arbre.personne_id` |
| REPRESENTER_SUR_CARTE | `carte_objet` |
| REPRODUIRE | `reproduction.exemplaire_source_id` |
| REPRODUIRE_CALCUL | `calcul.calcul_origine_id` |
| REPROPOSER | `relance.reponse_id` |
| RESPONSABILITE_SUR | `responsabilite.objet_id` |
| RESTREINDRE | `embargo.objet_cible_id` |
| RESTRICTION_AMONT | `decision_applicabilite_droit.restriction_id` |
| RESULTER | `filiation.operation_flux_id` |
| REVISER | `reponse.reponse_revisee_id` |
| ROLE | `assertion.role_id` |
| SEGMENTER | `segment.transcription_id` |
| SELECTIONNER | `selection_contexte.espace_contexte_id` |
| SE_TENIR | `evenement_connect.lieu_id` |
| SIGNALER_CONTEXTE | `annotation.communaute_signalante_id` |
| SITUER | `zone.page_id` |
| SOURCE | `operation_flux.espace_source_id` |
| SOURCER_EXT | `assertion_source_externe` |
| SOURCE_DU_RECIT | `recit.document_source_id` |
| SOUSCRIRE | `abonnement.titulaire_compte_id` |
| SOUS_ASSERTION | `assertion.assertion_parente_id` |
| SOUS_LICENCE | `objet.licence_code` |
| SOUS_QUESTION | `question.question_parente_id` |
| STOCKER | `reproduction_fichier` |
| STRUCTURER | `element_reconstruit.reconstruction_id` |
| SUIVRE | `recherche_effectuee.piste_id`, `veille.objet_suivi_id` |
| SUJET | `assertion.sujet_id` |
| SUR | `calcul.corpus_id` |
| SURVEILLER | `veille.requete_id` |
| S_APPUYER | `interpretation_appui` |
| TEMOIN | `session_temoin` |
| TENUE_PAR | `responsabilite.porteur_id` |
| TRACER | `lien_exploratoire.workspace_id` |
| TRADUIRE | `transcription.transcription_source_id` |
| TRADUIRE_EXPRESSION | `expression_assertion.expression_source_id` |
| TRANSCRIRE | `transcription.porteur_id` |
| TRANSFERER | `transfert_gouvernance.espace_transfere_id` |
| TYPER | `entite_historique`, `evenement` |
| USAGE | `usage_terme` |
| UTILISER_ENTREE | `activite_entree` |
| UTILISER_VERSION | `dependance.amont_numero` |
| VEILLER | `veille.compte_id` |
| VERS_ENTITE | `proposition_identification.entite_id` |
| VERS_POSITION | `proposition_identification.position_id` |
| VISER | `reference_persistante.cible_id` |

---

# 26. Structures propres au MLD (‡)

Ces structures n'ont pas d'équivalent direct dans le MCD ni dans le dictionnaire. Chacune est justifiée par une décision MLD ou une obligation du dictionnaire (annexe G : « une structure non rattachée est non justifiée »).

| Structure | Rôle | Justification |
|---|---|---|
| `objet.type_objet`, `UQ (id, type_objet)` et colonnes `type_objet` des tables de spécialisation | Discriminant et exclusivité des spécialisations | MLD-01 |
| `objet.est_purge`, `objet.date_purge` et `est_purge` des tables d'objet | Tombstone en place | MLD-15, DD-13 |
| `objet.version_courante`, `lien.version_courante` | Accès direct à la version courante | MLD-02, CP-02 |
| `objet.licence_code` | Réalisation de SOUS_LICENCE (0,1) dans le socle | MLD-01 (métadonnée de gouvernance) |
| `version_composant` | Manifestes des conteneurs | DD-01, MLD-02 |
| Tables `_hist` | États figés relationnels | MLD-02 |
| `v_debut`, `v_fin` des associations `[A:p]` | Versionnement par le propriétaire | MLD-02, CP-22 |
| `lien`, `lien_version`, `lien.espace_id`, `lien.visibilite` | Socle des liens gouvernables | DD-09, MLD-06 |
| `annotation_ancrage.id`, `mention_ancrage.id` | Identifiant d'un ancrage exclusif zone/segment | MLD-10 |
| `compte.espace_personnel_id` | Espace personnel du compte, porteur des objets du domaine Q | DD-07, V-4 |
| `rapprochement` : `entite_a_id < entite_b_id` ; `reconstruction_concurrence` : `a < b` | Ordre canonique d'une paire symétrique (évite les doublons A–B / B–A) | MLD-10 |
| `selection_contexte.predicat_id` | Copie du prédicat pour l'unicité déclarative | DI-F14, CP-07 |
| `message.masque`, `acte_moderation.cible_message_id` | Effet d'une modération sur un message, sans réécriture | RG-H05 |
| `lignee_import`, `import.lignee_id`, `cle_import` | Réconciliation des réimports | MLD-11, OB-10 |
| `export_element`, `export_dependance_externe`, `export_exclusion` | Manifeste relationnel et exclusions confidentielles | MLD-14, DI-P05 |
| `zone.x`, `y`, `largeur`, `hauteur`, `polygone_image` | Décomposition de `GEOM` image | MLD-05 |
| Groupes de colonnes `⟨dh⟩` et `⟨val⟩` | Décomposition de `DATE_HIST` et `VALEUR` | MLD-03, MLD-04 |
| `droit_effectif`, `graphe_accessible` (relations dérivées) | Forme logique du contrôle d'accès | MLD-13, P20 |
| `appartenance_espace.nature_habilitation`, `appartenance_espace.lecture_scientifique` | Séparation administration / lecture scientifique, sans nouvelle table | CP-25 |

---

# 27. Exemples de bout en bout

## 27.1 « Charles TANCRÈDE, âgé de 30 ans », puis relecture « 36 »

**Version 1** (identifiants abrégés) :

| Table | Ligne |
|---|---|
| `objet` | `P1` PERSONNE, espace `E-proj` ; `A1` ASSERTION ; `A2` ASSERTION ; `C1` CALCUL ; `S1` SEGMENT ; `Z1` ZONE ; `M1` MENTION |
| `segment` | `S1` : texte « Charles TANCRÈDE, âgé de trente ans », incertitude `probable` |
| `mention` | `M1` : texte_exact « Charles TANCRÈDE », nature `nominale`, statut `identifiée` |
| `proposition_identification` | `PI1` : mention `M1` → entité `P1`, plausibilité `probable` |
| `assertion` | `A1` : sujet (`P1`, PERSONNE), prédicat `age_declare`, valeur (`orig` « trente ans », `norm` 30, unité `an`, type `âge déclaré`), temps (`exacte`, 1882-06-12), niveau `attestée`, nature `attestée`, libelle_source « âgé de trente ans » |
| `assertion_zone` | (`A1`, `Z1`, rôle `principal`, `v_debut` 1) |
| `assertion` | `A2` : sujet `P1`, prédicat `naissance`, temps (`calculée`, min 1851-06-13, max 1852-06-12, `prec` jour), nature `dérivée`, `calcul_id` `C1` |
| `dependance` | `D1` : aval `A2`, amont `A1`, `amont_numero` 1, catégorie `production`, type `dérivation/calcul` |

**Relecture** : `segment` S1 passe en version 2 (« trente-six ans »), puis `assertion` A1 en version 2 (valeur 36), chacune avec `nature_changement = changement scientifique` et un motif. `segment_hist` et `assertion_hist` gardent les versions 1. CP-21 passe `D1.etat_impact` à `potentiellement affecté`. `A2` n'est pas modifiée. La question « date de naissance de Charles » passe à `à réexaminer`.

**« Que pensions-nous le 1ᵉʳ janvier 2029 ? »** : `etat_objet_a(A1, 2029-01-01)` renvoie la version 1 (30 ans) si la relecture est postérieure.

## 27.2 « L'un des fils de Jean DUPONT »

| Table | Ligne |
|---|---|
| `mention` | `M2` : « l'un des fils de Jean DUPONT », nature `relationnelle`, statut `structure non résolue` |
| `position` / `position_relationnelle` | `POS1` : description identique, nature `un parmi des candidats`, `reference_entite_id` = Jean, `relation_type_id` = concept `parent_de` |
| `proposition_identification` | mention `M2` → position `POS1` |
| `candidature` | (`POS1`, Pierre, `possible`, `en lice`) ; (`POS1`, Louis, `possible`, `en lice`) ; (`POS1`, François, `faible`, `écartée provisoirement`, motif « né après l'acte ») |

Aucune ligne `personne` « Inconnu DUPONT ».

## 27.3 Arsène CHARBONNÉ dans deux arbres

| Table | Ligne |
|---|---|
| `espace` | `EA` (privé, compte A) ; `EB` (privé, compte B) ; `CORE` (Core partagé) |
| `personne` | `PA` (espace `EA`) ; `PB` (espace `EB`) ; `PC` (espace `CORE`) |
| `noeud_arbre` | (arbre de A, `PA`) ; (arbre de B, `PB`) |
| `rapprochement` | (`PA`, `PC`, `même entité`, portée `privé→Core partagé`) dans `EA` ; (`PB`, `PC`, `même entité`, portée `privé→Core partagé`) dans `EB` |

Aucune ligne ne relie `EA` et `EB`. Les rapprochements vivent chacun dans l'espace privé de leur auteur : le Core ne voit pas qui l'a rapproché (P19). Une contribution de A crée une `operation_flux`, une nouvelle `assertion` dans `CORE` et une `filiation` vers la version d'origine.

---

# 28. Passage au MPD

## 28.1 Décisions MPD et contraintes fixées par le MLD

| ID | Décision MPD | Ce que le MLD impose |
|---|---|---|
| MPD-01 | Indexation | Index au moins sur : `objet(espace_id, type_objet)` ; `assertion(sujet_id, predicat_id)`, `assertion(cible_id)`, `assertion(temps_min, temps_max)` ; `dependance(amont_id)` et `dependance(aval_id)` ; toutes les colonnes `v_fin IS NULL` (index partiels) ; spatial sur `geometrie.geom` ; texte intégral sur `segment.texte` et `mention.texte_exact` **filtré par le graphe accessible** |
| MPD-02 | Matérialisation, caches | `droit_effectif`, `graphe_accessible`, vues de lecture : caches **par contexte**, invalidés par les versions des objets, règles et appartenances concernés |
| MPD-03 | Seuil de petit effectif | Appliqué à toute agrégation diffusée (§ 22.3) |
| MPD-04 | Délai de propagation | Délai maximal de CP-21 |
| MPD-05 | Chiffrement | Colonnes de confidentialité `I` (`compte.email`, `compte.identite_civile`, `contact.coordonnees_privees`, `fichier.emplacement_stockage`…) chiffrées au repos ; clés hors base |
| MPD-06 | Moteur d'autorisation | Doit appliquer l'ordre du § 22.2 et produire des réponses indistinguables (OB-04) ; si RLS : politiques sur les vues d'accès, pas seulement sur les tables |

## 28.2 Volumétrie attendue (ordre de grandeur, pour dimensionner)

Les tables les plus volumineuses seront, dans l'ordre : `segment` et `segment_hist`, `assertion` et ses tables d'ancrage, `version_objet`, `activite`, `zone`, `mention`, `dependance`. Les tables `_hist` grossissent avec le nombre de corrections, pas avec le nombre d'objets ; le partitionnement par date de version est une option MPD.

---

# 29. Points à valider

| # | Point | Pourquoi le valider |
|---|---|---|
| V-1 | Héritage par tables de classes, avec exception `interpretation` en table unique (MLD-01) | Structure tout le schéma ; le coût est un nombre élevé de jointures 1:1 pour lire un objet complet |
| V-2 | Historique par tables `_hist` miroir (MLD-02) | Double le nombre de tables ; alternative « tables temporelles » natives à étudier au MPD |
| V-3 | Purge en place avec colonnes de contenu nullables `NN*` (MLD-15) | Les obligations deviennent des `CHECK` ; à confirmer avec l'étude juridique (droit à l'effacement) |
| V-4 | Espace personnel unique par compte (`compte.espace_personnel_id` ‡) | Simplifie le rattachement des objets personnels (workspace, inbox, notes) |
| V-5 | Rapprochements vivant dans l'espace de leur auteur | Garantit qu'un utilisateur ne découvre pas les rapprochements des autres ; le Core ne sait donc pas combien d'arbres pointent une entité |
| V-6 | `lignee_import` ‡ pour la réconciliation (MLD-11) | Suppose que l'utilisateur désigne la source lors d'un réimport |
