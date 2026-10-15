# PT04 — Persistance, conservation et restauration

13 octobre 2026. **Protocole préparé, non exécuté ; PT04 non clos.** Prérequis : PT01–PT03 clos sur leurs périmètres réduits. [Dossier persistance](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_06_PERSISTANCE_CONSERVATION_RESTAURATION.md), PR01–12, PER-01–07. Réserves PT03-R01/R02/R04 conservées ; le protocole réseau complet ne sera pas déclaré qualifié par un seul exercice de stockage.

## Premier lot : autorité extérieure et barrière de restauration

Un snapshot applicatif ancien pourra être restauré réellement. L'autorité extérieure actuelle contiendra purges, restrictions, fermetures et reçus d'effets ; la réplique restaurée reste fermée tant que complétude et fraîcheur de cette autorité ne sont pas prouvées. Une génération plus grande dans la seule base restaurée ne prouve pas ces propriétés.

| Expérience préspécifiée | Attendu |
|---|---|
| Snapshot applicatif antérieur à une purge, registre actuel disponible | Purge réappliquée avant lecture, indexation, tâches ou réouverture. |
| Registre extérieur absent, tronqué ou antérieur au checkpoint attendu | Service fermé ; pas de compromis pour tenir le RTO. |
| Restauration simultanée de base et registre à une ancienne génération | Refus si aucune référence actuelle extérieure ne prouve la fraîcheur. Checkpoint « fiable » injecté déclaré comme tel, jamais preuve de sa propre persistance. |
| Panne après intention durable, avant effet canonique | Reprise réconcilie l'intention avec l'état réel ; aucune fausse confirmation. |
| Panne après commit canonique, avant accusé dans registre | Retrouver l'effet ou déclarer anomalie sous barrière ; aucune nouvelle exécution aveugle. |
| Effet passé perdu par restauration, reçu encore présent | Reconstruire l'effet de manière admissible ou déclarer une anomalie récupérable ; « déjà intégré » seul ne répare pas un effet perdu. |
| Registre/empreinte/manifeste compromis ou secret indisponible | Refus de réouverture jusqu'à preuve d'intégrité et récupération contrôlée. |

Les essais interrompront réellement des processus aux frontières nommées, puis reliront les supports durables. Le montage pourra commencer par SQLite de banc et évoluer vers PostgreSQL local isolé si nécessaire ; aucune pile ratifiée. Des magasins/fichiers distincts sur le même disque ne constituent pas des domaines de panne indépendants. La durabilité d'une autorité/checkpoint extérieur, son accès, ses copies et son anti-retour restent à démontrer physiquement.

## Lots complémentaires et portée

- Dépôt documentaire : objets/médias/manifeste, confirmation seulement après durabilité, intégrité et transaction admissible ; fichiers incomplets/orphelins récupérables.
- Purge et conservation : portée canonique, copies, dérivés, index, tâches et sauvegardes ; aucun statut « purge complète » sur la seule disparition d'une ligne.
- Clés et sauvegardes : protection réelle, secrets séparés, perte/récupération et rotation ; réutiliser DPAPI seulement comme preuve Windows ciblée, pas comme PRA multiplateforme.
- Exercice de restauration : étapes R01–R07, génération/sessions invalidées, droits actuels, cohérence métier avant ouverture ; publier chronologie, anomalies, volumes et coûts.

RPO structuré ≤ 5 minutes et RTO ≤ 4 heures hérités du CDC restent des objectifs. Un minuscule corpus restauré rapidement ne qualifie pas NF05 sur le patrimoine cible. Les actes de purge et de fermeture ne bénéficient pas d'une perte admissible de cinq minutes. RPO binaires et périmètre de service rétabli restent à fixer dans leurs décisions propriétaires.

**Conditions de preuve :** résultats par PR, supports et OS, sources/empreintes, état avant/après panne/restauration, frontière d'ouverture et erreurs publiées. Pas de PASS par omission ; témoins confiants injectés explicitement déclarés. Clôture réduite uniquement sur mécanismes éprouvés, PER-01–07 et recette réelle réservées. Aucun service payant ou suppression des conteneurs/fichiers existants ; budget préalable de 100 €/mois maintenu.
