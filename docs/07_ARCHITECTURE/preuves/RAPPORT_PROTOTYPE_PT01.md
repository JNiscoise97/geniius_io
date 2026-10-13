# PT01 — Clôture du périmètre prototype

**PASS_PERIMETRE_PT01 : 13/13 scénarios réussis. Clôture PT01 : True.**

La règle ratifiée le 13/10/2026 est consignée dans [DC-AUTH-01](../../04_CONTRAT_AUTORISATION/GENIIUS_AMENDEMENT_TEMPOREL_DC_AUTH_01.md). Le droit doit être valide au contrôle final Core sous gardes conservées jusqu’au commit. Le commit physique peut survenir après échéance. Toute nouvelle sortie réévalue les droits actuels.

Campagne UTC : 2026-10-13T06:25:41.030814+00:00 → 2026-10-13T06:25:59.584775+00:00.
Serveur : PostgreSQL 16.14 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit.
Image : sha256:57c72fd2a128e416c7fcc499958864df5301e940bca0a56f58fddf30ffc07777.
Conteneur retiré : True. Réseau none, aucun port publié ni montage hôte. Coût cloud engagé : 0 €.

[Résultats et traces](RESULTATS_PROTOTYPE_PT01.json). [Schéma](../../../spec/prototypes/pt01/schema.sql) et [runner](../../../spec/prototypes/pt01/run.py).

| Cas | Objet | Verdict |
|---|---|---|
| PT01-01 | Écriture avant révocation | PASS |
| PT01-02 | Révocation avant écriture | PASS |
| PT01-03 | Expiration avant contrôle final Core | PASS |
| PT01-04 | Rollback révocation/époque | PASS |
| PT01-05 | Rollback version/activité/impact/outbox/reçu | PASS |
| PT01-06 | Conflit de version concurrent | PASS |
| PT01-07 | Écritures indépendantes concurrentes | PASS |
| PT01-08 | Rôle applicatif sans contournement direct | PASS |
| PT01-09 | Idempotence et refus de réponse ancienne | PASS |
| PT01-10 | Perte de connexion et libération de garde | PASS |
| PT01-11 | Validation anticipée par SET CONSTRAINTS refusée | PASS |
| PT01-12 | Contrôle final avant échéance, commit tardif et révocation ordonnée | PASS |
| PT01-13 | Rollback après contrôle final et reprise expirée refusée | PASS |

## Preuve temporelle

- Contrôle final : 2026-10-13T06:25:54.485417+00:00.
- Échéance : 2026-10-13T06:25:56.465252+00:00.
- Horodatage de commit : 2026-10-13T06:25:56.519276+00:00.

PT01-03 refuse et annule tous les effets si l’échéance précède le contrôle final. PT01-11 force SET CONSTRAINTS sans certificat final : refus et rollback. PT01-12 injecte une pause après le contrôle final, observe zéro effet canonique depuis une autre connexion, puis accepte le commit tardif ; une révocation reste bloquée jusqu’au commit. Lecture et rejeu après révocation sont refusés. PT01-13 annule aussi le certificat et refuse une nouvelle tentative après échéance.

Le runner représente le Core de confiance. Il appelle finalize_fixture comme dernière instruction métier avant COMMIT. Les réponses SQL internes avant commit sont provisoires. Le demandeur ne possède pas le rôle SQL technique ; sa compromission n’est pas couverte. La sortie HTTP après confirmation du commit reste à éprouver dans PT02. L’injection de pause est réservée au banc.

[CE01/CE02 historiques](historique/PT01_AVANT_ARBITRAGE/RESULTATS_PROTOTYPE_PT01.json) restent des échecs de la borne physique initiale, sans reclassement rétroactif. Le timestamp PostgreSQL ne mesure pas la fin du flush WAL ni la visibilité.

## Portée de clôture

PT01-L01 est clos pour la règle ratifiée et ce corpus réduit. SEC-01 dispose de preuves SQL de garde et d’instant logique final ; transposition au moteur V1.6 complet, MPD et déploiement reste requise. Aucun gel d’architecture ni choix de pile ne découle de PT01. PT02 à PT06 restent à exécuter.

- Pas tout V1.6 ni le MLD complet ; identité limitée à des rôles PostgreSQL synthétiques.
- Instant logique du contrôle final ratifié ; aucune garantie de commit physique avant échéance.
- Orchestrateur Core simulé par Python/psql ; rôle SQL technique de confiance, pas un demandeur HTTP.
- Aucune preuve HTTP/point de divulgation, de non-divulgation temporelle ou de famine (SEC-03/04/02).
- Rôle applicatif restreint, fonctions SECURITY DEFINER à durcir/revoir en production ; pas politiques RLS de production.
- Deux connexions/processus prouvent une garde commune à la base, pas une topologie multi-hôte déployée.
- Aucun benchmark, PRA, délai MPD-04, chiffre de capacité ou totalité des prototypes exécutés.

[Contraintes différées PostgreSQL](https://www.postgresql.org/docs/16/sql-createtrigger.html) et [horodatage de commit](https://www.postgresql.org/docs/16/functions-info.html). Les verdicts viennent des exécutions consignées.
