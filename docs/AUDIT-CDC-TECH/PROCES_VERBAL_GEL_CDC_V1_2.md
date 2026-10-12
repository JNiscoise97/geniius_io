# GENIIUS — Clôture des réserves et gel documentaire du CDC V1.2

**13 octobre 2026 — décision du porteur consignée, gel documentaire prononcé.**

## Autorisation et périmètre

Après la [revue finale V1.1](REVUE_FINALE_CDC_V1_1.md), la proposition au porteur était : ratifier les exigences techniques déjà retenues avec leurs justifications, aligner le CDCF sur la V1.6 (révocation serveur immédiate, retrait hors ligne à la première reconnexion ou échéance), consigner le gel puis passer à l’architecture. Le porteur a répondu **« ok vas y »**. Cette autorisation porte sur ces actions et sur les reports explicitement décrits ; elle n’adopte aucune valeur d’exemple du modèle ni technologie.

La baseline gelée est le [CDC technique V1.2](../GENIIUS_CDC_TECHNIQUE_V1_0.md) et son [référentiel de recettes V1.2](../GENIIUS_CDC_TECHNIQUE_RECETTES_V1_2.md), avec source structurée `spec/validation/cdc_recettes_v1_2.json`. Le nom historique du fichier principal est conservé. La [V1.1 après revue](../archives/cdc-technique/GENIIUS_CDC_TECHNIQUE_V1_1_APRES_REVUE_FINALE.md) reste consultable.

## Décisions et conséquences

**DC-CDCF-01 / R-CDC-03.** Le CDCF passe en V1.3 : § 122.2 et critère 55 distinguent révocation effective côté serveur et délai de retrait sur une réplique déconnectée. L’échéance opposable reste le minimum plateforme/espace/habilitant sur toute donnée protégée, objets personnels compris. Aucun accès dérogatoire ne réplique ; les deltas personnels sont conservés et ne donnent aucun droit d’intégration. La V1.2 fonctionnelle est [archivée](../archives/cdcf/geniius_io_CDCF_V1_2_AVANT_DC_CDCF_01.md). L’écart documentaire est clos ; la limite physique hors ligne demeure. Le contrat V1.6 gelé, son modèle et ses preuves ne sont pas modifiés : leur mention de l’écart correspond à la baseline CDCF V1.2 d’alors, désormais remplacée.

**DC-CDCF-01 / R-CDC-02.** CDCF § 135 ratifie les TECH-001, 002, 004, 005, 009, 013, 014, 022, 023 et 028 dans leurs clauses du CDC, avec les justifications correspondantes. ECD-19 est clos sur ce périmètre. La régularisation directe remplace la proposition AV-FONC-002 ; aucun dossier d’avenant inexistant n’est présenté comme gelé. Les origines historiques restent des justifications techniques explicites.

## Levée des conditions

| Condition | Preuve de clôture documentaire |
|---|---|
| GEL-01 | MLD V1.1-g et catalogue V1.6 désignés au registre ; références amont uniques. |
| GEL-02 | Matrice de relecture des seize lacunes ; corrections RF-01 à RF-10 ; contrats et recettes présents. |
| GEL-03 | 33 TECH relues, 31 CU et 64 critères repris ; ratification § 135 clôt ECD-19. |
| GEL-04 | 381 identifiants uniques, attendus fidèles aux colonnes source, familles et recouvrements explicités. |
| GEL-05 | Ordre V1.6, titularité après départ, dérogation bornée et refus introuvable cohérents ; baseline gelée conservée. |
| GEL-06 | CP-21 traduit : direct transactionnel, transitif en attente visible, idempotence ; délai MPD-04 encadré. |
| GEL-07 | Réception privée et restauration sans résurrection ; CDCF § 122.2/critère 55 alignés. |
| GEL-08 | Protocole NF sans changement implicite de seuil ; reports avec responsables, contraintes, étapes et preuve attendue. |

**Les huit conditions sont levées documentairement.** Le contrôle reproductible et ses empreintes sont dans les [contrôles V1.2](CONTROLES_CDC_TECHNIQUE_V1_2.json). Il ne remplace pas la relecture motivée du rapport et ne constitue pas une recette logiciel.

## Reports acceptés et obligations aval

R-CDC-04 à R-CDC-06 sont acceptés comme reports encadrés : profils complémentaires, sondes/exclusions de disponibilité, RPO médias, protocole statistique de non-divulgation ; langues V1 (au moins deux dont français), quotas, durées et MPD-04 ; affectations nominatives avant décision/campagne. Les registres DEC-ARCH-01 à 17, PAR-CDC-01 à 11 et MPD-01 à 06 portent ces travaux. Chaque décision doit respecter les invariants, conserver alternatives/critères et être fermée avant l’étape qui en dépend. Un paramètre ouvert ne peut pas être présenté comme mesuré ou satisfait.

Le dictionnaire V1.3 reste validé documentairement sans nouveau gel formel ; le MLD V1.1-g reste stabilisé candidat. Le CDCF V1.3 est une référence, sans gel global implicite. Le gel du CDC est documentaire : aucune recette logiciel ni mesure NF n’a été exécutée. Les changements futurs suivent CDC § 13.

## Passage à l’architecture

Le passage à la préparation de l’architecture est acté sur ces baselines. Le [cadrage d’architecture](../architecture/GENIIUS_CADRAGE_ARCHITECTURE_V0_1.md) liste les frontières, flux et décisions à instruire ; il reste candidat et ne ratifie pas de fournisseur ni de technologie. Les décisions nécessitent ensuite leurs preuves de faisabilité et recettes adaptées.
