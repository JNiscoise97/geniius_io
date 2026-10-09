# GENIIUS — Dictionnaire de données V1.1 consolidé

## Définitions exhaustives des entités, associations et attributs du MCD V1.1 canonique

- **Statut :** dictionnaire de données de référence — **GELÉ le 9/10/2026** (décision explicite du porteur), après conformité des deux contrôles formels de l’annexe I : REC-01 et [REC-16](GENIIUS_DICTIONNAIRE_REC16_COUVERTURE_95_TESTS.md). Toute modification ultérieure suit la procédure de changement (CDC technique, § 13) et met à jour le [registre des versions normatives](GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md).
- **Révision du 9/10/2026 (audit de cohérence, ECD-04 et ECD-05) :**
  - ajouts `†` : ESPACE (réplication hors ligne), REGLE_ACCES (`nature`, `fondement`, DI-B29, DI-B30), CONTEXTE_EVALUATION (réplication, synchronisation, règle exceptionnelle, appareil), entité CONTRIBUTION_DIFFEREE (§ 4.25, DI-B31 à B33) ;
  - nouvelles obligations OB-20 à OB-22 ;
  - aucune règle existante n'est modifiée.
- **Version :** V1.1 consolidé = corps V1 (7/10/2026) + annexes G à J. C'est le document désigné par le MLD sous le nom `GENIIUS_DICTIONNAIRE_DONNEES_V1_1_CONSOLIDE.md`. *En-tête corrigé le 9/10/2026 (correction ECD-01) ; il indiquait auparavant « V1.0 — première version, à soumettre à validation ». Le contenu n'est pas modifié.*
- **Date :** 7 octobre 2026
- **Sources :** CDCF V1.1 (`docs/geniius_io_CDCF_V1.md`) ; MCD V1.1 canonique gelé (`docs/geniius_io_MCD_V1.md`) ; rapport de réexécution des 95 tests (`docs/GENIIUS_RAPPORT_REEXECUTION_95_TESTS_MCD_V1_1.md`)
- **Position dans la feuille de route :** étape suivant le gel du MCD, précède le modèle logique (MLD)

---

# 0. Objet et règles du document

## 0.1 Ce que fait ce dictionnaire

Pour chaque entité, association et attribut du MCD V1.1, il fixe : la définition exacte, le type conceptuel, le caractère obligatoire ou facultatif, le domaine de valeurs, les cardinalités, les règles d'intégrité, les valeurs interdites, un exemple, la provenance, le versionnement, la confidentialité et l'identifiant.

Il **tranche** aussi les points que le MCD avait laissés ouverts (§ 2) : granularité des versions, référentiels initiaux, seuil d'individualisation, indépendance des sources, schéma d'identifiants, gouvernance des arêtes, répartition `COMPTE` / `ACTEUR_GENIIUS`.

## 0.2 Ce qu'il ne fait pas

Les types restent **conceptuels** (`DATE_HIST`, `TEXTE_SOURCE`, `REF_CONCEPT`…), pas des types SQL. Le choix des tables, des index, des clés étrangères physiques, de la stratégie de stockage des versions et des politiques RLS relève du MLD et du MPD. Le dictionnaire impose en revanche ce que ces couches devront garantir.

## 0.3 Règle de maintien du gel du MCD

Le dictionnaire peut **préciser** le MCD : ajouter des attributs, fixer des formats, lever une ambiguïté de cardinalité, réifier une association pour la rendre gouvernable. Il ne peut **pas** ajouter de concept fondamental ni contredire un invariant (P1–P22).

Tout ajout par rapport au MCD est marqué **†** et récapitulé en annexe C, pour que le MCD puisse être aligné lors d'une prochaine révision éditoriale sans être rouvert conceptuellement.

---

# 1. Conventions

## 1.1 Structure d'une fiche

Chaque entité est décrite par une fiche :

- **Définition** — ce que représente une occurrence, et ce qu'elle ne représente pas.
- **Identifiant** — attribut identifiant et règle d'unicité métier éventuelle.
- **Héritage** — super-type et spécialisations.
- **Participe à** — associations du MCD (cardinalités détaillées dans le tableau des associations du domaine).
- **Versionnement** et **confidentialité** — comportement par défaut de l'entité.
- **Intégrité** — règles portant sur l'entité entière (`DI-<domaine><n°>`).
- **Exemple** — une occurrence réaliste.
- **Attributs** — tableau détaillé.

Les attributs hérités d'`OBJET` (§ 3.1) ne sont pas répétés dans les fiches des entités **Obj. ✓**.

## 1.2 Types conceptuels

| Type | Définition | Contraintes générales |
|---|---|---|
| `IDENT` | Identifiant opaque, non signifiant, attribué par le système | Immuable ; jamais réutilisé, même après suppression ; format défini en DD-02 |
| `URI` | Identifiant résoluble | Schéma `geniius:` interne ou ARK public (DD-02) |
| `CODE` | Valeur d'une énumération **fermée** de gouvernance (§ 22 du MCD, annexe B) | Uniquement une valeur listée ; pas de texte libre |
| `REF_CONCEPT` | Référence à un `CONCEPT` d'un `REFERENTIEL` versionné | Le concept doit être actif dans un référentiel accessible depuis l'espace de l'objet |
| `TEXTE_COURT` | Texte libre d'une ligne | ≤ 500 caractères ; Unicode NFC |
| `TEXTE_LONG` | Texte libre multilignes | Unicode NFC ; Markdown autorisé si précisé |
| `TEXTE_SOURCE` | Texte **verbatim** tel que lu ou dit | Aucune normalisation de casse, d'orthographe, d'accentuation ni de vocabulaire ; seule la normalisation Unicode NFC est permise ; jamais censuré |
| `BOOLEEN` | Vrai / faux | Pas de troisième état : l'inconnu est l'absence de valeur sur un attribut facultatif |
| `ENTIER` | Nombre entier | Bornes précisées par attribut |
| `DECIMAL` | Nombre décimal | Précision précisée par attribut |
| `HORODATAGE` | Instant du **temps épistémique** ou technique | UTC, précision milliseconde ; attribué par le système sauf mention contraire |
| `DATE_HIST` | Date historique incertaine (type composé, § 21) | Voir DD-10 |
| `PERIODE_HIST` | Couple (début, fin) de `DATE_HIST` | Début ≤ fin lorsque les deux sont bornés |
| `VALEUR` | Valeur déclarée ou mesurée (type composé, § 21) | Valeur originale toujours conservée |
| `GEOM` | Géométrie (type composé, § 21) | Voir DD-16 |
| `EMPREINTE` | Empreinte cryptographique | SHA-256, hexadécimal minuscule, 64 caractères |
| `ETAT_FIGE` | État sérialisé complet d'un objet à une version | Format documenté et versionné (format patrimonial, DD-02) |
| `LANGUE` | Code de langue | BCP 47 (`fr`, `gcf` pour le créole guadeloupéen, `la`, `fr-x-…` pour les variétés non codifiées) |
| `ECRITURE` | Système d'écriture | ISO 15924 (`Latn`, `Arab`, `Deva`…) |
| `MONNAIE` | Monnaie, y compris historique | `REF_CONCEPT` du référentiel des monnaies (annexe A.6) ; pas ISO 4217 seul |
| `UNITE` | Unité de mesure, y compris ancienne | `REF_CONCEPT` du référentiel des unités (annexe A.6) |

## 1.3 Obligation

| Code | Sens |
|---|---|
| `1` | Obligatoire, une seule valeur |
| `0..1` | Facultatif, au plus une valeur |
| `1..n` | Obligatoire, plusieurs valeurs possibles |
| `0..n` | Facultatif, plusieurs valeurs possibles |
| `C` | Conditionnel : obligatoire si la condition indiquée dans la colonne « Contraintes » est remplie, interdit sinon sauf mention contraire |

**Absence ≠ inexistence (TI-07).** L'absence de valeur sur un attribut facultatif signifie toujours « non renseigné ». Pour exprimer qu'une chose n'existe pas, qu'elle est inconnue pour une raison connue ou qu'elle a été cherchée en vain, on utilise `LACUNE`, une assertion de polarité négative ou une `RECHERCHE_EFFECTUEE` — jamais l'absence d'une valeur.

## 1.4 Codes P·V·C

La dernière colonne de chaque tableau d'attributs condense trois informations.

| Lettre | Provenance (P) | Versionnement (V) | Confidentialité (C) |
|---|---|---|---|
| `S` | Saisie humaine (via une `ACTIVITE` manuelle ou assistée) | — | — |
| `A` | Production automatique (OCR, détection, suggestion) ; soumise à `etat_examen` | — | — |
| `C` | Calculée par le système à partir d'autres données ; non saisissable | — | — |
| `Y` | Attribuée par le système (identifiants, horodatages) | — | — |
| `I` | Importée (porte une `ACQUISITION_INFORMATION`) | — | — |
| `F` | — | **Figé** : fixé à la création ; tout changement impose un nouvel objet relié par `FILIATION` | — |
| `V` | — | **Versionné** : toute modification crée une `VERSION_OBJET` | — |
| `D` | — | **Dérivé** : recalculé, non versionné en propre ; traçable par ses sources | — |
| `N` | — | **Journal** : hors versionnement d'objet ; append-only, jamais modifié | — |
| `O` | — | — | Suit les règles d'accès de l'objet porteur |
| `X` | — | — | **Révèle l'existence** d'un autre objet ou lien : filtré par `CONTEXTE_EVALUATION` avant toute opération (P20) |
| `R` | — | — | **Restreint renforcé** : jamais diffusé hors de l'espace sans `EVALUATION_DIFFUSABILITE` favorable explicite (personnes vivantes, mineurs, biométrie, coordonnées privées) |
| `I` | — | — | **Interne plateforme** : jamais exposé par API, export ou publication ; visible uniquement du titulaire et des fonctions habilitées |

Exemple : `S/I·V·O` = saisi ou importé, versionné, suit les droits de l'objet.

## 1.5 Règles transverses d'intégrité (TI)

Elles s'appliquent à toutes les fiches sans être répétées.

- **TI-01 — Pas de mise à jour en place.** Aucun attribut d'un objet **Obj. ✓** n'est modifié sans nouvelle `VERSION_OBJET` produite par une `ACTIVITE` (RG-A01).
- **TI-02 — Les liens sont des associations.** Un lien vers un autre objet n'est jamais un attribut libre (« id_personne » dans un champ texte). Il passe par une association du MCD, ce qui le rend versionnable, gouvernable et traçable.
- **TI-03 — Verbatim intouchable.** Un attribut `TEXTE_SOURCE` n'est jamais réécrit par normalisation, correction d'une autre source ou modération. Sa seule évolution possible est une nouvelle lecture (nouvelle version motivée).
- **TI-04 — Temps épistémique système.** Les `HORODATAGE` de création, de validité et d'activité sont attribués par le système, jamais saisis. Une date de saisie rétroactive (« je l'ai trouvé en 2019 ») est une `DATE_HIST` portée par une assertion ou une `ACQUISITION_*`.
- **TI-05 — Pas de score numérique de vérité.** Aucun attribut du Core ne stocke un pourcentage de confiance, de complétude ou de qualité. Un score produit par un algorithme n'existe que dans un `RESULTAT` relié à sa `METHODE` (DD-14).
- **TI-06 — Valeur « autre ».** Lorsqu'un `CODE` prévoit `autre`, une précision textuelle `…_precision` (`TEXTE_COURT`) devient obligatoire.
- **TI-07 — Absence ≠ inexistence.** Voir § 1.3.
- **TI-08 — Pas de valeur sentinelle.** Sont interdites dans tout attribut les valeurs fabriquées pour combler un vide : `01/01/1900`, `00/00/0000`, `1er janvier` d'une année approximative, `Inconnu`, `Inconnue`, `X`, `NN`, `N.`, `?`, `-`, `0` comme âge inconnu, coordonnées `0,0`, chaîne vide. Le vide se laisse vide (et se qualifie par `LACUNE` si utile).
- **TI-09 — Libellés techniques non historiques.** `libelle_technique`, `libelle_travail`, `libelle_affichage` sont des conventions d'interface : jamais exportés comme donnée historique, jamais sujets d'assertion.
- **TI-10 — Monotonie de visibilité.** La visibilité d'un lien (association gouvernée, DD-09) est toujours inférieure ou égale à la plus restrictive des visibilités de ses extrémités.
- **TI-11 — Pas de fuite par l'identifiant.** Tout attribut marqué `X` est retiré, et non masqué, des réponses où l'objet visé n'est pas accessible dans le contexte. Une réponse ne doit pas permettre de distinguer « absent » de « caché » lorsque la règle protège l'existence (test de non-régression 20).
- **TI-12 — Données sensibles vers l'IA.** Aucun attribut marqué `R` ou `I` n'est transmis à un fournisseur externe d'IA. Une transmission d'attributs `O` est tracée sur l'`ACTIVITE` (`fournisseur`, `perimetre_donnees_transmises`, DD-15).

---

# 2. Décisions tranchées

Chaque décision indique la question, la décision prise, sa justification et sa réversibilité. Les décisions **DD-01 à DD-06** répondent aux points ouverts du MCD § 25.3 et au rapport de tests § 7. Les suivantes lèvent des ambiguïtés apparues pendant la rédaction du dictionnaire.

## DD-01 — Granularité des versions

**Question.** Versionner chaque `SEGMENT` ou la `TRANSCRIPTION` entière ? Plus généralement, à quel grain naît une version ?

**Décision.**

1. **Grain = l'objet citable ou contestable le plus fin.** Chaque objet **Obj. ✓** a ses propres versions. Un `SEGMENT`, une `ZONE`, une `ASSERTION`, une `CANDIDATURE`, un `ELEMENT_RECONSTRUIT` sont versionnés individuellement.
2. **Les conteneurs sont versionnés par manifeste.** `TRANSCRIPTION`, `RECONSTRUCTION`, `PROTOCOLE`, `CORPUS`, `REFERENTIEL`, `ARBRE`, `PUBLICATION`, `SNAPSHOT`, `BASE_JUSTIFICATIVE` : leur `etat_fige` contient leurs propres attributs **et la liste des `id_version` de leurs composants** à cet instant. Une modification d'un composant ne crée pas automatiquement de version du conteneur.
3. **Une version de conteneur naît aux jalons** : enregistrement explicite du conteneur, changement de statut, citation figée, inclusion dans un snapshot, une publication ou un export, création d'une dépendance aval vers le conteneur.
4. **Les sauvegardes automatiques ne créent pas de version.** Une version naît à chaque enregistrement explicite, changement de statut, ou dès qu'un tiers ou un objet peut la référencer (citation, dépendance, évaluation, snapshot, export, publication).
5. **Une version déjà référencée n'est jamais compactée ni supprimée**, hors purge légale (DD-13).

**Justification.** Les citations de ligne et de zone (CDCF § 87), la localisation du désaccord au niveau de la lecture (§ 5.3) et la propagation fine des dépendances (§ 5.4) imposent un grain fin. Le manifeste évite de créer une version de transcription à chaque mot corrigé, tout en permettant de citer « la transcription telle qu'elle était le 12/05/2028 ».

**Réversibilité.** Élevée : passer à un grain plus grossier ne perd aucune information.

## DD-02 — Identifiants persistants

**Décision.**

| Élément | Format | Règle |
|---|---|---|
| `id_objet` | UUID version 7 (ordonné dans le temps) | Opaque ; ne code ni type, ni espace, ni date métier |
| `id_version` | `<id_objet>@<numero>` | `numero` séquentiel sans trou à partir de 1 |
| `uri_persistante` | `geniius:<id_objet>` | Résoluble dans GENIIUS selon les droits |
| Identifiant public | ARK `ark:/<NAAN>/g<base32(id_objet)>` | Attribué à la **première publication** ou à la première citation figée externe ; jamais retiré (une page de tombstone remplace le contenu supprimé) |
| Identifiants des journaux (`ACTIVITE`, `NOTIFICATION`…) | UUID v7 | Non publiés |

Un identifiant n'est jamais réutilisé, même après suppression effective. La fusion logique (`RAPPROCHEMENT`) ne supprime aucun identifiant (RG-F04).

**Justification.** CDCF § 40, § 87, § 88 ; RG-A05. L'ARK n'est attribué qu'à la publication pour éviter de rendre résoluble publiquement l'existence d'objets privés (P19).

## DD-03 — Référentiels initiaux

**Décision.** GENIIUS livre un référentiel commun **`GENIIUS-COMMUN` v1**, dont le contenu initial est fixé en annexe A :

- A.1 types d'entité (hiérarchie) ;
- A.2 prédicats d'assertion, **avec leur signature** (types de sujet admis, cible ou valeur attendue, profil d'assertion) ;
- A.3 rôles (participation, responsabilité documentaire) ;
- A.4 types documentaires ;
- A.5 natures d'événement ;
- A.6 monnaies, unités, calendriers ;
- A.7 systèmes d'identifiants externes.

Les professions, statuts juridiques fins, termes locaux et types de biens **ne sont pas** pré-remplis au-delà de quelques exemples : ils sont créés dans des référentiels personnels, projet ou communautaires, puis proposés au commun (RG-R01).

Les domaines `D-xx` du MCD sont répartis en **énumérations fermées** (gouvernance, statuts, cycles) et **référentiels** (description du monde historique). La répartition est donnée en annexe B.

**Justification.** P14, CDCF § 31.3. Un référentiel commun minimal est nécessaire pour que les assertions de deux projets soient comparables. Un référentiel maximal imposerait une ontologie mondiale, que le CDCF exclut (§ 116).

## DD-04 — Seuil d'individualisation

**Décision.**

- **Espace privé, familial ou projet :** aucun seuil. Une `PERSONNE` peut être créée sans nom, sans date et sans lieu, avec un simple `libelle_travail`.
- **Core partagé :** la création d'une entité historique (`PERSONNE` comprise) exige au moins **une trace** — une `PROPOSITION_IDENTIFICATION` depuis une `MENTION`, ou une `ASSERTION` ancrée — **et** une `note_individualisation` non vide qui explique pourquoi la trace désigne un individu distinct. Un nom n'est jamais exigé.

**Justification.** CDCF § 6.2 (pas de seuil universel), § 106.4 (« plus le statut monte, plus la rigueur augmente »), P13. Le rapport de tests (§ 7) classe ce point en gouvernance, ce que la décision respecte : elle ne change aucune structure.

## DD-05 — Indépendance des sources

**Décision.** L'indépendance entre deux traces est **calculée**, jamais stockée comme attribut d'un document. Le calcul parcourt le graphe accessible (P20) : `CITATION_DOCUMENTAIRE`, lignée de `REPRODUCTION`, `TRANSMISSION`, lot d'`ACQUISITION_INFORMATION`, `ERREUR_PROPAGEE`.

Résultat sur trois niveaux : **dépendance établie** / **aucune dépendance connue** / **indépendance établie**. Le niveau « indépendance établie » ne peut résulter que d'un `ACTE_EVALUATION` humain argumenté ; le calcul seul ne produit jamais mieux que « aucune dépendance connue » (CDCF § 112).

Une matérialisation (cache) est une optimisation du MPD. Elle est alors un `RESULTAT` de `mode = dynamique`, invalidé par toute nouvelle version des objets parcourus.

## DD-06 — Périmètre de Connect

**Décision.** Le dictionnaire décrit les entités Connect du MCD telles quelles. Les listes `type` d'`EVENEMENT_CONNECT` et d'`ACTIVITE_CONNECT` sont des **référentiels** (annexe B), pas des énumérations fermées : le catalogue de jeux pourra s'étendre sans révision du dictionnaire. Le détail des jeux relève de l'architecture fonctionnelle de Connect (CDCF § 115, phase 2).

## DD-07 — `UTILISATEUR` = `COMPTE` + `ACTEUR_GENIIUS`

**Question.** Le MCD § 4.5 réinterprète `UTILISATEUR` comme `COMPTE` et introduit `ACTEUR_GENIIUS` (P16), mais les domaines A à Q relient encore leurs associations à `UTILISATEUR`.

**Décision.** Chaque association du MCD qui cite `UTILISATEUR` est rattachée à l'une des deux entités :

| Rattachée à `ACTEUR_GENIIUS` (identité contributive durable) | Rattachée à `COMPTE` (identité d'accès, personnelle) |
|---|---|
| REALISER (activité) ; EVALUER ; CREDITER ; OBTENIR (badge) ; DECLARER_PROFIL ; APPARTENIR ; ATTRIBUER_ROLE ; MEMBRE_GROUPE ; BENEFICIER (règle d'accès) ; DECLARER_INTERET ; PROPOSER (modification) ; décideur ; MODERER ; CHERCHER ; INTERVENIR (mission) ; PROPOSER_OFFRE ; demandeur de micro-mission ; DECOUVERTE ; EMETTRE / RECEVOIR (demande) ; TRANSFERER ; DESIGNER ; EXECUTER (flux) ; EXPORTER ; CREER_CAPSULE ; EXPRIMER (volonté) ; INTERVIEWER ; ORGANISATEUR (Connect) ; auteur de MESSAGE ; adoptant de règle ; assignation de TACHE ; contact représentant un utilisateur | OUVRIR (workspace) ; CAPTURER (inbox) ; NAVIGUER ; VEILLER ; RECEVOIR (notification) ; SOUSCRIRE ; BLOQUER ; LIEN_COMPTE_PERSONNE (ex-`REVENDICATION`) ; NOTE privée (via l'espace personnel du compte) |

Les attributs de l'`UTILISATEUR` du MCD sont répartis : `identite_civile`, `email`, `niveau_verification_identite`, `etat_compte`, `date_inscription`, `categories_sollicitation_acceptees` → `COMPTE` ; `mode_affichage_public`, `pseudonyme` → `ACTEUR_GENIIUS`.

`REVENDICATION` (MCD § 4.2) et `LIEN_COMPTE_PERSONNE` (MCD § 4.5) désignent le **même** concept ; seul `LIEN_COMPTE_PERSONNE` est conservé.

**Justification.** P16, RG-B08 à RG-B10, test de non-régression 6 : supprimer un compte ne doit pas effacer l'attribution scientifique. Les droits sont attachés à l'acteur pour survivre à un changement de compte (RG-B09).

## DD-08 — `CHOIX_AFFICHAGE` généralisé en `SELECTION_CONTEXTE`

**Décision.** `SELECTION_CONTEXTE` (MCD § 8.5) remplace `CHOIX_AFFICHAGE`. Une sélection a un `usage` (`affichage`, `export`, `calcul`, `publication`, `arbre`) ; `CHOIX_AFFICHAGE` correspond à `usage = affichage`. La forme retenue est une `ASSERTION` existante, jamais une valeur saisie dans la sélection.

## DD-09 — Gouvernance des arêtes

**Question.** RG-B11 et RG-B12 rendent les liens gouvernables « au même titre que les nœuds », mais `DEPENDANCE`, `FILIATION` et plusieurs associations porteuses ne sont pas des `OBJET` dans le MCD.

**Décision.**

1. Les associations porteuses suivantes, qui ne sont pas des `OBJET` dans le MCD, sont **réifiées** au dictionnaire : elles reçoivent un identifiant propre (`id_lien`, `IDENT`) et peuvent être la portée d'une `REGLE_ACCES` (`cible_type = lien`) : `DEPENDANCE` (et ses trois catégories), `FILIATION`, `REFERENCE_INTER_ESPACE`, `RESPONSABILITE`, `CREDITER`. Les objets qui jouent déjà un rôle de lien et sont **Obj. ✓** (`RAPPROCHEMENT`, `CANDIDATURE`, `PROPOSITION_IDENTIFICATION`, `CITATION_DOCUMENTAIRE`, `TRANSMISSION`, `ASSERTION` de profil `RELATION`) sont gouvernables nativement.
2. La visibilité par défaut d'un lien est la plus restrictive de celles de ses extrémités. Elle peut être restreinte davantage, jamais élargie au-delà (TI-10).
3. Les autres associations (non porteuses ou purement techniques) suivent la visibilité de leur extrémité la plus restrictive, sans gouvernance propre.

**Justification.** Tests de non-régression 4 (relation privée entre deux personnes publiques), 9, 10, 11 et 20.

## DD-10 — Règles de `DATE_HIST`

**Décision.**

- `borne_min` et `borne_max` sont exprimées dans le **calendrier grégorien proleptique**, au format ISO 8601 tronqué à la précision (`1840`, `1840-03`, `1840-03-12`). Le calendrier d'origine est conservé dans `calendrier` et l'expression d'origine dans `expression_originale`.
- `expression_originale` est obligatoire dès que la date provient d'une source ou d'une saisie humaine. Une date `calculée` porte à la place la référence au `CALCUL` qui l'a produite (par l'assertion qui la porte).
- Cohérences imposées :

| `type_date` | `borne_min` | `borne_max` | Précision |
|---|---|---|---|
| exacte | = `borne_max` | = `borne_min` | jour, mois ou année selon la source |
| approximative, vers | renseignée | renseignée | la largeur de l'intervalle traduit l'approximation ; jamais une date unique |
| intervalle | renseignée | renseignée | min ≤ max |
| avant | vide | renseignée | — |
| après | renseignée | vide | — |
| calculée, déduite, estimée | au moins une borne | au moins une borne | — |
| inconnue | vide | vide | vide |

- **Interdits :** convertir « vers 1840 » en `1840-01-01` ou en `type_date = exacte` ; convertir un âge déclaré en date de naissance dans une `DATE_HIST` attestée (c'est une assertion dérivée, RG-G02).

## DD-11 — Statuts dérivés non saisissables

Le statut de validation est dérivé de la séquence des actes d'évaluation (RG-H01).

`OBJET.statut_validation`, `ETAT_REFERENCE_EXTERNE` courant (`REFERENCE_INTER_ESPACE.etat_courant`), `RESULTAT.fraicheur` et `ASSERTION.premiere_attestation` / `derniere_attestation` (si matérialisées) sont **dérivés** (`C·D`). Toute tentative de les saisir directement est rejetée ; on agit sur les objets sources (actes d'évaluation, états de référence, versions amont).

## DD-12 — Énumérations fermées et référentiels

Les domaines du MCD qui décrivent le **monde historique** (natures, rôles, types, couches, modèles de parenté, référentiels spatiaux, types de méthodes…) deviennent des référentiels (`REF_CONCEPT`) initialisés par `GENIIUS-COMMUN` v1. Les domaines de **gouvernance** (cycles de vie, statuts de validation, visibilité, plausibilité, états de mémoire, niveaux de consultation…) restent des `CODE` fermés : les modifier exige une nouvelle version du dictionnaire. Répartition détaillée : annexe B.

## DD-13 — Suppression, purge et rétention

| État (`etat_cycle_vie`) | Effet sur le contenu | Effet sur les versions | Effet sur les dépendances |
|---|---|---|---|
| archivé | Inchangé, hors des vues courantes | Inchangées | Aucun |
| corbeille | Masqué au propriétaire seul, restaurable | Inchangées | Aval signalé « potentiellement affecté » si l'objet est une preuve |
| suppression demandée | Masqué ; délai de réflexion (MPD) | Inchangées | Idem |
| supprimé | **Purgé** : attributs vidés, fichiers effacés | `etat_fige` purgé, `statut_contenu = purgé` ; l'identifiant et le numéro subsistent (tombstone) | Aval signalé « preuve n'est plus disponible dans GENIIUS » (≠ « n'a jamais existé », CDCF § 97) |
| conservation légitime | Conservé au minimum nécessaire (attribution, obligation légale) | Conservées | Aucun |

Interdits : conserver secrètement une copie supprimée pour sauver une conclusion (CDCF § 97) ; réutiliser un identifiant ; supprimer un `ACTE_EVALUATION` passé du seul fait de la suppression d'une preuve (RG-H04). La suppression d'un `COMPTE` n'entraîne pas celle de l'`ACTEUR_GENIIUS` lorsque la conservation de l'attribution est légitime (RG-B08).

## DD-14 — Plausibilité qualitative

L'échelle `D-19` (forte, probable, possible, faible, écartée provisoirement, rejetée, indéterminée) est la **seule** expression de certitude stockée dans le Core. Elle est fermée et ordonnée de `forte` à `faible` ; `écartée provisoirement`, `rejetée` et `indéterminée` sont hors ordre. Un score algorithmique (similarité, proposition de candidats) n'existe que dans un `RESULTAT`. Le passage d'un score à une plausibilité est une action humaine tracée.

## DD-15 — Traçabilité des usages d'IA

`ACTIVITE` reçoit deux attributs † : `fournisseur` (prestataire externe éventuel) et `perimetre_donnees_transmises` (catégories d'attributs envoyées). Ils sont obligatoires dès qu'une donnée quitte la plateforme (CDCF § 93.3, § 93.4 ; TI-12).

## DD-16 — Géométries et coordonnées

- **Géographique :** WGS 84 (EPSG:4326), longitude puis latitude. Une projection différente n'est admise que si elle est déclarée dans `GEOM.systeme`.
- **Image :** pixels de la `VUE` maîtresse, origine en haut à gauche ; la `VUE` porte † `largeur_px` et `hauteur_px`. Une région IIIF est dérivable de ces valeurs.
- **Temps média :** millisecondes depuis le début de la piste.
- **Interdits :** coordonnées `0,0` par défaut ; un point pour un lieu connu seulement de manière relative (RG-N01) ; réutiliser les coordonnées d'une ancienne reproduction sur une nouvelle sans `ALIGNEMENT_REPRODUCTION` (MCD § 5.5).

## DD-17 — Le Core partagé est un espace unique

Il existe exactement **un** `ESPACE` de `type_espace = Core partagé`. Il existe en revanche autant d'espaces `publication publique` que nécessaire (un par espace publiant, ou un global ; choix MPD sans effet conceptuel).

## DD-18 — Règles d'accès : interdiction prioritaire et protection de l'existence

`REGLE_ACCES` reçoit deux attributs † : `effet` {autoriser, interdire} et `objet_protege` {contenu, existence}. L'interdiction l'emporte toujours sur l'autorisation. Une règle `objet_protege = existence` retire l'objet ou le lien du graphe accessible pour les bénéficiaires visés, avant toute recherche, traversée, agrégation, comptage, export ou notification (P20, RG-B11).

---

# 3. Domaine A — Socle transversal

## 3.1 OBJET — super-type abstrait

**Définition.** Tout objet de connaissance ou de travail identifiable, versionnable, citable et soumis à des droits. N'est jamais instancié seul : toute occurrence est d'un sous-type **Obj. ✓**.

**Identifiant.** `id_objet`.

**Héritage.** Super-type de toutes les entités marquées ✓.

**Participe à.** CONTENIR, REFERENCE_INTER_ESPACE, AVOIR_VERSION, DEPENDRE (aval, amont), DERIVER (filiation), VISER, IDENTIFIER_EXT, SOUS_LICENCE, RESTREINDRE, CLASSER, MASQUER, REGLE_ACCES (portée), ARGUMENTER, CREDITER, ETIQUETER, RANGER, EPINGLER, RATTACHER_DISCUSSION, ANNOTER_NOTE, CITER.

**Versionnement.** Chaque modification crée une `VERSION_OBJET` (TI-01) ; grain et manifestes selon DD-01.

**Confidentialité.** Portée par les règles d'accès de l'objet et de son espace ; les restrictions ajoutées s'appliquent à toutes les versions existantes (cf. § 3.2).

**Intégrité.**

- **DI-A01** — Un objet appartient à exactement un espace (CONTENIR 1,1) ; ce rattachement est figé : changer de régime crée un nouvel objet et une `FILIATION` (RG-A02, RG-A03).
- **DI-A02** — Un objet a au moins une version ; sa version courante est celle dont `date_fin_validite` est vide.
- **DI-A03** — Transitions de `etat_cycle_vie` autorisées : actif → archivé | corbeille ; archivé → actif ; corbeille → actif | suppression demandée ; suppression demandée → corbeille | supprimé | conservation légitime ; conservation légitime → supprimé. `supprimé` est terminal.
- **DI-A04** — `decouvrabilite = indexable Web` exige `visibilite = public indexable`. Visibilité, découvrabilité et licence restent trois propriétés indépendantes (RG-B02).
- **DI-A05** — `visibilite` d'un objet ne peut excéder le plafond de son espace (`ESPACE.visibilite_max` †).

**Exemple.** `PERSONNE` `0192f4a2-7c1e-7b3a-9f10-2a9c4d5e6f70`, espace « Projet CHARBONNÉ », visibilité `projet`, non découvrable, version 4.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_objet | Identifiant de l'objet | `IDENT` | 1 | UUID v7 (DD-02) | Unique global ; immuable ; jamais réutilisé | `0192f4a2-…6f70` | Y·F·X |
| uri_persistante | Identifiant résoluble interne | `URI` | 1 | `geniius:<id_objet>` | Dérivé de `id_objet` ; jamais modifié | `geniius:0192f4a2-…` | Y·F·X |
| type_objet | Sous-type le plus spécialisé | `CODE` | 1 | Noms des entités ✓ du dictionnaire | Figé ; changer de type = nouvel objet + filiation | `PERSONNE` | Y·F·O |
| date_creation | Instant de création (temps épistémique) | `HORODATAGE` | 1 | UTC ms | = `date_debut_validite` de la version 1 | `2028-05-12T09:14:03.220Z` | Y·F·O |
| etat_cycle_vie | État de conservation | `CODE` | 1 | D-01 | Transitions DI-A03 ; défaut `actif` | `actif` | S/Y·V·O |
| etat_examen | Degré d'examen humain | `CODE` | 1 | D-02 | Création manuelle → `examiné` ; automatique → `détecté` ou `préstructuré automatiquement` ; `validé humainement` exige un `ACTE_EVALUATION` de validation ; **interdit** : promotion par écoulement du temps (RG-A06) | `préstructuré automatiquement` | C·V·O |
| statut_validation | État du cycle de validation | `CODE` | 1 | D-03 | Dérivé du dernier `ACTE_EVALUATION` (DD-11) ; non saisissable ; défaut `proposée` | `contestée` | C·D·O |
| visibilite | Qui peut voir | `CODE` | 1 | D-04 | Défaut `privé` ; ≤ plafond de l'espace (DI-A05) ; pour un lien : TI-10 | `projet` | S·V·O |
| decouvrabilite | Qui peut trouver | `CODE` | 1 | D-05 | Défaut `non découvrable` ; DI-A04 | `recherche interne` | S·V·O |
| libelle_technique | Libellé d'interface | `TEXTE_COURT` | 0..1 | — | TI-09 : jamais une donnée historique | `Arsène C. (projet)` | C·D·O |

## 3.2 VERSION_OBJET

**Définition.** État figé d'un objet à un instant du temps épistémique. Ne représente pas une « édition » au sens éditorial (cf. `PUBLICATION`).

**Identifiant.** `id_version` = `<id_objet>@<numero>` ; unicité (objet, numero).

**Héritage.** Aucun (non `OBJET`).

**Participe à.** AVOIR_VERSION (1,1), PRECEDER, PRODUIRE (1,1), UTILISER_ENTREE, UTILISER_VERSION, DERIVER (origine), FIGER_SUR, PORTER_SUR_VERSION, CIBLER_VERSION, BASE (conflit), CONTENIR_SNAP, EXPOSER, MODIFIER (découverte), protocole_version.

**Versionnement.** `N` : immuable une fois créée ; seule une purge légale peut vider `etat_fige`.

**Confidentialité.** Une version suit les règles **courantes** de son objet. Une restriction nouvelle s'applique rétroactivement à toutes les versions ; une ouverture ne s'applique aux versions antérieures que si la décision le précise explicitement (une version ancienne peut contenir ce qu'on a retiré pour raison de confidentialité).

**Intégrité.**

- **DI-A06** — `numero` est séquentiel sans trou par objet ; la version *n* précède la version *n+1* (PRECEDER).
- **DI-A07** — `date_fin_validite` de la version *n* = `date_debut_validite` de la version *n+1* ; une seule version courante par objet.
- **DI-A08** — `motif` est obligatoire si `nature_changement` ∈ {changement scientifique, restriction, changement de gouvernance}.
- **DI-A09** — Pour un conteneur (DD-01), `etat_fige` contient la liste des `id_version` des composants ; chaque version listée doit exister.

**Exemple.** `0192f4a2-…6f70@4`, du 2031-02-03 à aujourd'hui, `changement scientifique`, motif « identification de la mention m12 rejetée après relecture de l'âge ».

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_version | Identifiant de version | `IDENT` | 1 | `<id_objet>@<numero>` | Immuable | `…6f70@4` | Y·N·X |
| numero | Rang de la version | `ENTIER` | 1 | ≥ 1 | DI-A06 | `4` | Y·N·O |
| date_debut_validite | Début de validité épistémique | `HORODATAGE` | 1 | UTC ms | TI-04 | `2031-02-03T10:00:00Z` | Y·N·O |
| date_fin_validite | Fin de validité | `HORODATAGE` | 0..1 | UTC ms | Vide = version courante ; DI-A07 | — | Y·N·O |
| etat_fige | Contenu complet de l'objet à cette version | `ETAT_FIGE` | 1 | Format patrimonial | Immuable ; purgeable seulement (DD-13) ; manifeste pour conteneurs (DI-A09) | `{…}` | Y·N·O |
| nature_changement | Nature de l'évolution | `CODE` | 1 | {création, correction technique, changement scientifique, changement de statut, changement de gouvernance, restriction} | `création` pour la version 1 uniquement ; une correction technique ne déclenche pas de réexamen (RG-A04, RG-K03) | `changement scientifique` | S/C·N·O |
| motif | Raison du changement | `TEXTE_LONG` | C | — | DI-A08 | « âge relu 36 et non 30 » | S·N·O |
| empreinte_etat † | Empreinte de `etat_fige` | `EMPREINTE` | 1 | SHA-256 | Contrôle d'intégrité et d'export ; recalculée après purge | `9f2c…` | Y·N·O |
| statut_contenu † | Disponibilité du contenu figé | `CODE` | 1 | {intact, restreint, purgé} | `purgé` : `etat_fige` vidé, ligne conservée (tombstone) | `intact` | Y·N·O |

**Critère « technique » vs « scientifique ».** Est une `correction technique` tout changement qui ne modifie ni le sens d'une lecture, ni une identification, ni une valeur, ni une date, ni un statut : coquille dans un libellé technique, reformatage, correction d'une coordonnée d'affichage sans effet sur l'ancrage. Dans le doute, le changement est scientifique.

## 3.3 ACTIVITE

**Définition.** Acte de production ou de transformation, humain, assisté ou automatique. Porte la provenance d'acquisition et de production (« qui, quand, comment, avec quel moteur »). Ne porte pas la justification (P17).

**Identifiant.** `id_activite`.

**Participe à.** REALISER (ACTEUR_GENIIUS 0,n — ACTIVITE 0,1, DD-07), PRODUIRE, UTILISER_ENTREE, APPLIQUER (méthode), EXECUTER_CALCUL.

**Versionnement.** `N` (journal append-only).

**Confidentialité.** Suit l'objet produit ; l'acteur est affiché selon son `mode_affichage_public`.

**Intégrité.**

- **DI-A10** — `ia_generative = vrai` ⇒ `moteur` et `version_moteur` obligatoires, et les versions produites ont `etat_examen` ∈ {détecté, préstructuré automatiquement} (RG-A06).
- **DI-A11** — `mode = manuel` ⇒ une association REALISER vers un acteur ; `mode = automatique` ⇒ `moteur` obligatoire.
- **DI-A12** — Une donnée a quitté la plateforme ⇒ `fournisseur` et `perimetre_donnees_transmises` obligatoires ; aucun attribut `R` ou `I` ne figure dans le périmètre (TI-12).
- **DI-A13** — `date_fin` ≥ `date_debut`.

**Exemple.** Activité `transcription`, mode `assisté`, moteur « HTR-Caraïbes » v2.3, intervention humaine `correction`, mode de lecture `indépendante/aveugle`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_activite | Identifiant | `IDENT` | 1 | UUID v7 | — | `0193…` | Y·N·O |
| type_activite | Nature de l'acte | `CODE` | 1 | D-06 | — | `transcription` | Y·N·O |
| date_debut | Début | `HORODATAGE` | 1 | UTC ms | TI-04 | `2028-05-12T09:14Z` | Y·N·O |
| date_fin | Fin | `HORODATAGE` | 0..1 | UTC ms | DI-A13 | `2028-05-12T10:02Z` | Y·N·O |
| mode | Part humaine | `CODE` | 1 | {manuel, assisté, automatique} | DI-A11 | `assisté` | Y·N·O |
| declenchement | Origine du déclenchement | `CODE` | 1 | {explicite, planifié, automatique léger} | IA lourde : jamais `automatique léger` (CDCF § 93.1) | `explicite` | Y·N·O |
| moteur | Moteur ou algorithme | `TEXTE_COURT` | C | — | DI-A10, DI-A11 | `HTR-Caraïbes` | Y·N·O |
| version_moteur | Version du moteur | `TEXTE_COURT` | C | — | Obligatoire avec `moteur` | `2.3.1` | Y·N·O |
| parametres_decisifs | Paramètres influant sur le résultat | `TEXTE_LONG` | 0..1 | JSON ou texte | — | `{"langue":"fr"}` | Y·N·O |
| ia_generative | Recours à une IA générative | `BOOLEEN` | 1 | — | DI-A10 | `faux` | Y·N·O |
| intervention_humaine | Part humaine après production | `CODE` | 1 | {aucune, examen, correction, validation} | `validation` exige un `ACTE_EVALUATION` | `correction` | Y·N·O |
| mode_lecture | Lecture assistée ou aveugle | `CODE` | 1 | {assistée, indépendante/aveugle, sans objet} | `indépendante/aveugle` : RG-D02 | `indépendante/aveugle` | Y·N·O |
| fournisseur † | Prestataire externe ayant reçu des données | `TEXTE_COURT` | C | — | DI-A12 | `Anthropic` | Y·N·I |
| perimetre_donnees_transmises † | Catégories d'attributs transmises | `TEXTE_LONG` | C | Liste d'attributs | DI-A12 | `SEGMENT.texte` | Y·N·I |

## 3.4 DEPENDANCE — lien réifié (DD-09)

**Définition.** Un objet aval dépend d'un objet amont. Trois catégories exclusives, correspondant aux spécialisations du MCD § 3.6 : **production** (ce qui a servi à produire), **justification** (ce qui justifie aujourd'hui), **raisonnement** (arête logique, support de détection de cycles). Une même paire peut porter plusieurs dépendances de catégories différentes ; une dépendance de production n'est jamais présumée de justification (RG-A12).

**Identifiant.** `id_lien` ; unicité métier (aval, amont, categorie, type_dependance) parmi les dépendances actives.

**Participe à.** DEPENDRE aval (OBJET 0,n — 1,1), DEPENDRE amont (OBJET 0,n — 1,1), UTILISER_VERSION (VERSION_OBJET 0,n — 0,1), INVOQUER_PREUVE (via `BASE_JUSTIFICATIVE`).

**Versionnement.** Le lien est versionné comme un objet (son `etat_impact` évolue). Il n'est jamais supprimé : il passe à `etat_lien = retiré` †.

**Confidentialité.** Gouvernable (DD-09) ; par défaut la plus restrictive de ses extrémités (TI-10). L'existence d'une dépendance vers une preuve privée peut être protégée (test 11).

**Intégrité.**

- **DI-A14** — aval ≠ amont.
- **DI-A15** — `categorie = production` ⇒ `version_amont_utilisee` obligatoire ; `categorie = justification` ⇒ `version_amont_utilisee` et `role_probatoire` obligatoires.
- **DI-A16** — L'amont d'une dépendance de justification n'est jamais une `NARRATION` (RG-G08), ni un `BADGE`, ni un `LIEN_EXPLORATOIRE`, ni un objet du domaine Q.
- **DI-A17** — Les cycles sont autorisés en `raisonnement` ; ils sont détectés (`cycle_detecte`) et jamais comptés comme justifications indépendantes (RG-A13). Ils sont interdits en `production` (on ne produit pas un objet à partir de sa propre version future).
- **DI-A18** — Une nouvelle version **scientifique** de l'amont fait passer `etat_impact` à `potentiellement affecté` (RG-A04), avec `date_signalement`.

**Exemple.** Aval : assertion dérivée a2 (naissance vers 1851–1852) ; amont : assertion a1 (âge déclaré 30 ans), `categorie = production`, `type_dependance = dérivation/calcul`, version amont `a1@1`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_lien † | Identifiant du lien | `IDENT` | 1 | UUID v7 | — | `0194…` | Y·F·X |
| categorie † | Production, justification ou raisonnement | `CODE` | 1 | {production, justification, raisonnement} | Figée | `production` | S/C·F·O |
| type_dependance | Nature de la dépendance | `CODE` | 1 | D-07 | — | `dérivation/calcul` | S/C·V·O |
| role_probatoire | Rôle de l'amont comme preuve | `REF_CONCEPT` | C | D-08 | DI-A15 | `principal` | S·V·O |
| sens † | Sens logique (raisonnement) | `CODE` | C | {appui, contre, contexte} | Obligatoire si `categorie = raisonnement` | `appui` | S·V·O |
| etat_impact | Effet des changements amont | `CODE` | 1 | {inchangé, potentiellement affecté, à réexaminer, invalidé, à recalculer} | DI-A18 ; défaut `inchangé` | `potentiellement affecté` | C/S·V·O |
| date_signalement | Date du dernier changement d'impact | `HORODATAGE` | C | UTC ms | Obligatoire si `etat_impact ≠ inchangé` | `2031-02-03T10:00Z` | Y·V·O |
| cycle_detecte † | Appartenance à un cycle de raisonnement | `BOOLEEN` | 1 | — | DI-A17 ; calculé | `faux` | C·D·O |
| etat_lien † | Lien actif ou retiré | `CODE` | 1 | {actif, retiré} | Jamais supprimé physiquement | `actif` | S·V·O |

## 3.5 FILIATION — lien réifié (DD-09)

**Définition.** Un objet est dérivé d'une version d'un autre objet, en général dans un autre espace (contribution, import, restauration, échange). Crée un état autonome qui peut diverger (RG-A09). N'est ni une référence (RG-A08) ni une hypothèse d'identité (RG-A10).

**Identifiant.** `id_lien`.

**Participe à.** DERIVER (OBJET dérivé 0,n — 1,1 ; VERSION_OBJET origine 0,n — 1,1), RESULTER (OPERATION_FLUX 0,n — 0,1).

**Versionnement.** `V` (l'`etat_divergence` évolue).

**Confidentialité.** Gouvernable ; l'existence d'une filiation vers un objet privé n'est pas révélée aux lecteurs de l'objet partagé (P19).

**Intégrité.**

- **DI-A19** — L'objet dérivé et l'objet d'origine sont distincts.
- **DI-A20** — `type_filiation` ∈ {contribution, import, échange Tree↔Tree, restauration} ⇒ une `OPERATION_FLUX` ou un `IMPORT` est obligatoire.
- **DI-A21** — `contribution` ⇒ l'espace de l'objet dérivé est le Core partagé ; `import` ⇒ l'espace d'origine est le Core partagé.
- **DI-A22** — Aucune synchronisation n'est déduite : un changement de l'origine fait seulement passer `etat_divergence` à `divergents` et peut notifier (RG-L02).

**Exemple.** Assertion partagée A-847 dérivée de l'assertion privée `P-128@3`, type `contribution`, état `alignés`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_lien † | Identifiant | `IDENT` | 1 | UUID v7 | — | `0195…` | Y·F·X |
| type_filiation | Nature de la dérivation | `CODE` | 1 | {contribution, import, échange Tree↔Tree, restauration, réutilisation} | Figé ; DI-A20, DI-A21 | `contribution` | Y·F·O |
| etat_divergence | Écart entre dérivé et origine | `CODE` | 1 | {alignés, divergents, mise à jour proposée, mise à jour importée, divergence assumée} | Défaut `alignés` ; DI-A22 | `divergents` | C/S·V·O |
| date_constat | Date du dernier constat d'état | `HORODATAGE` | 1 | UTC ms | — | `2029-11-02T08:00Z` | Y·V·O |

## 3.6 REFERENCE_INTER_ESPACE — lien réifié (DD-09)

**Définition.** Un espace utilise, **sans copie**, un objet gouverné dans un autre espace (MCD § 3.6). Remplace l'association `REFERENCER` du MCD § 3.4, qui désigne le même mécanisme. Exemple type : cinquante projets citent la même `PERSONNE` du Core partagé.

**Identifiant.** `id_lien` ; unicité (espace référent, objet cible) parmi les références actives.

**Participe à.** ESPACE référent (0,n) — OBJET cible (0,n) ; DECRIRE_ETAT : REFERENCE_INTER_ESPACE (1,n) — ETAT_REFERENCE_EXTERNE (1,1).

**Versionnement.** `V` pour `motif` ; l'état est historisé par `ETAT_REFERENCE_EXTERNE`.

**Confidentialité.** Gouvernable. Le propriétaire de l'objet cible ne voit pas, par défaut, quels espaces privés le référencent (P19).

**Intégrité.**

- **DI-A23** — L'espace référent est différent de l'espace de l'objet cible.
- **DI-A24** — À la création, la cible doit être accessible depuis l'espace référent.
- **DI-A25** — Une référence ne crée ni copie, ni filiation, ni synchronisation (RG-A08). Une scission, fusion ou redirection de la cible crée un nouvel `ETAT_REFERENCE_EXTERNE`, jamais une modification d'un objet de l'espace référent (RG-A11).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_lien † | Identifiant | `IDENT` | 1 | UUID v7 | — | `0196…` | Y·F·X |
| date | Date de création de la référence | `HORODATAGE` | 1 | UTC ms | — | `2029-01-10T12:00Z` | Y·F·O |
| motif | Raison de l'usage | `TEXTE_COURT` | 0..1 | — | — | « ancêtre commun du projet » | S·V·O |
| etat_courant | État courant | `CODE` | 1 | {active, cible révisée, redirigée, retirée, inaccessible, non résolue} | Dérivé du dernier `ETAT_REFERENCE_EXTERNE` (DD-11) | `active` | C·D·O |

## 3.7 ETAT_REFERENCE_EXTERNE

**Définition.** État daté d'une référence inter-espace. Journal append-only.

**Identifiant.** `id_etat` ; ordre par `date`.

**Participe à.** DECRIRE_ETAT (1,1) ; REDIRIGER_VERS † : ETAT_REFERENCE_EXTERNE (0,1) — OBJET (0,n) lorsque `etat = redirigée`.

**Versionnement.** `N`.

**Confidentialité.** Suit la référence.

**Intégrité.** **DI-A26** — `etat = redirigée` ⇒ REDIRIGER_VERS renseigné ; `etat ∈ {cible révisée, redirigée, retirée}` peut créer une `TACHE` de réexamen dans l'espace référent, jamais une modification automatique.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_etat † | Identifiant | `IDENT` | 1 | UUID v7 | — | `0197…` | Y·N·O |
| etat | État constaté | `CODE` | 1 | {active, cible révisée, redirigée, retirée, inaccessible, non résolue} | — | `redirigée` | C/Y·N·O |
| date | Date du constat | `HORODATAGE` | 1 | UTC ms | — | `2032-04-01T00:00Z` | Y·N·O |
| motif | Explication | `TEXTE_COURT` | 0..1 | — | — | « scission de l'entité Core en deux homonymes » | S/C·N·O |

## 3.8 BASE_JUSTIFICATIVE ✓

**Définition.** Ensemble versionné des éléments invoqués **aujourd'hui** pour justifier une production scientifique (assertion, interprétation, conclusion), dans une portée donnée. Distinct de l'histoire de production (P17). Conteneur au sens de DD-01.

**Identifiant.** `id_objet` ; au plus une base `en vigueur` par (objet justifié, portée).

**Participe à.** JUSTIFIER † : BASE_JUSTIFICATIVE (1,1) — OBJET justifié (0,n) ; INVOQUER_PREUVE † : BASE_JUSTIFICATIVE (1,n) — DEPENDANCE de catégorie justification (0,n).

**Intégrité.**

- **DI-A27** — Toutes les dépendances invoquées ont pour aval l'objet justifié et `categorie = justification`.
- **DI-A28** — Une base de portée `publique` n'invoque que des éléments diffusables publiquement (sinon : `EVALUATION_DIFFUSABILITE` « provenance masquée » ou « existence seulement »).
- **DI-A29** — Une base dont une dépendance est en cycle de raisonnement ne peut pas être `en vigueur` sans élément non circulaire (RG-A13).

**Exemple.** Conclusion « Charles TANCRÈDE meurt aux Îles du Salut le 2 février 1890 », base publique v2 invoquant l'acte de décès colonial et le registre matricule ; la lettre familiale privée qui a mis sur la piste n'y figure pas (elle reste en dépendance de production).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| portee | Public auquel la base est destinée | `CODE` | 1 | {publique, communautaire, projet, privée} | DI-A28 | `publique` | S·V·O |
| date | Date d'établissement | `HORODATAGE` | 1 | UTC ms | — | `2031-03-01T00:00Z` | Y·V·O |
| statut | État de la base | `CODE` | 1 | {en vigueur, remplacée, insuffisante, à réexaminer} | DI-A29 | `en vigueur` | S/C·V·O |

## 3.9 ACQUISITION_INFORMATION ✓

**Définition.** Entrée d'une information dans GENIIUS : import, saisie, transmission orale, réutilisation, capture. Décrit comment l'information est arrivée, jamais ce qui la prouve (P18, RG-A14).

**Identifiant.** `id_objet`.

**Participe à.** ACQUERIR † : ACQUISITION_INFORMATION (0,n) — OBJET acquis (0,n) ; LOT † : IMPORT (0,n) — ACQUISITION_INFORMATION (0,1) ; FOURNIR † : ACQUISITION_INFORMATION (0,1) — ACTEUR_GENIIUS (0,n).

**Intégrité.**

- **DI-A30** — Une acquisition n'est jamais l'amont d'une dépendance de `justification`.
- **DI-A31** — `mode = import fichier` ⇒ LOT renseigné.
- **DI-A32** — Une donnée importée sans source reste `etat_provenance = non sourcée` ou `provenance perdue à l'import` (RG-L04).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| mode | Voie d'entrée | `CODE` | 1 | {import fichier, saisie, transmission orale, réutilisation inter-espace, reprise d'un tiers, capture inbox, collecte Connect} | DI-A31 | `import fichier` | Y/S·F·O |
| date | Date d'entrée dans GENIIUS | `HORODATAGE` | 1 | UTC ms | Date de connaissance antérieure : `date_connaissance_declaree` | `2028-05-12T09:00Z` | Y·F·O |
| date_connaissance_declaree † | Date à laquelle l'information était connue avant d'entrer dans GENIIUS | `DATE_HIST` | 0..1 | DD-10 | Déclarative | « vers 2015 » | S·V·O |
| fournisseur | Personne ou organisme ayant fourni l'information, hors acteur GENIIUS | `TEXTE_COURT` | 0..1 | — | Si le fournisseur est un acteur : association FOURNIR | « tante Lucienne » | S/I·V·R |
| transformation | Transformations subies avant ou pendant l'entrée | `TEXTE_LONG` | 0..1 | — | — | « export Heredis → GEDCOM 5.5.1, notes tronquées » | S/I·V·O |

## 3.10 ACQUISITION_DOCUMENTAIRE ✓

**Définition.** Acquisition d'un document, d'un exemplaire, d'une reproduction ou d'un fichier : don, dépôt, photographie personnelle, téléchargement. Distincte de l'origine historique du document (P18).

**Identifiant.** `id_objet`.

**Participe à.** ACQUERIR_DOC † : ACQUISITION_DOCUMENTAIRE (0,n) — OBJET (`DOCUMENT`, `EXEMPLAIRE`, `REPRODUCTION`, `FICHIER`) (1,n).

**Intégrité.** **DI-A33** — Une acquisition documentaire ne crée ni ne modifie `DOCUMENT.statut_existence` ni la `RESPONSABILITE` historique.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| mode | Voie d'acquisition | `CODE` | 1 | {don, dépôt, photographie personnelle, téléchargement, transmission familiale, achat, prêt, numérisation institutionnelle reçue, autre} | TI-06 | `photographie personnelle` | S·F·O |
| date | Date d'acquisition | `DATE_HIST` | 1 | DD-10 | — | `2027-03-14` | S·V·O |
| detenteur_fournisseur | Détenteur ou fournisseur | `TEXTE_COURT` | 0..1 | — | Personne privée : `R` | « ANOM, salle de lecture » | S·V·R |
| conditions | Conditions d'usage associées | `TEXTE_LONG` | 0..1 | — | Peut fonder une `REGLE_ACCES` ou une `LICENCE` | « usage privé, pas de rediffusion » | S·V·O |

## 3.11 REFERENCE_PERSISTANTE ✓

**Définition.** Lien profond durable vers un objet, éventuellement figé sur une version et un fragment (CDCF § 87).

**Identifiant.** `id_objet` ; `identifiant` unique.

**Participe à.** VISER (1,1), FIGER_SUR (0,1), POINTER_FRAGMENT (0,1), CITER.

**Intégrité.** **DI-A34** — `mode = figé` ⇔ FIGER_SUR renseigné (RG-A05). **DI-A35** — `ark` attribué seulement si la cible est publiée ou citée publiquement (DD-02). **DI-A36** — La résolution applique les droits du lecteur ; une référence vers un objet supprimé résout vers une tombstone.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| identifiant | Identifiant interne résoluble | `URI` | 1 | `geniius:ref/<id_objet>` | Immuable | `geniius:ref/0198…` | Y·F·X |
| ark † | Identifiant public | `URI` | C | DD-02 | DI-A35 ; jamais retiré | `ark:/12345/g4f…` | Y·F·O |
| mode | Courant ou figé | `CODE` | 1 | {courant, figé} | DI-A34 ; figé | `figé` | S·F·O |
| fragment | Partie visée | `TEXTE_COURT` | 0..1 | `ligne=<n>`, `t=<début>,<fin>` (ms), `xywh=<x,y,w,h>` | Cohérent avec la cible | `ligne=12` | S·F·O |

## 3.12 IDENTIFIANT_EXTERNE

**Définition.** Identifiant d'un objet dans un système tiers (FamilySearch, Geneanet, Wikidata, BnF, matchID…). Ne prouve pas l'identité (RG-A07).

**Identifiant.** `id_identifiant_externe` ; unicité (objet, systeme, valeur).

**Participe à.** IDENTIFIER_EXT (OBJET 0,n — 1,1).

**Versionnement.** `V` via l'objet porteur (statut).

**Confidentialité.** `O` ; un identifiant externe d'une personne vivante est `R`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_identifiant_externe | Identifiant | `IDENT` | 1 | UUID v7 | — | `0199…` | Y·F·O |
| systeme | Système tiers | `REF_CONCEPT` | 1 | Annexe A.7 | — | `Wikidata` | S/I·F·O |
| valeur | Identifiant dans le système | `TEXTE_COURT` | 1 | Format du système | Ne pas reformater | `Q123456` | S/I·F·O |
| type | Portée du lien | `CODE` | 1 | {identifiant officiel, lien externe déclaré, correspondance candidate} | `correspondance candidate` n'établit pas d'identité | `lien externe déclaré` | S/I·V·O |
| statut | État | `CODE` | 1 | {actif, obsolète, contesté} | — | `actif` | S·V·O |
| date_constat | Dernière vérification | `HORODATAGE` | 1 | UTC ms | Pas d'interrogation continue (CDCF § 86) | `2029-06-01T00:00Z` | Y·V·O |

## 3.13 Associations du domaine A

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| CONTENIR | ESPACE (0,n) — OBJET (1,1) | — | DI-A01 ; figée | Suit l'objet |
| REFERENCE_INTER_ESPACE | ESPACE (0,n) — OBJET (0,n) | voir § 3.6 | DI-A23 à A25 | Lien réifié |
| AVOIR_VERSION | OBJET (1,n) — VERSION_OBJET (1,1) | — | DI-A02 | Suit l'objet |
| PRECEDER | VERSION_OBJET (0,1) — VERSION_OBJET (0,1) | — | DI-A06 | Suit l'objet |
| PRODUIRE | ACTIVITE (0,n) — VERSION_OBJET (1,1) | — | Toute version a une activité | Suit l'objet |
| UTILISER_ENTREE | ACTIVITE (0,n) — VERSION_OBJET (0,n) | role_entree (`TEXTE_COURT`, 0..1) | Une entrée est antérieure à l'activité | `X` |
| REALISER | ACTEUR_GENIIUS (0,n) — ACTIVITE (0,1) | — | DI-A11 | Suit l'activité |
| APPLIQUER | ACTIVITE (0,n) — METHODE (0,n) | version_methode (`IDENT` de version, 1) | La version de méthode existe | Suit l'activité |
| DEPENDRE aval / amont | OBJET (0,n) — DEPENDANCE (1,1), ×2 | — | DI-A14 | Lien réifié |
| UTILISER_VERSION | VERSION_OBJET (0,n) — DEPENDANCE (0,1) | — | DI-A15 | Suit la dépendance |
| DERIVER objet / origine | OBJET (0,n) — FILIATION (1,1) ; VERSION_OBJET (0,n) — FILIATION (1,1) | — | DI-A19 | Lien réifié |
| RESULTER | OPERATION_FLUX (0,n) — FILIATION (0,1) | — | DI-A20 | Suit la filiation |
| DECRIRE_ETAT † | REFERENCE_INTER_ESPACE (1,n) — ETAT_REFERENCE_EXTERNE (1,1) | — | Au moins l'état `active` initial | Suit la référence |
| REDIRIGER_VERS † | ETAT_REFERENCE_EXTERNE (0,1) — OBJET (0,n) | — | DI-A26 | `X` |
| JUSTIFIER † | BASE_JUSTIFICATIVE (1,1) — OBJET (0,n) | — | Une base en vigueur par portée | Suit la base |
| INVOQUER_PREUVE † | BASE_JUSTIFICATIVE (1,n) — DEPENDANCE (0,n) | — | DI-A27 | Suit la dépendance |
| ACQUERIR † | ACQUISITION_INFORMATION (0,n) — OBJET (0,n) | — | DI-A30 | Suit l'objet |
| LOT † | IMPORT (0,n) — ACQUISITION_INFORMATION (0,1) | — | DI-A31 | Suit l'import |
| FOURNIR † | ACQUISITION_INFORMATION (0,1) — ACTEUR_GENIIUS (0,n) | — | — | Suit l'acquisition |
| ACQUERIR_DOC † | ACQUISITION_DOCUMENTAIRE (0,n) — OBJET (1,n) | — | DI-A33 | Suit l'objet |
| VISER | OBJET (0,n) — REFERENCE_PERSISTANTE (1,1) | — | DI-A36 | `X` |
| FIGER_SUR | VERSION_OBJET (0,n) — REFERENCE_PERSISTANTE (0,1) | — | DI-A34 | Suit la référence |
| POINTER_FRAGMENT | ZONE (0,n) — REFERENCE_PERSISTANTE (0,1) | — | La zone appartient à la cible | Suit la référence |
| IDENTIFIER_EXT | OBJET (0,n) — IDENTIFIANT_EXTERNE (1,1) | — | Unicité (objet, système, valeur) | Suit l'objet |

---

# 4. Domaine B — Espaces, comptes, droits, gouvernance

## 4.1 ESPACE ✓

**Définition.** Régime de gouvernance dans lequel vivent des objets. Le Core partagé (unique, DD-17) et la publication publique sont des espaces. Un espace n'est pas un dossier : il fixe qui gouverne, pas comment on range (cf. `COLLECTION`).

**Identifiant.** `id_objet`.

**Héritage.** Spécialisations : `PROJET` (§ 13.1), `COMMUNAUTE`, `ESPACE_ORGANISATION`.

**Participe à.** CONTENIR, REFERENCE_INTER_ESPACE, APPARTENIR, ATTRIBUER_ROLE, PORTER_SUR_ESPACE, TRANSFERER, SOUSCRIRE, HEBERGER (arbre), PUBLIER, FIGER (snapshot), PORTER (référentiel), CARNET (contacts), SOURCE / CIBLE (flux), CIBLE_IMPORT, ORGANISER (Connect), PRODUIRE_CARTE.

**Intégrité.**

- **DI-B01** — Exactement un espace `Core partagé` (DD-17).
- **DI-B02** — Un espace `personnel` appartient à un seul compte (via son acteur principal) ; il ne peut pas avoir de membres invités.
- **DI-B03** — `visibilite_max` ≥ `visibilite` de chacun de ses objets (DI-A05).
- **DI-B04** — Un espace a au moins un acteur de rôle `propriétaire` ou `administrateur`, sauf le Core partagé, gouverné par ses rôles de gouvernance.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type_espace | Nature du régime | `CODE` | 1 | D-09 | Figé ; DI-B01 | `projet` | S·F·O |
| nom | Nom de l'espace | `TEXTE_COURT` | 1 | — | — | « Projet CHARBONNÉ » | S·V·O |
| regime_gouvernance | Règles de décision de l'espace | `TEXTE_LONG` | 0..1 | — | Obligatoire pour `communauté` et `Core partagé` | « décisions scientifiques par référents » | S·V·O |
| date_creation | Date de création | `HORODATAGE` | 1 | UTC ms | Égale à `OBJET.date_creation` | `2028-01-04T00:00Z` | Y·F·O |
| visibilite_max † | Plafond de visibilité des objets | `CODE` | 1 | D-04 | DI-B03 ; `personnel` : `privé` | `cercle invité` | S·V·O |
| replication_hors_ligne † | Politique de réplication des contenus de l'espace sur les appareils | `CODE` | 1 | {autorisée, limitée, interdite} | Défaut `autorisée` ; OB-20 (AUDIT-TECH-001) | `limitée` | S·V·O |
| duree_max_hors_ligne_jours † | Durée maximale de consultation hors ligne sans revalidation | `ENTIER` | C | > 0 | Obligatoire si et seulement si `replication_hors_ligne = limitée` | `30` | S·V·O |

## 4.2 COMMUNAUTE ✓ — ⊂ ESPACE

**Définition.** Espace de coopération autour d'un objet historique, documentaire ou méthodologique (CDCF § 57). Pas un réseau social.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| objet_focal | Objet de la coopération | `TEXTE_COURT` | 1 | — | — | « Registres de Deshaies 1848–1870 » | S·V·O |
| charte | Règles de participation | `TEXTE_LONG` | 1 | — | Pas de fil algorithmique, pas de compteur d'abonnés | « … » | S·V·O |

## 4.3 ESPACE_ORGANISATION ✓ — ⊂ ESPACE

**Définition.** Structure adhérente : association, laboratoire, service d'archives, collectivité, entreprise, cabinet (CDCF § 65). Distincte de l'`ORGANISATION` historique, même quand elles désignent la même institution (un service d'archives peut être les deux ; le lien se fait par `RAPPROCHEMENT` ou par `CONTACT`).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| nature_structure | Type de structure | `REF_CONCEPT` | 1 | {association, laboratoire, service d'archives, collectivité, entreprise, cabinet, autre} | — | `association` | S·V·O |
| forme_juridique | Forme juridique | `TEXTE_COURT` | 0..1 | — | — | « association loi 1901 » | S·V·O |

## 4.4 COMPTE (ex-`UTILISATEUR`, DD-07)

**Définition.** Identité technique d'authentification et d'accès d'un être humain. Ne contribue pas : c'est l'`ACTEUR_GENIIUS` lié qui agit.

**Identifiant.** `id_compte` ; `email` unique parmi les comptes actifs.

**Héritage.** Aucun (non `OBJET`).

**Participe à.** LIEN_COMPTE_ACTEUR, LIEN_COMPTE_PERSONNE, OUVRIR, CAPTURER, NAVIGUER, VEILLER, RECEVOIR (notification), SOUSCRIRE, BLOQUER.

**Versionnement.** Historisation technique (audit), hors versions d'objet.

**Confidentialité.** `I` pour l'identité civile et le courriel ; jamais exposés.

**Intégrité.**

- **DI-B05** — La suppression d'un compte purge `identite_civile`, `email` et les objets personnels (workspace, historique, inbox non rattachée) ; elle ne supprime pas l'acteur lié si l'attribution est légitime (RG-B08).
- **DI-B06** — Seul un compte de `niveau_verification_identite` ≥ `standard` peut agir, via son acteur, comme validateur sur le Core partagé (RG-H07).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_compte | Identifiant | `IDENT` | 1 | UUID v7 | — | `01a0…` | Y·F·I |
| identite_civile | Nom civil vérifié | `TEXTE_COURT` | 0..1 | — | Jamais affiché publiquement (critère 40) | « Jordan B. » | S·N·I |
| email | Adresse de connexion | `TEXTE_COURT` | 1 | RFC 5322 | Jamais exposée ni transmise (CDCF § 59) | `…@…` | S·N·I |
| niveau_verification_identite | Niveau de vérification | `CODE` | 1 | {aucun, standard, renforcé} | DI-B06 | `standard` | Y·N·I |
| categories_sollicitation_acceptees | Demandes acceptées | `CODE` | 0..n | Catégories de `DEMANDE` | Vide = aucune sollicitation | `photo-identification` | S·N·I |
| date_inscription | Date d'ouverture | `HORODATAGE` | 1 | UTC ms | — | `2027-11-02T18:00Z` | Y·N·I |
| etat_compte | État | `CODE` | 1 | {actif, suspendu, fermé, supprimé} | DI-B05 | `actif` | Y·N·I |

## 4.5 ACTEUR_GENIIUS ✓

**Définition.** Identité contributive et scientifique durable : chercheur, transcripteur, validateur, déposant, ou organisation représentée. C'est à elle que se rattachent activités, crédits, évaluations, rôles et droits (DD-07).

**Identifiant.** `id_objet` ; `pseudonyme` unique parmi les acteurs actifs lorsqu'il est utilisé.

**Participe à.** Toutes les associations de la colonne « ACTEUR_GENIIUS » de DD-07.

**Confidentialité.** Le nom affiché suit `mode_affichage_public` ; le lien vers le compte est `I`.

**Intégrité.**

- **DI-B07** — Un acteur est lié à 0, 1 ou plusieurs comptes successifs (RG-B09) ; au plus un compte actif à la fois pour un acteur `personne`.
- **DI-B08** — `mode_affichage_public = pseudonyme stable` ⇒ `pseudonyme` obligatoire et jamais réattribué.
- **DI-B09** — Un acteur sans compte actif conserve ses crédits et ses actes, mais ne peut plus agir.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| nature_acteur † | Personne ou organisation | `CODE` | 1 | {personne, organisation} | Figée | `personne` | S·F·O |
| nom_attribution | Nom sous lequel les contributions sont créditées | `TEXTE_COURT` | 1 | — | Selon `mode_affichage_public` | « J. Bluker » | S·V·O |
| mode_affichage_public | Mode d'affichage | `CODE` | 1 | {nom réel, pseudonyme stable, masqué} | DI-B08 | `pseudonyme stable` | S·V·O |
| pseudonyme | Pseudonyme public | `TEXTE_COURT` | C | — | DI-B08 | « ArchivesDeshaies » | S·V·O |
| statut | État de l'acteur | `CODE` | 1 | {actif, inactif, décédé, dissous} | `décédé` déclenche les `DESIGNATION_GARDE` conditionnelles | `actif` | S·V·O |
| periode_activite | Période d'activité | `PERIODE_HIST` | 0..1 | — | — | 2027– | C·D·O |

## 4.6 LIEN_COMPTE_ACTEUR

**Définition.** Association temporelle entre un compte et un acteur.

**Identifiant.** (id_compte, id_acteur, date_debut).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| date_debut | Début du lien | `HORODATAGE` | 1 | UTC ms | — | `2027-11-02T18:00Z` | Y·N·I |
| date_fin | Fin du lien | `HORODATAGE` | 0..1 | UTC ms | DI-B07 | — | Y·N·I |
| niveau_verification | Niveau de preuve du lien | `CODE` | 1 | {déclaré, vérifié} | Organisation : `vérifié` obligatoire | `vérifié` | Y·N·I |

## 4.7 LIEN_COMPTE_PERSONNE ✓ (ex-`REVENDICATION`)

**Définition.** Lien vérifié et révocable « je suis cette personne » entre un compte et une `PERSONNE`. Ouvre témoignage, consentement, signalement et volontés ; ne confère aucune propriété sur l'entité ni sur les assertions produites par d'autres (RG-B04, RG-B10).

**Identifiant.** `id_objet` ; au plus un lien `vérifié` actif par personne.

**Participe à.** COMPTE (0,n) — LIEN_COMPTE_PERSONNE (1,1) — PERSONNE (0,n).

**Confidentialité.** `R` : le lien entre un compte et une personne du graphe n'est jamais public sans accord explicite.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| methode | Méthode de vérification | `TEXTE_COURT` | 1 | — | — | « pièce d'identité + acte de naissance » | S·V·R |
| date | Date du lien | `HORODATAGE` | 1 | UTC ms | — | `2028-02-02T00:00Z` | Y·V·R |
| statut | État | `CODE` | 1 | {déclaré, vérifié, révoqué} | Révocation = nouvelle version | `vérifié` | S·V·R |
| niveau | Niveau de vérification | `CODE` | 1 | {standard, renforcé} | — | `renforcé` | Y·V·R |

## 4.8 GROUPE ✓

**Définition.** Ensemble nommé d'acteurs : famille, cercle invité, équipe. Sert aux droits **et** à qualifier l'indépendance des validateurs (RG-H02).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| nom | Nom du groupe | `TEXTE_COURT` | 1 | — | — | « Équipe Deshaies » | S·V·O |
| type_groupe | Nature | `CODE` | 1 | {famille, cercle invité, équipe, autre} | `équipe` alimente l'indépendance des validations | `équipe` | S·V·O |

## 4.9 REGLE_ACCES ✓

**Définition.** Permission ou interdiction granulaire : qui peut faire quoi, sur quel objet, espace ou lien, pendant quelle période, et si l'on protège le contenu ou l'existence même (CDCF § 62 ; RG-B11 ; DD-18).

**Identifiant.** `id_objet`.

**Participe à.** PORTER_SUR_OBJET | PORTER_SUR_ESPACE | PORTER_SUR_LIEN † (exactement une) ; BENEFICIER (ACTEUR_GENIIUS | GROUPE ; aucune si `public`).

**Intégrité.**

- **DI-B10** — Exactement une portée ; `cible_type` cohérent avec la portée renseignée.
- **DI-B11** — `effet = interdire` l'emporte sur toute autorisation (DD-18).
- **DI-B12** — `objet_protege = existence` ⇒ l'objet ou le lien est retiré du graphe accessible des bénéficiaires visés avant toute opération (P20, TI-11).
- **DI-B13** — Une règle ne peut pas élargir la visibilité d'un lien au-delà de ses extrémités (TI-10).
- **DI-B14** — Une règle ne peut conférer `contribuer au Core` qu'à un acteur ayant un rôle sur l'espace source.
- **DI-B29** † — Une règle d'effet `autoriser` dont le bénéficiaire est le rôle d'espace `propriétaire` ou `administrateur` ne porte que sur l'action `administrer`. Cette action n'implique aucune autre action. Les rôles de gouvernance (ATTRIBUER_ROLE) ne sont jamais bénéficiaires d'une règle. *(9/10/2026 — REC-X11 arbitrage A, REV-02-A.)*
- **DI-B30** † — `nature = exceptionnelle` exige un bénéficiaire acteur nominatif, `effet = autoriser`, une `date_fin` et un `fondement`. Chaque usage est consigné dans un `CONTEXTE_EVALUATION` qui référence la règle, avec une finalité déclarée. Le contenu consulté n'est jamais consigné. *(9/10/2026 — TECH-027.5.)*

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| cible_type † | Nature de la portée | `CODE` | 1 | {objet, espace, lien} | DI-B10 | `lien` | S·V·O |
| action | Action concernée | `CODE` | 1 | D-10 | — | `voir` | S·V·O |
| effet † | Autoriser ou interdire | `CODE` | 1 | {autoriser, interdire} | DI-B11 | `interdire` | S·V·O |
| objet_protege † | Contenu ou existence | `CODE` | 1 | {contenu, existence} | DI-B12 ; défaut `contenu` | `existence` | S·V·O |
| type_beneficiaire | Nature du bénéficiaire | `CODE` | 1 | {acteur, groupe, rôle d'espace, public} | `public` : aucun BENEFICIER | `public` | S·V·O |
| role_beneficiaire † | Rôle visé | `CODE` | C | Rôles d'APPARTENIR | Si `type_beneficiaire = rôle d'espace` | `lecteur` | S·V·O |
| date_debut | Début d'effet | `HORODATAGE` | 1 | UTC ms | — | `2029-01-01T00:00Z` | S·V·O |
| date_fin | Fin d'effet | `HORODATAGE` | 0..1 | UTC ms | Accès temporaire (missions déléguées) | `2029-03-01T00:00Z` | S·V·O |
| condition | Condition d'application | `TEXTE_COURT` | 0..1 | — | Expression évaluable (MPD) | « tant que la personne est vivante » | S·V·O |
| sensibilite | Niveau de sensibilité | `CODE` | 1 | {normale, sensible, très sensible} | — | `sensible` | S·V·O |
| nature † | Règle ordinaire ou habilitation exceptionnelle | `CODE` | 1 | {ordinaire, exceptionnelle} | Défaut `ordinaire` ; DI-B30 | `exceptionnelle` | S·V·O |
| fondement † | Justification, mandat ou base juridique d'une habilitation exceptionnelle | `TEXTE_COURT` | C | — | Obligatoire si `nature = exceptionnelle` | « ticket support 2031-114, accord du propriétaire » | S·V·I |

## 4.10 CONTEXTE_EVALUATION

**Définition.** Contexte dans lequel une décision d'accès, de diffusion ou d'opération est évaluée : qui, pour quel public, dans quel espace, quand, pour quelle opération et quelle finalité. Éphémère par nature ; **conservé** seulement lorsqu'il fonde une décision enregistrée (évaluation de diffusabilité, export, publication, notification).

**Identifiant.** `id_contexte`.

**Participe à.** EVALUER_DANS † : EVALUATION_DIFFUSABILITE (1,1) — CONTEXTE_EVALUATION (0,n) ; également référencé par `EXPORT` et `PUBLICATION`.

**Versionnement.** `N`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_contexte | Identifiant | `IDENT` | 1 | UUID v7 | — | `01a1…` | Y·N·O |
| acteur | Acteur demandeur | `IDENT` | 0..1 | id d'`ACTEUR_GENIIUS` | Vide pour un lecteur anonyme | `01a2…` | Y·N·I |
| audience | Public final visé | `CODE` | 1 | D-04 | — | `public indexable` | Y/S·N·O |
| espace | Espace d'évaluation | `IDENT` | 1 | id d'`ESPACE` | — | `01a3…` | Y·N·O |
| projet | Projet concerné | `IDENT` | 0..1 | id de `PROJET` | — | — | Y·N·O |
| role | Rôle de l'acteur au moment de l'évaluation | `CODE` | 0..1 | Rôles d'APPARTENIR | — | `collaborateur` | Y·N·O |
| instant | Instant d'évaluation | `HORODATAGE` | 1 | UTC ms | — | `2030-02-02T12:00Z` | Y·N·O |
| operation | Opération évaluée | `CODE` | 1 | {consultation, recherche, traversée, suggestion, agrégation, comptage, calcul, export, publication, notification, API, réplication †, synchronisation †} | P20 ; OB-20, OB-21 | `agrégation` | Y·N·O |
| finalite | Finalité déclarée | `TEXTE_COURT` | 0..1 | — | — | « statistique publique Dolé » | S·N·O |
| canal | Canal | `CODE` | 1 | {interface, API, export, notification, page publique, application locale †} | — | `page publique` | Y·N·O |
| regle_acces † | Habilitation exceptionnelle utilisée | `IDENT` | 0..1 | id de `REGLE_ACCES` | Si renseigné : `finalite` obligatoire (DI-B30) | `01b7…` | Y·N·O |
| appareil † | Appareil concerné (schéma technique) | `IDENT` | C | Identifiant d'appareil | Obligatoire si `operation = réplication` (OB-20) | `01c2…` | Y·N·I |

## 4.11 DECISION_APPLICABILITE_DROIT ✓

**Définition.** Décide si une restriction amont (embargo, consentement, licence, règle d'accès) reste applicable à un objet dérivé (P21). Première étape ; la diffusion est décidée ensuite par `EVALUATION_DIFFUSABILITE` (RG-B13).

**Participe à.** RESTRICTION_AMONT † : DECISION (1,1) — OBJET restriction (`EMBARGO`, `CONSENTEMENT`, `LICENCE`, `REGLE_ACCES`) (0,n) ; DERIVE_CONCERNE † : DECISION (1,1) — OBJET dérivé (0,n).

**Intégrité.** **DI-B15** — Le dérivé a une dépendance (production ou justification) vers l'objet restreint. **DI-B16** — Absence de décision = la restriction s'applique (prudence par défaut).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| decision | Applicabilité | `CODE` | 1 | {applicable, partiellement applicable, non applicable, indéterminée, à réexaminer} | DI-B16 | `non applicable` | S·V·O |
| fondement | Raisonnement | `TEXTE_LONG` | 1 | — | Cite les questions du CDCF § 73 | « la conclusion est démontrable par l'acte public seul » | S·V·O |
| date | Date de décision | `HORODATAGE` | 1 | UTC ms | — | `2031-03-01T00:00Z` | Y·V·O |

## 4.12 EVALUATION_DIFFUSABILITE ✓

**Définition.** Décision sur la possibilité de diffuser un objet ou un résultat dans un contexte, une fois établies les contraintes applicables. Tient compte du risque d'inférence et de réidentification (RG-B14).

**Participe à.** EVALUER_OBJET † : EVALUATION (1,1) — OBJET (0,n) ; EVALUER_DANS † (1,1).

**Intégrité.** **DI-B17** — `risque_inference = élevé` ⇒ `decision` ≠ `diffusable`. **DI-B18** — Un agrégat calculé sur moins d'éléments que le seuil de petit effectif défini au MPD est au mieux `autorisation requise` (test 9).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| decision | Décision | `CODE` | 1 | {diffusable, diffusable avec provenance masquée, existence seulement, autorisation requise, non diffusable} | DI-B17, DI-B18 | `diffusable avec provenance masquée` | S/C·V·O |
| motif | Explication | `TEXTE_LONG` | 1 | — | — | « témoignage sous embargo non nécessaire à la démonstration » | S·V·O |
| risque_inference | Risque de déduction d'un élément protégé | `CODE` | 1 | {faible, modéré, élevé, non évalué} | — | `faible` | S/C·V·O |
| date | Date | `HORODATAGE` | 1 | UTC ms | — | `2031-03-02T00:00Z` | Y·V·O |

## 4.13 LICENCE

**Définition.** Référentiel des licences, appliquées par composant (CDCF § 80).

**Identifiant.** `code_licence`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| code_licence | Code | `TEXTE_COURT` | 1 | SPDX si existant | Unique | `CC-BY-4.0` | Y·F·O |
| libelle | Libellé | `TEXTE_COURT` | 1 | — | — | « Creative Commons Attribution 4.0 » | Y·V·O |
| redistribution | Redistribution permise | `BOOLEEN` | 1 | — | — | `vrai` | Y·V·O |
| modification | Modification permise | `BOOLEEN` | 1 | — | — | `vrai` | Y·V·O |
| usage_commercial | Usage commercial permis | `BOOLEEN` | 1 | — | — | `vrai` | Y·V·O |
| attribution_requise | Attribution requise | `BOOLEEN` | 1 | — | — | `vrai` | Y·V·O |

## 4.14 EMBARGO ✓

**Définition.** Restriction temporaire ou conditionnelle portant sur le média, la transcription, l'information, l'usage ou l'existence même d'un objet.

**Intégrité.** **DI-B19** — Au moins un de `date_fin` ou `condition_levee`. **DI-B20** — Un embargo survit à l'export, à la restauration et au transfert de gouvernance (RG-B03, RG-P05). **DI-B21** — `portee = existence même` ⇒ une `REGLE_ACCES` `objet_protege = existence` est dérivée pour les non-bénéficiaires.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| portee | Ce qui est protégé | `CODE` | 1 | {média, transcription, information, usage, existence même} | DI-B21 | `transcription` | S·V·O |
| date_fin | Fin d'embargo | `DATE_HIST` | C | DD-10 (date exacte ou année) | DI-B19 | `2060` | S·V·O |
| condition_levee | Condition de levée | `TEXTE_COURT` | C | — | DI-B19 | « décès du témoin + 25 ans » | S·V·O |
| motif | Raison | `TEXTE_LONG` | 1 | — | — | « propos sur des personnes vivantes » | S·V·R |
| statut | État | `CODE` | 1 | {actif, levé, expiré} | `expiré` calculé | `actif` | S/C·V·O |

## 4.15 CLASSIFICATION

**Définition.** Référentiel des catégories de données (CDCF § 96), qui alimentent droits, export, IA et partage.

**Identifiant.** `code_classification`. Valeurs initiales : public, partagé, famille, privé, confidentiel, vivant, décédé, source publique, source privée, témoignage, sensible, note privée, média, embargo.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| code_classification | Code | `TEXTE_COURT` | 1 | Liste ci-dessus | Unique | `vivant` | Y·F·O |
| libelle | Libellé | `TEXTE_COURT` | 1 | — | — | « concerne une personne vivante » | Y·V·O |

## 4.16 MASQUAGE ✓

**Définition.** Transformation de protection d'un objet : masquage, pseudonymisation ou anonymisation (CDCF § 70).

**Intégrité.** **DI-B22** — `anonymisation` n'est admis que si aucun chemin accessible publiquement ne relie la version publique à l'original (RG-B07) ; sinon, `pseudonymisation`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `CODE` | 1 | {masquage, pseudonymisation, anonymisation} | DI-B22 | `pseudonymisation` | S·V·O |
| pseudonyme_attribue | Pseudonyme | `TEXTE_COURT` | C | — | Si `pseudonymisation` | « Mme L. » | S·V·R |
| perimetre | Éléments masqués | `TEXTE_LONG` | 1 | — | — | « noms des enfants vivants » | S·V·R |
| date | Date | `HORODATAGE` | 1 | UTC ms | — | `2031-01-01T00:00Z` | Y·V·O |

## 4.17 CONSENTEMENT ✓

**Définition.** Consentement explicite, versionné et horodaté d'une personne (CDCF § 24.16, § 72).

**Intégrité.** **DI-B23** — Le retrait crée une nouvelle version (`decision = retiré`) ; l'ancienne reste historisée (RG-B06). **DI-B24** — Un retrait ne détruit pas mécaniquement une conclusion justifiée indépendamment (test 18) ; il déclenche une `DECISION_APPLICABILITE_DROIT` sur les dérivés. **DI-B25** — `portee = biométrie` d'une personne vivante : `decision = accordé` exigé avant tout traitement (CDCF § 33.2).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| portee | Usage concerné | `CODE` | 1 | {enregistrement, transcription, usage familial, usage projet, publication, usage posthume, biométrie} | DI-B25 | `publication` | S·V·R |
| decision | Décision | `CODE` | 1 | {accordé, refusé, retiré} | DI-B23 | `accordé` | S·V·R |
| texte_version | Version du texte de consentement présenté | `TEXTE_COURT` | 1 | Identifiant de version | — | `consentement-journal-v3` | Y·V·R |
| horodatage | Instant du recueil | `HORODATAGE` | 1 | UTC ms | — | `2028-06-01T15:22Z` | Y·V·R |
| mode_recueil | Mode | `CODE` | 1 | {écrit signé, oral enregistré, électronique, représentant légal} | Mineur : `représentant légal` | `oral enregistré` | S·V·R |

## 4.18 VOLONTE_NUMERIQUE ✓

**Définition.** Volonté d'un acteur sur ses contenus, par catégorie ou projet (CDCF § 72).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| action | Volonté | `CODE` | 1 | {conserver, transmettre, publier, remettre, supprimer, transmettre les enregistrements} | — | `transmettre` | S·V·R |
| perimetre | Contenus visés | `TEXTE_LONG` | 1 | Catégorie, projet ou liste | Pas forcément tout le compte | « Journal familial » | S·V·R |
| beneficiaire | Bénéficiaire | `TEXTE_COURT` | 0..1 | — | — | « ma fille » | S·V·R |
| condition_declenchement | Condition | `TEXTE_COURT` | 1 | — | — | « décès » | S·V·R |

## 4.19 TRANSFERT_GOUVERNANCE ✓

**Définition.** Transfert historisé de la gouvernance d'un espace (CDCF § 65.1).

**Intégrité.** **DI-B26** — Le transfert n'outrepasse jamais les droits attachés au contenu : embargos, consentements et crédits restent inchangés (RG-B03).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| date | Date d'effet | `HORODATAGE` | 1 | UTC ms | — | `2040-01-01T00:00Z` | S·V·O |
| perimetre | Ce qui est transféré | `TEXTE_LONG` | 1 | — | — | « gouvernance du projet » | S·V·O |
| exclusions | Ce qui est exclu | `TEXTE_LONG` | 0..1 | — | — | « Journal personnel du fondateur » | S·V·O |
| conditions | Conditions | `TEXTE_LONG` | 0..1 | — | — | — | S·V·O |
| autorisation | Fondement de l'autorisation | `TEXTE_COURT` | 1 | — | — | « décision du bureau du 12/12/2039 » | S·V·O |

## 4.20 DESIGNATION_GARDE ✓

**Définition.** Désignation d'un rôle de garde ou de succession sur un objet ou un espace (CDCF § 24.15, § 25.18, § 89).

**Intégrité.** **DI-B27** — Le désigné est un acteur ou une personne (destinataire futur), jamais les deux. **DI-B28** — La désignation ne rend pas le successeur auteur rétroactif (RG-B03).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| role | Rôle | `CODE` | 1 | D-11 | — | `successeur scientifique` | S·V·O |
| condition_effet | Condition | `CODE` | 1 | {immédiat, décès, date, autre} | TI-06 | `décès` | S·V·O |
| date_effet | Date d'effet | `DATE_HIST` | C | — | Si `condition_effet = date` ou constatée | `2045` | S·V·O |
| statut | État | `CODE` | 1 | {prévue, effective, révoquée} | — | `prévue` | S/C·V·O |

## 4.21 LIEN_INTERET ✓

**Définition.** Lien déclaré entre un acteur et ce qu'il évalue (CDCF § 55.1). Contextualise ; n'invalide ni ne valide.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature du lien | `CODE` | 1 | {valide sa propre famille, propriétaire du fonds, membre du projet évalué, participant à l'événement, financeur, autre} | TI-06 | `valide sa propre famille` | S·V·O |
| date_declaration | Date | `HORODATAGE` | 1 | UTC ms | — | `2030-04-01T00:00Z` | Y·V·O |

## 4.22 FINANCEMENT ✓

**Définition.** Source de financement d'un projet, traitée comme provenance (CDCF § 55, Q213). Sans effet sur l'évaluation scientifique (critère 39).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `CODE` | 1 | {autofinancement, association, université, collectivité, subvention, mécénat, crowdfunding} | — | `subvention` | S·V·O |
| montant | Montant | `VALEUR` | 0..1 | § 21 | Monnaie obligatoire si renseigné | `{12000, EUR}` | S·V·O |
| periode | Période | `PERIODE_HIST` | 0..1 | — | — | 2029–2031 | S·V·O |
| obligations | Obligations associées | `TEXTE_LONG` | 0..1 | — | — | « dépôt des données en fin de projet » | S·V·O |

## 4.23 ABONNEMENT

**Définition.** Droit d'usage acheté (stockage, calcul, quotas). Aucune association avec validation, badge, rôle ou vote (RG-B05).

**Identifiant.** `id_abonnement`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_abonnement | Identifiant | `IDENT` | 1 | UUID v7 | — | `01a4…` | Y·F·I |
| offre | Offre | `TEXTE_COURT` | 1 | Catalogue commercial | — | `Echo Pro` | Y·N·I |
| quotas | Quotas | `TEXTE_LONG` | 1 | — | — | « 50 Go, 2 000 pages HTR » | Y·N·I |
| credits_calcul | Crédits restants | `ENTIER` | 0..1 | ≥ 0 | — | `1 200` | C·N·I |
| date_debut | Début | `HORODATAGE` | 1 | UTC ms | — | `2028-01-01T00:00Z` | Y·N·I |
| date_fin | Fin | `HORODATAGE` | 0..1 | UTC ms | — | — | Y·N·I |

## 4.24 Associations du domaine B

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| APPARTENIR | ACTEUR_GENIIUS (0,n) — ESPACE (0,n) | role_espace {propriétaire, administrateur, responsable scientifique, collaborateur, invité, lecteur} (1) ; date_debut (1) ; date_fin (0..1) | DI-B02, DI-B04 | Suit l'espace ; liste des membres `X` |
| ATTRIBUER_ROLE | ACTEUR_GENIIUS (0,n) — ESPACE (0,n) | role_gouvernance {contributeur, validateur, référent communautaire, modérateur, administrateur technique} (1) ; procedure (1) ; date (1) ; domaine → DOMAINE_EXPERTISE (0..1) | Validateur : DI-B06 | Public dans l'espace |
| MEMBRE_GROUPE | ACTEUR_GENIIUS (0,n) — GROUPE (0,n) | date_debut (1) ; date_fin (0..1) | — | Suit le groupe |
| PORTER_SUR_OBJET / _ESPACE / _LIEN † | REGLE_ACCES (1,1) — OBJET (0,n) \| ESPACE (0,n) \| lien réifié (0,n) | — | DI-B10 | `X` |
| BENEFICIER | REGLE_ACCES (0,1) — ACTEUR_GENIIUS (0,n) \| GROUPE (0,n) | — | Aucun si `public` | `X` |
| SOUS_LICENCE | OBJET (0,1) — LICENCE (0,n) | — | Un composant, une licence | Suit l'objet |
| RESTREINDRE | OBJET (0,n) — EMBARGO (1,1) | — | DI-B19 à B21 | Suit l'objet |
| CLASSER | OBJET (0,n) — CLASSIFICATION (0,n) | origine {déclarée, déduite} (1) | — | Suit l'objet |
| MASQUER | OBJET original (0,n) — MASQUAGE (1,1) ; OBJET version publique (0,1) — MASQUAGE (0,1) | — | DI-B22 | Lien original↔public `I` |
| CONSENTIR | PERSONNE (0,n) — CONSENTEMENT (1,1) ; CONSENTEMENT (0,1) — OBJET (0,n) \| ESPACE (0,n) | — | DI-B23 à B25 | `R` |
| EXPRIMER | ACTEUR_GENIIUS (0,n) — VOLONTE_NUMERIQUE (1,1) | — | — | `R` |
| LIEN_COMPTE_PERSONNE | COMPTE (0,n) — LIEN_COMPTE_PERSONNE (1,1) — PERSONNE (0,n) | voir § 4.7 | RG-B10 | `R` |
| LIEN_COMPTE_ACTEUR | COMPTE (0,n) — ACTEUR_GENIIUS (0,n) | voir § 4.6 | DI-B07 | `I` |
| TRANSFERER | ESPACE (0,n) — TRANSFERT_GOUVERNANCE (1,1) ; cédant ACTEUR (0,n) — (1,1) ; cessionnaire ACTEUR (0,n) — (1,1) | — | DI-B26 | Suit l'espace |
| DESIGNER | DESIGNATION_GARDE (1,1) — OBJET (0,n) ; ACTEUR (0,n) — (0,1) \| PERSONNE (0,n) — (0,1) | — | DI-B27 | `R` |
| DECLARER_INTERET | ACTEUR_GENIIUS (0,n) — LIEN_INTERET (1,1) — OBJET (0,n) | — | — | Visible des évaluateurs |
| FINANCER | PROJET (0,n) — FINANCEMENT (1,1) ; FINANCEMENT (0,1) — ORGANISATION (0,n) | — | — | Suit le projet |
| SOUSCRIRE | COMPTE (0,n) \| ESPACE (0,n) — ABONNEMENT (1,1) | — | RG-B05 | `I` |
| BLOQUER | COMPTE (0,n) — COMPTE (0,n) | date (1) | — | `I` |
| RESTRICTION_AMONT † / DERIVE_CONCERNE † | DECISION_APPLICABILITE_DROIT (1,1) — OBJET (0,n), ×2 | — | DI-B15 | Suit le dérivé |
| EVALUER_OBJET † / EVALUER_DANS † | EVALUATION_DIFFUSABILITE (1,1) — OBJET (0,n) ; (1,1) — CONTEXTE_EVALUATION (0,n) | — | DI-B17 | Suit l'objet |

## 4.25 CONTRIBUTION_DIFFEREE † — ajout du 9/10/2026

**Définition.** Opération réalisée hors connexion sur un appareil, reçue par GENIIUS et en attente de traitement, ou déjà traitée : création, modification ou demande de suppression. C'est la zone de réconciliation du CDC technique (TECH-003, AUDIT-TECH-003). Une contribution différée **n'est pas** une connaissance intégrée. L'objet qu'elle produit, s'il est intégré, suit son propre cycle de validation.

**Identifiant.** `id_objet` ; unicité de `(acteur, operation_origine)`, qui garantit l'idempotence du rejeu.

**Héritage.** `OBJET` (versionné, soumis aux droits et à la purge).

**Confidentialité.** `R` ; visibilité `privé`, lisible par son auteur seul (CP-23 du MLD).

**Intégrité.**
- **DI-B31** — Une opération hors ligne n'est jamais écrite directement dans les objets métier. Elle est reçue ici, puis intégrée seulement après réévaluation des droits **au moment de l'intégration** et contrôle de compatibilité des versions. Une conversion n'est admise que si elle est déterministe ; sinon, la contribution est `en attente de réconciliation`.
- **DI-B32** — Une modification dont la version de base n'est plus la version courante ouvre un `CONFLIT_EDITION`. Elle n'écrase jamais l'existant (CDCF § 64).
- **DI-B33** — Une contribution différée n'est jamais supprimée hors purge légale (DD-13). Refusée, elle reste lisible par son seul auteur, sans divulgation ni publication.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| operation_origine | Identifiant de l'opération attribué par l'appareil | `IDENT` | 1 | UUID | Unique par acteur | `01d0…` | Y·F·O |
| appareil | Appareil d'origine | `IDENT` | 1 | Identifiant d'appareil (schéma technique) | — | `01c2…` | Y·F·I |
| date_operation_locale | Date de l'opération sur l'appareil | `HORODATAGE` | 1 | UTC ms | — | `2031-04-02T11:03Z` | Y·F·O |
| nature_operation | Nature | `CODE` | 1 | {création, modification, demande de suppression} | `création` ⇔ pas de version de base | `modification` | Y·F·O |
| version_base | Version canonique connue lors de l'opération | `IDENT` + numéro | C | Version d'objet | Obligatoire hors création (TECH-003.2) | `P-1024 v17` | Y·F·O |
| charge | Opération sérialisée | `ETAT_FIGE` | 1 | Format patrimonial | Purgeable | `{…}` | Y·F·R |
| versions_client | Versions logicielle, de schéma et de référentiel déclarées | `TEXTE_COURT` ×3 | 1 | — | La version du référentiel pointe une version de `REFERENTIEL` | « 2.4 / s12 / GENIIUS-COMMUN v3 » | Y·F·O |
| etat_reception | État de réception | `CODE` | 1 | {reçue, intégrée, transformée, en attente de réconciliation, refusée - droits, refusée - invalide, en erreur} | `intégrée`/`transformée` ⇒ objet résultant ; refus, erreur, transformation ⇒ motif | `en attente de réconciliation` | S·V·O |
| motif | Motif du traitement | `TEXTE_COURT` | C | — | — | « catégorie scindée en V3 » | S·V·R |

Associations : PROPOSER_DIFFERE (ACTEUR_GENIIUS (0,n) — CONTRIBUTION_DIFFEREE (1,1)) ; CIBLER_ESPACE (ESPACE (0,n) — (1,1)) ; RESULTER_EN (CONTRIBUTION_DIFFEREE (0,1) — OBJET (0,1)) ; OUVRIR_CONFLIT (CONTRIBUTION_DIFFEREE (0,1) — CONFLIT_EDITION (0,1)).

---

# 5. Domaine C — Sources et hiérarchie documentaire

## 5.1 DOCUMENT ✓

**Définition.** Unité intellectuelle : un acte, un registre, une photographie, un enregistrement, un témoignage. Existe indépendamment de ses exemplaires, qu'il soit conservé, perdu, détruit ou seulement prescrit. N'est pas un fichier (RG-C07) ni une cote (RG-C06).

**Identifiant.** `id_objet`. Aucune unicité métier sur le titre : deux documents peuvent porter le même titre forgé.

**Participe à.** INCARNER, COTER, ACCEDER, TRANSCRIRE, CITER_DOC, PRESCRIRE, RECONSTRUIRE, SOURCE_DU_RECIT, PRODUIRE_DOC, COMPOSER_DOC †, IDENTIFIER_SOURCE †, APPLIQUER_A (exploitation), sujet d'`ASSERTION` (existence documentaire).

**Intégrité.**

- **DI-C01** — `statut_existence = prescrit seulement` ne passe à `existence attestée` que par une `ASSERTION` d'existence documentaire ancrée sur une trace (RG-C05).
- **DI-C02** — Un document peut n'avoir aucun `EXEMPLAIRE` (RG-C04) ; s'il a un exemplaire conservé, `statut_existence` ∈ {conservé et localisé, non localisé, inaccessible, lacunaire}.
- **DI-C03** — Une `ANOMALIE_DOCUMENTAIRE` ne modifie jamais `statut_existence` (RG-I04).
- **DI-C04** — `nature = témoignage` ⇔ le document est produit par une `SESSION_MEMOIRE`.

**Exemple.** Acte de mariage de Rose CARMEN et Jean-Louis X, Deshaies, 1849 ; nature `acte manuscrit` ; type documentaire `acte de mariage` ; `conservé et localisé`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| titre_forge | Titre attribué par le chercheur ou l'institution | `TEXTE_COURT` | 1 | — | Convention de description, pas une citation | « Mariage CARMEN × X, Deshaies, 1849 » | S/I·V·O |
| titre_original † | Titre porté par le document | `TEXTE_SOURCE` | 0..1 | — | Verbatim (TI-03) | « Registre des nouveaux libres » | S/A·V·O |
| nature | Forme du document | `REF_CONCEPT` | 1 | D-12 | — | `acte manuscrit` | S/I·V·O |
| type_documentaire | Genre documentaire | `REF_CONCEPT` | 0..1 | Annexe A.4 | — | `acte de mariage` | S/I·V·O |
| date_production | Date de production | `DATE_HIST` | 0..1 | DD-10 | Date du document, pas de l'événement relaté | `1849-07-14` | S/I·V·O |
| langues | Langues du document | `LANGUE` | 0..n | BCP 47 | — | `fr` | S/A·V·O |
| statut_existence | Existence et conservation | `CODE` | 1 | D-13 | DI-C01 à C03 | `conservé et localisé` | S·V·O |
| accessibilite | Accessibilité actuelle | `CODE` | 1 | {accessible, restreint, inaccessible, inconnue} | Alimente la vérifiabilité (RG-H04) | `accessible` | S/C·V·O |
| description | Description libre | `TEXTE_LONG` | 0..1 | — | — | « 2 folios, mention marginale de 1872 » | S·V·O |
| etat_provenance | Qualité de la provenance | `CODE` | 1 | D-14 | — | `sourcée` | S/C·V·O |

## 5.2 EXEMPLAIRE ✓

**Définition.** Support matériel d'un document : original, minute, expédition, double de greffe, tirage photographique, album.

**Participe à.** INCARNER (1,1), COMPORTER, LOCALISER, REPRODUIRE, COTER, TRANSCRIRE, OCCUPER, COMPOSER_DOC †.

**Intégrité.** **DI-C05** — Un exemplaire appartient à un seul document.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type_exemplaire | Nature de l'exemplaire | `REF_CONCEPT` | 1 | {original, minute, expédition, copie authentique, duplicata, copie privée, tirage, album, autre} | — | `duplicata` (double de greffe) | S/I·V·O |
| description_materielle | Support, format, reliure | `TEXTE_LONG` | 0..1 | — | — | « registre relié, 210 × 320 mm » | S·V·O |
| etat_conservation | État physique | `TEXTE_COURT` | 0..1 | — | — | « mouillures, f° 12 lacunaire » | S·V·O |
| nb_pages_declare | Nombre de pages déclaré | `ENTIER` | 0..1 | ≥ 1 | Déclaratif ; peut différer des `PAGE` présentes | `96` | S/I·V·O |

## 5.3 UNITE_ARCHIVISTIQUE ✓

**Définition.** Niveau de description archivistique (fonds, série, article, registre, dossier, pièce). Granularité progressive : on peut décrire un fonds sans en détailler les pièces.

**Participe à.** LOCALISER, CLASSER_DANS, CONSERVER, COTER, CIBLER (piste), PLANIFIER_ITEM, PERIMETRE (recherche), PRESENTER (anomalie).

**Intégrité.** **DI-C06** — La hiérarchie d'un même `type_ordre` est sans cycle. **DI-C07** — Un ordre `historique reconstruit` est une hypothèse : il doit être relié à une `INTERPRETATION`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| niveau | Niveau de description | `CODE` | 1 | {fonds, série, sous-série, article/cote, registre, dossier, pièce} | — | `registre` | S/I·V·O |
| intitule | Intitulé | `TEXTE_COURT` | 1 | — | — | « État civil de Deshaies, mariages 1849 » | S/I·V·O |
| dates_extremes | Dates extrêmes | `PERIODE_HIST` | 0..1 | — | — | 1849–1849 | S/I·V·O |
| description | Description | `TEXTE_LONG` | 0..1 | — | — | — | S/I·V·O |

## 5.4 IDENTIFIANT_DOCUMENTAIRE ✓

**Définition.** Cote ou identifiant successif d'un document, d'un exemplaire ou d'une unité, historisé (« cote ≠ identité »).

**Intégrité.** **DI-C08** — Un seul identifiant de type `cote actuelle` sans `date_fin` par (objet, institution). **DI-C09** — Un changement de cote clôt l'ancienne (`date_fin`) et en crée une nouvelle (RG-C06).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| valeur | Valeur de la cote | `TEXTE_SOURCE` | 1 | Telle que donnée par l'institution | Ne pas reformater | `FR ANOM 971 EC 9/12` | S/I·V·O |
| type | Nature | `CODE` | 1 | {cote actuelle, ancienne cote, identifiant historique, numéro d'acte, ARK, autre} | DI-C08 | `cote actuelle` | S/I·V·O |
| institution_emettrice | Institution | `TEXTE_COURT` | 0..1 | — | — | « ANOM » | S/I·V·O |
| date_debut | Début de validité | `DATE_HIST` | 0..1 | — | — | `2004` | S·V·O |
| date_fin | Fin de validité | `DATE_HIST` | 0..1 | — | DI-C09 | — | S·V·O |

## 5.5 LOCALISATION_EN_LIGNE ✓

**Définition.** Adresse d'accès en ligne historisée, avec état d'accès observé (CDCF § 98). Une URL morte ne détruit pas la provenance.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| adresse | Adresse | `URI` | 1 | URL, ARK, DOI | — | `http://anom.archivesnationales…` | S/I·V·O |
| type | Nature | `CODE` | 1 | {URL, ARK, DOI, manifeste IIIF, autre} | — | `manifeste IIIF` | S/I·V·O |
| plateforme | Plateforme | `TEXTE_COURT` | 0..1 | — | — | « IREL » | S/I·V·O |
| date_debut | Début de validité observée | `HORODATAGE` | 1 | UTC ms | — | `2027-03-01T00:00Z` | S/Y·V·O |
| date_fin | Fin de validité observée | `HORODATAGE` | 0..1 | UTC ms | — | — | S/Y·V·O |
| etat_acces | Accès constaté | `CODE` | 1 | D-15 | — | `accessible` | S/A·V·O |
| date_observation | Dernière observation | `HORODATAGE` | 1 | UTC ms | Pas d'archivage automatique du Web (§ 98) | `2029-09-01T00:00Z` | Y·V·O |

## 5.6 PAGE ✓

**Définition.** Face physique d'un exemplaire : folio, recto ou verso, page d'album.

**Identifiant.** `id_objet` ; unicité (exemplaire, rang).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| numero | Numéro porté ou attribué | `TEXTE_COURT` | 0..1 | — | Tel que porté (TI-03 si porté) | `12` | S/A·V·O |
| folio | Foliotation | `TEXTE_COURT` | 0..1 | — | — | `6` | S·V·O |
| face | Recto ou verso | `CODE` | 1 | {recto, verso, sans objet} | Photo : recto et verso sont deux pages | `verso` | S·V·O |
| rang | Ordre physique observé | `ENTIER` | 1 | ≥ 1 | Unique par exemplaire | `12` | S/A·V·O |
| etat | Présence | `CODE` | 1 | {présente, absente, endommagée} | Une page `absente` est une lacune matérielle | `présente` | S·V·O |

## 5.7 REPRODUCTION ✓

**Définition.** Reproduction d'un exemplaire, ou transformation d'une autre reproduction ; maillon de la lignée de reproduction (CDCF § 18).

**Intégrité.** **DI-C10** — Exactement une origine : REPRODUIRE ou DERIVER_DE (RG-C01). **DI-C11** — `type` ∈ {colorisation, generative fill, amélioration} ⇒ jamais ancrage probatoire des détails produits (RG-C02) et `original_recuperable = vrai` exigé. **DI-C12** — Les ancrages d'une reproduction ne sont pas réutilisés sur une autre sans `ALIGNEMENT_REPRODUCTION` † (MCD § 5.5).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `REF_CONCEPT` | 1 | D-16 | DI-C11 | `photographie` | S/I·V·O |
| date | Date de réalisation | `DATE_HIST` | 0..1 | — | — | `2027-03-14` | S/A·V·O |
| qualite | Qualité | `CODE` | 0..1 | {excellente, bonne, moyenne, médiocre} | — | `bonne` | S·V·O |
| pages_manquantes | Pages non reproduites | `TEXTE_COURT` | 0..1 | — | — | « f° 7 v° » | S·V·O |
| support | Support | `TEXTE_COURT` | 0..1 | — | — | « smartphone, JPEG » | S/A·V·O |
| produite_par_ia | Production par IA | `BOOLEEN` | 1 | — | DI-C11 | `faux` | Y/S·V·O |
| original_recuperable | L'original reste accessible | `BOOLEEN` | 1 | — | DI-C11 | `vrai` | Y·V·O |

## 5.8 FICHIER

**Définition.** Fichier binaire. Son empreinte permet la déduplication **technique** uniquement (RG-C07).

**Identifiant.** `id_fichier` ; `empreinte` unique.

**Confidentialité.** `emplacement_stockage` est `I` ; l'accès au binaire suit l'objet le plus restrictif qui l'utilise.

**Intégrité.** **DI-C13** — Deux fichiers de même empreinte sont fusionnés techniquement ; cela ne fusionne aucun document, exemplaire ni reproduction (test 13).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_fichier | Identifiant | `IDENT` | 1 | UUID v7 | — | `01b0…` | Y·F·I |
| empreinte | Empreinte | `EMPREINTE` | 1 | SHA-256 | Unique ; DI-C13 | `3a7f…` | Y·F·O |
| format | Type MIME | `TEXTE_COURT` | 1 | IANA | — | `image/jpeg` | Y·F·O |
| taille | Taille en octets | `ENTIER` | 1 | > 0 | — | `4 821 337` | Y·F·O |
| emplacement_stockage | Localisation physique | `TEXTE_COURT` | 1 | — | Jamais exposé | `s3://…` | Y·N·I |
| date_depot | Date de dépôt | `HORODATAGE` | 1 | UTC ms | — | `2027-03-14T19:00Z` | Y·F·O |

## 5.9 VUE ✓

**Définition.** Image ou piste d'une reproduction. Repère des coordonnées des zones (DD-16).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| rang | Ordre dans la reproduction | `ENTIER` | 1 | ≥ 1 | Unique par reproduction | `12` | Y/S·V·O |
| type | Nature | `CODE` | 1 | {image, piste audio, piste vidéo} | — | `image` | Y·F·O |
| duree | Durée | `ENTIER` | C | millisecondes | Si piste | — | Y·F·O |
| largeur_px † | Largeur de l'image maîtresse | `ENTIER` | C | > 0 | Si image ; DD-16 | `4032` | Y·F·O |
| hauteur_px † | Hauteur de l'image maîtresse | `ENTIER` | C | > 0 | Si image | `3024` | Y·F·O |

## 5.10 ZONE ✓

**Définition.** Fragment localisé d'une vue : région d'image, ligne, plage temporelle. Point d'ancrage universel de la preuve.

**Intégrité.** **DI-C14** — La géométrie est contenue dans les dimensions de la vue (image) ou sa durée (piste). **DI-C15** — `plage temporelle` ⇒ `debut_ms` < `fin_ms`, géométrie vide ; sinon `geometrie` obligatoire.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type_geometrie | Forme | `CODE` | 1 | {rectangle, polygone, ligne, point, plage temporelle, vue entière} | DI-C15 | `rectangle` | S/A·V·O |
| geometrie | Géométrie image | `GEOM` | C | Repère image (DD-16) | DI-C14 | `xywh=812,1204,1650,96` | S/A·V·O |
| debut_ms | Début de plage | `ENTIER` | C | ms ≥ 0 | DI-C15 | `754000` | S/A·V·O |
| fin_ms | Fin de plage | `ENTIER` | C | ms | DI-C15 | `781500` | S/A·V·O |
| libelle | Libellé | `TEXTE_COURT` | 0..1 | — | TI-09 | « ligne 12, marge » | S·V·O |

## 5.11 RESPONSABILITE — lien réifié (DD-09)

**Définition.** Rôle documentaire d'une entité historique sur un document, un exemplaire ou une assertion : rédacteur, signataire, déclarant, informateur… (CDCF § 16). Les rôles ne sont pas écrasés dans « auteur ».

**Identifiant.** `id_responsabilite`.

**Intégrité.** **DI-C16** — Le porteur est une `PERSONNE` ou une `ORGANISATION` (pas un compte ni un acteur GENIIUS : un numériseur GENIIUS passe par `ACTIVITE`).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| id_responsabilite | Identifiant | `IDENT` | 1 | UUID v7 | — | `01b1…` | Y·F·X |
| role | Rôle | `REF_CONCEPT` | 1 | D-17 ; annexe A.3 | — | `déclarant` | S/A·V·O |
| certitude | Plausibilité de l'attribution du rôle | `CODE` | 1 | D-19 | — | `probable` | S·V·O |

## 5.12 CITATION_DOCUMENTAIRE ✓

**Définition.** Un document en présente, cite, annexe, résume ou reproduit un autre (CDCF § 17). Fondement du calcul d'indépendance (DD-05) ; des reproductions d'un même exemplaire ne sont pas des preuves indépendantes (RG-C03).

**Intégrité.** **DI-C17** — Le document citant et le document cité sont distincts. **DI-C18** — Le document cité peut être perdu ou seulement connu par citation.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Relation | `CODE` | 1 | {présenté, cité, annexé, résumé, reproduit, copie de, probablement utilisé, concordant} | — | `cité` | S·V·O |
| certitude | Plausibilité | `CODE` | 1 | D-19 | — | `forte` | S·V·O |

## 5.13 EMPLACEMENT ✓

**Définition.** Emplacement (slot) d'une page d'album, vide ou occupé (CDCF § 32.3). Un emplacement vide a une valeur documentaire.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| position | Position sur la page | `TEXTE_COURT` | 1 | — | — | « haut gauche » | S·V·O |
| etat | Occupation | `CODE` | 1 | {occupé, vide, trace de retrait} | — | `trace de retrait` | S·V·O |
| type_ordre | Nature de l'ordre | `CODE` | 1 | D-18 | — | `actuel observé` | S·V·O |

## 5.14 PRESCRIPTION ✓

**Définition.** Une norme prescrit la production d'un type de document sur un territoire et une période (CDCF § 22). « Normalement produit » ne signifie pas « a existé » (DI-C01).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| periode | Période d'application | `PERIODE_HIST` | 1 | — | — | 1848–1849 | S·V·O |
| type_document_attendu | Type de document prescrit | `REF_CONCEPT` | 1 | Annexe A.4 | — | `registre des nouveaux libres` | S·V·O |

Le territoire, propriété du MCD, devient l'association CONCERNER_TERRITOIRE † vers `LIEU` (TI-02).

## 5.15 SOURCE_EXTERNE_DECLAREE ✓

**Définition.** Référence de source telle qu'importée (« archives familiales », « AD 971 »), non encore rattachée à un `DOCUMENT` identifié (MCD § 5.5).

**Participe à.** DECLARER_SOURCE † : ACQUISITION_INFORMATION (0,n) — SOURCE_EXTERNE_DECLAREE (1,1) ; IDENTIFIER_SOURCE † : SOURCE_EXTERNE_DECLAREE (0,1) — DOCUMENT (0,n) ; SOURCER_EXT † : ASSERTION (0,n) — SOURCE_EXTERNE_DECLAREE (0,n).

**Intégrité.** **DI-C19** — Une source externe déclarée ne crée jamais automatiquement un `DOCUMENT` (test 16). **DI-C20** — `etat = identifiée` ⇔ IDENTIFIER_SOURCE renseigné. **DI-C21** — Une assertion fondée sur une source externe déclarée non identifiée garde `etat_provenance` ≠ `sourcée`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| libelle_importe | Référence telle qu'importée | `TEXTE_SOURCE` | 1 | — | Verbatim | « Archives familiales, cahier de tante Lucie » | I·F·O |
| etat | Degré de résolution | `CODE` | 1 | {non résolue, déclarée, rapprochée, identifiée} | DI-C20 | `déclarée` | S/C·V·O |

## 5.16 Associations du domaine C

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| INCARNER | DOCUMENT (0,n) — EXEMPLAIRE (1,1) | — | DI-C05 | Suit l'exemplaire |
| COMPORTER | EXEMPLAIRE (0,n) — PAGE (1,1) | — | Rang unique | Suit la page |
| LOCALISER | EXEMPLAIRE (0,n) — UNITE_ARCHIVISTIQUE (0,n) | type_ordre D-18 (1) ; rang (0..1) ; periode (0..1) | — | Suit l'exemplaire |
| CLASSER_DANS | UNITE enfant (0,n) — UNITE parent (0,n) | type_ordre (1) ; rang (0..1) ; periode (0..1) | DI-C06, DI-C07 | Suit l'unité |
| CONSERVER | UNITE_ARCHIVISTIQUE (0,1) — ORGANISATION (0,n) | historisé par versions | — | Public si l'unité l'est |
| COTER | DOCUMENT \| EXEMPLAIRE \| UNITE (0,n) — IDENTIFIANT_DOCUMENTAIRE (1,1) | — | DI-C08 | Suit l'objet |
| ACCEDER | DOCUMENT \| REPRODUCTION (0,n) — LOCALISATION_EN_LIGNE (1,1) | — | — | Suit l'objet |
| REPRODUIRE | EXEMPLAIRE (0,n) — REPRODUCTION (0,1) | — | DI-C10 | Suit la reproduction |
| DERIVER_DE | REPRODUCTION parente (0,n) — dérivée (0,1) | — | DI-C10 ; sans cycle | Suit la dérivée |
| STOCKER | REPRODUCTION (1,n) — FICHIER (0,n) | role {master, dérivé, vignette} (1) | Un seul `master` par reproduction | Suit la reproduction |
| DECOMPOSER | REPRODUCTION (1,n) — VUE (1,1) | — | — | Suit la vue |
| MONTRER | VUE (0,n) — PAGE (0,n) | — | Même exemplaire que la reproduction | Suit la vue |
| DELIMITER | VUE (0,n) — ZONE (1,1) | — | DI-C14 | Suit la zone |
| SITUER | ZONE (0,1) — PAGE (0,n) | — | La page est montrée par la vue | Suit la zone |
| RESPONSABILITE_SUR / TENUE_PAR | OBJET (0,n) — RESPONSABILITE (1,1) ; ENTITE_HISTORIQUE (0,n) — RESPONSABILITE (1,1) | — | DI-C16 | Lien réifié |
| CITER_DOC | DOCUMENT citant (0,n) — CITATION (1,1) ; DOCUMENT cité (0,n) — (1,1) ; CITATION (0,n) — ZONE (0,n) | — | DI-C17 | Suit la citation |
| OFFRIR | PAGE (0,n) — EMPLACEMENT (1,1) | — | — | Suit la page |
| OCCUPER | EMPLACEMENT (0,n) — EXEMPLAIRE photo (0,n) | periode (0..1) ; type_ordre (1) | — | Suit l'emplacement |
| PRESCRIRE | NORME (0,n) — PRESCRIPTION (1,1) ; PRESCRIPTION (0,1) — DOCUMENT (0,n) | — | DI-C01 | Suit la prescription |
| CONCERNER_TERRITOIRE † | PRESCRIPTION (0,1) — LIEU (0,n) | — | — | Suit la prescription |
| COMPOSER_DOC † | DOCUMENT \| EXEMPLAIRE contenant (0,n) — DOCUMENT \| EXEMPLAIRE contenu (0,n) | type_composition {album → photographie, dossier → pièce, registre → cahier, document inclus} (1) ; rang (0..1) ; type_ordre (1) | Sans cycle ; ordre physique, archivistique et historique peuvent coexister (MCD § 5.5) | Suit le contenant |
| ALIGNEMENT_REPRODUCTION † | VUE source (0,n) — VUE cible (0,n) | transformation (`TEXTE_LONG`, 1) ; methode (0..1) ; statut {proposé, vérifié} (1) | DI-C12 | Suit la vue cible |
| DECLARER_SOURCE † / IDENTIFIER_SOURCE † / SOURCER_EXT † | voir § 5.15 | — | DI-C19 à C21 | Suit la source déclarée |

---

# 6. Domaine D — Lecture : transcription, annotation, mention, traces

## 6.1 TRANSCRIPTION ✓ — conteneur (DD-01)

**Définition.** Une couche textuelle d'un document ou d'un exemplaire, par un auteur, dans un mode de lecture. Plusieurs couches et plusieurs lectures concurrentes coexistent (CDCF § 23.2). Ses versions sont des manifestes de versions de segments.

**Intégrité.** **DI-D01** — `couche = traduction` ⇔ TRADUIRE renseigné vers une transcription source. **DI-D02** — Une transcription en mode `indépendante/aveugle` n'a accès, avant son enregistrement, à aucune autre lecture des mêmes zones (RG-D02). **DI-D03** — `statut = achevée selon protocole` exige une `APPLICATION_PROTOCOLE` accomplie sur le document.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| couche | Niveau d'édition | `CODE` | 1 | D-20 | DI-D01 | `semi-diplomatique/lecture` | S·F·O |
| langue | Langue de la couche | `LANGUE` | 1 | BCP 47 | — | `fr` | S·V·O |
| ecriture | Système d'écriture | `ECRITURE` | 1 | ISO 15924 | — | `Latn` | S·V·O |
| mode_lecture | Mode de lecture | `CODE` | 1 | {assistée, indépendante/aveugle} | DI-D02 ; figé | `indépendante/aveugle` | S·F·O |
| statut | Avancement | `CODE` | 1 | {en cours, achevée selon protocole, abandonnée} | DI-D03 | `en cours` | S·V·O |

## 6.2 SEGMENT ✓

**Définition.** Unité de texte d'une transcription (mot, ligne, paragraphe, marge), alignée sur des zones. Le désaccord de lecture se localise ici. Versionné individuellement (DD-01).

**Intégrité.** **DI-D04** — Une correction de lecture crée une nouvelle version du segment, sans toucher image, zone ni autres lectures (RG-D01). `texte` est un `TEXTE_SOURCE` : une autre source ne le corrige jamais (RG-D03), la modération ne le censure jamais (RG-D04). **DI-D05** — `incertitude_lecture = illisible` admet un texte vide ou des signes conventionnels de lacune (`[…]`), jamais une restitution présentée comme lue.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| rang | Ordre dans la transcription | `ENTIER` | 1 | ≥ 1 | Unique par transcription | `12` | S/A·V·O |
| texte | Texte lu | `TEXTE_SOURCE` | 1 | Conventions de transcription du protocole | DI-D04, DI-D05 | « Charles TANCRÈDE, âgé de trente ans » | S/A·V·O |
| type | Unité | `CODE` | 1 | {mot, ligne, paragraphe, marge, interligne} | — | `ligne` | S/A·V·O |
| incertitude_lecture | Assurance de la lecture | `CODE` | 1 | {certaine, probable, douteuse, illisible} | DI-D05 | `probable` | S/A·V·O |

## 6.3 ANNOTATION ✓

**Définition.** Observation localisée, sans transcription nécessaire : signature, tampon, rature, main, dommage, note de contexte, appareil critique (CDCF § 23.3, § 19.2). Une annotation postérieure (tampon, restauration) porte sa propre date et sa propre responsabilité (MCD § 5.5).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `REF_CONCEPT` | 1 | D-21 | — | `note de contexte` | S/A·V·O |
| contenu | Contenu | `TEXTE_LONG` | 1 | Markdown | Une note de contexte n'altère jamais le segment annoté | « Terme historique employé par l'administration coloniale… » | S·V·O |
| visible_publiquement | Affichage public souhaité | `BOOLEEN` | 1 | — | Soumis à la visibilité de l'objet | `vrai` | S·V·O |
| date_trace † | Date du phénomène annoté (tampon, rature) | `DATE_HIST` | 0..1 | DD-10 | Distincte de la date de l'annotation | `1872` | S·V·O |

## 6.4 MENTION ✓

**Définition.** Occurrence de quelque chose dans une source : nom, désignation, visage, voix, signature. N'est pas une entité (CDCF § 5).

**Intégrité.** **DI-D06** — Une mention ne crée jamais automatiquement de `PERSONNE` (RG-D05). **DI-D07** — `statut_resolution = identifiée` exige au moins une `PROPOSITION_IDENTIFICATION` non rejetée ; `candidats multiples` en exige au moins deux. **DI-D08** — `texte_exact` vide autorisé uniquement pour `nature` ∈ {visuelle, vocale, signature, main d'écriture}.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| texte_exact | Forme exacte dans la source | `TEXTE_SOURCE` | C | — | DI-D08 ; verbatim | « l'un des fils de Jean DUPONT » | S/A·V·O |
| nature | Nature de l'occurrence | `CODE` | 1 | D-22 | — | `relationnelle` | S/A·V·O |
| categorie_pressentie | Catégorie supposée | `CODE` | 1 | {personne, lieu, organisation, objet, bien, événement, collectif, date, montant, autre} | Indicative ; ne type aucune entité | `personne` | S/A·V·O |
| statut_resolution | État de résolution | `CODE` | 1 | D-23 | DI-D07 ; défaut `non traitée` | `structure non résolue` | S/C·V·O |

## 6.5 REGROUPEMENT_TRACES ✓

**Définition.** Groupe de mentions attribuées à un même porteur non identifié : individu visuel P-184, cluster vocal, main H-17 (CDCF § 33). Ne vaut pas identification (RG-D06).

**Confidentialité.** Un regroupement visuel ou vocal concernant une personne potentiellement vivante est `R` (biométrie, CDCF § 33.2).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `CODE` | 1 | {individu visuel, cluster vocal, main d'écriture, signature récurrente} | Biométrie vivants : `CONSENTEMENT` préalable (DI-B25) | `main d'écriture` | S/A·V·O |
| code | Code de travail | `TEXTE_COURT` | 1 | Unique dans l'espace | TI-09 | `H-17` | Y/S·V·O |
| statut | État | `CODE` | 1 | {proposé, examiné, contesté} | — | `examiné` | S/A·V·O |

## 6.6 Associations du domaine D

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| TRANSCRIRE | DOCUMENT \| EXEMPLAIRE (0,n) — TRANSCRIPTION (1,1) | — | — | Suit la transcription |
| TRADUIRE | TRANSCRIPTION source (0,n) — traduction (0,1) | — | DI-D01 ; une traduction est une expression dérivée (MCD § 6.5) | Suit la traduction |
| SEGMENTER | TRANSCRIPTION (1,n) — SEGMENT (1,1) | — | — | Suit le segment |
| ALIGNER | SEGMENT (0,n) — ZONE (0,n) | — | La zone appartient à une reproduction du même document | Suit le segment |
| ANCRER_ANNOTATION | ANNOTATION (1,n) — ZONE (0,n) \| SEGMENT (0,n) | — | Au moins un ancrage | Suit l'annotation |
| SIGNALER_CONTEXTE | COMMUNAUTE (0,n) — ANNOTATION (0,1) | — | La communauté ne modifie pas le texte (critère 38) | Suit l'annotation |
| LOCALISER_MENTION | MENTION (1,n) — ZONE (0,n) \| SEGMENT (0,n) | role_probatoire D-08 (0..1) | Ancrages multiples autorisés | Suit la mention |
| REGROUPER | MENTION (0,n) — REGROUPEMENT_TRACES (0,n) | degre {proposé, probable, examiné} (1) | — | Suit le regroupement |

---

# 7. Domaine E — Entités historiques

**Règle de domaine (RG-E01).** Aucun attribut d'entité historique n'exprime un fait historique : nom, sexe, naissance, décès, profession, résidence, statut juridique passent tous par `ASSERTION`. Les attributs ci-dessous portent uniquement l'identité de travail, le type et le régime de protection.

## 7.1 ENTITE_HISTORIQUE ✓ — super-type abstrait

**Définition.** Ce qui existe dans le monde historique et peut être sujet d'assertions. Porte l'identité, jamais les faits.

**Héritage.** Spécialisations exclusives : PERSONNE, LIEU, ORGANISATION, FONCTION, FAMILLE, COLLECTIF_HISTORIQUE, OBJET_MATERIEL, BIEN, NORME, EVENEMENT (dont VOYAGE), PHENOMENE, TRADITION.

**Participe à.** TYPER (1,1), TENUE_PAR, VERS_ENTITE, CANDIDAT, RAPPROCHER, REFERENCE (position), SELECTIONNER †, PORTER_SUR (interprétation), EMETTEUR / RECEPTEUR (transmission), REPRESENTE (contact), sujet et cible d'`ASSERTION`.

**Intégrité.**

- **DI-E01** — Le type est un `CONCEPT` : une nouvelle catégorie s'ajoute au référentiel sans modifier le modèle (RG-E06). Le concept de TYPER appartient à la branche de l'annexe A.1 correspondant à la spécialisation (une `PERSONNE` ne peut pas être typée `Objet > Moyen de transport`).
- **DI-E02** — Aucun nom, date, lieu, arbre ni descendant n'est exigé (RG-E02) ; dans le Core partagé, création soumise à DD-04 (une trace + `note_individualisation`).
- **DI-E03** — `densite_documentaire` n'est utilisée par aucun tri, classement, score ni filtre par défaut (CDCF § 114, critère 49).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| libelle_travail | Libellé de travail | `TEXTE_COURT` | 1 | — | TI-09 ; jamais une assertion de nom ; TI-08 interdit « Inconnu » : utiliser une description (« mère des 4 enfants, case n° 7 ») | « femme de la case n° 7, Dolé 1793 » | S·V·O |
| note_individualisation | Pourquoi cette entité est un individu distinct | `TEXTE_LONG` | C | — | Obligatoire au Core partagé (DD-04) | « décrite comme mère de quatre enfants distincts dans l'inventaire » | S·V·O |
| densite_documentaire | Nombre de traces connues | `ENTIER` | 0..1 | ≥ 0 | DI-E03 ; calculée sur le graphe accessible | `1` | C·D·O |

## 7.2 PERSONNE ✓ — ⊂ ENTITE_HISTORIQUE

**Définition.** Être humain individualisé par un chercheur, même sans nom. Une personne réduite en esclavage reste une `PERSONNE` (CDCF § 6.5).

**Intégrité.**

- **DI-E04** — Aucune `PERSONNE` n'est typée sous `Bien` ou `Objet` (RG-E03).
- **DI-E05** — `regime_protection` ∈ {vivant attesté, raisonnablement présumé vivant} ou `mineur_protege = vrai` ⇒ les assertions de la personne sont `R` par défaut et la biométrie exige un consentement (DI-B25).
- **DI-E06** — `regime_protection` ne crée aucune assertion de vie ou de décès (RG-E04). Une personne sans assertion de décès et née (même approximativement) il y a moins de 120 ans est `raisonnablement présumé vivant` par défaut.
- **DI-E07** — `mineur_protege = vrai` ⇒ `date_reevaluation_protection` obligatoire (réévaluation à la majorité, CDCF § 71).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| mode_individualisation | Comment l'individu est désigné | `CODE` | 1 | {nommée, prénom seul, surnom/désignation, anonyme individualisée} | Mis à jour quand les assertions de nom évoluent | `anonyme individualisée` | S/C·V·O |
| regime_protection | Règle de confidentialité vitale | `CODE` | 1 | {vivant attesté, raisonnablement présumé vivant, décédé attesté, statut vital inconnu} | DI-E05, DI-E06 | `décédé attesté` | S/C·V·O |
| mineur_protege | Protection renforcée des mineurs | `BOOLEEN` | 1 | — | DI-E07 | `faux` | S/C·V·O |
| date_reevaluation_protection | Date de réévaluation | `DATE_HIST` | C | Date exacte | DI-E07 | `2041-05-03` | S/C·V·R |

## 7.3 Autres spécialisations d'ENTITE_HISTORIQUE

| Entité | Définition | Attribut | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| LIEU | Lieu historique, même disparu ou sans coordonnées (CDCF § 27) | couche_spatiale | `REF_CONCEPT` | 1 | D-24 | Absence de géométrie ≠ absence de lieu | `parcelle/propriété` | S·V·O |
|  |  | existence_actuelle | `CODE` | 1 | {existe, disparu, inconnu} | — | `disparu` | S·V·O |
| ORGANISATION | Institution ou organisation historique (mairie, paroisse, tribunal, habitation-exploitation, service d'archives…) | — | — | — | Nature par TYPER | — | `étude notariale` | — |
| FONCTION | Poste distinct de l'organisation et du titulaire (CDCF § 29.3) | intitule_generique | `TEXTE_COURT` | 1 | — | La tenure est une `SITUATION` | « greffier du tribunal de Basse-Terre » | S·V·O |
| FAMILLE | Groupe de parenté, distinct du foyer et du logement | critere_definition | `TEXTE_LONG` | 1 | — | — | « descendants de Marie-Louise C. » | S·V·O |
| COLLECTIF_HISTORIQUE | Collectif attesté à composition éventuellement partielle | nature | `REF_CONCEPT` | 1 | {convoi, foyer, équipage, groupe de travailleurs, association, population, autre} | — | `convoi` | S·V·O |
|  |  | effectif_declare | `VALEUR` | 0..1 | § 21 | Valeur déclarée par la source ; ne crée aucune personne (CU-17) | `{24, personnes}` | S/A·V·O |
|  |  | date_observation | `DATE_HIST` | C | DD-10 | Obligatoire si `nature = foyer` | `1802` | S·V·O |
|  |  | composition_connue | `CODE` | 1 | {complète, partielle, inconnue} | `complète` exige autant de membres individualisés que l'effectif déclaré | `partielle` | S/C·V·O |
| OBJET_MATERIEL | Objet individualisé quand c'est historiquement utile (navire, bague, instrument) | — | — | — | Nature par TYPER | Pas une entité par chaise d'inventaire (§ 30.2) | `Navire` | — |
| BIEN | Bien ou actif, séparé du lieu | nature | `REF_CONCEPT` | 1 | {terre, maison, parcelle, rente, fonds, autre} | Jamais une personne (DI-E04) | `parcelle` | S·V·O |
| NORME | Loi, décret, règlement, décision | nature | `REF_CONCEPT` | 1 | {loi, décret, règlement, arrêté, décision, autre} | Pas de base juridique exhaustive (§ 22) | `décret` | S·V·O |
| EVENEMENT | Occurrence identifiable, y compris décisions et non-événements | mode_realite | `CODE` | 1 | D-25 | RG-E05 : une autorisation n'implique aucune réalisation | `autorisation` | S·V·O |
| VOYAGE (⊂ EVENEMENT) | Déplacement structuré en étapes | — | — | — | — | Au moins une `ETAPE_VOYAGE` | — | — |
| PHENOMENE | Objet fédérateur : épidémie, cyclone, guerre… | — | — | — | Nature par TYPER | Proximité ≠ causalité | `épidémie` | — |
| TRADITION | Tradition ou légende familiale comme objet historique | origine_connue | `CODE` | 1 | {connue, supposée, inconnue} | Une réfutation archivistique n'efface pas la tradition (§ 110) | `inconnue` | S·V·O |

La nature d'un `EVENEMENT` (mariage, vente, condamnation…) est portée par TYPER (annexe A.5).

## 7.4 ETAPE_VOYAGE ✓

**Définition.** Étape d'un voyage, avec sa propre preuve.

**Intégrité.** **DI-E08** — `statut = attestée` ⇒ au moins une assertion ancrée sur l'étape. **DI-E09** — Deux présences attestées ne créent ni voyage ni étape (RG-E07).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| rang | Ordre | `ENTIER` | 1 | ≥ 1 | Unique par voyage | `2` | S·V·O |
| date | Date de l'étape | `DATE_HIST` | 0..1 | DD-10 | — | « vers mars 1884 » | S·V·O |
| statut | Nature épistémique | `CODE` | 1 | {attestée, reconstruite, hypothétique} | DI-E08 | `reconstruite` | S·V·O |

## 7.5 RECIT ✓

**Définition.** Version d'un événement selon un point de vue ; la version judiciaire est une version institutionnelle (CDCF § 35).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| point_de_vue | Origine du récit | `CODE` | 1 | {accusé, victime, témoin, police, tribunal, presse, famille, chercheur, autre} | — | `tribunal` | S·V·O |
| resume | Résumé | `TEXTE_LONG` | 0..1 | — | Le résumé n'est pas une assertion | « version de l'arrêt du 12/06/1882 » | S·V·O |

## 7.6 Associations du domaine E

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| TYPER | ENTITE_HISTORIQUE (1,1) — CONCEPT (0,n) | — | DI-E01 | Suit l'entité |
| ETAPE | VOYAGE (1,n) — ETAPE_VOYAGE (1,1) | — | — | Suit le voyage |
| A_LIEU | ETAPE_VOYAGE (0,1) — LIEU (0,n) | — | — | Suit l'étape |
| MOYEN | ETAPE_VOYAGE (0,1) — OBJET_MATERIEL (0,n) | — | Un navire ne devient pas un lieu | Suit l'étape |
| RACONTER | EVENEMENT (0,n) — RECIT (1,1) | — | — | Suit le récit |
| SOURCE_DU_RECIT | RECIT (0,1) — DOCUMENT (0,n) | — | — | Suit le récit |
| COMPOSER_RECIT | RECIT (0,n) — ASSERTION (0,n) | rang (`ENTIER`, 1) | Séquence ordonnée | Suit le récit |

---

# 8. Domaine F — Identification et identité

Trois mécanismes à ne jamais confondre (MCD § 8.5, P15) : `REFERENCE_INTER_ESPACE` (réutilisation certaine), `FILIATION` (état autonome dérivé), `RAPPROCHEMENT` (hypothèse d'identité).

## 8.1 PROPOSITION_IDENTIFICATION ✓

**Définition.** Hypothèse « cette mention (ou ce regroupement) correspond à cette entité, ou à cette position ». Plusieurs propositions pour une même mention = plusieurs candidats.

**Intégrité.**

- **DI-F01** — Exactement une source (MENTION ou REGROUPEMENT_TRACES) et exactement une cible (ENTITE_HISTORIQUE ou POSITION) (RG-F01).
- **DI-F02** — Unicité (source, cible) parmi les propositions non rejetées ; une mention ambiguë donne plusieurs propositions, sans choix automatique (RG-F02).
- **DI-F03** — `plausibilite = forte` exige au moins un `ARGUMENT` `pour` (RG-F06) ; un nom rare, une similarité visuelle ou vocale ne suffisent jamais seuls.
- **DI-F04** — Une proposition rejetée reste conservée (Q138).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| plausibilite | Plausibilité | `CODE` | 1 | D-19 | DI-F03 ; pas de pourcentage (DD-14) | `probable` | S·V·O |
| verdict | Conclusion d'identité | `CODE` | 1 | {même entité, entité distincte, indéterminé} | Défaut `indéterminé` | `même entité` | S·V·O |
| justification | Raisonnement | `TEXTE_LONG` | 0..1 | — | Obligatoire au Core partagé | « même habitation, mêmes témoins, âge compatible » | S·V·O |

## 8.2 POSITION ✓ — super-type

**Définition.** Place humaine connue sans individu déterminé ; « l'un des fils de Jean » ne crée jamais de personne « Inconnu » (RG-F03). Spécialisations : `POSITION_RELATIONNELLE`, `ELEMENT_RECONSTRUIT` (§ 11.2).

**Intégrité.** **DI-F05** — `statut = résolue` exige une `CANDIDATURE` `retenue`. **DI-F06** — Une position ne devient jamais une `PERSONNE` par transformation : on retient un candidat existant, ou l'on crée une personne qui devient candidate.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| description | Description de la place | `TEXTE_COURT` | 1 | — | — | « l'un des fils de Jean DUPONT » | S·V·O |
| rang | Rang dans une structure | `ENTIER` | 0..1 | ≥ 1 | — | `8` | S·V·O |
| statut | État | `CODE` | 1 | {ouverte, résolue, déclarée inconnue} | DI-F05 | `ouverte` | S·V·O |

## 8.3 POSITION_RELATIONNELLE ✓ — ⊂ POSITION

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| nature | Nature de la position | `CODE` | 1 | {un parmi des candidats, membre non individualisé d'un collectif, position impliquée par un compte, position manquante} | `membre non individualisé` ⇒ MEMBRE_DE renseigné | `un parmi des candidats` | S·V·O |
| effectif_implique | Nombre de places impliquées | `ENTIER` | 0..1 | ≥ 1 | Ne crée aucune personne (CU-17) | `1` | S·V·O |

## 8.4 CANDIDATURE ✓

**Définition.** Une entité candidate pour une position, avec plausibilité et statut. Les candidats écartés restent visibles avec leurs raisons (Q138).

**Intégrité.** **DI-F07** — Unicité (position, entité). **DI-F08** — Au plus une candidature `retenue` par position.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| plausibilite | Plausibilité | `CODE` | 1 | D-19 | — | `possible` | S·V·O |
| statut | État | `CODE` | 1 | {en lice, écartée provisoirement, rejetée, retenue} | DI-F08 | `en lice` | S·V·O |
| motif | Raison du statut | `TEXTE_LONG` | C | — | Obligatoire si `écartée provisoirement` ou `rejetée` | « né après l'acte » | S·V·O |

## 8.5 RAPPROCHEMENT ✓

**Définition.** Hypothèse d'identité **entre deux entités individualisées** : même personne, personnes distinctes, indéterminé. Porte la fusion logique réversible et le lien Tree → Core (RG-F07).

**Intégrité.**

- **DI-F09** — Les deux entités sont distinctes et de même spécialisation.
- **DI-F10** — `presentation_fusionnee = vrai` exige `verdict = même entité` et `statut_validation` ∈ {validée, confirmée} ; elle n'agit que sur l'affichage et ne supprime aucun identifiant (RG-F04).
- **DI-F11** — Un verdict `entités distinctes` est opposable : une nouvelle proposition contraire doit le citer en `ARGUMENT` (RG-F05).
- **DI-F12** — `portee = privé→Core partagé` ne met en relation ni les propriétaires des espaces, ni leurs données (RG-F07, CU-21).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| verdict | Conclusion | `CODE` | 1 | {même entité, entités distinctes, indéterminé} | DI-F11 | `même entité` | S·V·O |
| presentation_fusionnee | Affichage commun | `BOOLEEN` | 1 | — | DI-F10 ; défaut `faux` | `faux` | S·V·O |
| portee | Portée | `CODE` | 1 | {intra-espace, privé→Core partagé, Tree↔Tree, inter-espaces} | DI-F12 | `privé→Core partagé` | S/C·F·O |
| justification | Raisonnement | `TEXTE_LONG` | 1 | — | — | « même acte de baptême cité dans les deux arbres » | S·V·O |

## 8.6 SELECTION_CONTEXTE ✓ (ex-`CHOIX_AFFICHAGE`, DD-08)

**Définition.** Choix, dans un contexte (espace et usage), d'une assertion parmi plusieurs pour un usage pratique : nom affiché, valeur exportée, valeur utilisée dans un calcul. Convention, jamais vérité (MCD § 8.5).

**Participe à.** SELECTIONNER † : ESPACE (0,n) — SELECTION_CONTEXTE (1,1) ; ENTITE_HISTORIQUE (0,n) — (1,1) ; ASSERTION retenue (0,n) — (1,1).

**Intégrité.** **DI-F13** — L'assertion retenue a pour sujet l'entité. **DI-F14** — Unicité (espace, entité, usage, predicat de l'assertion). **DI-F15** — Une sélection ne modifie ni la plausibilité ni le statut de l'assertion retenue ou des autres.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| usage | Usage de la sélection | `CODE` | 1 | {affichage, export, calcul, publication, arbre} | DI-F14 | `affichage` | S·V·O |
| motif | Raison du choix | `TEXTE_COURT` | 0..1 | — | — | « forme la plus fréquente dans le projet » | S·V·O |

## 8.7 POSITION_EPISTEMIQUE ✓

**Définition.** Position contextualisée qu'un projet, une communauté, une publication ou un espace adopte sur une proposition (identification, rapprochement, assertion, interprétation). Ni vérité globale, ni modification de la preuve (MCD § 8.5).

**Participe à.** ADOPTER † : ESPACE | PUBLICATION (0,n) — POSITION_EPISTEMIQUE (1,1) ; PORTER_SUR_PROPOSITION † : POSITION_EPISTEMIQUE (1,1) — OBJET (0,n).

**Intégrité.** **DI-F16** — Unicité (contexte, objet) parmi les positions courantes. **DI-F17** — Deux contextes peuvent avoir des positions incompatibles sur un même objet (test 15) ; aucune agrégation ne les réduit en « position majoritaire ».

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| position | Position adoptée | `CODE` | 1 | {adoptée, rejetée, indéterminée, contestée, à réexaminer} | DI-F17 | `adoptée` | S·V·O |
| justification | Raisonnement | `TEXTE_LONG` | 1 | — | — | « retenue par le comité scientifique du projet » | S·V·O |
| date | Date | `HORODATAGE` | 1 | UTC ms | — | `2030-10-10T00:00Z` | Y·V·O |

## 8.8 Associations du domaine F

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| IDENTIFIER | MENTION (0,n) \| REGROUPEMENT_TRACES (0,n) — PROPOSITION_IDENTIFICATION (0,1) | — | DI-F01 | Suit la proposition |
| VERS_ENTITE / VERS_POSITION | PROPOSITION (0,1) — ENTITE_HISTORIQUE (0,n) \| POSITION (0,n) | — | DI-F01 | Suit la proposition ; `X` |
| REFERENCE | POSITION_RELATIONNELLE (0,1) — ENTITE_HISTORIQUE (0,n) | — | — | Suit la position |
| RELATION_TYPE | POSITION_RELATIONNELLE (0,1) — CONCEPT (0,n) | — | Concept de nature `prédicat` (relation) | Suit la position |
| MEMBRE_DE | POSITION_RELATIONNELLE (0,1) — COLLECTIF_HISTORIQUE (0,n) | — | — | Suit la position |
| CANDIDAT_POUR / CANDIDAT | POSITION (0,n) — CANDIDATURE (1,1) ; ENTITE_HISTORIQUE (0,n) — CANDIDATURE (1,1) | — | DI-F07 | Suit la candidature |
| RAPPROCHER | ENTITE A (0,n) — RAPPROCHEMENT (1,1) ; ENTITE B (0,n) — RAPPROCHEMENT (1,1) | — | DI-F09 | Suit le rapprochement ; l'existence d'un rapprochement vers un espace privé est `X` |
| SELECTIONNER † | voir § 8.6 | — | DI-F13, DI-F14 | Suit la sélection |
| ADOPTER † / PORTER_SUR_PROPOSITION † | voir § 8.7 | — | DI-F16 | Suit le contexte |

---

# 9. Domaine G — Assertions, valeurs et interprétations

## 9.1 ASSERTION ✓

**Définition.** Proposition structurée sur le monde historique : **sujet** — **prédicat** — **cible** et/ou **valeur**, qualifiée par un temps historique, un lieu, un rôle et un statut épistémique. Plusieurs assertions incompatibles coexistent (RG-G04). Une assertion n'est pas sa formulation (`EXPRESSION_ASSERTION`).

**Identifiant.** `id_objet`. Aucune unicité métier : deux assertions identiques issues de deux sources sont deux assertions.

**Héritage.** Profils exclusifs (spécialisations) : ASSERTION_ATTRIBUT, RELATION, PARTICIPATION, PRESENCE, SITUATION, EXISTENCE_DOCUMENTAIRE. Le profil est déterminé par le prédicat (annexe A.2).

**Participe à.** SUJET (1,1), CIBLE (0,1), PREDICAT (1,1), ROLE (0,1), LIEU_DE (0,1), SOUS_ASSERTION, FONDER, ANCRER, ISSUE_DE, DERIVER (calcul), COMPOSER_RECIT, INCLURE_LIEN (arbre), SELECTIONNER, EXPRIMER_ASSERTION †, SOURCER_EXT †, RESPONSABILITE_SUR.

**Intégrité.**

- **DI-G01** — La **signature du prédicat** (annexe A.2) est respectée : type du sujet admis, présence et type de la cible, présence et type de la valeur, profil.
- **DI-G02** — `nature = attestée` ⇒ au moins un ANCRER, un FONDER, un ISSUE_DE ou un SOURCER_EXT ; sinon `etat_provenance` ≠ `sourcée` (RG-G01).
- **DI-G03** — `nature = dérivée` ⇒ exactement un DERIVER (CALCUL) et au moins une `DEPENDANCE` de production vers ses entrées (RG-G02).
- **DI-G04** — Une assertion de `modalite = déclarée par un tiers dans la source` porte une `RESPONSABILITE` de rôle `déclarant` ou `informateur` (RG-G07).
- **DI-G05** — `polarite = négative` (« explicitement absent ») exige une source (RG-G10) ; elle n'est jamais produite par une recherche négative (RG-K01).
- **DI-G06** — `libelle_source` est obligatoire si `niveau = attestée` ; il conserve le vocabulaire exact, y compris un terme offensant (RG-D04, RG-R02).
- **DI-G07** — `RELATION` de `famille_relation = causale` ⇒ `statut_causal` obligatoire et au moins une source ou un `ARGUMENT` (RG-G06) ; une cooccurrence calculée ne crée jamais de `RELATION`.
- **DI-G08** — Une `SITUATION` ne couvre une période que si `continuite = continuité attestée` ; trois points attestés ne produisent pas de situation continue (RG-G05, CU-15).
- **DI-G09** — Une classification historique d'une personne comme bien ou valeur (statut juridique) est une `ASSERTION_ATTRIBUT` attribuée à sa source, jamais un typage de l'entité (RG-E03).

**Exemple.** Sujet : PERSONNE P-1 ; prédicat `âge déclaré` ; valeur `{30, ans}` ; temps historique = date de l'acte ; `niveau = attestée` ; `nature = attestée` ; `modalite = affirmée par la source` ; `libelle_source` « âgé de trente ans » ; ancrée sur la zone z1.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| libelle_source | Vocabulaire exact de la source | `TEXTE_SOURCE` | C | — | DI-G06 | « âgé de trente ans » | S/A·V·O |
| niveau | Niveau d'élaboration | `CODE` | 1 | {attestée, normalisée, interprétée} | — | `attestée` | S·V·O |
| nature | Statut d'origine | `CODE` | 1 | {attestée, dérivée, synthétique, choisie pour affichage} | DI-G02, DI-G03 ; figée | `attestée` | S/C·F·O |
| modalite | Qui affirme | `CODE` | 1 | D-30 | DI-G04 ; `proposée automatiquement` ⇒ `etat_examen` automatique | `affirmée par la source` | S/A·V·O |
| polarite | Affirmative ou négative | `CODE` | 1 | {positive, négative} | DI-G05 ; défaut `positive` | `positive` | S·V·O |
| plausibilite | Plausibilité | `CODE` | 1 | D-19 | DD-14 | `forte` | S·V·O |
| temps_historique | Quand la proposition vaut | `DATE_HIST` ou `PERIODE_HIST` | 0..1 | DD-10 | Pour `SITUATION` : utiliser `date_debut`/`date_fin` | `1882-06-12` | S/A·V·O |
| valeur | Valeur | `VALEUR` | C | § 21 | Selon signature (DI-G01) | `{30, ans}` | S/A·V·O |
| etat_provenance | Qualité de la provenance | `CODE` | 1 | D-14 | DI-G02 | `sourcée` | C/S·V·O |

**Attributs propres aux profils**

| Profil | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| RELATION | famille_relation | Famille de relation | `REF_CONCEPT` | 1 | D-26 | Déduite du prédicat | `parenté` | C·V·O |
| RELATION | modele_parente | Modèle de parenté | `REF_CONCEPT` | C | D-27 | Si `famille_relation = parenté` | `déclaré` | S·V·O |
| RELATION | referentiel_spatial | Référentiel d'un rattachement spatial | `REF_CONCEPT` | C | D-28 | Si relation spatiale de rattachement | `religieux` | S·V·O |
| RELATION | statut_causal | Origine de la causalité | `CODE` | C | {attestée par la source, proposée par un chercheur} | DI-G07 | `proposée par un chercheur` | S·V·O |
| PRESENCE | type_presence | Nature de la présence | `CODE` | 1 | {présence attestée, déplacement attesté, trajet reconstruit} | `trajet reconstruit` ⇒ `nature` ≠ `attestée` | `présence attestée` | S·V·O |
| SITUATION | date_debut | Début | `DATE_HIST` | 0..1 | DD-10 | — | « avant 1834 » | S·V·O |
| SITUATION | date_fin | Fin | `DATE_HIST` | 0..1 | DD-10 | — | — | S·V·O |
| SITUATION | continuite | Continuité | `CODE` | 1 | {points attestés seulement, continuité hypothétique, continuité attestée} | DI-G08 | `points attestés seulement` | S·V·O |
| SITUATION | type_droit | Nature du droit sur un bien | `REF_CONCEPT` | C | D-29 | Si la cible est un `BIEN` | `hypothèque` | S·V·O |
| ASSERTION_ATTRIBUT, PARTICIPATION, EXISTENCE_DOCUMENTAIRE | — | Pas d'attribut propre | — | — | — | Le rôle d'une participation passe par ROLE | — | — |

**Dates de première et dernière attestation (CU-23).** Calculées à la demande sur les assertions accessibles (`C·D`) ; si elles sont matérialisées, c'est un cache invalidé par toute nouvelle assertion. Elles ne créent jamais d'événement « arrivée » ou « disparition » (RG-G11).

## 9.2 EXPRESSION_ASSERTION ✓

**Définition.** Formulation linguistique d'une assertion : formulation de la source, transcription normalisée, traduction, reformulation. Distincte de la proposition structurée : transcrire, normaliser ou traduire n'écrase pas l'assertion (MCD § 9.6, test 12).

**Participe à.** EXPRIMER_ASSERTION † : ASSERTION (0,n) — EXPRESSION_ASSERTION (1,1) ; EXTRAITE_DE † : EXPRESSION_ASSERTION (0,n) — SEGMENT (0,n) ; TRADUIRE_EXPRESSION † : EXPRESSION source (0,n) — EXPRESSION traduite (0,1).

**Intégrité.** **DI-G10** — Une traduction ne crée une nouvelle `ASSERTION` que si le sens propositionnel change ; sinon, c'est une nouvelle expression de la même assertion (MCD § 6.5). **DI-G11** — `nature = formulation source` ⇒ EXTRAITE_DE renseigné.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| texte | Formulation | `TEXTE_SOURCE` si `formulation source`, sinon `TEXTE_LONG` | 1 | — | TI-03 pour la formulation source | « Charles, âgé de trente ans » | S/A·V·O |
| langue | Langue | `LANGUE` | 1 | BCP 47 | — | `fr` | S/A·V·O |
| nature | Nature | `CODE` | 1 | {formulation source, transcription normalisée, traduction, reformulation} | DI-G10, DI-G11 | `traduction` | S·F·O |

## 9.3 INTERPRETATION ✓ — et ses spécialisations

**Définition.** Production raisonnée qui agrège des assertions ou d'autres interprétations. Spécialisations : HYPOTHESE, CONCLUSION, PHASE_TRAJECTOIRE, SYNTHESE, NARRATION, ESTIMATION.

**Participe à.** S_APPUYER, PORTER_SUR, REPONDRE, EXPLIQUER (anomalie), JUSTIFIER (base justificative).

**Intégrité.**

- **DI-G12** — Une `CONCLUSION` publiée ou partagée possède une `BASE_JUSTIFICATIVE` en vigueur (MCD § 9.6).
- **DI-G13** — Une `NARRATION` n'est jamais amont d'une dépendance de justification, ni sujet d'un ANCRER (RG-G08).
- **DI-G14** — Une `ESTIMATION` n'est jamais présentée comme statistique calculée ni comme statistique de source (RG-O04).
- **DI-G15** — Une `PHASE_TRAJECTOIRE` de `mode = proposée` reste `etat_examen` automatique jusqu'à examen humain.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Spécialisation | `CODE` | 1 | {hypothèse, conclusion, phase de trajectoire, synthèse, narration, estimation} | Figé | `conclusion` | S·F·O |
| enonce | Énoncé | `TEXTE_LONG` | 1 | — | — | « Charles TANCRÈDE meurt aux Îles du Salut le 2 février 1890 » | S/A·V·O |
| raisonnement | Raisonnement | `TEXTE_LONG` | C | — | Obligatoire pour hypothèse, conclusion, estimation | « … » | S·V·O |
| certitude | Certitude | `CODE` | 1 | D-19 | DD-14 | `forte` | S·V·O |
| questions_ouvertes | Questions restant ouvertes | `TEXTE_LONG` | 0..1 | — | — | « lieu exact de l'évasion » | S·V·O |
| etat_provenance | Qualité de la provenance | `CODE` | 1 | D-14 | — | `sourcée` | C/S·V·O |
| titre | Titre de phase | `TEXTE_COURT` | C | — | PHASE_TRAJECTOIRE | « Bagne de Guyane » | S·V·O |
| periode | Période de phase | `PERIODE_HIST` | C | — | PHASE_TRAJECTOIRE | 1885–1890 | S·V·O |
| mode | Origine de la phase | `CODE` | C | {manuelle, proposée} | PHASE_TRAJECTOIRE ; DI-G15 | `manuelle` | S/A·V·O |
| portee | Portée de synthèse | `CODE` | C | {documentaire stricte, projet, communautaire, Tree, chercheur} | SYNTHESE | `documentaire stricte` | S·V·O |
| regle_construction | Règle de construction | `TEXTE_LONG` | C | — | SYNTHESE | « assertions validées, sources publiques seules » | S·V·O |
| texte | Texte narratif | `TEXTE_LONG` | C | Markdown | NARRATION ; DI-G13 | « Né vers 1851… » | S/A·V·O |
| generee_par_ia | Narration générée par IA | `BOOLEEN` | C | — | NARRATION ; affiché au lecteur (§ 93.5) | `vrai` | Y·V·O |

## 9.4 LACUNE ✓

**Définition.** Qualification d'un vide : pourquoi ce qu'on ne sait pas est vide (CDCF § 11.1).

**Intégrité.** **DI-G16** — `type_vide = explicitement absent` exige une source ; `recherche exhaustive sans résultat` exige une `RECHERCHE_EFFECTUEE` de `niveau_consultation = consultation exhaustive` par JUSTIFIER (RG-G10).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type_vide | Nature du vide | `CODE` | 1 | D-31 | DI-G16 | `recherche exhaustive sans résultat` | S·V·O |
| dimension | Aspect concerné | `REF_CONCEPT` | 0..1 | Prédicat (annexe A.2) | — | `décès` | S·V·O |
| perimetre | Périmètre | `TEXTE_LONG` | C | — | Obligatoire pour les types de recherche | « état civil de Deshaies 1884–1888 » | S·V·O |

## 9.5 ERREUR_PROPAGEE ✓

**Définition.** Erreur dont on suit l'origine, les reprises et la correction (CDCF § 111). Vingt copies d'une erreur ne sont pas vingt confirmations.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| description | Description | `TEXTE_LONG` | 1 | — | — | « confusion de deux Jean CARMEN dans un arbre en ligne » | S·V·O |
| etat | État | `CODE` | 1 | {suspectée, établie, corrigée} | `corrigée` n'efface pas les reprises | `établie` | S·V·O |

## 9.6 TRANSMISSION ✓

**Définition.** Maillon de circulation d'une information ou d'un récit : A raconte à B ; un journal était disponible ; X l'a lu (CDCF § 108–109). Porte la **lignée informationnelle** (MCD § 9.6).

**Intégrité.** **DI-G17** — Un niveau n'est jamais promu sans trace (`exposition possible` ↛ `réception attestée`) (RG-G09). **DI-G18** — Les maillons d'une même chaîne comptent pour une seule ligne d'indépendance (DD-05).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| niveau | Niveau de circulation | `CODE` | 1 | D-32 | DI-G17 | `réception attestée` | S·V·O |
| mode | Support | `CODE` | 1 | {oral, manuscrit, imprimé, image, numérique, autre} | — | `oral` | S·V·O |
| date | Date | `DATE_HIST` | 0..1 | DD-10 | — | « vers 1950 » | S·V·O |

## 9.7 Associations du domaine G

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| SUJET | OBJET (`ENTITE_HISTORIQUE`, `DOCUMENT`, `POSITION`) (0,n) — ASSERTION (1,1) | — | DI-G01 | Suit l'assertion |
| CIBLE | OBJET (0,n) — ASSERTION (0,1) | — | DI-G01 ; TI-10 | `X` |
| PREDICAT | CONCEPT (0,n) — ASSERTION (1,1) | — | Concept de nature `prédicat` | Suit l'assertion |
| ROLE | CONCEPT (0,n) — ASSERTION (0,1) | — | Concept de nature `rôle` | Suit l'assertion |
| LIEU_DE | LIEU (0,n) — ASSERTION (0,1) | — | — | Suit l'assertion |
| SOUS_ASSERTION | ASSERTION parente (0,n) — composante (0,1) | rang (0..1) | Sans cycle | Suit la parente |
| FONDER | ASSERTION (0,n) — MENTION (0,n) | role_probatoire D-08 (1) | — | Suit l'assertion |
| ANCRER | ASSERTION (0,n) — ZONE (0,n) | role_probatoire D-08 (1) ; rang (0..1) | DI-G13 | Suit l'assertion |
| ISSUE_DE | ASSERTION (0,n) — REPONSE (0,n) | — | `modalite = issue d'une mémoire` | Suit l'assertion |
| DERIVER (calcul) | CALCUL (0,n) — ASSERTION (0,1) | — | DI-G03 | Suit l'assertion |
| S_APPUYER | INTERPRETATION (0,n) — OBJET (0,n) | sens {appui, contre, contexte} (1) | Doublé d'une `DEPENDANCE` de production | Suit l'interprétation |
| PORTER_SUR | INTERPRETATION (0,n) — ENTITE_HISTORIQUE (0,n) | — | — | Suit l'interprétation |
| REPONDRE | INTERPRETATION (0,n) — QUESTION (0,n) | — | — | Suit l'interprétation |
| QUALIFIER_VIDE | OBJET (0,n) — LACUNE (1,1) | — | — | Suit la lacune |
| JUSTIFIER (lacune) | LACUNE (0,n) — RECHERCHE_EFFECTUEE (0,n) | — | DI-G16 | Suit la lacune |
| ORIGINE / REPRENDRE | ERREUR_PROPAGEE (0,1) — OBJET (0,n) ; ERREUR (0,n) — OBJET (0,n) | transformation (`TEXTE_COURT`, 0..1) | — | Suit l'erreur |
| CONTENU / EMETTEUR / RECEPTEUR | OBJET (0,n) — TRANSMISSION (1,1) ; ENTITE_HISTORIQUE (0,n) — TRANSMISSION (0,1), ×2 | — | DI-G18 | Gouvernable nativement |
| EXPRIMER_ASSERTION † / EXTRAITE_DE † / TRADUIRE_EXPRESSION † | voir § 9.2 | — | DI-G10, DI-G11 | Suit l'assertion |

---

# 10. Domaine H — Validation, débat, crédit, réputation

## 10.1 ACTE_EVALUATION ✓

**Définition.** Acte daté d'un cycle de validation sur une **version** d'objet (CDCF § 50–51). N'est jamais supprimé du fait de la disparition d'une preuve (RG-H04).

**Participe à.** EVALUER (ACTEUR 0,n — 1,1), PORTER_SUR_VERSION (1,1), INVOQUER (arguments).

**Intégrité.**

- **DI-H01** — `type ∈ {validation, confirmation}` sur le Core partagé ⇒ l'acteur a le rôle `validateur` sur l'espace et un compte de vérification ≥ `standard` (RG-H07, DI-B06).
- **DI-H02** — `independance` est calculée : `lien connu` si l'acteur a un `LIEN_INTERET` sur l'objet, partage un `GROUPE` `équipe` avec un autre évaluateur du même objet, ou est auteur de la version évaluée ; `inconnue` sinon. `indépendance déclarée` est une déclaration de l'acteur, jamais un calcul (RG-H02).
- **DI-H03** — `type = contestation` ou `demande de réexamen` exige `justification` ; appuyé sur une preuve nouvelle, il ouvre un réexamen quel que soit le nombre de validations antérieures (RG-H03).
- **DI-H04** — Aucun acte n'est pondéré par un abonnement, un badge ou un nombre de votes (RG-B05, RG-H06).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature de l'acte | `CODE` | 1 | D-33 | DI-H01, DI-H03 | `contestation` | S·F·O |
| date | Date | `HORODATAGE` | 1 | UTC ms | — | `2030-05-01T00:00Z` | Y·F·O |
| justification | Justification | `TEXTE_LONG` | C | — | DI-H03 | « âge incompatible avec l'acte de 1802 » | S·F·O |
| processus_applicable | Processus de validation appliqué | `TEXTE_COURT` | 1 | Référence de procédure | — | « double relecture indépendante » | S/Y·F·O |
| independance | Indépendance de l'évaluateur | `CODE` | 1 | {indépendance déclarée, lien connu, inconnue} | DI-H02 | `lien connu` | C/S·F·O |
| role_au_moment † | Rôle de gouvernance de l'acteur à cette date | `CODE` | 1 | Rôles d'ATTRIBUER_ROLE | Figé | `validateur` | Y·F·O |

## 10.2 ARGUMENT ✓

**Définition.** Élément pour ou contre une hypothèse (identification, rapprochement, candidature, conclusion, reconstruction). Remplace tout score (CDCF § 50).

**Intégrité.** **DI-H05** — Un `BADGE` n'est jamais l'objet étayant un argument (critère 35). **DI-H06** — `nature = preuve discriminante` exige au moins un ETAYER.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| sens | Sens | `CODE` | 1 | {pour, contre, contexte} | — | `contre` | S·V·O |
| nature | Nature | `CODE` | 1 | {critère compatible, critère incompatible, indice, preuve discriminante, méthodologique} | DI-H06 | `critère incompatible` | S·V·O |
| enonce | Énoncé | `TEXTE_LONG` | 1 | — | — | « deux signatures simultanées en deux lieux » | S·V·O |

## 10.3 PROPOSITION_MODIFICATION ✓

**Définition.** Correction proposée par un tiers, avec justification et preuve (CDCF § 63).

**Intégrité.** **DI-H07** — Acceptée ⇒ une nouvelle version de l'objet cible, produite par une activité qui cite la proposition, et un `CREDIT` `proposant` conservé (RG-H08).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| contenu_propose | Modification proposée | `TEXTE_LONG` | 1 | Diff ou texte | — | « lire CHARBONNÉ au lieu de CHARBONNET » | S·V·O |
| justification | Justification | `TEXTE_LONG` | 1 | — | — | « le É est accentué ligne 3 » | S·V·O |
| statut | État | `CODE` | 1 | {soumise, en discussion, acceptée, refusée, retirée} | DI-H07 | `acceptée` | S·V·O |

## 10.4 CONFLIT_EDITION ✓

**Définition.** Conflit scientifique entre propositions concurrentes sur une même version de base. Pas de « dernier enregistrement gagnant » (CDCF § 64).

**Intégrité.** **DI-H08** — Au moins deux propositions (OPPOSER 2,n). **DI-H09** — `résolu par fusion compatible` uniquement pour des modifications non sémantiques.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| etat | État | `CODE` | 1 | {ouvert, résolu par choix, résolu par fusion compatible, indétermination conservée} | DI-H09 | `indétermination conservée` | S·V·O |

## 10.5 DISCUSSION ✓, MESSAGE, ACTE_MODERATION

| Entité | Définition | Attribut | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| DISCUSSION ✓ | Fil rattaché si possible à un objet de travail (§ 57) | titre | `TEXTE_COURT` | 1 | — | — | « Lecture du patronyme l. 3 » | S·V·O |
|  |  | statut | `CODE` | 1 | {ouverte, close, archivée} | — | `ouverte` | S·V·O |
| MESSAGE | Message d'une discussion ; non `OBJET` | id_message | `IDENT` | 1 | UUID v7 | — | `01c0…` | Y·N·O |
|  |  | date | `HORODATAGE` | 1 | UTC ms | — | `2030-05-02T08:00Z` | Y·N·O |
|  |  | texte | `TEXTE_LONG` | 1 | Markdown | Modération = masquage tracé, jamais réécriture | « … » | S·N·O |
| ACTE_MODERATION | Acte de modération ; sans effet scientifique (RG-H05) | id_moderation | `IDENT` | 1 | UUID v7 | — | `01c1…` | Y·N·O |
|  |  | type | `CODE` | 1 | {masquage, avertissement, suspension, rétablissement} | Ne modifie ni statut de validation ni argument | `masquage` | S·N·O |
|  |  | motif | `TEXTE_LONG` | 1 | — | — | « propos injurieux » | S·N·O |
|  |  | date | `HORODATAGE` | 1 | UTC ms | — | `2030-05-03T00:00Z` | Y·N·O |
|  |  | recours | `TEXTE_LONG` | 0..1 | — | Recours de modération ≠ réexamen scientifique | — | S·N·O |

## 10.6 DOMAINE_EXPERTISE, BADGE ✓, DECLARATION_PROFIL ✓

| Entité | Définition | Attribut | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| DOMAINE_EXPERTISE | Contexte d'expertise (CDCF § 34) | id_domaine | `IDENT` | 1 | UUID v7 | — | `01c2…` | Y·F·O |
|  |  | theme | `REF_CONCEPT` | 1 | — | — | `paléographie` | S·V·O |
|  |  | periode | `PERIODE_HIST` | 0..1 | — | — | XIXᵉ siècle | S·V·O |
|  |  | territoire | `TEXTE_COURT` | 0..1 | — | — | « Guadeloupe » | S·V·O |
|  |  | langue | `LANGUE` | 0..1 | BCP 47 | — | `la` | S·V·O |
|  |  | type_source | `REF_CONCEPT` | 0..1 | Annexe A.4 | — | `registre paroissial` | S·V·O |
| BADGE ✓ | Expérience constatée ou qualification attribuée ; jamais une preuve | famille | `CODE` | 1 | {expérience constatée, qualification attribuée} | `qualification attribuée` exige une procédure | `expérience constatée` | Y/S·V·O |
|  |  | libelle | `TEXTE_COURT` | 1 | — | Aucun badge du type « expert de… » fabriqué par observation (§ 58) | « 500 actes transcrits » | Y/S·V·O |
|  |  | critere_ou_procedure | `TEXTE_COURT` | 1 | — | — | « compteur de transcriptions validées » | Y/S·V·O |
|  |  | date_attribution | `HORODATAGE` | 1 | UTC ms | — | `2031-01-01T00:00Z` | Y·V·O |
|  |  | date_revocation | `HORODATAGE` | 0..1 | UTC ms | — | — | S·V·O |
| DECLARATION_PROFIL ✓ | Intérêt ou compétence déclarés (CDCF § 58) | type | `CODE` | 1 | {intérêt, compétence} | Déclaratif, jamais déduit de l'activité | `compétence` | S·V·O |
|  |  | visibilite | `CODE` | 1 | D-04 | — | `communauté GENIIUS` | S·V·O |
|  |  | disponible_sollicitation | `BOOLEEN` | 1 | — | Défaut `faux` | `vrai` | S·V·O |

## 10.7 DEMANDE ✓

**Définition.** Demande ciblée entre acteurs, sans messagerie ouverte ni exposition du courriel (CDCF § 59).

**Intégrité.** **DI-H10** — Le destinataire accepte la catégorie (`COMPTE.categories_sollicitation_acceptees`) et ne bloque pas l'émetteur.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| categorie | Catégorie | `CODE` | 1 | {source, vérification, photo-identification, avis, mission d'archives, collaboration} | DI-H10 | `photo-identification` | S·V·O |
| message | Message | `TEXTE_LONG` | 1 | — | — | « Reconnaissez-vous cette personne ? » | S·V·R |
| identite_revelee | L'émetteur révèle son identité | `BOOLEEN` | 1 | — | Défaut `faux` | `faux` | S·V·O |
| statut | État | `CODE` | 1 | {envoyée, acceptée, refusée, close} | — | `envoyée` | S·V·O |

## 10.8 Associations du domaine H

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| EVALUER | ACTEUR_GENIIUS (0,n) — ACTE_EVALUATION (1,1) | — | DI-H01 | Selon `mode_affichage_public` |
| PORTER_SUR_VERSION | ACTE_EVALUATION (1,1) — VERSION_OBJET (0,n) | — | — | Suit l'objet |
| ARGUMENTER | OBJET visé (0,n) — ARGUMENT (1,1) | — | — | Suit l'objet |
| ETAYER | ARGUMENT (0,n) — OBJET preuve (0,n) | — | DI-H05 | `X` |
| INVOQUER | ARGUMENT (0,n) — ACTE_EVALUATION (0,n) | — | — | Suit l'acte |
| PROPOSER / décideur | ACTEUR (0,n) — PROPOSITION_MODIFICATION (1,1) ; décideur ACTEUR (0,n) — (0,1) | — | — | Suit la proposition |
| CIBLER_VERSION | PROPOSITION_MODIFICATION (1,1) — VERSION_OBJET (0,n) | — | — | Suit l'objet |
| BASE / OPPOSER | CONFLIT_EDITION (1,1) — VERSION_OBJET (0,n) ; CONFLIT (2,n) — PROPOSITION (0,1) | — | DI-H08 | Suit l'objet |
| RATTACHER_DISCUSSION / CONTENIR_MESSAGE | OBJET (0,n) — DISCUSSION (0,1) ; DISCUSSION (0,n) — MESSAGE (1,1) ; ACTEUR (0,n) — MESSAGE (1,1) | — | — | Suit la discussion |
| MODERER | ACTEUR (0,n) — ACTE_MODERATION (1,1) — OBJET (0,n) \| ACTEUR (0,n) | — | RG-H05 | Interne à la modération |
| CREDITER — lien réifié (DD-09) | ACTEUR_GENIIUS (0,n) \| PERSONNE (0,n) — OBJET (0,n) | role_credit D-34 (1) ; id_lien (1) | Un acteur peut avoir plusieurs rôles sur un objet ; « remercié » ≠ coauteur (§ 54) | Gouvernable |
| OBTENIR | ACTEUR (0,n) — BADGE (1,1) ; BADGE (0,1) — DOMAINE_EXPERTISE (0,n) | — | — | Public si l'acteur l'accepte |
| DECLARER_PROFIL | ACTEUR (0,n) — DECLARATION_PROFIL (1,1) ; (0,1) — DOMAINE_EXPERTISE (0,n) | — | — | Selon `visibilite` |
| EMETTRE / RECEVOIR | ACTEUR (0,n) — DEMANDE (1,1), ×2 ; DEMANDE (0,1) — OBJET (0,n) | — | DI-H10 | Émetteur et destinataire seuls |

---

# 11. Domaine I — Reconstruction et cohérence documentaire

## 11.1 RECONSTRUCTION ✓ — conteneur (DD-01)

**Définition.** Reconstruction, par un auteur et selon une méthode, d'un document perdu ou lacunaire. Plusieurs reconstructions peuvent concurrencer (CDCF § 20, CU-03). Ses versions sont des manifestes de versions d'éléments.

**Intégrité.** **DI-I01** — Le document cible a `statut_existence` ≠ `conservé et localisé`, ou `lacunaire` (RG-I01). **DI-I02** — Une reconstruction n'est jamais affichée comme l'original : toute vue la présente avec la mention « reconstruction » et son auteur (RG-I02).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| titre | Titre | `TEXTE_COURT` | 1 | — | — | « Registre des nouveaux libres de Deshaies — reconstruction A » | S·V·O |
| methode | Méthode | `TEXTE_LONG` | 1 | — | Peut citer une `METHODE` | « dépouillement des mariages 1848–1870 citant un numéro » | S·V·O |
| statut | État | `CODE` | 1 | {proposée, en discussion, validée, abandonnée} | `validée` ≠ original | `en discussion` | S·V·O |

## 11.2 ELEMENT_RECONSTRUIT ✓ — ⊂ POSITION

**Définition.** Volume, section, colonne, page ou entrée d'une reconstruction. Son contenu est porté par des assertions dont il est le sujet ; son attribution à une personne passe par `CANDIDATURE`.

**Intégrité.**

- **DI-I03** — `statut_contenu = attesté par une trace` exige au moins un APPUYER.
- **DI-I04** — Aucun élément n'est créé pour « compléter » une série sans trace : une position inconnue entre deux numéros attestés n'est créée que si elle est explicitement utile, avec `statut_contenu = inconnu` (RG-I02, § 20.4).
- **DI-I05** — Chaque APPUYER crée une `DEPENDANCE` de production de l'élément vers la mention (RG-I03).
- **DI-I06** — Unicité (reconstruction, parent, niveau, numero) lorsque `numero` est renseigné.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| niveau | Niveau structurel | `CODE` | 1 | {volume, section, colonne, page, entrée} | — | `entrée` | S·V·O |
| numero | Numéro porté ou déduit | `TEXTE_COURT` | 0..1 | — | Tel que cité par les traces | `8` | S·V·O |
| statut_contenu | Nature épistémique du contenu | `CODE` | 1 | {attesté par une trace, reconstruit (hypothèse), inconnu} | DI-I03, DI-I04 | `reconstruit (hypothèse)` | S·V·O |

Les attributs `description`, `rang` et `statut` sont hérités de `POSITION`.

## 11.3 ANOMALIE_DOCUMENTAIRE ✓

**Définition.** Anomalie détectée dans une série ou un document (numéro manquant, pages absentes, rupture de série) ; jamais une conclusion (CDCF § 21).

**Intégrité.** **DI-I07** — Une anomalie ne modifie aucun `statut_existence` (RG-I04, CU-25). **DI-I08** — `statut = expliquée` exige une `INTERPRETATION` par EXPLIQUER de `certitude` ≠ `indéterminée`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `CODE` | 1 | D-35 | — | `numéro manquant` | A/S·V·O |
| description | Description | `TEXTE_LONG` | 1 | — | — | « actes 86 puis 88 ; 87 absent » | A/S·V·O |
| detectee_par | Origine | `CODE` | 1 | {moteur de règles, humain} | `moteur de règles` ⇒ `etat_examen` automatique | `moteur de règles` | Y·F·O |
| statut | État | `CODE` | 1 | {signalée, en examen, expliquée, sans explication} | DI-I08 | `signalée` | S·V·O |

## 11.4 Associations du domaine I

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| RECONSTRUIRE | DOCUMENT (0,n) — RECONSTRUCTION (1,1) | — | DI-I01 | Suit la reconstruction |
| CONCURRENCER | RECONSTRUCTION (0,n) — RECONSTRUCTION (0,n) | — | Même document cible | Suit chacune |
| STRUCTURER | RECONSTRUCTION (1,n) — ELEMENT_RECONSTRUIT (1,1) | — | — | Suit l'élément |
| CONTENIR_ELEMENT | ELEMENT parent (0,n) — enfant (0,1) | — | Sans cycle ; même reconstruction | Suit l'élément |
| APPUYER | ELEMENT_RECONSTRUIT (0,n) — MENTION (0,n) | apport {cite le numéro, cite le nom, cite la parenté, cite une information} (1) ; role_probatoire D-08 (1) | DI-I05 | Suit l'élément |
| PRESENTER | UNITE_ARCHIVISTIQUE \| DOCUMENT (0,n) — ANOMALIE_DOCUMENTAIRE (1,1) | — | — | Suit l'anomalie |
| EXPLIQUER | ANOMALIE (0,n) — INTERPRETATION (0,n) | — | Plusieurs hypothèses concurrentes admises | Suit l'anomalie |
| OUVRIR | ANOMALIE (0,1) — PISTE (0,n) | — | — | Suit la piste |

---

# 12. Domaine J — Journal (mémoire)

**Règle de domaine.** Une session produit un `DOCUMENT` de nature `témoignage`, qui suit la chaîne documentaire normale (DI-C04). Les données de ce domaine concernent des personnes souvent vivantes : la confidentialité par défaut est `R` pour les contenus de réponse et l'identité des témoins.

## 12.1 SESSION_MEMOIRE ✓

**Définition.** Moment de recueil : auto-mémoire, entretien d'un tiers, discussion collective, capture libre (CDCF § 24.1–24.4).

**Intégrité.**

- **DI-J01** — Au moins un témoin (TEMOIN 1,n).
- **DI-J02** — Un enregistrement audio ou une transcription exige un `CONSENTEMENT` de portée correspondante du ou des témoins avant tout usage hors de l'espace (CDCF § 24.16).
- **DI-J03** — `type = discussion collective` est une nouvelle source : elle ne remplace aucune réponse individuelle antérieure (RG-J05).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `CODE` | 1 | {auto-mémoire, entretien d'un tiers, discussion collective, capture libre, réponse de campagne} | DI-J03 | `entretien d'un tiers` | S·F·O |
| date | Date | `DATE_HIST` | 1 | DD-10 | — | `2028-08-15` | S·V·O |
| lieu | Lieu de l'entretien | `TEXTE_COURT` | 0..1 | — | Lieu historique : association à `LIEU` ; adresse privée : `R` | « chez tante Lucienne, Deshaies » | S·V·R |
| mode | Modalité | `CODE` | 1 | {présentiel, téléphone, visio, écrit, audio seul} | — | `présentiel` | S·V·O |
| contexte | Contexte | `TEXTE_LONG` | 0..1 | — | — | « fête de famille, plusieurs cousins présents » | S·V·R |
| statut_temoin | Rapport du témoin aux faits | `CODE` | 1 | {personne concernée, témoin direct, témoin indirect, inconnu} | `personne concernée` : RG-J07 | `témoin direct` | S·V·O |

## 12.2 ECHANGE ✓

**Définition.** Une question posée et ce qui s'en suit, dans l'ordre (CDCF § 24.4).

**Intégrité.** **DI-J04** — `question_texte_exact` vide ⇒ `caractere_question = inconnu` ; une question manquante n'est jamais reconstituée (RG-J02). **DI-J05** — Rang unique par session.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| rang | Ordre dans la session | `ENTIER` | 1 | ≥ 1 | DI-J05 | `3` | S/A·V·O |
| question_texte_exact | Question telle que posée | `TEXTE_SOURCE` | 0..1 | — | DI-J04 | « Comment s'appelait le frère de ta mère ? » | S/A·V·O |
| caractere_question | Caractère | `CODE` | 1 | {ouverte, fermée, suggestive, inconnu} | DI-J04 | `ouverte` | S·V·O |

## 12.3 REPONSE ✓

**Définition.** Réponse à un échange, avant ou après indice, avec état de mémoire et mode de connaissance (CDCF § 20, § 21, § 24.5–24.6).

**Intégrité.**

- **DI-J06** — `phase = après indice` ⇒ un `INDICE` existe dans le même échange, antérieur à la réponse (RG-J01).
- **DI-J07** — La réponse spontanée n'est jamais modifiée : un changement de déclaration est une nouvelle réponse liée par REVISER ; seule une correction de transcription crée une nouvelle version (RG-J03).
- **DI-J08** — `etat_memoire` ∈ {jamais su, savait mais a oublié, refuse, non demandé, exclu volontairement} admet un `texte` vide ; aucun attribut n'interprète un silence (RG-J04).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| phase | Moment de la réponse | `CODE` | 1 | {spontanée, après indice} | DI-J06 ; figé | `spontanée` | S·F·O |
| texte | Réponse | `TEXTE_SOURCE` | C | — | DI-J08 ; verbatim | « Je ne sais plus, on l'appelait Ti-René » | S/A·V·R |
| etat_memoire | État de mémoire | `CODE` | 1 | D-36 | DI-J08 | `souvenir partiel` | S·V·R |
| mode_connaissance | Mode de connaissance | `CODE` | 1 | D-37 | Défaut `inconnu` | `tradition familiale` | S·V·R |

## 12.4 INDICE ✓

**Définition.** Élément montré au témoin ; marque la frontière entre spontané et suggéré.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `CODE` | 1 | {nom, photo, arbre, hypothèse, document, autre} | TI-06 | `nom` | S·F·O |
| description | Ce qui a été montré | `TEXTE_LONG` | 1 | — | — | « suggestion : Marcel » | S·V·O |
| moment | Instant dans la session | `ENTIER` | 0..1 | ms depuis le début de l'enregistrement | Antérieur à la réponse après indice | `754000` | S/A·V·O |

## 12.5 RELANCE ✓

**Définition.** Re-proposition planifiée d'une question oubliée ou non résolue (CDCF § 21, § 24.6).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| date_prevue | Date prévue | `DATE_HIST` | 1 | Date exacte ou mois | Pas de relance automatique non sollicitée | `2029-02` | S·V·O |
| note_delicatesse | Précautions | `TEXTE_LONG` | 0..1 | — | — | « sujet douloureux, ne pas insister » | S·V·R |
| statut | État | `CODE` | 1 | {prévue, faite, abandonnée} | — | `prévue` | S·V·O |

## 12.6 CAMPAGNE_MEMOIRE ✓

**Définition.** Campagne de questions vers plusieurs personnes ; réponses indépendantes avant confrontation (CDCF § 24.13).

**Intégrité.** **DI-J09** — En phase `réponses indépendantes`, un participant n'accède pas aux réponses des autres (RG-J05). **DI-J10** — Le passage en `confrontation collective` est irréversible pour la campagne (une nouvelle phase indépendante exige une nouvelle campagne).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| titre | Titre | `TEXTE_COURT` | 1 | — | — | « Qui était Ti-René ? » | S·V·O |
| phase | Phase | `CODE` | 1 | {réponses indépendantes, confrontation collective, close} | DI-J09, DI-J10 | `réponses indépendantes` | S·V·O |
| periode | Période de la campagne | `PERIODE_HIST` | 0..1 | — | — | 2028-08 – 2028-12 | S·V·O |

## 12.7 CAPSULE ✓

**Définition.** Contenu destiné à un destinataire futur, délivré sous condition ; distinct de l'embargo (CDCF § 24.14).

**Intégrité.** **DI-J11** — Le destinataire est une personne, un acteur, ou seulement décrit (`destinataire_description`) s'il n'existe pas encore ; au moins un des trois. **DI-J12** — La délivrance ne lève aucun embargo sur le contenu (RG-J06).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| titre | Titre | `TEXTE_COURT` | 1 | — | — | « Pour mes petits-enfants » | S·V·R |
| condition_type | Type de condition | `CODE` | 1 | {date, âge du destinataire, décès de l'auteur, autre} | TI-06 | `âge du destinataire` | S·V·R |
| condition_valeur | Valeur de la condition | `TEXTE_COURT` | 1 | Selon le type | — | `18 ans` | S·V·R |
| destinataire_description | Destinataire non encore identifiable | `TEXTE_COURT` | C | — | DI-J11 | « mon premier arrière-petit-enfant » | S·V·R |
| etat | État | `CODE` | 1 | {scellée, délivrable, délivrée, annulée} | `délivrable` calculé ; DI-J12 | `scellée` | S/C·V·R |

## 12.8 Associations du domaine J

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| PRODUIRE_DOC | SESSION_MEMOIRE (0,1) — DOCUMENT (0,1) | — | DI-C04 | Suit la session |
| TEMOIN | SESSION_MEMOIRE (1,n) — PERSONNE (0,n) | — | DI-J01 | `R` |
| PRESENT | SESSION (0,n) — PERSONNE (0,n) | role {présent, intervenant, traducteur} (1) | — | `R` |
| INTERVIEWER | SESSION (0,1) — ACTEUR_GENIIUS (0,n) | — | — | Suit la session |
| DANS_CAMPAGNE | SESSION (0,1) — CAMPAGNE_MEMOIRE (0,n) | — | — | Suit la session |
| DEROULER | SESSION (0,n) — ECHANGE (1,1) | — | DI-J05 | Suit l'échange |
| POSER_QUESTION | ECHANGE (0,1) — QUESTION (0,n) | — | — | Suit l'échange |
| MINUTE | ECHANGE (0,n) — ZONE (0,n) | — | Zones de la reproduction de l'enregistrement | Suit l'échange |
| OBTENIR | ECHANGE (0,n) — REPONSE (1,1) | — | — | `R` |
| MONTRER_INDICE | ECHANGE (0,n) — INDICE (1,1) ; INDICE (0,1) — OBJET (0,n) | — | DI-J06 | Suit l'échange |
| REVISER | REPONSE nouvelle (0,1) — REPONSE antérieure (0,1) | nature {nouvelle déclaration, précision, rétractation} (1) | DI-J07 | `R` |
| REPROPOSER | REPONSE (0,n) — RELANCE (1,1) | — | — | Suit la réponse |
| INTERROGER | CAMPAGNE (0,n) — PERSONNE (0,n) | statut {invitée, a répondu, a décliné} (1) | — | `R` |
| POSER | CAMPAGNE (0,n) — QUESTION (0,n) | portee {commune, personnalisée} (1) | — | Suit la campagne |
| CREER_CAPSULE / CONTENIR_CAPSULE | ACTEUR (0,n) — CAPSULE (1,1) ; CAPSULE (1,n) — OBJET (0,n) ; CAPSULE (0,1) — PERSONNE (0,n) \| ACTEUR (0,n) | — | DI-J11 | `R` |

---

# 13. Domaine K — Echo (recherche)

## 13.1 PROJET ✓ — ⊂ ESPACE

**Définition.** Projet de recherche ou de mémoire, transmissible, avec un cycle de vie historisé (CDCF § 25.19).

**Intégrité.** **DI-K01** — `etat_cycle = clôturé dans son périmètre` exige `date_cloture` ; une réouverture crée une nouvelle version sans effacer l'état de clôture (RG-K04, critère 21). **DI-K02** — `transmis` exige une `DESIGNATION_GARDE` effective de rôle successeur.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| intitule | Intitulé | `TEXTE_COURT` | 1 | — | — | « Les CHARBONNÉ de Deshaies » | S·V·O |
| objet_focal | Point de départ | `TEXTE_COURT` | 1 | — | Pas forcément une personne (§ 1.1) | « habitation Dolé » | S·V·O |
| perimetre | Périmètre déclaré | `TEXTE_LONG` | 0..1 | — | Sert à « clôturé dans son périmètre » | « 1793–1848, Basse-Terre » | S·V·O |
| etat_cycle | État | `CODE` | 1 | D-38 | DI-K01, DI-K02 ; pas de pourcentage d'avancement (RG-K02) | `actif` | S·V·O |
| date_cloture | Date de clôture | `DATE_HIST` | C | Date exacte | DI-K01 | — | S·V·O |

## 13.2 QUESTION ✓

**Définition.** Question de recherche ou de mémoire, objet autonome et réouvrable (CDCF § 24.12, § 25.9). Commune à Journal et Echo (MCD C3).

**Intégrité.**

- **DI-K03** — `etat = suffisamment traitée selon protocole` exige une `APPLICATION_PROTOCOLE` accomplie sur la question (RG-K02).
- **DI-K04** — `etat = à réexaminer` est posé automatiquement quand une dépendance de la conclusion qui y répond passe à `potentiellement affecté` pour un changement scientifique (RG-K03) ; `motif_reouverture` est alors renseigné.
- **DI-K05** — `recherchabilite = insolubilité fortement documentée` exige au moins une `RECHERCHE_EFFECTUEE` exhaustive et une justification ; cette valeur doit rester exceptionnelle (CDCF § 25.12).
- **DI-K06** — La hiérarchie SOUS_QUESTION est sans cycle.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| libelle | Question | `TEXTE_COURT` | 1 | Forme interrogative | — | « Qui sont les parents de Charles TANCRÈDE ? » | S·V·O |
| portee | Recherche ou mémoire | `CODE` | 1 | {recherche, mémoire} | — | `recherche` | S·V·O |
| etat | État | `CODE` | 1 | D-39 | DI-K03, DI-K04 | `ouverte` | S/C·V·O |
| recherchabilite | Possibilité actuelle de progresser | `CODE` | 1 | D-40 | DI-K05 ; une question peut redevenir recherchable | `pistes disponibles` | S·V·O |
| motif_reouverture | Raison de la réouverture | `TEXTE_LONG` | C | — | DI-K04 | « identification de m12 invalidée » | S/C·V·O |

## 13.3 PISTE ✓

**Définition.** Piste d'une question, avec statut de branche et priorité explicable (CDCF § 25.9, Q140).

**Intégrité.** **DI-K07** — `source_suggeree` ne crée aucun document ni assertion d'existence (RG-K06). **DI-K08** — `priorite` renseignée ⇒ `justification_priorite` obligatoire (priorisation explicable).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| description | Piste | `TEXTE_LONG` | 1 | — | — | « rechercher la fiche matricule » | S·V·O |
| statut | Statut de branche | `CODE` | 1 | {à explorer, en cours, réussie, suspendue, réfutée, bloquée} | — | `à explorer` | S·V·O |
| priorite | Priorité | `CODE` | 0..1 | {haute, moyenne, basse} | DI-K08 ; pas de score numérique | `haute` | S/A·V·O |
| justification_priorite | Pourquoi cette priorité | `TEXTE_LONG` | C | — | DI-K08 | « seule série couvrant 1884–1888 » | S/A·V·O |
| source_suggeree | Source possible | `TEXTE_COURT` | 0..1 | — | DI-K07 : « suggérée ≠ existe » | « registres matricules, ANOM » | S/A·V·O |

## 13.4 RECHERCHE_EFFECTUEE ✓

**Définition.** Recherche réellement menée, positive ou négative, avec son périmètre, ses variantes, son niveau de consultation et ses limites (CDCF § 11.3, § 23, § 25.3). Porte aussi le fragment effectivement consulté.

**Intégrité.**

- **DI-K09** — Au moins un objet de PERIMETRE ; `couverture` décrit précisément ce qui a été vu (pages, années, index).
- **DI-K10** — `resultat = négatif` ne produit jamais d'assertion négative ni de lacune « explicitement absent » ; au mieux une `LACUNE` « recherche exhaustive sans résultat » si `niveau_consultation = consultation exhaustive` (RG-K01, critère 19).
- **DI-K11** — `termes_et_variantes` est obligatoire pour une recherche nominative.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| date | Date de la recherche | `DATE_HIST` | 1 | Date exacte | — | `2029-03-14` | S·F·O |
| objectif | Ce qui était cherché | `TEXTE_COURT` | 1 | — | — | « décès de Charles TANCRÈDE » | S·V·O |
| termes_et_variantes | Termes et variantes employés | `TEXTE_LONG` | C | — | DI-K11 | « TANCRÈDE, TANCREDE, TANCRED » | S·V·O |
| niveau_consultation | Profondeur atteinte | `CODE` | 1 | D-41 | DI-K10 | `consultation partielle` | S·V·O |
| couverture | Périmètre exact consulté | `TEXTE_LONG` | 1 | — | DI-K09 | « décès 1884–1886, tables décennales seulement » | S·V·O |
| resultat | Résultat | `CODE` | 1 | {positif, négatif, partiel, non concluant} | DI-K10 | `négatif` | S·V·O |
| limites | Limites connues | `TEXTE_LONG` | 0..1 | — | — | « 1885 lacunaire » | S·V·O |

## 13.5 MISSION ✓ et ITEM_MISSION ✓

**Définition.** `MISSION` : mission d'archives, de la préparation au compte rendu, éventuellement déléguée (CDCF § 25.2, § 25.4). `ITEM_MISSION` : cote ou document à traiter, avec son état de consultation.

**Intégrité.** **DI-K12** — Les accès des intervenants sont bornés par `acces_debut`, `acces_fin` et `perimetre_acces` (RG-K05) ; à expiration, les règles d'accès dérivées sont closes. **DI-K13** — Un item `consulté`, `photographié` ou `incomplet` produit une `RECHERCHE_EFFECTUEE` (REALISER_ITEM).

| Entité | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| MISSION | objectifs | Objectifs | `TEXTE_LONG` | 1 | — | — | « consulter les registres matricules 1882–1890 » | S·V·O |
| MISSION | date_prevue | Date prévue | `DATE_HIST` | 0..1 | — | — | `2029-04` | S·V·O |
| MISSION | dates_effectives | Dates effectives | `PERIODE_HIST` | 0..1 | — | — | 2029-04-10 – 2029-04-12 | S·V·O |
| MISSION | statut | État | `CODE` | 1 | {préparée, en cours, réalisée, annulée} | — | `réalisée` | S·V·O |
| MISSION | cout | Coût | `VALEUR` | 0..1 | § 21 | — | `{420, EUR}` | S·V·O |
| MISSION | contraintes | Contraintes | `TEXTE_LONG` | 0..1 | — | — | « pas de photo des registres reliés » | S·V·O |
| MISSION | compte_rendu | Compte rendu | `TEXTE_LONG` | 0..1 | — | — | « … » | S·V·O |
| ITEM_MISSION | rang | Ordre | `ENTIER` | 1 | ≥ 1 | — | `1` | S·V·O |
| ITEM_MISSION | priorite | Priorité | `CODE` | 0..1 | {haute, moyenne, basse} | — | `haute` | S·V·O |
| ITEM_MISSION | statut | État de consultation | `CODE` | 1 | D-42 | DI-K13 | `photographié` | S·V·O |
| ITEM_MISSION | notes | Notes | `TEXTE_LONG` | 0..1 | — | — | « refaire le f° 22, flou » | S·V·O |

## 13.6 OFFRE_DEPLACEMENT ✓ et MICRO_MISSION ✓

**Définition.** Un acteur annonce un passage aux archives et accepte de petites demandes (CDCF § 25.5). Privacy by default.

**Intégrité.** **DI-K14** — Une offre n'expose aucun projet privé ; seule la `consigne` d'une micro-mission est transmise au porteur.

| Entité | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| OFFRE_DEPLACEMENT | date | Date du passage | `DATE_HIST` | 1 | Date exacte | — | `2029-05-02` | S·V·O |
| OFFRE_DEPLACEMENT | categories_acceptees | Types de demandes acceptées | `CODE` | 1..n | {photographie d'une cote, vérification d'une mention, relevé d'index} | — | `photographie d'une cote` | S·V·O |
| OFFRE_DEPLACEMENT | capacite | Nombre de demandes acceptées | `ENTIER` | 0..1 | ≥ 1 | — | `5` | S·V·O |
| OFFRE_DEPLACEMENT | visibilite | Qui voit l'offre | `CODE` | 1 | D-04 | Défaut `cercle invité` | `communauté GENIIUS` | S·V·O |
| MICRO_MISSION | consigne | Demande | `TEXTE_LONG` | 1 | — | DI-K14 | « photographier 9 E 12, acte 87 » | S·V·O |
| MICRO_MISSION | cible | Cote visée | `TEXTE_COURT` | 0..1 | — | Une unité connue passe par association | `9 E 12` | S·V·O |
| MICRO_MISSION | statut | État | `CODE` | 1 | {proposée, acceptée, réalisée, refusée} | — | `acceptée` | S·V·O |

## 13.7 CONDITION_PRATIQUE ✓, CONTACT ✓, INTERACTION ✓

| Entité | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| CONDITION_PRATIQUE | type | Nature de la condition | `CODE` | 1 | {horaires, réservation, délai de communication, photo autorisée, quota, fermeture, tarif, autre} | TI-06 | `photo autorisée` | S·V·O |
| CONDITION_PRATIQUE | valeur | Valeur observée | `TEXTE_COURT` | 1 | — | — | « oui, sans flash » | S·V·O |
| CONDITION_PRATIQUE | date_observation | Date du constat | `DATE_HIST` | 1 | Date exacte | Historisée (Q142) | `2029-04-10` | S·V·O |
| CONTACT | nom_affiche | Nom de l'interlocuteur | `TEXTE_COURT` | 1 | — | Privé à l'espace | « M. Dupuis, ANOM » | S·V·R |
| CONTACT | type | Nature | `CODE` | 1 | {institution, archiviste, association, famille, chercheur, autre} | — | `archiviste` | S·V·O |
| CONTACT | coordonnees_privees | Coordonnées | `TEXTE_LONG` | 0..1 | — | Jamais partagées hors de l'espace | « … » | S·V·I |
| INTERACTION | type | Nature | `CODE` | 1 | {demande, réponse, relance, échange, note privée} | — | `relance` | S·V·O |
| INTERACTION | date | Date | `DATE_HIST` | 1 | Date exacte | — | `2029-02-01` | S·V·O |
| INTERACTION | contenu | Contenu | `TEXTE_LONG` | 1 | — | — | « demande de communication de 9 E 12 » | S·V·R |
| INTERACTION | echeance_relance | Échéance de relance | `DATE_HIST` | 0..1 | Date exacte | — | `2029-03-01` | S·V·O |

## 13.8 PROTOCOLE ✓, CRITERE_PROTOCOLE ✓, APPLICATION_PROTOCOLE ✓

**Définition.** `PROTOCOLE` : protocole versionné, partageable, citable, conditionnel (conteneur, DD-01). `CRITERE_PROTOCOLE` : étape ou dimension. `APPLICATION_PROTOCOLE` : application d'une **version** de protocole à une question (critère d'arrêt) ou à un document (couverture d'exploitation).

**Intégrité.**

- **DI-K15** — Une application cite une version figée du protocole ; une nouvelle version du protocole ne modifie pas les applications passées (RG-K08).
- **DI-K16** — `statut = accompli selon protocole` exige que chaque critère de la version appliquée soit `accompli` ou `non applicable` (ETAT_CRITERE).
- **DI-K17** — « Exhaustif » n'est affiché que sous la forme « exhaustif selon le protocole X vN » (RG-D07).

| Entité | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| PROTOCOLE | titre | Titre | `TEXTE_COURT` | 1 | — | — | « Recherche des parents — état civil antillais » | S·V·O |
| PROTOCOLE | portee | Portée | `CODE` | 1 | {personnel, équipe, communauté, pays, période, type de problème} | — | `type de problème` | S·V·O |
| PROTOCOLE | conditions_application | Quand l'appliquer | `TEXTE_LONG` | 0..1 | — | — | « personne née avant 1848 en Guadeloupe » | S·V·O |
| CRITERE_PROTOCOLE | rang | Ordre | `ENTIER` | 1 | ≥ 1 | Unique par protocole | `1` | S·V·O |
| CRITERE_PROTOCOLE | libelle | Critère | `TEXTE_COURT` | 1 | — | — | « état civil de la commune vérifié » | S·V·O |
| CRITERE_PROTOCOLE | dimension | Dimension de couverture | `REF_CONCEPT` | 0..1 | {pages transcrites, personnes extraites, lieux, propriétés, signatures, marges, professions, relations, série consultée, variantes recherchées, autre} | — | `marges` | S·V·O |
| CRITERE_PROTOCOLE | condition | Condition d'applicabilité | `TEXTE_COURT` | 0..1 | — | — | « si acte notarié » | S·V·O |
| APPLICATION_PROTOCOLE | statut | État | `CODE` | 1 | {en cours, accompli selon protocole, interrompu} | DI-K16 | `accompli selon protocole` | S/C·V·O |
| APPLICATION_PROTOCOLE | date | Date | `HORODATAGE` | 1 | UTC ms | — | `2029-06-01T00:00Z` | Y·V·O |

## 13.9 REGLE_METHODOLOGIQUE ✓

**Définition.** Régularité détectée, règle proposée ou règle adoptée humainement, avec portée explicite ; inclut l'apprentissage par corrections (CDCF § 23.7, § 25.8).

**Intégrité.** **DI-K18** — `niveau = règle adoptée` exige un adoptant humain (CONTEXTE_REGLE) ; la portée ne s'étend jamais automatiquement (RG-K07). **DI-K19** — Une règle de portée `main/scribe`, `registre` ou `corpus` est reliée à l'objet correspondant.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| enonce | Règle | `TEXTE_LONG` | 1 | — | — | « dans ce registre, "Jn" abrège "Jean" » | S/A·V·O |
| niveau | Niveau | `CODE` | 1 | {pattern détecté, règle proposée, règle adoptée} | DI-K18 | `règle adoptée` | S/A·V·O |
| origine | Origine | `CODE` | 1 | {détection automatique, corrections humaines, proposition humaine} | — | `corrections humaines` | Y/S·F·O |
| portee | Portée | `CODE` | 1 | D-43 | DI-K19 | `registre` | S·V·O |

## 13.10 TACHE ✓

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| libelle | Tâche | `TEXTE_COURT` | 1 | — | — | « retrouver le fondement de la validation de 2028 » | S/C·V·O |
| statut | État | `CODE` | 1 | {à faire, en cours, faite, abandonnée} | — | `à faire` | S·V·O |
| echeance | Échéance | `DATE_HIST` | 0..1 | Date exacte | — | `2035-06-30` | S·V·O |
| origine | Origine | `CODE` | 1 | {manuelle, signal de dépendance, preuve inaccessible, réouverture, anomalie} | Les origines non manuelles sont créées par le système (CU-20) | `preuve inaccessible` | Y/S·F·O |

## 13.11 SNAPSHOT ✓, DIFF_CONNAISSANCE ✓, DECOUVERTE ✓

**Définition.** `SNAPSHOT` : état intellectuel figé, nommé, daté, citable (conteneur, DD-01). `DIFF_CONNAISSANCE` : explication enregistrée d'un changement entre deux états. `DECOUVERTE` : découverte formalisée, sans revendication automatique de priorité.

**Intégrité.** **DI-K20** — Un snapshot est immuable après création (une seule version). **DI-K21** — Un diff désigne deux snapshots, ou un snapshot et une date, ou deux dates ; `nature` est `technique` si toutes les versions comparées ont `nature_changement = correction technique`. **DI-K22** — `priorite_externe` n'est jamais `revendiquée` : la valeur n'existe pas (CDCF § 25.17).

| Entité | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| SNAPSHOT | nom | Nom | `TEXTE_COURT` | 1 | — | Unique par espace | « État au dépôt du mémoire, juin 2028 » | S·F·O |
| SNAPSHOT | date | Date | `HORODATAGE` | 1 | UTC ms | DI-K20 | `2028-06-30T00:00Z` | Y·F·O |
| SNAPSHOT | description | Description | `TEXTE_LONG` | 0..1 | — | — | « … » | S·F·O |
| DIFF_CONNAISSANCE | resume | Résumé du changement | `TEXTE_LONG` | 1 | — | — | « 47 → 48 personnes après scission de P-12 » | S/A·V·O |
| DIFF_CONNAISSANCE | nature | Nature | `CODE` | 1 | {technique, scientifique, mixte} | DI-K21 | `scientifique` | C/S·V·O |
| DIFF_CONNAISSANCE | consequences | Conséquences | `TEXTE_LONG` | 0..1 | — | — | « statistique Dolé recalculée » | S/A·V·O |
| DECOUVERTE | enonce | Découverte | `TEXTE_LONG` | 1 | — | — | « le n°8 désigne Rosalie, pas Rose » | S·V·O |
| DECOUVERTE | date | Date | `DATE_HIST` | 1 | Date exacte | — | `2032-03-02` | S·V·O |
| DECOUVERTE | portee_nouveaute | Pour qui c'est nouveau | `CODE` | 1 | D-44 | — | `nouveau dans GENIIUS` | S·V·O |
| DECOUVERTE | priorite_externe | Priorité scientifique externe | `CODE` | 1 | {non évaluée, antériorité connue, non revendiquée} | DI-K22 | `non évaluée` | S·V·O |

## 13.12 Associations du domaine K

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| RELIER_PROJETS | PROJET (0,n) — PROJET (0,n) | type {issu de, prolonge, complète, réexamine, conteste, réutilise le corpus de, sous-projet de, succède à} (1) | Sans cycle pour `sous-projet de` | Suit chaque projet |
| SOUS_QUESTION | QUESTION parente (0,n) — QUESTION (0,1) | — | DI-K06 | Suit la question |
| CONCERNER | QUESTION (0,n) — OBJET (0,n) | — | — | `X` |
| EXPLORER | QUESTION (0,n) — PISTE (1,1) ; PISTE (0,1) — RECHERCHE_EFFECTUEE \| ANOMALIE (origine) | — | — | Suit la piste |
| CIBLER | PISTE (0,n) — UNITE_ARCHIVISTIQUE \| ORGANISATION \| CONCEPT (0,n) | — | DI-K07 | Suit la piste |
| INSTRUIRE / SUIVRE | QUESTION (0,n) — RECHERCHE (0,1) ; PISTE (0,n) — RECHERCHE (0,1) | — | — | Suit la recherche |
| PERIMETRE | RECHERCHE_EFFECTUEE (1,n) — OBJET (0,n) | pages_ou_annees_couvertes (`TEXTE_COURT`, 0..1) | DI-K09 | Suit la recherche |
| CHERCHER | ACTEUR (0,n) — RECHERCHE (1,1) | — | — | Suit la recherche |
| ORGANISER / CENTRE | PROJET (0,n) — MISSION (0,1) ; ORGANISATION (0,n) — MISSION (1,1) | — | — | Suit la mission |
| PLANIFIER_ITEM | MISSION (0,n) — ITEM_MISSION (1,1) ; ITEM (0,1) — UNITE_ARCHIVISTIQUE (0,n) ; ITEM (0,1) — QUESTION (0,n) | — | — | Suit la mission |
| REALISER_ITEM | ITEM (0,n) — RECHERCHE (0,1) ; ITEM (0,n) — REPRODUCTION (0,1) | — | DI-K13 | Suit la mission |
| INTERVENIR | MISSION (0,n) — ACTEUR (0,n) | role {commanditaire, consultant, photographe, transcripteur, interprète, validateur} (1) ; statut {soi, tiers, professionnel, bénévole} (1) ; acces_debut (1) ; acces_fin (0..1) ; perimetre_acces (1) | DI-K12 | Suit la mission |
| PROPOSER_OFFRE / ACCUEILLIR | ACTEUR (0,n) — OFFRE (1,1) ; OFFRE (0,n) — ORGANISATION (1,1) ; OFFRE (0,n) — MICRO_MISSION (1,1) ; demandeur ACTEUR (0,n) — MICRO_MISSION (1,1) | — | DI-K14 | Selon `visibilite` de l'offre |
| OBSERVER | ORGANISATION (0,n) — CONDITION_PRATIQUE (1,1) | — | — | Partageable |
| CARNET / REPRESENTE / HISTORIQUE | ESPACE (0,n) — CONTACT (1,1) ; CONTACT (0,1) — ENTITE_HISTORIQUE \| ACTEUR (0,n) ; CONTACT (0,n) — INTERACTION (1,1) | — | — | Privé à l'espace |
| DEFINIR | PROTOCOLE (1,n) — CRITERE_PROTOCOLE (1,1) | — | — | Suit le protocole |
| APPLIQUER_A / protocole_version | QUESTION \| DOCUMENT \| EXEMPLAIRE (0,n) — APPLICATION (1,1) ; VERSION_OBJET (0,n) — APPLICATION (1,1) | — | DI-K15 | Suit l'application |
| ETAT_CRITERE | APPLICATION (0,n) — CRITERE (0,n) | etat {accompli, partiel, non fait, non applicable} (1) ; couverture (0..1) ; preuve → OBJET (0..1) | DI-K16 | Suit l'application |
| CONTEXTE_REGLE | REGLE (0,n) — OBJET (0,n) ; adoptant ACTEUR (0,n) — REGLE (0,1) | — | DI-K18, DI-K19 | Suit la règle |
| PLANIFIER_TACHE | PROJET (0,n) — TACHE (1,1) ; TACHE (0,1) — ACTEUR (0,n) ; TACHE (0,n) — OBJET (0,n) | — | — | Suit le projet |
| FIGER / CONTENIR_SNAP | ESPACE (0,n) — SNAPSHOT (1,1) ; SNAPSHOT (1,n) — VERSION_OBJET (0,n) | — | DI-K20 | Suit le snapshot ; une version restreinte reste restreinte dans le snapshot |
| AVANT / APRES | DIFF (0,1) — SNAPSHOT (0,n), ×2 | date_avant / date_apres (`HORODATAGE`, C) si pas de snapshot | DI-K21 | Suit le diff |
| DECLENCHER / MODIFIER | DECOUVERTE (0,1) — DIFF (0,n) ; DECOUVERTE (0,n) — VERSION_OBJET (0,n) ; ACTEUR (0,n) — DECOUVERTE (1,1) | — | — | Suit la découverte |

---

# 14. Domaine L — Tree

## 14.1 ARBRE ✓ — conteneur (DD-01)

**Définition.** Arbre généalogique souverain d'un espace privé ou familial : structure de navigation sur des `PERSONNE` et des `RELATION` de cet espace (MCD C5). Jamais fusionné avec un arbre mondial (CDCF § 26.1). Ses versions sont des manifestes (nœuds et liens inclus).

**Intégrité.** **DI-L01** — L'espace de l'arbre n'est pas le Core partagé. **DI-L02** — `origine = import GEDCOM` ⇒ IMPORTE_DE renseigné.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| nom | Nom de l'arbre | `TEXTE_COURT` | 1 | — | — | « Arbre familial Bluker » | S·V·O |
| origine | Origine | `CODE` | 1 | {saisie, import GEDCOM, import autre} | DI-L02 ; figée | `import GEDCOM` | S/Y·F·O |

La propriété `personne_racine_affichage` du MCD devient l'association RACINE † vers `NOEUD_ARBRE` (TI-02) ; c'est une convention d'affichage (TI-09).

## 14.2 NOEUD_ARBRE ✓

**Définition.** Présence d'une `PERSONNE` de l'espace dans un arbre, avec ses conventions d'affichage.

**Intégrité.** **DI-L03** — La personne représentée appartient au même espace que l'arbre (RG-L01). **DI-L04** — Unicité (arbre, personne). **DI-L05** — Le lien vers une entité du Core partagé passe par `RAPPROCHEMENT` ou `REFERENCE_INTER_ESPACE`, jamais par le nœud (RG-F07).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| libelle_affichage | Libellé affiché | `TEXTE_COURT` | 0..1 | — | TI-09 ; par défaut issu de `SELECTION_CONTEXTE` (`usage = arbre`) | « Arsène CHARBONNÉ (1821–1890) » | S/C·V·O |
| position_affichage | Position graphique | `TEXTE_COURT` | 0..1 | — | Pas une assertion | `x=120;y=40` | S·V·O |

## 14.3 OPERATION_FLUX ✓

**Définition.** Opération explicite de circulation entre espaces : contribuer, importer, comparer, échanger, restaurer (CDCF § 13, § 26.3). Seul moyen de créer un objet dans le Core partagé (RG-B01).

**Intégrité.**

- **DI-L06** — `contribution privé→Core` : espace cible = Core partagé ; l'acteur a un rôle sur l'espace source et la règle `contribuer au Core` (DI-B14).
- **DI-L07** — `import Core→privé` : espace source = Core partagé ; aucune modification silencieuse ultérieure de l'espace cible (RG-L02).
- **DI-L08** — `comparaison Tree↔Tree` et `échange Tree↔Tree` : aucun des deux espaces n'est le Core partagé (RG-L03).
- **DI-L09** — Une opération `exécutée` n'est jamais annulée : son effet se corrige par une nouvelle opération ou de nouvelles versions.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature du flux | `CODE` | 1 | D-45 | DI-L06 à L08 ; figé | `contribution privé→Core` | S·F·O |
| date | Date | `HORODATAGE` | 1 | UTC ms | — | `2029-11-02T08:00Z` | Y·F·O |
| statut | État | `CODE` | 1 | {préparée, exécutée, annulée} | DI-L09 ; `annulée` seulement avant exécution | `exécutée` | S·V·O |
| autorisation | Fondement de l'autorisation | `TEXTE_COURT` | 1 | — | — | « contribution validée par la responsable du projet » | S·F·O |

## 14.4 COMPARAISON ✓ et ECART ✓

**Définition.** Comparaison autorisée de deux arbres (CDCF § 26.5) et différences relevées. N'alimente pas le Core.

**Intégrité.** **DI-L10** — Les deux propriétaires ont autorisé la comparaison (règle d'accès `voir` sur l'arbre de l'autre, bornée dans le temps). **DI-L11** — Les écarts ne sont visibles que des deux parties.

| Entité | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| COMPARAISON | date | Date | `HORODATAGE` | 1 | UTC ms | — | `2030-01-05T00:00Z` | Y·F·O |
| COMPARAISON | perimetre | Branches comparées | `TEXTE_COURT` | 1 | — | — | « descendants d'Arsène » | S·F·O |
| COMPARAISON | statut | État | `CODE` | 1 | {en cours, terminée, expirée} | DI-L10 | `terminée` | S/C·V·O |
| ECART | type | Nature de l'écart | `CODE` | 1 | {seulement dans A, seulement dans B, valeur divergente, identique} | — | `valeur divergente` | C·F·O |

Les objets comparés A et B sont reliés par les associations ECART_A † et ECART_B † vers `OBJET` (0,1) (TI-02).

## 14.5 Associations du domaine L

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| HEBERGER | ESPACE (0,n) — ARBRE (1,1) | — | DI-L01 | Suit l'arbre |
| IMPORTE_DE | ARBRE (0,1) — IMPORT (0,1) | — | DI-L02 | Suit l'arbre |
| COMPORTER_NOEUD | ARBRE (0,n) — NOEUD_ARBRE (1,1) | — | DI-L04 | Suit l'arbre |
| REPRESENTER | NOEUD_ARBRE (1,1) — PERSONNE (0,n) | — | DI-L03 | Suit l'arbre |
| RACINE † | ARBRE (0,1) — NOEUD_ARBRE (0,1) | — | Le nœud appartient à l'arbre | Suit l'arbre |
| INCLURE_LIEN | ARBRE (0,n) — ASSERTION de profil RELATION (0,n) | — | Relation de parenté ou d'alliance entre personnes de l'arbre | Suit l'arbre |
| EXECUTER | ACTEUR (0,n) — OPERATION_FLUX (1,1) | — | DI-L06 | Suit l'opération |
| SOURCE / CIBLE | OPERATION_FLUX (1,1) — ESPACE (0,n), ×2 | — | Espaces distincts | Suit l'opération |
| PRODUIRE_FILIATION | OPERATION_FLUX (0,n) — FILIATION (0,1) | — | DI-A20 | Suit la filiation |
| COMPARER | ARBRE A (0,n) — COMPARAISON (1,1) ; ARBRE B (0,n) — (1,1) ; COMPARAISON (0,n) — ECART (1,1) | — | DI-L10 | DI-L11 |
| ECART_A † / ECART_B † | ECART (0,1) — OBJET (0,n), ×2 | — | — | DI-L11 |

---

# 15. Domaine M — Connect

## 15.1 EVENEMENT_CONNECT ✓, ACTIVITE_CONNECT ✓, PARTICIPATION_CONNECT ✓, CONTRIBUTION_CONNECT ✓

**Définitions.** `EVENEMENT_CONNECT` : objet métier (cousinade, rencontre, commémoration), qui peut documenter un `EVENEMENT` historique. `ACTIVITE_CONNECT` : jeu, quiz, photo-identification, collecte, avant, pendant ou après l'événement. `PARTICIPATION_CONNECT` : invitation et participation d'un acteur ou d'une personne non inscrite. `CONTRIBUTION_CONNECT` : apport d'un participant, qui produit des objets Journal ou Inbox.

**Intégrité.**

- **DI-M01** — Une contribution ne sort de l'espace de l'événement qu'avec un `CONSENTEMENT` de portée adaptée ; la contribution au Core exige une `OPERATION_FLUX` séparée (RG-M01).
- **DI-M02** — Une photo-identification collective conserve les réponses indépendantes avant confrontation (RG-M02, DI-J09).
- **DI-M03** — Une participation désigne un acteur ou une personne, jamais les deux.
- **DI-M04** — Une personne non inscrite invitée est `R` (coordonnées jamais exposées).

| Entité | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| EVENEMENT_CONNECT | type | Nature | `REF_CONCEPT` | 1 | {cousinade, rencontre, commémoration, atelier, autre} (DD-06) | — | `cousinade` | S·V·O |
| EVENEMENT_CONNECT | titre | Titre | `TEXTE_COURT` | 1 | — | — | « Cousinade Tanjama 2028 » | S·V·O |
| EVENEMENT_CONNECT | date | Date | `DATE_HIST` | 1 | Date exacte | — | `2028-04-12` | S·V·O |
| EVENEMENT_CONNECT | statut | État | `CODE` | 1 | {en préparation, en cours, terminé, annulé} | — | `terminé` | S·V·O |
| ACTIVITE_CONNECT | type | Nature | `REF_CONCEPT` | 1 | {jeu, quiz, photo-identification, collecte d'anecdotes, campagne de mémoire, exposition} (DD-06) | — | `photo-identification` | S·V·O |
| ACTIVITE_CONNECT | phase | Moment | `CODE` | 1 | {avant, pendant, après} | — | `pendant` | S·V·O |
| ACTIVITE_CONNECT | consignes | Consignes | `TEXTE_LONG` | 0..1 | — | Pas de mécanique d'engagement (§ 92) | « nommez les personnes de la photo 3 » | S·V·O |
| PARTICIPATION_CONNECT | role | Rôle | `CODE` | 1 | {organisateur, animateur, participant} | — | `participant` | S·V·O |
| PARTICIPATION_CONNECT | statut | État | `CODE` | 1 | {invité, inscrit, présent, absent} | — | `présent` | S·V·R |
| CONTRIBUTION_CONNECT | date | Date | `HORODATAGE` | 1 | UTC ms | — | `2028-04-12T15:00Z` | Y·F·O |
| CONTRIBUTION_CONNECT | statut | État | `CODE` | 1 | {brute, qualifiée, rattachée} | — | `brute` | S·V·O |

## 15.2 Associations du domaine M

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| ORGANISER / ORGANISATEUR | ESPACE (0,n) — EVENEMENT_CONNECT (1,1) ; ACTEUR (0,n) — EVENEMENT_CONNECT (1,1) | — | — | Suit l'événement |
| SE_TENIR / DOCUMENTER | EVENEMENT_CONNECT (0,1) — LIEU (0,n) ; EVENEMENT_CONNECT (0,1) — EVENEMENT (0,n) | — | — | Suit l'événement |
| PROPOSER_ACTIVITE | EVENEMENT_CONNECT (0,n) — ACTIVITE_CONNECT (1,1) ; ACTIVITE (0,1) — CAMPAGNE_MEMOIRE (0,n) ; ACTIVITE (0,n) — OBJET (0,n) | — | — | Suit l'activité |
| INVITER | EVENEMENT_CONNECT (0,n) — PARTICIPATION (1,1) ; PARTICIPATION (0,1) — ACTEUR (0,n) \| PERSONNE (0,n) | — | DI-M03 | DI-M04 |
| RECUEILLIR / APPORTER / PRODUIRE_OBJ | ACTIVITE (0,n) — CONTRIBUTION (1,1) ; PARTICIPATION (0,n) — CONTRIBUTION (1,1) ; CONTRIBUTION (1,n) — OBJET (0,1) | — | DI-M01 | Suit la contribution |

---

# 16. Domaine N — Atlas (spatialité)

Le `LIEU` est défini au § 7.3. Ses noms, rattachements et relations spatiales sont des assertions (profil RELATION avec `referentiel_spatial`, annexe A.2).

## 16.1 GEOMETRIE ✓

**Définition.** Une localisation d'un lieu pour une période, avec son type de précision. Plusieurs géométries concurrentes ou successives coexistent (CDCF § 27.4–27.5).

**Intégrité.**

- **DI-N01** — Une géométrie n'est jamais plus précise que ses fondements : `exacte` exige une source cartographique ou un relevé ancré ; un lieu connu seulement par relations ne peut avoir que `relative` ou `zone possible` (RG-N01, critère 12).
- **DI-N02** — `precision_metres` est obligatoire pour `approximative` et `zone possible`.
- **DI-N03** — Une géométrie reconstruite est produite par un `CALCUL` (RECONSTRUIRE_GEOM) et fondée sur des assertions (FONDEE_SUR).
- **DI-N04** — Interdits : coordonnées `0,0` ; centroïde de commune présenté comme position exacte d'une habitation ; polygone précis sans preuve.
- **DI-N08** — Lieu, bien, droit sur bien et détenteur restent quatre objets distincts ; les mutations sont des `EVENEMENT` (RG-N03).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type_localisation | Nature de la précision | `CODE` | 1 | D-46 | DI-N01 | `zone possible` | S/C·V·O |
| geometrie | Géométrie | `GEOM` | 1 | WGS 84 (DD-16) | DI-N04 | polygone 4 sommets | S/C·V·O |
| precision_metres | Incertitude | `DECIMAL` | C | ≥ 0 | DI-N02 | `350` | S/C·V·O |
| periode | Période de validité | `PERIODE_HIST` | 0..1 | — | Limites changeantes | 1793–1848 | S·V·O |
| statut | État | `CODE` | 1 | {proposée, examinée, contestée, rejetée} | — | `proposée` | S·V·O |

## 16.2 CARTE ✓ — conteneur (DD-01)

**Définition.** Production cartographique : résultat de recherche dépendant de localisations, versionné, dynamique ou figé (CDCF § 28).

**Intégrité.** **DI-N05** — Une ligne entre deux présences n'est tracée que si une assertion `déplacement attesté` ou `trajet reconstruit` existe, avec une symbolisation distincte (RG-N02). **DI-N06** — `mode = figée` : la carte n'est jamais recalculée ; `mode = dynamique` : `fraicheur` passe à `potentiellement obsolète` dès qu'une géométrie affichée change. **DI-N07** — La carte est calculée sur le graphe accessible du lecteur (P20).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| titre | Titre | `TEXTE_COURT` | 1 | — | — | « Présences attestées de Charles TANCRÈDE, 1881–1890 » | S·V·O |
| mode | Dynamique ou figée | `CODE` | 1 | {dynamique, figée} | DI-N06 ; figé | `figée` | S·F·O |
| periode | Période représentée | `PERIODE_HIST` | 0..1 | — | — | 1881–1890 | S·V·O |
| couches | Couches affichées | `REF_CONCEPT` | 0..n | D-24 | — | `territoire historique` | S·V·O |
| fraicheur | Fraîcheur | `CODE` | 1 | {à jour, potentiellement obsolète} | DI-N06 | `à jour` | C·D·O |

## 16.3 Associations du domaine N

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| LOCALISER_LIEU | LIEU (0,n) — GEOMETRIE (1,1) | — | — | Suit la géométrie |
| RECONSTRUIRE_GEOM | CALCUL (0,n) — GEOMETRIE (0,1) | — | DI-N03 | Suit la géométrie |
| FONDEE_SUR | GEOMETRIE (0,n) — ASSERTION (0,n) | — | DI-N01 | Suit la géométrie |
| PRODUIRE_CARTE | ESPACE (0,n) — CARTE (1,1) | — | — | Suit la carte |
| REPRESENTER_SUR_CARTE | CARTE (0,n) — OBJET (0,n) | symbolisation {attesté, hypothétique, calculé, cooccurrence} (1) | DI-N05 | `X` |
| AFFICHER | CARTE (0,n) — GEOMETRIE (0,n) | — | DI-N07 | `X` |
| DROIT_SUR | ASSERTION de profil SITUATION (0,1) — BIEN (0,n) | — | `type_droit` obligatoire | Suit l'assertion |

---

# 17. Domaine O — Analyse, corpus, reproductibilité

**Règle de domaine (P20).** Tout calcul, agrégat, comptage ou parcours s'exécute sur le **graphe accessible** dans le `CONTEXTE_EVALUATION`, jamais sur le graphe complet suivi d'un masquage. Un résultat destiné à un public différent de celui de son calcul est recalculé, ou soumis à une `EVALUATION_DIFFUSABILITE` (test 9).

## 17.1 REQUETE ✓

**Définition.** Requête sauvegardée, versionnée, partageable, citable ; peut alimenter un corpus, une cohorte ou une veille (CDCF § 43, § 91).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| definition | Expression de la requête | `TEXTE_LONG` | 1 | Langage de requête documenté (MPD) | Évaluée sur le graphe accessible | « PERSONNE présente à Dolé 1790–1810 » | S·V·O |
| mode | Niveau d'exigence | `CODE` | 1 | {strict, recherche, exploratoire} | `strict` : assertions validées seules ; `exploratoire` : inclut le non examiné, signalé comme tel | `recherche` | S·V·O |
| partage | Partage | `CODE` | 1 | D-04 | ≤ visibilité de l'espace | `projet` | S·V·O |

## 17.2 CORPUS ✓ — conteneur (DD-01)

**Définition.** Jeu de recherche manuel, par critères, dynamique ou figé ; citable (CDCF § 39).

**Intégrité.** **DI-O01** — `type = figé` ⇒ FIGER_CORPUS vers un snapshot ou manifeste d'inclusions figé. **DI-O02** — `type ∈ {par critères, dynamique}` ⇒ DEFINIR_CORPUS vers une requête. **DI-O03** — Une exclusion manuelle prévaut sur une inclusion par critère et porte un motif.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `CODE` | 1 | {manuel, par critères, dynamique, figé} | DI-O01, DI-O02 | `figé` | S·F·O |
| definition | Description du corpus | `TEXTE_LONG` | 1 | — | — | « inventaires de Dolé 1793 et 1802 » | S·V·O |

## 17.3 COHORTE_ANALYTIQUE ✓

**Définition.** Groupe construit par un chercheur selon des critères ; jamais une catégorie historique (CDCF § 13.2).

**Intégrité.** **DI-O04** — Ne peut jamais être convertie en `COLLECTIF_HISTORIQUE` (RG-O05, critère 28).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| libelle | Libellé | `TEXTE_COURT` | 1 | — | Affiché avec la mention « cohorte analytique » | « Femmes nées vers 1780 présentes en 1793 et 1802 » | S·V·O |
| criteres_texte | Critères en clair | `TEXTE_LONG` | 1 | — | Doit correspondre à la requête liée | « … » | S·V·O |

## 17.4 METHODE ✓

**Définition.** Méthode versionnée : dérivation de date, conversion, statistique, reconstruction spatiale, proposition de candidats, OCR/HTR… (CDCF § 9.3, § 40).

**Intégrité.** **DI-O05** — Toute modification de `algorithme`, `version_algorithme`, `parametres` ou `hypotheses` crée une nouvelle version ; les calculs passés restent liés à leur version. **DI-O06** — Une méthode déterministe (filtrer, compter, comparer des dates) ne recourt jamais à une IA générative (RG-O06).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| nom | Nom | `TEXTE_COURT` | 1 | — | — | « Âge déclaré → intervalle de naissance » | S·V·O |
| type | Nature | `REF_CONCEPT` | 1 | D-47 | DI-O06 | `dérivation de date` | S·V·O |
| description | Description | `TEXTE_LONG` | 1 | — | — | « date de l'acte − âge, ± 1 an » | S·V·O |
| hypotheses | Hypothèses | `TEXTE_LONG` | 1 | — | — | « âge déclaré en années révolues » | S·V·O |
| parametres | Paramètres par défaut | `TEXTE_LONG` | 0..1 | JSON | — | `{"marge_annees":1}` | S·V·O |
| limites | Limites | `TEXTE_LONG` | 1 | — | — | « âges arrondis fréquents (30, 40…) » | S·V·O |
| algorithme | Algorithme | `TEXTE_LONG` | 0..1 | — | — | « intervalle [acte − âge − 1 ; acte − âge] » | S·V·O |
| version_algorithme | Version | `TEXTE_COURT` | 1 | SemVer | DI-O05 | `1.0.0` | S·V·O |
| deterministe † | Méthode déterministe | `BOOLEEN` | 1 | — | DI-O06 | `vrai` | S·V·O |

## 17.5 CALCUL ✓

**Définition.** Exécution datée d'une version de méthode, sur une version de corpus et un état de connaissance (CDCF § 40).

**Intégrité.**

- **DI-O07** — `nature_execution = reproduction` exige mêmes versions de méthode, de corpus, de référentiels et même état de connaissance que le calcul d'origine (REPRODUIRE_CALCUL) ; sinon `rerun` ou `nouvelle analyse` (RG-O02).
- **DI-O08** — Un calcul désigne un état de connaissance : un snapshot, ou une date de référence (`date_reference` †).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| date | Date d'exécution | `HORODATAGE` | 1 | UTC ms | — | `2028-06-30T10:00Z` | Y·F·O |
| nature_execution | Nature | `CODE` | 1 | {calcul initial, reproduction, rerun, nouvelle analyse} | DI-O07 | `rerun` | S/C·F·O |
| parametres_effectifs | Paramètres utilisés | `TEXTE_LONG` | 0..1 | JSON | — | `{"marge_annees":1}` | Y·F·O |
| date_reference † | État de connaissance (si pas de snapshot) | `HORODATAGE` | C | UTC ms | DI-O08 | `2028-06-30T00:00Z` | Y·F·O |

## 17.6 RESULTAT ✓

**Définition.** Résultat d'un calcul : statistique, entourage, cooccurrences, zone plausible, intervalle, liste de candidats (CDCF § 38, § 41). Seul endroit où un score algorithmique peut être stocké (DD-14).

**Intégrité.**

- **DI-O09** — Un résultat `figé` n'est jamais recalculé ; un résultat `dynamique` passe à `potentiellement obsolète` quand une dépendance change, sans recalcul immédiat obligatoire (RG-O03).
- **DI-O10** — Un résultat affiché indique toujours corpus, méthode, couverture et date de calcul (RG-O01) (« 146 décès dans le corpus » ≠ « 146 décès réels »).
- **DI-O11** — Une cooccurrence ou un entourage calculé ne crée jamais de `RELATION` (RG-G06).
- **DI-O12** — Un résultat d'agrégation exposé à une audience plus large que celle du calcul exige une `EVALUATION_DIFFUSABILITE` (DI-B18).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `CODE` | 1 | {statistique calculée, entourage, cooccurrences, comparaison de trajectoires, zone plausible, intervalle dérivé, liste de candidats, indépendance, autre} | `indépendance` : DD-05 | `statistique calculée` | C·F·O |
| contenu | Résultat | `TEXTE_LONG` | 1 | JSON documenté par type | Les scores éventuels restent ici (DD-14) | `{"personnes":47}` | C·V·O |
| mode | Dynamique ou figé | `CODE` | 1 | {dynamique, figé} | DI-O09 ; figé | `figé` | S·F·O |
| fraicheur | Fraîcheur | `CODE` | 1 | {à jour, potentiellement obsolète, recalcul en cours} | DI-O09 ; DD-11 | `à jour` | C·D·O |
| date_dernier_calcul | Dernier calcul | `HORODATAGE` | 1 | UTC ms | — | `2028-06-30T10:00Z` | Y·V·O |
| couverture | Couverture | `TEXTE_LONG` | 1 | — | DI-O10 | « 2 inventaires, 1 lacunaire (f° 7) » | C/S·V·O |

## 17.7 Associations du domaine O

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| DEFINIR_CORPUS / FIGER_CORPUS | REQUETE (0,n) — CORPUS (0,1) ; SNAPSHOT (0,n) — CORPUS (0,1) | — | DI-O01, DI-O02 | Suit le corpus |
| INCLURE | CORPUS (0,n) — OBJET (0,n) | decision {inclus, exclu} (1) ; motif (C, obligatoire si exclusion manuelle) ; mode {manuel, critère} (1) | DI-O03 | `X` |
| CRITERES / DANS | REQUETE (0,n) — COHORTE (1,1) ; CORPUS (0,n) — COHORTE (1,1) | — | — | Suit la cohorte |
| APPLIQUER_METHODE | METHODE (version) (0,n) — CALCUL (1,1) | — | DI-O05 | Suit le calcul |
| SUR | CORPUS (version) (0,n) — CALCUL (0,1) | — | — | Suit le calcul |
| ETAT_CONNAISSANCE | SNAPSHOT (0,n) — CALCUL (0,1) | — | DI-O08 | Suit le calcul |
| MOBILISER | CALCUL (0,n) — REFERENTIEL (version) (0,n) | — | — | Suit le calcul |
| EXECUTER_CALCUL | ACTIVITE (0,1) — CALCUL (1,1) | — | — | Suit le calcul |
| PRODUIRE_RESULTAT | CALCUL (1,n) — RESULTAT (1,1) | — | — | Suit le résultat |
| REPRODUIRE_CALCUL | CALCUL d'origine (0,n) — CALCUL (0,1) | — | DI-O07 | Suit le calcul |

---

# 18. Domaine P — Publication, pérennité, interopérabilité

## 18.1 PUBLICATION ✓ — conteneur (DD-01)

**Définition.** Publication volontaire, sélective, versionnée (CDCF § 76). Expose des **versions** figées : une évolution ultérieure de l'objet ne modifie pas la publication (RG-P01).

**Intégrité.**

- **DI-P01** — Avant `publiée`, chaque version exposée est vérifiée contre embargos, personnes vivantes et mineurs, consentements, licences par composant et masquages ; le résultat est consigné dans une `EVALUATION_DIFFUSABILITE` par version exposée, dans le `CONTEXTE_EVALUATION` de la publication (RG-P02).
- **DI-P02** — Une publication corrigée n'est jamais réécrite : correction = `CORRECTION_PUBLICATION`, nouvelle édition = nouvelle publication (RG-P03).
- **DI-P03** — `indexable = vrai` exige que toutes les versions exposées aient `decouvrabilite = indexable Web` (RG-P04).
- **DI-P04** — La première publication attribue un ARK aux objets exposés qui n'en ont pas (DD-02).

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| titre | Titre | `TEXTE_COURT` | 1 | — | — | « Charles TANCRÈDE, 1851–1890 : trajectoire » | S·V·O |
| type | Nature | `CODE` | 1 | {fiche entité, chronologie, carte, corpus, conclusion, article, édition critique, page publique} | — | `article` | S·F·O |
| etat | État | `CODE` | 1 | {brouillon, publiée, corrigée, remplacée, retirée} | DI-P01, DI-P02 ; `retirée` exige un motif (correction de type retrait motivé) | `publiée` | S·V·O |
| date_publication | Date de publication | `HORODATAGE` | C | UTC ms | Obligatoire dès `publiée` | `2028-09-01T00:00Z` | Y·F·O |
| numero_edition | Édition | `ENTIER` | 1 | ≥ 1 | — | `1` | S·F·O |
| indexable | Indexation Web | `BOOLEEN` | 1 | — | DI-P03 | `vrai` | S·V·O |

## 18.2 CORRECTION_PUBLICATION ✓

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `CODE` | 1 | {correction éditoriale mineure, erratum/corrigendum, nouvelle édition, retrait motivé} | `nouvelle édition` ⇒ publication remplaçante obligatoire | `erratum/corrigendum` | S·F·O |
| motif | Motif | `TEXTE_LONG` | 1 | — | — | « l'entrée n°8 désigne Rosalie, pas Rose » | S·F·O |
| date | Date | `HORODATAGE` | 1 | UTC ms | — | `2032-03-10T00:00Z` | Y·F·O |

## 18.3 EXPORT ✓

**Définition.** Export de portabilité, format patrimonial ou package de reproductibilité (CDCF § 82, Q198).

**Intégrité.**

- **DI-P05** — Le contenu, le `manifeste`, les compteurs, les références et les dépendances exportés sont tous évalués dans le `CONTEXTE_EVALUATION` de l'export (MCD § 18.5, test 11).
- **DI-P06** — Les embargos, consentements, licences et masquages applicables accompagnent les objets exportés (RG-P05).
- **DI-P07** — Un export n'expose aucun attribut `I`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| format | Format | `CODE` | 1 | D-48 | — | `format patrimonial GENIIUS` | S·F·O |
| version_format | Version du format | `TEXTE_COURT` | 1 | SemVer | — | `1.0.0` | Y·F·O |
| perimetre | Périmètre demandé | `TEXTE_LONG` | 1 | — | — | « projet CHARBONNÉ, sans Journal » | S·F·O |
| date | Date | `HORODATAGE` | 1 | UTC ms | — | `2033-01-01T00:00Z` | Y·F·O |
| droits_appliques | Restrictions appliquées | `TEXTE_LONG` | 1 | — | DI-P06 | « 3 objets exclus (embargo) » | C·F·O |
| manifeste † | Manifeste du paquet | `ETAT_FIGE` | C | Sections : version du schéma, objets et versions, relations, fichiers et empreintes, dépendances exportables, identifiants persistants, dépendances externes référencées | Obligatoire pour le format patrimonial ; DI-P05 | `{…}` | C·F·O |
| empreinte_paquet † | Empreinte du paquet | `EMPREINTE` | 1 | SHA-256 | — | `5be1…` | Y·F·O |

## 18.4 IMPORT ✓ et RECONCILIATION_IMPORT ✓

**Définition.** `IMPORT` : import externe, réimport du format patrimonial ou restauration ; l'import est une provenance (CDCF § 83–84). `RECONCILIATION_IMPORT` : issue de la réconciliation d'un objet importé avec l'existant.

**Intégrité.**

- **DI-P08** — Un réimport reconnaît le lot antérieur, les identifiants externes, l'empreinte du fichier, les objets déjà acquis et les divergences apparues depuis ; un même GEDCOM importé deux fois ne devient pas deux ensembles de preuves (MCD § 18.5, test 7).
- **DI-P09** — Une restauration ne recrée que des objets de l'espace privé ; aucune réconciliation ne publie dans le Core partagé (RG-P06).
- **DI-P10** — `rapport` est obligatoire pour `restauration` et `réimport patrimonial`.

| Entité | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| IMPORT | type | Nature | `CODE` | 1 | {import externe, réimport patrimonial, restauration} | DI-P09 | `import externe` | S·F·O |
| IMPORT | logiciel | Logiciel d'origine | `TEXTE_COURT` | 0..1 | — | — | « Heredis 2024 » | I·F·O |
| IMPORT | format | Format | `TEXTE_COURT` | 1 | — | — | `GEDCOM` | I·F·O |
| IMPORT | version_format | Version du format | `TEXTE_COURT` | 0..1 | — | — | `5.5.1` | I·F·O |
| IMPORT | fournisseur | Fournisseur | `TEXTE_COURT` | 0..1 | — | Personne privée : `R` | « export personnel » | S·F·R |
| IMPORT | date | Date | `HORODATAGE` | 1 | UTC ms | — | `2028-05-12T09:00Z` | Y·F·O |
| IMPORT | avertissements | Avertissements | `TEXTE_LONG` | 0..1 | — | — | « 214 notes sans source » | C·F·O |
| IMPORT | rapport † | Rapport de restauration ou de reconnexion | `TEXTE_LONG` | C | — | DI-P10 | « 1 204 objets reconnectés, 3 isolés » | C·F·O |
| RECONCILIATION_IMPORT | issue | Issue | `CODE` | 1 | {nouveau, identique - reconnecté, local modifié - à comparer, Core évolué - lien proposé, incompatible - isolé} | DI-P08 | `identique - reconnecté` | C·V·O |

## 18.5 Associations du domaine P

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| PUBLIER | ESPACE (0,n) — PUBLICATION (1,1) | — | — | Suit la publication |
| EXPOSER | PUBLICATION (1,n) — VERSION_OBJET (0,n) | mode_exposition {intégral, provenance masquée, pseudonymisé, existence seulement} (1) | DI-P01 | Selon `mode_exposition` |
| EVALUER_PUBLICATION † | PUBLICATION (0,1) — CONTEXTE_EVALUATION (1,1) | — | DI-P01 | Suit la publication |
| CORRIGER | PUBLICATION (0,n) — CORRECTION (1,1) ; CORRECTION (0,1) — PUBLICATION remplaçante (0,1) | — | DI-P02 | Suit la publication |
| CITER | OBJET citant (0,n) — REFERENCE_PERSISTANTE (0,n) | type {cite, s'appuie sur, discute, réfute, réutilise} (1) | Une citation d'une preuve restreinte ne la révèle pas (Q178) | `X` |
| EXPORTER / CONTENIR_EXPORT | ACTEUR (0,n) — EXPORT (1,1) ; EXPORT (1,n) — OBJET (0,n) | — | DI-P05 | Suit l'export |
| EVALUER_EXPORT † | EXPORT (0,1) — CONTEXTE_EVALUATION (1,1) | — | DI-P05 | Suit l'export |
| FICHIER_ORIGINAL / CIBLE_IMPORT | IMPORT (1,1) — FICHIER (0,n) ; IMPORT (1,1) — ESPACE (0,n) | — | — | Suit l'import |
| RECONCILIER | IMPORT (0,n) — RECONCILIATION (1,1) ; RECONCILIATION (1,1) — OBJET importé (0,n) ; RECONCILIATION (0,1) — OBJET existant (0,n) | — | DI-P08, DI-P09 | Suit l'import |

---

# 19. Domaine Q — Organisation personnelle, veille, notifications

**Règle de domaine (RG-Q01).** Aucune association de ce domaine ne produit d'`ASSERTION`, de `DEPENDANCE` de justification ni de contribution. Ces objets vivent dans l'espace personnel du compte, sauf collection ou tag collaboratifs.

## 19.1 WORKSPACE ✓, LIEN_EXPLORATOIRE ✓, COLLECTION ✓, TAG ✓, NOTE ✓

| Entité | Définition | Attribut | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| WORKSPACE | Table de travail privée et temporaire (§ 47) | titre | `TEXTE_COURT` | 1 | — | — | « Hypothèses Ti-René » | S·V·O |
|  |  | etat | `CODE` | 1 | {actif, converti, archivé, supprimé} | `converti` ⇒ DEVENIR renseigné | `actif` | S·V·O |
| LIEN_EXPLORATOIRE | Trait tracé entre deux objets ; jamais une assertion | libelle | `TEXTE_COURT` | 0..1 | — | Jamais amont d'une dépendance de justification (DI-A16) | « même rivière ? » | S·V·O |
| COLLECTION | Organisation légère et transversale (§ 48.1) | titre | `TEXTE_COURT` | 1 | — | Distincte d'un corpus et d'un workspace | « Photos à identifier » | S·V·O |
|  |  | collaborative | `BOOLEEN` | 1 | — | — | `faux` | S·V·O |
| TAG | Étiquette libre, distincte d'un concept (§ 48.2) | libelle | `TEXTE_COURT` | 1 | — | Jamais utilisé comme prédicat ni type | « à revoir » | S·V·O |
|  |  | portee | `CODE` | 1 | {personnel, collaboratif} | — | `personnel` | S·V·O |
| NOTE | Note privée sur un objet | texte | `TEXTE_LONG` | 1 | Markdown | Pas une annotation de source | « vérifier avec tante L. » | S·V·O |

Les extrémités d'un lien exploratoire sont portées par les associations EXPLORER_A † et EXPLORER_B † vers `OBJET` (TI-02).

## 19.2 INBOX_ITEM ✓

**Définition.** Capture brute : fichier, lien, note, photo, audio, vidéo, document reçu (CDCF § 24.10, § 48.3). La structuration n'est jamais une condition préalable.

**Intégrité.** **DI-Q01** — Aucune qualification exigée à la capture ; aucun traitement IA lourd déclenché automatiquement (RG-Q02). **DI-Q02** — `etat = rattaché` exige au moins un RATTACHER.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| type | Nature | `CODE` | 1 | {fichier, lien, note, photo, audio, vidéo, document reçu} | — | `audio` | Y/S·F·O |
| contenu_brut | Contenu | `TEXTE_LONG` | 0..1 | — | Fichier : association JOINDRE | « Ti-René vivait près de la rivière » | S·V·O |
| etat | Avancement | `CODE` | 1 | {capturé, qualifié, rattaché, traité, archivé} | DI-Q02 | `capturé` | S·V·O |
| date_capture | Date | `HORODATAGE` | 1 | UTC ms | — | `2028-03-01T21:12Z` | Y·F·O |

## 19.3 HISTORIQUE_NAVIGATION, VEILLE ✓, NOTIFICATION

**Intégrité.** **DI-Q03** — `HISTORIQUE_NAVIGATION` n'alimente jamais le Core et est purgeable par le titulaire (RG-Q03). **DI-Q04** — Une veille `surveiller` exige une condition ou une requête. **DI-Q05** — Une notification n'est créée que si l'événement, son existence et le contenu nécessaire sont communicables au destinataire dans son contexte (MCD § 19.5, test 10). **DI-Q06** — Aucun `motif` d'engagement (RG-Q04).

| Entité | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| HISTORIQUE_NAVIGATION | id_navigation | Identifiant | `IDENT` | 1 | UUID v7 | — | `01d0…` | Y·N·I |
| HISTORIQUE_NAVIGATION | date | Date | `HORODATAGE` | 1 | UTC ms | DI-Q03 | `2029-02-02T10:00Z` | Y·N·I |
| HISTORIQUE_NAVIGATION | session | Session | `IDENT` | 1 | — | — | `01d1…` | Y·N·I |
| VEILLE | type | Suivre ou surveiller | `CODE` | 1 | {suivre, surveiller} | DI-Q04 | `surveiller` | S·V·O |
| VEILLE | condition | Condition | `TEXTE_COURT` | C | — | DI-Q04 | « nouvelle mention CHARBONNÉ à Deshaies » | S·V·O |
| VEILLE | mode_notification | Mode | `CODE` | 1 | {immédiat, digest, in-app, silencieux} | — | `digest` | S·V·O |
| VEILLE | active | Active | `BOOLEEN` | 1 | — | — | `vrai` | S·V·O |
| NOTIFICATION | id_notification | Identifiant | `IDENT` | 1 | UUID v7 | — | `01d2…` | Y·N·I |
| NOTIFICATION | date | Date | `HORODATAGE` | 1 | UTC ms | — | `2030-01-01T08:00Z` | Y·N·I |
| NOTIFICATION | motif | Motif | `CODE` | 1 | D-49 | DI-Q05, DI-Q06 | `dépendance modifiée` | Y·N·I |
| NOTIFICATION | explication | Pourquoi cette notification | `TEXTE_COURT` | 1 | — | Explicable (§ 92) | « la lecture de l'acte A a changé » | Y·N·I |
| NOTIFICATION | priorite | Priorité | `CODE` | 1 | {haute, normale, basse} | — | `normale` | Y·N·I |
| NOTIFICATION | groupe | Regroupement | `TEXTE_COURT` | 0..1 | — | — | « projet CHARBONNÉ » | Y·N·I |
| NOTIFICATION | lue | Lue | `BOOLEEN` | 1 | — | — | `faux` | S·N·I |

## 19.4 Associations du domaine Q

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| OUVRIR | COMPTE (0,n) — WORKSPACE (1,1) | — | — | Personnel |
| EPINGLER | WORKSPACE (0,n) — OBJET (0,n) | x (0..1) ; y (0..1) ; groupe (0..1) ; note (0..1) | RG-Q01 | Personnel ; l'objet épinglé garde ses droits |
| TRACER | WORKSPACE (0,n) — LIEN_EXPLORATOIRE (1,1) | — | — | Personnel |
| EXPLORER_A † / EXPLORER_B † | LIEN_EXPLORATOIRE (1,1) — OBJET (0,n), ×2 | — | — | Personnel |
| DEVENIR | WORKSPACE (0,1) — PROJET \| SNAPSHOT \| ESPACE (0,1) | — | — | Suit la cible |
| RANGER | COLLECTION (0,n) — OBJET (0,n) | rang (0..1) | — | Suit la collection |
| ETIQUETER | TAG (0,n) — OBJET (0,n) | — | — | Suit le tag |
| CAPTURER / JOINDRE / RATTACHER | COMPTE (0,n) — INBOX_ITEM (1,1) ; INBOX (0,1) — FICHIER (0,n) ; INBOX (0,n) — OBJET (0,n) | — | DI-Q02 | Personnel |
| ANNOTER_NOTE | OBJET (0,n) — NOTE (0,1) | — | — | Personnel |
| NAVIGUER | COMPTE (0,n) — HISTORIQUE (1,1) ; HISTORIQUE (1,1) — OBJET (0,n) | — | DI-Q03 | `I` |
| VEILLER / SUIVRE / SURVEILLER | COMPTE (0,n) — VEILLE (1,1) ; VEILLE (0,1) — OBJET (0,n) ; VEILLE (0,1) — REQUETE (0,n) | — | DI-Q04 | Personnel ; évaluée sur le graphe accessible |
| DECLENCHER / RECEVOIR | VEILLE (0,n) — NOTIFICATION (0,1) ; COMPTE (0,n) — NOTIFICATION (1,1) ; NOTIFICATION (0,1) — OBJET (0,n) | — | DI-Q05 | `I` |

---

# 20. Domaine R — Référentiels et concepts

## 20.1 REFERENTIEL ✓ — conteneur (DD-01)

**Définition.** Vocabulaire versionné de niveau personnel / projet, communautaire ou commun GENIIUS (CDCF § 31.3). `GENIIUS-COMMUN` v1 est défini en annexe A.

**Intégrité.** **DI-R01** — Un seul référentiel de `niveau = commun GENIIUS` par nom. **DI-R02** — Un concept retiré n'est jamais supprimé : il reste résoluble pour les objets qui l'utilisent.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| nom | Nom | `TEXTE_COURT` | 1 | — | DI-R01 | `GENIIUS-COMMUN` | S·F·O |
| niveau | Niveau | `CODE` | 1 | {personnel/projet, communautaire, commun GENIIUS} | — | `commun GENIIUS` | S·F·O |
| description | Description | `TEXTE_LONG` | 0..1 | — | — | « référentiel initial » | S·V·O |

## 20.2 CONCEPT ✓

**Définition.** Concept normalisé : prédicat, rôle, type d'entité, type documentaire, nature d'événement, profession, statut… Pour les prédicats, la **signature** est portée par des attributs † (annexe A.2).

**Intégrité.**

- **DI-R03** — `nature = prédicat` ⇒ `profil_assertion`, `types_sujet` et `attend_cible` ou `type_valeur` obligatoires.
- **DI-R04** — `statut_promotion = promu` exige une décision humaine historisée (RG-R01) ; jamais par popularité.
- **DI-R05** — `PLUS_LARGE` est sans cycle et reste dans la même `nature`.

| Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|
| code † | Code stable | `TEXTE_COURT` | 1 | `minuscules_sans_accent` | Unique par référentiel ; figé | `age_declare` | S·F·O |
| libelle | Libellé | `TEXTE_COURT` | 1 | — | — | « âge déclaré » | S·V·O |
| definition | Définition | `TEXTE_LONG` | 1 | — | — | « âge attribué à une personne par une source, à la date de la source » | S·V·O |
| nature | Nature | `CODE` | 1 | {prédicat, rôle, type d'entité, type documentaire, nature d'événement, profession, statut, monnaie, unité, calendrier, système d'identifiant, autre} | — | `prédicat` | S·F·O |
| statut_promotion | Promotion vers le commun | `CODE` | 1 | {local, proposé au commun, promu, refusé} | DI-R04 | `local` | S·V·O |
| actif † | Utilisable pour de nouveaux objets | `BOOLEEN` | 1 | — | DI-R02 | `vrai` | S·V·O |
| profil_assertion † | Profil produit (prédicat) | `CODE` | C | {attribut, relation, participation, présence, situation, existence documentaire} | DI-R03 | `attribut` | S·V·O |
| types_sujet † | Types de sujet admis (prédicat) | `CODE` | C (1..n) | Noms d'entités | DI-R03 | `PERSONNE` | S·V·O |
| attend_cible † | Exige une entité cible (prédicat) | `BOOLEEN` | C | — | DI-R03 | `faux` | S·V·O |
| types_cible † | Types de cible admis | `CODE` | 0..n | Noms d'entités | Si `attend_cible` | — | S·V·O |
| type_valeur † | Type de valeur attendu | `CODE` | C | {aucune, VALEUR nombre, VALEUR âge, VALEUR montant, VALEUR mesure, VALEUR texte, REF_CONCEPT} | DI-R03 | `VALEUR âge` | S·V·O |

## 20.3 TERME_HISTORIQUE ✓ et CORRESPONDANCE ✓

| Entité | Attribut | Définition | Type | Obl. | Domaine / format | Contraintes · interdits | Exemple | P·V·C |
|---|---|---|---|---|---|---|---|---|
| TERME_HISTORIQUE | forme | Mot tel qu'employé | `TEXTE_SOURCE` | 1 | — | Verbatim, y compris terme offensant (RG-D04) | « nouveau libre » | S·F·O |
| TERME_HISTORIQUE | langue | Langue | `LANGUE` | 1 | BCP 47 | — | `fr` | S·F·O |
| TERME_HISTORIQUE | ecriture | Écriture | `ECRITURE` | 1 | ISO 15924 | — | `Latn` | S·F·O |
| CORRESPONDANCE | type | Correspondance | `CODE` | 1 | {équivalent, plus large, plus spécifique, proche, incompatible, contesté, inconnu} | `incompatible` est une information, pas une erreur (RG-R03) | `proche` | S·V·O |

## 20.4 Associations du domaine R

| Association | Pattes et cardinalités | Propriétés | Intégrité | Gouvernance |
|---|---|---|---|---|
| PORTER | ESPACE (0,n) — REFERENTIEL (1,1) | — | Le commun est porté par le Core partagé | Suit le référentiel |
| CONTENIR_CONCEPT | REFERENTIEL (0,n) — CONCEPT (1,1) | — | DI-R02 | Suit le référentiel |
| PLUS_LARGE | CONCEPT parent (0,n) — CONCEPT (0,1) | — | DI-R05 | Suit le référentiel |
| CONCEPT_A / CONCEPT_B | CONCEPT (0,n) — CORRESPONDANCE (1,1), ×2 | — | Concepts distincts | Suit la correspondance |
| USAGE | TERME_HISTORIQUE (0,n) — CONCEPT (0,n) | periode (`PERIODE_HIST`, 0..1) ; territoire → LIEU (0..1) ; corpus → CORPUS (0..1) ; sens (`TEXTE_LONG`, 1) | Le sens peut varier selon période, territoire et corpus (§ 31.2) | Suit le terme |

---

# 21. Types composés

## 21.1 DATE_HIST

| Composant | Définition | Type | Obl. | Domaine / format | Contraintes |
|---|---|---|---|---|---|
| expression_originale | Texte tel que lu ou saisi | `TEXTE_SOURCE` | C | — | Obligatoire si la date provient d'une source ou d'une saisie (DD-10) |
| type_date | Nature | `CODE` | 1 | {exacte, approximative, intervalle, avant, après, vers, calculée, déduite, estimée, inconnue} | Cohérences de DD-10 |
| calendrier | Calendrier d'origine | `REF_CONCEPT` | 1 | {grégorien, julien, républicain, autre} | Défaut `grégorien` |
| borne_min | Borne basse | ISO 8601 tronqué | C | Grégorien proleptique | Voir DD-10 |
| borne_max | Borne haute | ISO 8601 tronqué | C | Grégorien proleptique | `borne_min` ≤ `borne_max` |
| precision | Précision | `CODE` | C | {jour, mois, année, décennie, siècle} | Vide si `inconnue` |

Exemple : « le 3 brumaire an II » → `{expression_originale: "3 brumaire an II", type_date: exacte, calendrier: républicain, borne_min: 1793-10-24, borne_max: 1793-10-24, precision: jour}`.

## 21.2 VALEUR

| Composant | Définition | Type | Obl. | Domaine / format | Contraintes |
|---|---|---|---|---|---|
| valeur_originale | Valeur telle que dans la source | `TEXTE_SOURCE` | 1 | — | Jamais remplacée par la normalisée |
| valeur_normalisee | Valeur normalisée | `DECIMAL` | 0..1 | — | Une conversion (monnaie, unité) est une assertion dérivée (RG-G03), pas cette normalisation |
| unite_originale | Unité d'origine | `UNITE` | C | Annexe A.6 | Obligatoire pour une mesure, un âge ou un effectif |
| monnaie_originale | Monnaie d'origine | `MONNAIE` | C | Annexe A.6 | Obligatoire pour un montant |
| type_valeur | Nature | `CODE` | 1 | {nombre, âge déclaré, montant, mesure, effectif, texte} | Cohérent avec la signature du prédicat |

Exemple : « 1 200 livres coloniales » → `{valeur_originale: "1 200 livres", valeur_normalisee: 1200, monnaie_originale: livre_coloniale, type_valeur: montant}`.

## 21.3 GEOM

| Composant | Définition | Type | Obl. | Domaine / format | Contraintes |
|---|---|---|---|---|---|
| systeme | Système de coordonnées | `TEXTE_COURT` | 1 | `EPSG:4326` ou `image:<id_vue>` | DD-16 |
| forme | Forme | `CODE` | 1 | {point, ligne, polygone, multipolygone, zone floue} | `zone floue` : polygone + `precision_metres` |
| coordonnees | Coordonnées | `TEXTE_LONG` | 1 | GeoJSON (géographique) ou `xywh` / polygone en pixels (image) | Interdit `0,0` par défaut (DD-16) |

---

# Annexe A — Référentiel commun initial `GENIIUS-COMMUN` v1 (DD-03)

Ce contenu est le **minimum** livré au lancement. Tout ajout passe par un référentiel local puis une proposition au commun (RG-R01). Les libellés sont en français ; les `code` sont stables et servent aux échanges.

## A.1 Types d'entité (nature `type d'entité`)

| Branche (spécialisation) | Concepts initiaux (hiérarchie par `PLUS_LARGE`) |
|---|---|
| Personne | `personne` |
| Lieu | `territoire` > `colonie`, `île`, `pays` ; `division_administrative` > `commune`, `section`, `quartier`, `paroisse_territoriale` ; `lieu_dit` ; `habitation_lieu` ; `bati` > `maison`, `case`, `edifice_religieux` ; `voie` ; `element_naturel` > `riviere`, `ravine`, `morne`, `littoral` ; `parcelle` |
| Organisation | `administration`, `juridiction`, `paroisse`, `etude_notariale`, `habitation_exploitation`, `entreprise`, `unite_militaire`, `etablissement_penitentiaire`, `service_archives`, `association`, `etablissement_scolaire`, `etablissement_hospitalier` |
| Fonction | `fonction` |
| Famille | `famille` |
| Collectif | `foyer`, `convoi`, `equipage`, `atelier`, `groupe_travailleurs`, `population` |
| Objet matériel | `moyen_transport` > `navire` ; `objet_personnel` ; `instrument` ; `objet_ceremoniel` |
| Bien | `terre`, `maison_bien`, `parcelle_bien`, `rente`, `fonds` |
| Norme | `loi`, `decret`, `reglement`, `arrete`, `decision` |
| Événement | voir A.5 |
| Phénomène | `epidemie`, `cyclone`, `seisme`, `eruption`, `secheresse`, `guerre`, `famine`, `greve`, `revolte`, `incendie` |
| Tradition | `tradition`, `legende_familiale` |

Une habitation-plantation est en général **deux** entités : un `LIEU` (`habitation_lieu`) et une `ORGANISATION` (`habitation_exploitation`), reliées par une relation `siege_de`.

## A.2 Prédicats (nature `prédicat`) et leurs signatures

**Règle des événements individuels.** Une naissance, un baptême, un décès ou une inhumation peuvent être exprimés de deux façons : par un **prédicat-raccourci** sur la personne (`naissance`, `deces`…), avec temps historique et lieu ; ou par un `EVENEMENT` typé avec des participations. Le raccourci est admis tant que l'événement n'a qu'un participant principal et aucun récit concurrent ; dès qu'il faut lui rattacher plusieurs participants (parents, témoins, déclarant) ou plusieurs récits, il devient un `EVENEMENT`. La conversion crée une `FILIATION` de l'assertion raccourcie vers les nouvelles assertions.

**Règle de direction.** Les relations orientées ne sont stockées que dans un sens (`parent_de`, jamais `enfant_de`) ; l'inverse est calculé. Les relations symétriques (`conjoint_de`, `fratrie_de`, `voisin_de`) sont stockées une fois.

| Code | Libellé | Profil | Sujets admis | Cible | Valeur | Notes |
|---|---|---|---|---|---|---|
| `nom_porte` | nom tel que porté | attribut | PERSONNE, LIEU, ORGANISATION, OBJET_MATERIEL, COLLECTIF | — | texte | Forme complète telle qu'écrite ou dite |
| `patronyme` | patronyme | attribut | PERSONNE | — | texte | — |
| `prenom` | prénom(s) | attribut | PERSONNE | — | texte | — |
| `surnom` | surnom | attribut | PERSONNE | — | texte | « Ti-René » |
| `nom_usage` | nom d'usage | attribut | PERSONNE | — | texte | — |
| `sexe_declare` | sexe déclaré | attribut | PERSONNE | — | concept {féminin, masculin, autre désignation} | Déclaré par la source ; jamais déduit du prénom |
| `age_declare` | âge déclaré | attribut | PERSONNE | — | âge | Toujours à la date de la source (RG-G02) |
| `profession_declaree` | profession déclarée | attribut | PERSONNE | — | concept (profession) ou texte | Professions : référentiels locaux |
| `statut_juridique_declare` | statut juridique déclaré | attribut | PERSONNE | — | concept (statut) | Classification historique attribuée à la source, jamais typage de la personne (RG-E03) |
| `classification_declaree` | classification sociale déclarée | attribut | PERSONNE | — | texte (verbatim) | Catégories coloniales de couleur ou d'origine telles qu'écrites ; aucune inférence, contexte obligatoire (`ANNOTATION` note de contexte) |
| `signature` | signature | attribut | PERSONNE | — | concept {a signé, n'a pas signé, déclare ne savoir signer} | « N'a pas signé » ≠ « illettré » (CDCF § 33.4) |
| `naissance` | naissance | attribut | PERSONNE | — | aucune | Raccourci ; temps historique + lieu |
| `bapteme` | baptême | attribut | PERSONNE | — | aucune | Raccourci |
| `deces` | décès | attribut | PERSONNE | — | aucune | Raccourci |
| `inhumation` | inhumation | attribut | PERSONNE | — | aucune | Raccourci |
| `origine_declaree` | origine déclarée | relation | PERSONNE | LIEU | — | « natif de… » |
| `parent_de` | parent de | relation | PERSONNE | PERSONNE | — | `modele_parente` obligatoire |
| `conjoint_de` | conjoint de | relation | PERSONNE | PERSONNE | — | Symétrique ; période éventuelle |
| `fratrie_de` | frère ou sœur de | relation | PERSONNE | PERSONNE | — | Symétrique |
| `parrain_marraine_de` | parrain ou marraine de | relation | PERSONNE | PERSONNE | — | — |
| `asservi_par` | réduit(e) en esclavage par | relation | PERSONNE | PERSONNE, ORGANISATION | — | Relation juridique historique ; la personne reste une `PERSONNE` (CDCF § 6.5, § 113) |
| `affranchi_par` | affranchi(e) par | relation | PERSONNE | PERSONNE, ORGANISATION | — | — |
| `au_service_de` | au service de | relation | PERSONNE | PERSONNE, ORGANISATION | — | — |
| `voisin_de` | voisin de | relation | PERSONNE, LIEU | PERSONNE, LIEU | — | Voisinage explicite ≠ contiguïté (RG-N05) |
| `associe_de` | associé de | relation | PERSONNE, ORGANISATION | PERSONNE, ORGANISATION | — | — |
| `contient` | contient | relation | LIEU | LIEU | — | `referentiel_spatial` |
| `rattache_a` | rattaché à | relation | LIEU, ORGANISATION | LIEU, ORGANISATION | — | `referentiel_spatial` obligatoire (RG-N04) |
| `jouxte` | jouxte | relation | LIEU | LIEU | — | Contiguïté |
| `au_nord_de`, `au_sud_de`, `a_l_est_de`, `a_l_ouest_de` | orientation relative | relation | LIEU | LIEU | — | — |
| `en_amont_de` | en amont de | relation | LIEU | LIEU | — | — |
| `traverse_par` | traversé par | relation | LIEU | LIEU | — | — |
| `separe_par` | séparé par | relation | LIEU | LIEU | — | — |
| `proche_de` | proche de | relation | LIEU | LIEU | — | Proximité reconstruite, distincte du voisinage |
| `siege_de` | siège de | relation | LIEU | ORGANISATION | — | — |
| `depend_de` | dépend de | relation | ORGANISATION, FONCTION | ORGANISATION | — | — |
| `succede_a` | succède à | relation | ORGANISATION, FONCTION | ORGANISATION, FONCTION | — | — |
| `absorbe` | absorbe | relation | ORGANISATION | ORGANISATION | — | — |
| `cause_de` | cause de | relation | EVENEMENT, PHENOMENE | EVENEMENT | — | `statut_causal` obligatoire (RG-G06) |
| `autorise` | autorise | relation | EVENEMENT (décision) | EVENEMENT | — | Décision → effet (RG-E05) |
| `realise` | réalise | relation | EVENEMENT | EVENEMENT | — | Réalisation d'une décision ou d'un projet |
| `participe_a` | participe à | participation | PERSONNE, ORGANISATION, COLLECTIF, OBJET_MATERIEL | EVENEMENT | — | Rôle (A.3) obligatoire |
| `present_a` | présent à | présence | PERSONNE, COLLECTIF, OBJET_MATERIEL | LIEU | — | `type_presence` |
| `reside_a` | réside à | situation | PERSONNE, COLLECTIF | LIEU | — | — |
| `exerce` | exerce la fonction | situation | PERSONNE | FONCTION | — | Tenure |
| `emploie` | employé par | situation | PERSONNE | ORGANISATION, PERSONNE | — | — |
| `membre_de` | membre de | situation | PERSONNE | COLLECTIF, ORGANISATION, FAMILLE | — | — |
| `statut_durable` | statut (durée) | situation | PERSONNE | — | concept (statut) | Version durable de `statut_juridique_declare` |
| `detient_droit_sur` | détient un droit sur | situation | PERSONNE, ORGANISATION | BIEN | — | `type_droit` obligatoire |
| `a_existe` | a existé | existence documentaire | DOCUMENT | — | aucune | Distinct de « prescrit » (RG-C05) |
| `a_ete_produit` | a été produit | existence documentaire | DOCUMENT | — | aucune | — |

## A.3 Rôles (nature `rôle`)

| Usage | Concepts initiaux |
|---|---|
| Participation à un événement | `sujet_principal`, `enfant`, `pere`, `mere`, `epoux`, `epouse`, `pere_epoux`, `mere_epoux`, `pere_epouse`, `mere_epouse`, `parrain`, `marraine`, `temoin`, `declarant`, `officier_etat_civil`, `ministre_culte`, `notaire`, `vendeur`, `acquereur`, `creancier`, `debiteur`, `donateur`, `donataire`, `heritier`, `accuse`, `victime`, `plaignant`, `juge`, `condamne`, `affranchi`, `affranchissant`, `proprietaire_historique`, `passager`, `membre_equipage`, `capitaine` |
| Responsabilité documentaire (D-17) | `redacteur`, `auteur_intellectuel`, `signataire`, `informateur`, `declarant`, `autorite_emettrice`, `destinataire`, `collecteur`, `deposant`, `ancien_detenteur`, `conservateur_actuel`, `numeriseur`, `diffuseur` |
| Rôle probatoire (D-08) | `principal`, `complementaire`, `marge`, `verso`, `page_suivante`, `contexte`, `contradictoire` |

## A.4 Types documentaires (nature `type documentaire`)

| Famille | Concepts initiaux |
|---|---|
| État civil | `acte_naissance`, `acte_mariage`, `acte_deces`, `acte_reconnaissance`, `publication_mariage`, `transcription_etat_civil`, `table_decennale` |
| Registres paroissiaux | `acte_bapteme`, `acte_mariage_religieux`, `acte_sepulture` |
| Actes notariés | `vente`, `testament`, `inventaire_apres_deces`, `contrat_mariage`, `obligation`, `procuration`, `partage`, `donation`, `acte_affranchissement` |
| Registres coloniaux et de l'esclavage | `registre_nouveaux_libres`, `registre_individualites`, `denombrement`, `recensement`, `etat_nominatif`, `registre_matricule_esclaves`, `registre_affranchissements` |
| Militaire | `registre_matricule_militaire`, `fiche_matricule` |
| Judiciaire et pénitentiaire | `jugement`, `arret`, `dossier_procedure`, `registre_matricule_bagnard`, `dossier_individuel_bagnard` |
| Foncier | `transcription_hypothecaire`, `inscription_hypothecaire`, `plan_cadastral`, `matrice_cadastrale` |
| Autres | `presse`, `correspondance`, `photographie`, `album`, `temoignage_oral`, `carte_plan`, `annuaire`, `liste_passagers` |

## A.5 Natures d'événement (nature `nature d'événement`)

`naissance`, `bapteme`, `mariage`, `divorce`, `deces`, `inhumation`, `reconnaissance`, `affranchissement`, `emancipation_generale`, `vente`, `succession`, `partage`, `donation`, `hypotheque`, `bail`, `division_fonciere`, `fusion_fonciere`, `changement_nom`, `proces`, `condamnation`, `commutation`, `incarceration`, `evasion`, `liberation`, `recensement_operation`, `depart`, `arrivee`, `traversee`, `engagement_militaire`, `reunion_familiale`, `ceremonie`, `decision_administrative`.

## A.6 Monnaies, unités, calendriers

| Nature | Concepts initiaux |
|---|---|
| Monnaie | `livre_tournois`, `livre_coloniale`, `sol`, `denier`, `franc`, `franc_colonial`, `piastre`, `gourde`, `euro` |
| Unité | `an`, `mois`, `jour` (âges) ; `personne` (effectifs) ; `carre` (surface antillaise), `arpent`, `hectare`, `toise`, `pied`, `pas`, `aune`, `barrique` |
| Calendrier | `gregorien`, `julien`, `republicain` |

Les équivalences (1 carré ≈ 1,29 ha selon les usages) sont des **méthodes de conversion** (`METHODE`), jamais des attributs des concepts (RG-G03).

## A.7 Systèmes d'identifiants externes

`wikidata`, `familysearch`, `geneanet`, `viaf`, `isni`, `idref`, `bnf_ark`, `anom_irel`, `matchid_insee`, `geonames`, `memoire_des_hommes`, `gallica`, `ad_cote` (archives départementales).

---

# Annexe B — Statut des domaines de valeurs du MCD (DD-12)

**Fermé** : `CODE`, modifiable seulement par une nouvelle version du dictionnaire. **Référentiel** : `REF_CONCEPT`, initialisé par `GENIIUS-COMMUN` v1 et extensible par référentiel local.

| Code | Domaine | Statut | Code | Domaine | Statut |
|---|---|---|---|---|---|
| D-01 | etat_cycle_vie | Fermé | D-26 | famille_relation | Référentiel |
| D-02 | etat_examen | Fermé | D-27 | modele_parente | Référentiel |
| D-03 | statut_validation | Fermé | D-28 | referentiel_spatial | Référentiel |
| D-04 | visibilite | Fermé | D-29 | type_droit | Référentiel |
| D-05 | decouvrabilite | Fermé | D-30 | modalite | Fermé |
| D-06 | type_activite | Fermé | D-31 | type_vide | Fermé |
| D-07 | type_dependance | Fermé | D-32 | niveau (transmission) | Fermé |
| D-08 | role_probatoire | Référentiel (A.3) | D-33 | type (évaluation) | Fermé |
| D-09 | type_espace | Fermé | D-34 | role_credit | Fermé |
| D-10 | action (permission) | Fermé | D-35 | type (anomalie) | Fermé |
| D-11 | role (garde) | Fermé | D-36 | etat_memoire | Fermé |
| D-12 | nature (document) | Référentiel | D-37 | mode_connaissance | Fermé |
| D-13 | statut_existence | Fermé | D-38 | etat_cycle (projet) | Fermé |
| D-14 | etat_provenance | Fermé | D-39 | etat (question) | Fermé |
| D-15 | etat_acces | Fermé | D-40 | recherchabilite | Fermé |
| D-16 | type (reproduction) | Référentiel | D-41 | niveau_consultation | Fermé |
| D-17 | role (responsabilité) | Référentiel (A.3) | D-42 | statut (item de mission) | Fermé |
| D-18 | type_ordre | Fermé | D-43 | portee (règle) | Fermé |
| D-19 | plausibilité / certitude | Fermé (DD-14) | D-44 | portee_nouveaute | Fermé |
| D-20 | couche (transcription) | Fermé | D-45 | type (flux) | Fermé |
| D-21 | type (annotation) | Référentiel | D-46 | type_localisation | Fermé |
| D-22 | nature (mention) | Fermé | D-47 | type (méthode) | Référentiel |
| D-23 | statut_resolution | Fermé | D-48 | format (export) | Fermé |
| D-24 | couche_spatiale | Référentiel | D-49 | motif (notification) | Fermé |
| D-25 | mode_realite | Fermé |  |  |  |

Sont également des **référentiels** les listes introduites dans les fiches pour : `type_exemplaire`, `nature_structure`, natures de `COLLECTIF_HISTORIQUE`, `BIEN`, `NORME`, `CRITERE_PROTOCOLE.dimension`, types d'`EVENEMENT_CONNECT` et d'`ACTIVITE_CONNECT` (DD-06), `DOMAINE_EXPERTISE.theme`, `IDENTIFIANT_EXTERNE.systeme`.

---

# Annexe C — Écarts par rapport au MCD V1.1 (†)

Ces écarts **précisent** le MCD sans le rouvrir (§ 0.3). Ils sont à reporter lors de la prochaine révision éditoriale du MCD.

## C.1 Renommages et fusions

| MCD V1.1 | Dictionnaire V1.0 | Décision |
|---|---|---|
| `UTILISATEUR` | `COMPTE` + `ACTEUR_GENIIUS` | DD-07 |
| `REVENDICATION` / `REVENDIQUER` | `LIEN_COMPTE_PERSONNE` | DD-07 |
| `CHOIX_AFFICHAGE` / `CHOISIR_AFFICHAGE` | `SELECTION_CONTEXTE` / `SELECTIONNER` | DD-08 |
| `REFERENCER` (§ 3.4) | `REFERENCE_INTER_ESPACE` (§ 3.6) | § 3.6 |
| `DEPENDANCE_PRODUCTION`, `_JUSTIFICATION`, `_RAISONNEMENT` | `DEPENDANCE.categorie` | § 3.4 |

## C.2 Propriétés du MCD transformées en associations (TI-02)

`PRESCRIPTION.territoire` → CONCERNER_TERRITOIRE ; `ARBRE.personne_racine_affichage` → RACINE ; `ECART.objet_a` / `objet_b` → ECART_A / ECART_B ; `LIEN_EXPLORATOIRE.objet_a` / `objet_b` → EXPLORER_A / EXPLORER_B.

## C.3 Attributs ajoutés

| Entité | Attributs † |
|---|---|
| ESPACE | visibilite_max ; replication_hors_ligne, duree_max_hors_ligne_jours (9/10/2026) |
| VERSION_OBJET | empreinte_etat, statut_contenu |
| ACTIVITE | fournisseur, perimetre_donnees_transmises |
| DEPENDANCE | id_lien, categorie, sens, cycle_detecte, etat_lien |
| FILIATION, REFERENCE_INTER_ESPACE | id_lien |
| ETAT_REFERENCE_EXTERNE | id_etat |
| ACQUISITION_INFORMATION | date_connaissance_declaree |
| REFERENCE_PERSISTANTE | ark |
| ACTEUR_GENIIUS | nature_acteur |
| REGLE_ACCES | cible_type, effet, objet_protege, role_beneficiaire ; nature, fondement (9/10/2026) |
| CONTEXTE_EVALUATION | regle_acces, appareil ; valeurs `réplication`, `synchronisation`, `application locale` (9/10/2026) |
| CONTRIBUTION_DIFFEREE | entité ajoutée (§ 4.25, 9/10/2026) |
| DOCUMENT | titre_original |
| VUE | largeur_px, hauteur_px |
| ANNOTATION | date_trace |
| ACTE_EVALUATION | role_au_moment |
| METHODE | deterministe |
| CALCUL | date_reference |
| EXPORT | manifeste, empreinte_paquet |
| IMPORT | rapport |
| CONCEPT | code, actif, profil_assertion, types_sujet, attend_cible, types_cible, type_valeur |

## C.4 Associations ajoutées

DECRIRE_ETAT, REDIRIGER_VERS, JUSTIFIER, INVOQUER_PREUVE, ACQUERIR, LOT, FOURNIR, ACQUERIR_DOC (A) ; PORTER_SUR_LIEN, RESTRICTION_AMONT, DERIVE_CONCERNE, EVALUER_OBJET, EVALUER_DANS, PROPOSER_DIFFERE, CIBLER_ESPACE, RESULTER_EN, OUVRIR_CONFLIT (B) ; CONCERNER_TERRITOIRE, COMPOSER_DOC, ALIGNEMENT_REPRODUCTION, DECLARER_SOURCE, IDENTIFIER_SOURCE, SOURCER_EXT (C) ; SELECTIONNER, ADOPTER, PORTER_SUR_PROPOSITION (F) ; EXPRIMER_ASSERTION, EXTRAITE_DE, TRADUIRE_EXPRESSION (G) ; RACINE, ECART_A, ECART_B (L) ; EVALUER_PUBLICATION, EVALUER_EXPORT (P) ; EXPLORER_A, EXPLORER_B (Q).

## C.5 Associations réifiées en liens gouvernables (DD-09)

DEPENDANCE, FILIATION, REFERENCE_INTER_ESPACE, RESPONSABILITE, CREDITER.

---

# Annexe D — Obligations transmises au MLD et au MPD

Ce que le modèle logique et le modèle physique doivent rendre **exécutable** (rapport de tests § 8). Chaque ligne est vérifiable par un test.

| # | Obligation | Origine |
|---|---|---|
| OB-01 | Versionnement append-only : aucune mise à jour en place d'un objet ✓ ; versions séquentielles sans trou ; une seule version courante | TI-01, DI-A06, DI-A07 |
| OB-02 | Manifestes de conteneurs et jalons de version | DD-01 |
| OB-03 | Calcul du **graphe accessible** par contexte avant toute recherche, traversée, agrégation, comptage, calcul, export, notification et réponse d'API | P20, DI-B12, DI-O12, DI-Q05 |
| OB-04 | Réponses indistinguables entre « absent » et « caché » lorsque l'existence est protégée (codes d'erreur, temps de réponse, compteurs, pagination) | TI-11, test 20 |
| OB-05 | Priorité des interdictions sur les autorisations | DD-18 |
| OB-06 | Monotonie de visibilité des liens | TI-10, DD-09 |
| OB-07 | Seuil de petit effectif pour les agrégats diffusés (valeur à fixer au MPD) | DI-B18, test 9 |
| OB-08 | Détection des cycles de raisonnement et exclusion du décompte des justifications indépendantes | DI-A17, DI-A29 |
| OB-09 | Propagation des changements amont vers les dépendances (`etat_impact`), en asynchrone admis, avec délai maximal à fixer | DI-A18, RG-A04 |
| OB-10 | Réconciliation d'import par lot, identifiants externes, empreinte et objets déjà acquis | DI-P08, test 7 |
| OB-11 | Résolution des identifiants : `geniius:` interne, ARK public à la publication, tombstones après suppression | DD-02, DI-A36 |
| OB-12 | Purge légale : `etat_fige` vidé, empreinte recalculée, identifiant conservé, dépendances signalées | DD-13 |
| OB-13 | Validation des assertions contre la signature de leur prédicat | DI-G01, DI-R03 |
| OB-19 | Une API expose `DATE_HIST`, statut épistémique et provenance sans jamais aplatir une date hypothétique en date exacte | RG-P07, critère 44 |
| OB-14 | Validation des `DATE_HIST` (cohérences DD-10) et rejet des valeurs sentinelles | DD-10, TI-08 |
| OB-15 | Interdiction technique de transmettre des attributs `R` ou `I` à un fournisseur d'IA ; traçage des transmissions | TI-12, DI-A12 |
| OB-16 | Accès temporaires bornés (missions, comparaisons) et clôture automatique | DI-K12, DI-L10 |
| OB-17 | Isolation des espaces et chiffrement des attributs `I` au repos | CDCF § 95 |
| OB-18 | Calcul d'indépendance des sources sur le graphe accessible ; jamais mieux que « aucune dépendance connue » sans acte humain | DD-05 |
| OB-20 † | Réplication locale : la réplique est le graphe accessible d'un contexte `réplication` (acteur, appareil), limité aux espaces qui l'autorisent ; existence protégée exclue ; expiration locale pour les espaces `limitée` ; retraits transmis en premier, sous une forme non qualifiée ; un retrait ne détruit jamais les contributions locales de l’utilisateur, y compris celles qui portent sur l’objet retiré : elles sont conservées et transmises en CONTRIBUTION_DIFFEREE (arbitrage confirmé le 9/10/2026) | AUDIT-TECH-001, TECH-002, TECH-011.6 (9/10/2026) |
| OB-21 † | Réception différée : idempotence par `(acteur, operation_origine)`, réévaluation des droits à l'intégration, conversion seulement déterministe, conflits sans écrasement (DI-B31 à B33) | TECH-003, TECH-005, AUDIT-TECH-003 (9/10/2026) |
| OB-22 † | Aucune règle de lecture au profit d'un rôle administratif ; habilitation exceptionnelle nominative, bornée, fondée et journalisée à chaque usage (DI-B29, DI-B30) | REV-02-A, REC-X11, TECH-027 (9/10/2026) |

---

# Annexe E — Couverture des tests critiques par le dictionnaire

Le rapport de réexécution identifie les tests 4, 5, 7, 8, 9, 10, 11, 14, 18, 19 et 20 comme les plus exposés à une traduction naïve. Voici les règles du dictionnaire qui les rendent exécutables.

| Test | Scénario | Règles du dictionnaire |
|---|---|---|
| 4 | Relation privée entre deux personnes publiques | DD-09, TI-10, `REGLE_ACCES.objet_protege = existence`, DI-B12 |
| 5 | Preuve privée, conclusion désormais justifiée publiquement | `DEPENDANCE.categorie`, `BASE_JUSTIFICATIVE` (DI-A27, DI-A28), DI-G12 |
| 7 | GEDCOM importé deux fois | `ACQUISITION_INFORMATION`, LOT, DI-A30, DI-P08, OB-10 |
| 8 | Scission d'une cible Core sans réécrire Tree | `ETAT_REFERENCE_EXTERNE`, DI-A25, DI-A26, DI-L05 |
| 9 | Agrégat public sans révéler les éléments secrets | P20, DI-B18, DI-O12, OB-03, OB-07 |
| 10 | Notification sans révéler une contradiction privée | DI-Q05, OB-03 |
| 11 | Export sans révéler une dépendance interdite | DI-P05, `EXPORT.manifeste`, EVALUER_EXPORT |
| 14 | Raisonnement circulaire non compté | DI-A17, DI-A29, OB-08 |
| 18 | Retrait de consentement sans destruction automatique | DI-B23, DI-B24, `DECISION_APPLICABILITE_DROIT` |
| 19 | Tree souverain après évolution du Core | DI-A22, DI-A25, DI-L03 à DI-L05, DI-L07 |
| 20 | API indistinguable entre absence et existence secrète | TI-11, DI-B12, OB-04 |

---

# Annexe F — Décisions à confirmer

Ces choix ont été tranchés pour ne pas bloquer le MLD, mais ils engagent la gouvernance ou des tiers. Ils méritent une validation explicite.

| # | Décision | Pourquoi la confirmer |
|---|---|---|
| F-1 | Seuil d'individualisation au Core partagé : une trace + note d'individualisation, sans nom (DD-04) | Engage la politique de contribution du Core |
| F-2 | Présomption « raisonnablement présumé vivant » pour une naissance de moins de 120 ans sans décès connu (DI-E06) | Seuil juridique et éthique ; à valider par l'étude juridique (CDCF § 115) |
| F-3 | ARK attribué à la première publication (DD-02) | Suppose l'obtention d'un NAAN auprès de la CDL |
| F-4 | Répartition `COMPTE` / `ACTEUR_GENIIUS` des associations (DD-07) | Structure les droits et l'attribution de tout le système |
| F-5 | Prédicats-raccourcis pour les événements individuels (annexe A.2) | Compromis entre saisie rapide et modèle événementiel |
| F-6 | Prédicat `classification_declaree` pour les catégories coloniales de couleur ou d'origine (annexe A.2) | Sujet sensible ; à valider avec les communautés concernées (CDCF § 60) |
| F-7 | Valeurs du seuil de petit effectif (OB-07) et du délai de propagation (OB-09) | Laissées au MPD ; à fixer avant l'ouverture publique |

---

# Annexe G — Matrice d'audit MCD → Dictionnaire → MLD

Cette annexe ne crée aucune règle métier. Elle sert de **contrôle de passage** entre le MCD gelé, le présent dictionnaire et le futur MLD.

## G.1 Statuts de traçabilité

| Statut | Sens | Effet sur la suite |
|---|---|---|
| `MCD-CANONIQUE` | Concept explicitement présent dans le MCD V1.1 | Le MLD doit l'implémenter sans en modifier le sens |
| `DD-PRECISION` | Précision apportée par le dictionnaire sans nouveau concept fondamental | Le MLD applique la précision ; l'alignement éditorial du MCD peut être fait ultérieurement |
| `DD-ECART-†` | Ajout ou réification marqué `†`, recensé en annexe C | Doit rester traçable et être reporté lors d'une révision éditoriale du MCD |
| `MLD-OUVERT` | Choix volontairement non tranché au niveau conceptuel | Doit être décidé et documenté au MLD |
| `MPD-OUVERT` | Choix de technologie, performance, chiffrement ou exploitation | Doit être décidé au MPD sans altérer les invariants du MCD/DD |
| `VALIDATION-EXTERNE` | Décision dépendant d'une validation juridique, communautaire, institutionnelle ou d'un tiers | Ne doit pas être figée silencieusement par l'implémentation |

## G.2 Règle de traçabilité

Toute structure du futur MLD devra pouvoir être reliée à au moins une des catégories suivantes :

1. une entité ou association du MCD ;
2. une précision `DD-*`, `DI-*` ou `TI-*` du présent dictionnaire ;
3. un écart `†` recensé en annexe C ;
4. une obligation `OB-*` de l'annexe D ;
5. une décision explicitement enregistrée dans le registre MLD de l'annexe H.

Une table, colonne, contrainte, vue matérialisée ou politique d'accès qui ne peut être rattachée à aucune de ces catégories est considérée comme **non justifiée** jusqu'à documentation.

## G.3 Règle de non-régression

Le passage au MLD ne peut pas :

- transformer une assertion en attribut de vérité intrinsèque d'une entité ;
- aplatir `DATE_HIST` en date exacte ;
- confondre `COMPTE`, `ACTEUR_GENIIUS` et `PERSONNE` ;
- confondre acquisition, production et justification ;
- remplacer une filiation, une référence ou un rapprochement par un même lien générique ;
- supprimer l'historique d'une version, d'une évaluation ou d'une provenance ;
- calculer sur le graphe complet puis masquer les éléments interdits ;
- utiliser une suppression en cascade qui détruit une preuve, une provenance ou une citation devant subsister ;
- transformer un import en validation scientifique ;
- considérer un score algorithmique comme une probabilité historique.

---

# Annexe H — Registre des décisions encore ouvertes pour le MLD / MPD

Les décisions ci-dessous sont **volontairement laissées ouvertes** par le dictionnaire. Elles ne doivent pas être tranchées implicitement pendant la création des tables.

| ID | Niveau | Sujet | Décision attendue | Contraintes imposées par le DD | Statut |
|---|---|---|---|---|---|
| MLD-01 | MLD | Stratégie d'héritage `OBJET` | Table mère + sous-types, composition, autre stratégie relationnelle | Préserver identités, spécialisations, droits et versionnement ; éviter une table métier universelle opaque `type + JSON` | À décider |
| MLD-02 | MLD | Stockage des états versionnés | Snapshot complet, delta, tables historisées ou hybride | Respecter DD-01, TI-01, citations de versions et tombstones | À décider |
| MLD-03 | MLD | Représentation de `DATE_HIST` | Type composite, colonnes structurées, tables dédiées | Toutes les composantes et incertitudes de DD-10 doivent rester interrogeables | À décider |
| MLD-04 | MLD | Représentation de `VALEUR` | Composite ou structure relationnelle | Valeur originale toujours conservée ; conversion ≠ remplacement | À décider |
| MLD-05 | MLD | Représentation de `GEOM` | PostGIS + métadonnées, structure dédiée ou hybride | Géométries concurrentes et localisation relative doivent coexister | À décider |
| MLD-06 | MLD | Associations gouvernables | Tables de liens spécialisées ou socle commun de liens | Respecter DD-09, TI-10 et protection de l'existence | À décider |
| MLD-07 | MLD | `DEPENDANCE` | Table unique avec `categorie` ou spécialisations logiques | Production, justification et raisonnement restent distinguables et requêtables | À décider |
| MLD-08 | MLD | Référentiels et concepts | Tables/versionnement/résolution des concepts | Préserver niveaux personnel/projet, communautaire et commun GENIIUS | À décider |
| MLD-09 | MLD | Assertions | Schéma relationnel des profils d'assertion | Ne pas réintroduire `PERSONNE.date_naissance`, `profession`, `résidence` comme vérités intrinsèques | À décider |
| MLD-10 | MLD | Nullabilité / états d'absence | Traduction SQL des obligations `1`, `0..1`, `C` et de `LACUNE` | TI-07 et TI-08 : NULL ≠ inexistence et aucune valeur sentinelle | À décider |
| MLD-11 | MLD | Réconciliation d'import | Clés techniques, empreintes, identifiants externes, lots | Respecter DI-P08 et OB-10 ; aucun UPSERT de « vérité » | À décider |
| MLD-12 | MLD | Références persistantes | Résolution interne, version figée, fragments, redirections | Respecter DD-02, DI-A34 à DI-A36 | À décider |
| MLD-13 | MLD | Politiques d'accès | Modèle logique des bénéficiaires, interdictions, existence protégée | Interdiction prioritaire ; calcul sur graphe accessible | À décider |
| MLD-14 | MLD | Dépendances sémantiques des publications/exports | Tables ou manifeste relationnel | Les dépendances interdites ne doivent pas fuiter | À décider |
| MLD-15 | MLD | Purge / tombstones | Structures conservées après purge | Identifiants et traces légitimes persistent selon DD-13 | À décider |
| MPD-01 | MPD | Indexation | Index relationnels, texte, spatial, graphe | Ne doit pas contourner les droits ni aplatir l'épistémologie | À décider |
| MPD-02 | MPD | Matérialisation / cache | Vues matérialisées, caches d'agrégats, résultats calculés | Cache contextualisé par droits ; invalidation sur dépendances pertinentes | À décider |
| MPD-03 | MPD | Seuil de petit effectif | Valeur de protection des agrégats | Doit satisfaire OB-07 et risque de ré-identification | À confirmer avant ouverture publique |
| MPD-04 | MPD | Délai de propagation | SLA de mise à jour de `etat_impact` | Doit satisfaire OB-09 | À décider |
| MPD-05 | MPD | Chiffrement | Données `I`, secrets, clés et rotation | Respecter OB-17 et TI-12 | À décider |
| MPD-06 | MPD | RLS / moteur d'autorisation | PostgreSQL RLS, service de policy ou hybride | P20 : filtrage avant opération révélatrice | À décider |
| EXT-01 | Validation externe | ARK / NAAN | Autorité et procédure d'attribution | DD-02 ; ne pas simuler un NAAN | À confirmer |
| EXT-02 | Validation externe | Présomption de personne vivante | Seuil et politique juridique | F-2 ; validation juridique requise | À confirmer |
| EXT-03 | Validation externe | Catégories historiques sensibles | Gouvernance et contextualisation | F-6 ; validation avec communautés concernées | À confirmer |

---

# Annexe I — Definition of Done du dictionnaire avant passage au MLD

Le dictionnaire est considéré comme **gelable pour le MLD** lorsque tous les critères suivants sont satisfaits.

| ID | Critère | Preuve attendue | État V1 |
|---|---|---|---|
| REC-01 | Toutes les entités et associations du MCD sont représentées ou explicitement fusionnées/renommées | MCD + annexe C | À auditer formellement |
| REC-02 | Tous les ajouts du dictionnaire par rapport au MCD sont identifiables | Marque `†` + annexe C | Couvert |
| REC-03 | Chaque entité possède une définition non ambiguë | Fiches des domaines A–R | Couvert |
| REC-04 | Chaque attribut possède type conceptuel, obligation et contraintes | Tableaux attributaires | Couvert |
| REC-05 | Les associations portent leurs cardinalités et leur gouvernance | Tableaux « Associations du domaine » | Couvert |
| REC-06 | Les règles transversales sont formalisées | TI-* | Couvert |
| REC-07 | Les contraintes d'intégrité métier sont formalisées | DI-* | Couvert |
| REC-08 | Les décisions de précision sont explicites | DD-* | Couvert |
| REC-09 | Les écarts avec le MCD sont traçables | Annexe C | Couvert |
| REC-10 | Les obligations d'implémentation sont transmises au MLD/MPD | Annexe D + annexe H | Couvert |
| REC-11 | Les tests critiques exposés par le passage au logique sont mappés | Annexe E | Couvert pour les tests critiques |
| REC-12 | Les décisions externes/gouvernance encore contestables sont isolées | Annexe F + EXT-* | Couvert |
| REC-13 | Aucun choix physique n'est présenté comme une vérité métier sans justification | Revue MLD | À vérifier au MLD |
| REC-14 | Les états d'absence et les valeurs interdites sont cohérents | TI-07, TI-08, LACUNE | Couvert |
| REC-15 | Les données historiques sensibles et l'IA ont une règle de traitement explicite | TI-12, DD-15 | Couvert |
| REC-16 | La couverture des tests non critiques du rapport de 95 tests est auditée jusqu'au niveau DD | Matrice 95 tests → DD/DI/TI/OB | À produire avant gel final |
| REC-17 | Chaque future structure MLD est traçable vers MCD/DD/OB ou une décision MLD | Annexe G | À appliquer au MLD |

**Règle de sortie.** Les critères `REC-01` et `REC-16` sont les deux contrôles formels restant à exécuter avant de déclarer le dictionnaire **gelé**. Les autres critères ouverts relèvent du MLD/MPD et ne bloquent pas la rédaction de celui-ci.

---

# Annexe J — Statut de la V1 consolidée

Cette version adopte le présent dictionnaire détaillé comme **corps canonique**. Les mécanismes ajoutés dans les annexes G à I ne remplacent aucune règle `DD-*`, `DI-*`, `TI-*`, `OB-*` ni aucune annexe A à F.

Ils apportent uniquement :

1. une nomenclature de traçabilité entre MCD, dictionnaire, MLD et MPD ;
2. un registre explicite des choix restant réellement ouverts ;
3. une Definition of Done vérifiable avant gel du dictionnaire ;
4. une interdiction de créer au MLD des structures sans justification conceptuelle documentée.

Le prochain travail recommandé est donc **un audit de gel du dictionnaire**, et non une nouvelle passe de rédaction générale :

- **(a)** vérifier la couverture MCD → DD de manière mécanique ;
- **(b)** mapper les 95 tests vers `DD/DI/TI/OB` ;
- **(c)** corriger les éventuels trous ;
- **(d)** geler le dictionnaire ;
- **(e)** commencer le MLD.
