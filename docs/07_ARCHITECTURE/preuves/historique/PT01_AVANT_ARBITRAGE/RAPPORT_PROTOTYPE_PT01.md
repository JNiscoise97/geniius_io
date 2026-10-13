# PT01 — Rapport d’écritures et révocations concurrentes

**13 octobre 2026 — prototype de faisabilité, architecture non gelée.**

**Verdict : PARTIEL_EXPIRATION_NON_RESOLUE.** 10/10 scénarios exécutés réussis. PT01 n’est pas clos intégralement.

Le porteur impose un budget de 100 €/mois avant abonnements, souhaite décembre 2026 et demande les six prototypes avant lancement. Ce banc est local : aucun service cloud payant engagé. Il ne mesure ni coût électrique/matériel, ni coût d’exploitation de production.

## Banc et preuves

- Exécution UTC : 2026-10-13T06:20:34.457031+00:00 → 2026-10-13T06:20:54.330468+00:00.
- SQL exécuté : oui.
- PostgreSQL : PostgreSQL 16.14 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit.
- Image : postgres:16-alpine, identifiant sha256:57c72fd2a128e416c7fcc499958864df5301e940bca0a56f58fddf30ffc07777.
- [Résultats, traces et empreintes](RESULTATS_PROTOTYPE_PT01.json).
- [Schéma synthétique](../../../spec/prototypes/pt01/schema.sql) et runner : `spec/prototypes/pt01/run.py` ; commande dans `spec/prototypes/pt01/README.md`.

## Scénarios et état final

| Cas | Objet | Verdict | État observé |
|---|---|---|---|
| PT01-01 | Écriture avant révocation | PASS | {"epoch": 2, "active": false, "versions": 1, "activities": 1, "outbox": 1, "receipts": 1, "impacted": true, "object_version": 1} |
| PT01-02 | Révocation avant écriture | PASS | {"epoch": 2, "active": false, "versions": 0, "activities": 0, "outbox": 0, "receipts": 0, "impacted": false, "object_version": 0} |
| PT01-03 | Expiration avant validation différée de commit | PASS | {"epoch": 1, "active": true, "versions": 0, "activities": 0, "outbox": 0, "receipts": 0, "impacted": false, "object_version": 0} |
| PT01-04 | Rollback révocation/époque | PASS | {"epoch": 1, "active": true, "versions": 1, "activities": 1, "outbox": 1, "receipts": 1, "impacted": true, "object_version": 1} |
| PT01-05 | Rollback version/activité/impact/outbox/reçu | PASS | {"epoch": 1, "active": true, "versions": 0, "activities": 0, "outbox": 0, "receipts": 0, "impacted": false, "object_version": 0} |
| PT01-06 | Conflit de version concurrent | PASS | {"epoch": 1, "active": true, "versions": 1, "activities": 1, "outbox": 1, "receipts": 1, "impacted": true, "object_version": 1} |
| PT01-07 | Écritures indépendantes concurrentes | PASS | {"epoch": 1, "active": true, "versions": 2, "activities": 2, "outbox": 2, "receipts": 2, "impacted": true, "object_version": 1} |
| PT01-08 | Rôle applicatif sans contournement direct | PASS | {"epoch": 1, "active": true, "versions": 0, "activities": 0, "outbox": 0, "receipts": 0, "impacted": false, "object_version": 0} |
| PT01-09 | Idempotence et refus de réponse ancienne | PASS | {"epoch": 2, "active": false, "versions": 1, "activities": 1, "outbox": 1, "receipts": 1, "impacted": true, "object_version": 1} |
| PT01-10 | Perte de connexion et libération de garde | PASS | {"epoch": 2, "active": false, "versions": 0, "activities": 0, "outbox": 0, "receipts": 0, "impacted": false, "object_version": 0} |

## Expiration et contre-épreuve

**PT01-CE01 : CONTRE_EXEMPLE_OBSERVE.** La connexion applicative force `SET CONSTRAINTS ALL IMMEDIATE`, attend l’échéance puis commite. Le contrôle différé a été effectué avant expiration, mais la version a été commise après.

- Validation : 2026-10-13T06:20:48.552879+00:00.
- Échéance : 2026-10-13T06:20:50.520691+00:00.
- Timestamp de commit PostgreSQL : 2026-10-13T06:20:50.574137+00:00.

Cette contre-épreuve est un échec de la garantie de borne de commit pour cette implémentation, et non un onzième test de conformité réussi. Le contrôle différé seul est écarté comme preuve suffisante de SEC-01. Les traces consignent les requêtes et l’ordre ; les timestamps proviennent du serveur.

**PT01-CE02 : CONTRE_EXEMPLE_OBSERVE.** Une écriture en autocommit, sans `BEGIN` ni `SET CONSTRAINTS`, est retardée après le contrôle par un trigger injecté par le propriétaire du banc. Cette injection simule une pause serveur ; le rôle applicatif ne peut pas créer ce trigger.

- Validation : 2026-10-13T06:20:50.911543+00:00.
- Échéance : 2026-10-13T06:20:52.89638+00:00.
- Timestamp de commit PostgreSQL : 2026-10-13T06:20:53.915397+00:00.

Cela réfute la suffisance de l’autocommit comme correction. Cela ne démontre pas une attaque permettant à l’application de créer des triggers. Une borne dure ne découle pas d’un dernier contrôle SQL, même non piloté par le client.

La proposition de résolution et la décision normative préalable sont documentées dans [le dossier temporel](../GENIIUS_ARCHITECTURE_PT01_RESOLUTION_TEMPORELLE.md).

## Couverture et limites

AC01/02 : ordre écriture/révocation sous garde relationnelle partagée/exclusive ; AC07 : effets et époque annulés avec leur transaction ; AC08 : connexions/processus distincts utilisant la même garde de base, sans preuve d’une topologie multi-hôte. AC03 : expiration avant validation différée testée, mais borne au commit non résolue. Le détail ne vaut couverture du modèle V1.6 complet.

Le schéma utilise un droit binaire synthétique et des rôles SQL, pas tout le MLD ni le moteur complet d’identité/autorisation. Pas de preuve de réponse HTTP, de rendu/échéance pendant flux, de non-divulgation temporelle, de famine, de débit/capacité ou de PRA. Le rôle non propriétaire ne contourne pas les écritures directes testées ; les fonctions SECURITY DEFINER restent à durcir/revoir pour le produit.

Les scénarios de panne et concurrence sont pertinents pour sélectionner une primitive transactionnelle ; ils ne suffisent pas à ratifier PostgreSQL, une pile ou les délais de production. Les autres prototypes PT02 à PT06 ne sont pas réputés exécutés.

## Suite nécessaire

PT01-L01 / SEC-01 : définir et démontrer le point de linéarisation temporel exact compatible avec le contrat gelé, éliminer le contournement de validation précoce et traiter le délai validation→commit/visibilité. Aucune tolérance de délai ni modification métier du contrat n’est adoptée. Une solution éventuelle doit être testée par contre-épreuves avant clôture de PT01.

Les travaux indépendants PT02–PT06 peuvent se préparer, mais le gel d’architecture reste interdit tant qu’une garantie P0 demeure non démontrée. Le budget reste plafonné à 100 €/mois et l’échéance décembre est un objectif, sans promesse de lancement avant verdicts.

## Sources techniques consultées

PostgreSQL documente le déclenchement différé et la possibilité de forcer son exécution : [CREATE TRIGGER](https://www.postgresql.org/docs/current/sql-createtrigger.html). Le timestamp de commit utilisé par la contre-épreuve nécessite l’option `track_commit_timestamp`, activée sur ce seul banc : [fonctions de commit](https://www.postgresql.org/docs/current/functions-info.html). Ces sources expliquent les primitives ; la conclusion sur notre implémentation vient des résultats ci-dessus.
