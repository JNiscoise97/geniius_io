# Documentation GENIIUS

Chaque dossier numéroté correspond à un maillon de la chaîne documentaire. On les lit **dans l'ordre des numéros** : chacun s'appuie sur les précédents. Le [registre des versions normatives](GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md) indique, pour chaque document, sa version, son statut (référence, candidat, gelé) et la preuve de ce statut. **Seul un fichier inscrit au registre fait référence.**

| Dossier | Document de référence | Statut au 13/10/2026 |
|---|---|---|
| [`01_CDCF`](01_CDCF/) | [Cahier des charges fonctionnel](01_CDCF/GENIIUS_CDCF.md), avec ses [avenants](01_CDCF/avenants/) | Référence V1.3, gel global non prononcé |
| [`02_MCD`](02_MCD/) | [Modèle conceptuel de données](02_MCD/GENIIUS_MCD.md) | Gelé (V1.2) |
| [`03_DICTIONNAIRE`](03_DICTIONNAIRE/) | [Dictionnaire de données](03_DICTIONNAIRE/GENIIUS_DICTIONNAIRE_DONNEES.md) | Validé documentairement (V1.3) |
| [`04_CONTRAT_AUTORISATION`](04_CONTRAT_AUTORISATION/) | [Contrat d'autorisation](04_CONTRAT_AUTORISATION/GENIIUS_CONTRAT_AUTORISATION.md) et sa [batterie de scénarios](04_CONTRAT_AUTORISATION/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION.md) | Gelé (V1.6) |
| [`05_MLD`](05_MLD/) | [Modèle logique de données](05_MLD/GENIIUS_MLD.md) et [catalogue des autorisations](05_MLD/GENIIUS_MLD_AUTORISATIONS.md) | Stabilisé (V1.1-g), candidat au gel |
| [`06_CDC_TECHNIQUE`](06_CDC_TECHNIQUE/) | [Cahier des charges technique](06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE.md) et ses [recettes](06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE_RECETTES.md) | Gelé documentairement (V1.2) |
| [`07_ARCHITECTURE`](07_ARCHITECTURE/) | Dix dossiers d'architecture, numérotés dans l'ordre de lecture ; [index](07_ARCHITECTURE/README.md) | Candidats (V0.1), non gelés |
| [`08_AUDIT_COHERENCE`](08_AUDIT_COHERENCE/) | [Rapport d'audit de cohérence](08_AUDIT_COHERENCE/RAPPORT_AUDIT_COHERENCE_V1.md) | Rapport de contrôle (V1) |

## Organisation d'un dossier

| Emplacement | Contenu |
|---|---|
| à la racine du dossier | Le ou les **documents de référence**, dans leur version en vigueur. |
| `preuves/` | Ce qui **fonde le statut actuel** : procès-verbaux, dossiers de validation ou de clôture, contrôles et empreintes. |
| `travaux/` | Les **étapes qui y ont conduit** : audits, contrôles en aveugle, instructions, revues intermédiaires. |
| `historique/` | Les **versions remplacées** du document de référence, conservées pour la traçabilité. |
| `avenants/` | (CDCF seulement) Les avenants fonctionnels. |

Pour valider un document, lisez le document de référence, puis `preuves/`. `travaux/` et `historique/` ne servent qu'à retracer une décision.

## Règle de nommage

1. **Dossiers de la chaîne** : `NN_SUJET`, numérotés dans l'ordre de lecture (`01_CDCF` … `08_AUDIT_COHERENCE`). Sous-dossiers en minuscules, pris dans la liste fermée ci-dessus.
2. **Document de référence** : `GENIIUS_<SUJET>.md`, **sans numéro de version**. La version figure dans l'en-tête du document et au registre, si bien qu'un lien vers un document de référence ne change jamais. Quand un sujet compte plusieurs documents à lire dans un ordre, un rang les précède : `GENIIUS_ARCHITECTURE_01_CADRAGE.md`.
3. **Pièce** (preuve, contrôle, instruction, rapport…) : `<TYPE>_<OBJET>_V<majeure>_<mineure>.<ext>`. Le type vient en tête : `PROCES_VERBAL`, `DOSSIER`, `PREUVES`, `CONTROLE` ou `CONTROLES`, `VALIDATION`, `REGISTRE`, `RAPPORT`, `AUDIT`, `CONTRE_AUDIT`, `INSTRUCTION`, `REVUE`, `BILAN`, `COUVERTURE`, `MATRICE`, `REPORT`, `RESULTATS`, `ECHANGES`. La version est celle du document attesté.
4. **Version remplacée** : `GENIIUS_<SUJET>_V<majeure>_<mineure>[_<QUALIFICATIF>].md` dans `historique/`, par exemple `GENIIUS_CDCF_V1_2_AVANT_DC_CDCF_01.md`.
5. **Caractères** : majuscules, chiffres et `_` seulement ; ni espace, ni accent, ni tiret. Extensions en minuscules. Seule exception, `README.md`, l'index d'un dossier.

## Rangement du 13 octobre 2026

Les fichiers ont été déplacés et renommés selon cette règle. Seuls leurs liens et leurs mentions de chemins ont changé ; la vérification est consignée au [registre](GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md), § 6, avec la table de correspondance des anciens chemins et le rescellement des preuves de gel.
