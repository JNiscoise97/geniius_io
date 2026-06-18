# REBOND

# Modèle du patrimoine documentaire — Implémentation

Version 1.0

---

# 1. Objet du document

Ce document décrit le modèle du patrimoine documentaire tel qu'il est
effectivement implémenté dans la base de données de REBOND.

Il fait le pont entre le modèle conceptuel (section 4 du document
`13-modele-donnees`) et les tables SQL réelles.

---

# 2. Les quatre entités du modèle

```text
ref_unites_documentaires (UD parente)
         ↓ parent_ud_id
ref_unites_documentaires (UD d'acte)
         ↓
    ref_exemplaires
         ↑
      citations ──→ etat_civil_actes / ac_actes
```

---

# 3. Table `ref_unites_documentaires`

## Rôle

Sert à la fois de **Source** (fonds ou collection documentaire) et de
**Document** (acte individuel identifiable).

La distinction entre les deux niveaux est portée par `parent_ud_id`.

---

## Colonnes principales

| Colonne          | Type    | Description                                              |
| ---------------- | ------- | -------------------------------------------------------- |
| id               | uuid    | Identifiant unique                                       |
| titre            | text    | Intitulé de l'UD                                         |
| serie_ref        | uuid    | Référence à la série documentaire (état civil, notariat…)|
| parent_ud_id     | uuid?   | UD parente (null = UD de niveau source)                  |
| workflow_statut  | text    | Statut de traitement (`en_attente`, `en_cours`, `traite`)|
| statut           | text    | Statut de qualification (`a_qualifier`, `qualifie`…)     |
| note             | text?   | Note libre                                               |

---

## Deux usages

### UD parente (niveau source / collection)

`parent_ud_id = null`

Exemples :
* Registres des naissances de Deshaies 1889
* Minutier de Maître Dupont 1850–1870
* Collection familiale Niscoise

Créée et qualifiée manuellement par l'utilisateur.

---

### UD d'acte (niveau document individuel)

`parent_ud_id` pointe vers la UD parente.

Exemples :
* Acte de naissance de Henri NISCOISE — Deshaies — 1889
* Vente Dupont–Martin — 12 mai 1860

**Créée automatiquement** lors du référencement d'un acte dans
`ReferencerDocumentPage`, si elle n'existe pas déjà.

Le titre de la UD d'acte est le label de l'acte correspondant.

---

# 4. Table `ref_exemplaires`

## Rôle

Représente une copie physique d'un document conservée dans une institution
précise. Un même document peut avoir plusieurs exemplaires (ADG, ANOM,
mairie, FamilySearch…).

---

## Colonnes principales

| Colonne               | Type  | Description                               |
| --------------------- | ----- | ----------------------------------------- |
| id                    | uuid  | Identifiant unique                        |
| unite_documentaire_id | uuid  | UD à laquelle cet exemplaire est rattaché |
| depot_id              | uuid? | Institution de conservation               |
| cote_locale           | text? | Cote propre à cette institution           |
| localisation          | text? | Description complémentaire                |

---

## Contrainte

Un Exemplaire appartient à une seule UD.

Plusieurs Exemplaires peuvent appartenir à la même UD.

---

# 5. Table `citations`

## Rôle

Lien polymorphique entre un acte (ou registre) et son Exemplaire physique.
C'est le mécanisme central qui relie la couche documentaire (sources,
exemplaires) à la couche contenu (actes transcrits).

---

## Colonnes principales

| Colonne       | Type   | Description                                              |
| ------------- | ------ | -------------------------------------------------------- |
| id            | uuid   | Identifiant unique                                       |
| target_type   | text   | Type de l'objet cité (`ec_acte`, `ec_registre`, `ac_acte`) |
| target_id     | uuid   | Identifiant de l'objet cité                              |
| exemplaire_id | uuid   | Exemplaire dans lequel l'objet est localisé              |
| locating      | jsonb  | Localisation physique détaillée                          |

---

## Valeurs de `target_type`

| Valeur        | Table cible         | Usage                          |
| ------------- | ------------------- | ------------------------------ |
| `ec_acte`     | `etat_civil_actes`  | Acte d'état civil              |
| `ec_registre` | `etat_civil_registres` | Registre d'état civil entier|
| `ac_acte`     | `ac_actes`          | Acte notarial ou autre         |

---

## Structure du JSONB `locating`

```json
{
  "systems": [
    { "type": "folio", "value": "12v" },
    { "type": "image", "value": "45" }
  ],
  "missing_ranges": [
    { "debut": 5, "fin": 10, "note": "Pages arrachées" }
  ]
}
```

`systems` : systèmes de numérotation utilisés dans cet exemplaire
(folio, image, numéro d'acte…).

`missing_ranges` : plages d'actes connues comme absentes de cet exemplaire
(lacunes, microfilm incomplet, pages manquantes).

---

## Contrainte d'unicité

La combinaison (`target_type`, `target_id`, `exemplaire_id`) doit être unique :
un même objet ne peut pas être cité deux fois dans le même exemplaire.

---

# 6. Règles de création automatique

## Lors du référencement d'un acte (UC-020)

Quand l'utilisateur valide le formulaire `ReferencerDocumentPage` :

### Étape 1 — Résoudre l'acte

Si l'acte est sélectionné parmi les résultats : `acteId` = id existant.

Si l'acte est créé : INSERT dans `etat_civil_actes` ou `ac_actes`.

---

### Étape 2 — Résoudre la source parente (optionnelle)

Si une UD parente existante est sélectionnée : `parentUdId` = id existant.

Si une note approximative est saisie : INSERT dans `ref_unites_documentaires`
avec `parent_ud_id = null`, `workflow_statut = 'en_attente'`, `statut = 'a_qualifier'`.

---

### Étape 3 — Résoudre la UD d'acte

Recherche via `citations` : existe-t-il déjà une Citation pointant vers cet acte ?

Si oui : récupération de l'`exemplaire_id` → `unite_documentaire_id` = UD existante.

Si non : INSERT dans `ref_unites_documentaires` avec :
* `titre` = label de l'acte
* `serie_ref` = série déduite du type d'acte
* `parent_ud_id` = `parentUdId` (ou null)
* `workflow_statut = 'en_attente'`
* `statut = 'a_qualifier'`

---

### Étape 4 — Créer l'Exemplaire

INSERT dans `ref_exemplaires` :
* `unite_documentaire_id` = UD d'acte
* `depot_id` = dépôt sélectionné
* `cote_locale` = cote saisie

---

### Étape 5 — Créer la Citation

INSERT dans `citations` :
* `target_type` = `'ec_acte'` ou `'ac_acte'`
* `target_id` = `acteId`
* `exemplaire_id` = id de l'Exemplaire créé à l'étape 4
* `locating` = JSONB construit à partir des données saisies

---

# 7. Visibilité dans l'UI Patrimoine documentaire

Les UD et Exemplaires créés apparaissent dans la page Patrimoine documentaire
via la vue `v_sources` (et vues associées).

| Ce qu'on voit            | Table source                   | Conditions                        |
| ------------------------ | ------------------------------ | --------------------------------- |
| Onglet Sources           | `ref_unites_documentaires`     | `parent_ud_id IS NULL`            |
| Onglet Documents         | `ref_exemplaires`              | Via la UD d'acte                  |
| Statut "En attente"      | `ref_unites_documentaires`     | `workflow_statut = 'en_attente'`  |

---

# 8. Principe directeur

Le patrimoine documentaire de REBOND est organisé autour d'une distinction
fondamentale :

* La **source** (UD parente) est ce que l'archiviste référence.
* Le **document** (UD d'acte) est ce que le chercheur consulte.
* L'**exemplaire** est la copie physique qu'il tient entre les mains.
* La **citation** est la preuve que cet acte se trouve dans cet exemplaire.

Cette chaîne garantit la traçabilité complète : de l'acte transcrit jusqu'au
fonds d'archives qui le conserve.
