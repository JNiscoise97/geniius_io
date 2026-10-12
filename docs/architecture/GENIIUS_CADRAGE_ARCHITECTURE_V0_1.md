# GENIIUS — Cadrage de l’architecture V0.1

**13 octobre 2026 — candidat, préparation de l’architecture.** Entrée : [CDC V1.2 gelé](../GENIIUS_CDC_TECHNIQUE_V1_0.md), [procès-verbal](../AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md), CDCF V1.3, dictionnaire V1.3, MLD V1.1-g et contrat V1.6. Ce cadrage organise l’étude ; les choix de technologies et de dimensionnement restent à instruire.

## Contraintes déjà arrêtées

Web, Desktop et Mobile utilisent un Core commun, sans parité fonctionnelle imposée. Le serveur porte l’autorité canonique ; le fonctionnement hors ligne conserve des répliques ordinaires sous échéance et des deltas personnels. Le monolithe modulaire, la base relationnelle canonique initialement unifiée, le stockage objet séparé et les workers asynchrones sont des décisions déjà ratifiées (TECH-001 à 008), pas des choix nouveaux de cette étude.

## Frontières à concevoir

| Responsabilité logique | Contrat de frontière | Exigences |
|---|---|---|
| Identité, comptes, sessions, autorisations | Personne opératrice tous comptes, droits par fondement, décisions actuelles ; aucun accès administratif implicite | TECH-007/011/019/027 |
| Connaissance scientifique et référentiels | Versions, provenance, contraintes CP, décisions scientifiques et dépendances ; droits contrôlés avant mutation | TECH-003/018/031 |
| Documents, médias, conservation | Ingestion contrôlée, intégrité, original distinct des dérivés, disponibilité réelle et purge cohérente | TECH-006/010/012/030 |
| Espaces, projets, partages et publications | Rattachement sans droits transitifs, sélection versionnée, transferts atomiques, diffusion à droits actuels | CDC § 12 ; TECH-011/026 |
| Synchronisation et applications | Négociation de compatibilité, réception privée avant résolution, intégration serveur, retraits avant ajouts | TECH-002/005/018/025 |
| Tâches et propagation | Travail durable, identité/idempotence, direct transactionnel et transitif sans faux état à jour | TECH-013/015 |
| Recherche, index et caches | Dérivés reconstructibles, contexte/époque/échéance ; refus si fraîcheur non vérifiable | TECH-011/016 |
| Exploitation, sécurité, audit et reprise | Journaux minimisés, environnements séparés, chaîne de livraison, restauration sans ressusciter droit/contenu | TECH-020 à 024/028/030 |

Le découpage final doit préciser propriétaire des écritures, dépendances permises, transaction ou événement durable entre modules, contrat d’erreur, état exposable et règles de reprise. Il doit rester compatible avec les contraintes relationnelles du MLD.

## Flux prioritaires à démontrer

1. **Écriture scientifique** : contexte et droits actuels → contraintes et nouvelle version → marquage direct dans la transaction → travail transitif durable → sorties avec état d’impact. Un échec ne perd pas l’impact.
2. **Lecture/recherche/diffusion** : contexte → ordre V1.6 → graphe accessible → opération/pagination → nouvelle vérification aux reprises et avant sortie différée. Une révocation effective ou une échéance invalide le résultat avant exposition.
3. **Hors ligne** : réplique visible par accès ordinaire et sous échéance → delta privé → reconnexion/retraits → réception opaque sans FK de cible → résolution → intégration à droits courants ou conservation isolée pour l’auteur.
4. **Ingestion** : réception isolée → contrôle/empreinte → conservation confirmée → métadonnées canoniques → dérivés traçables. Pas de connaissance présentée comme fondée sur un fichier manquant.
5. **PRA/purge** : sauvegarde base et médias → restauration isolée → cohérence et état courant d’autorisation/effacement → refus tant que fraîcheur non démontrée → ouverture contrôlée. Le RTO inclut le retour à un service cohérent et autorisé.

## Dossiers de décision à produire

| Ordre | Dossier | Décisions / preuves attendues |
|---|---|---|
| 1 | Frontières et transactions du Core | Responsabilités d’écriture, contrats et propagation ; matrice CP → module → vérification, sans changer les invariants. |
| 2 | Autorisation et isolation | DEC-ARCH-01/05, MPD-02/03/06 ; protocole d’époque/barrière interespaces, caches, non-divulgation sous charge, P-3. |
| 3 | Synchronisation | DEC-ARCH-03/04, PAR-CDC-03/05 ; états, échéances opposables, horloge et terminal, compatibilité/reprise/delta privé. |
| 4 | Persistance et conservation | DEC-ARCH-02/06/14/15, MPD-01/05 ; intégrité, transactions base/médias, RPO médias, conservation/purge et secrets. |
| 5 | Asynchronisme et capacité | MPD-04, DEC-ARCH-07, PAR-CDC-01/02/06 ; charge, priorité, panne/rejeu, délai et coût. |
| 6 | Technologies et livraison | DEC-ARCH-11/12/13/16 ; ADR avec alternatives, contraintes, compétences, coût, licences, risque et preuves. |
| 7 | Produit et exploitation | DEC-ARCH-08/09/10/17 et autres PAR-CDC ; langues, sécurité/récupération, SLO, quotas et responsabilités nominatives. |

Les ADR doivent citer leur version amont et identifier ce qui est décidé, différé ou à démontrer. Aucun fournisseur n’est choisi sur la seule présence d’une illustration dans le CDC. Les études de technologies actuelles nécessiteront une vérification des sources officielles à ce stade.

## Sortie attendue de l’étude

Architecture candidate avec vues de composants/déploiement, contrats de flux et erreurs, décisions ADR, matrice d’exigences, budgets de ressources et coût, menace/non-divulgation, protocole de mesure et stratégie PRA. Le crash-test confronte cette architecture aux scénarios de révocation concurrente, droits des copies, saturation, perte d’un worker, longue déconnexion et restauration après purge. Le MPD vient ensuite, avec contraintes exécutables et tests adaptés ; ce cadrage ne prétend pas en apporter les preuves.
