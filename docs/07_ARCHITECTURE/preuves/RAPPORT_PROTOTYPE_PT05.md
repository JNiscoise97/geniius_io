# PT05 — Lot A : outbox, rejeux et baux

**14 octobre 2026 — neuf scénarios réussis ; PT05 partiel, non clos.**

Campagne UTC : 2026-10-14T10:29:26.738512+00:00 → 2026-10-14T10:29:41.327207+00:00. OS : Windows-11-10.0.26200-SP0. SQLite : 3.50.4.

Commit métier/outbox dans une même transaction SQLite WAL/FULL ; file synthétique dans une autre base. Publication commise avant accusé d’outbox, consommation répétable, task/effect/receipt identifiés par origine. Commandes dans des processus distincts, os._exit aux frontières, deux processus finalisant concurremment.

| Cas | Expérience | Verdict |
|---|---|---|
| PT05-A01 | Transaction métier/outbox annulée : aucun travail publié | PASS |
| PT05-A02 | Commit métier puis dispatcher perdu : travail retrouvé | PASS |
| PT05-A03 | Publication durable et accusé perdu : livraison rejouée | PASS |
| PT05-A04 | Effet commis puis réponse perdue : checkpoint rejoué | PASS |
| PT05-A05 | Bail expiré et reprise : ancienne tentative refusée | PASS |
| PT05-A06 | Annulation avant finalisation : succès ancien refusé | PASS |
| PT05-A07 | Deux finalisations concurrentes : un effet | PASS |
| PT05-A08 | Origine répétée avec empreinte différente : conflit | PASS |
| PT05-A09 | Autorité retirée pendant travail : finalisation refusée | PASS |

Chaque prise de bail augmente un jeton de tentative ; finalisation contrôle atomiquement jeton, statut, échéance et autorité courante. À l’échéance exacte, ancienne tentative refusée ; reprise produit un jeton supérieur, ancienne tentative reste refusée. Effet, reçu et statut final sont commis ensemble. Le rejeu d’un résultat déjà finalisé ne crée pas un second effet. Annulation incrémente le jeton ; retrait d’autorité refuse aussi une finalisation.

Les origines sont comparées au contenu exact synthétique ; une même origine avec un contenu différent provoque conflit à publication/consommation. Aucun broker exactly-once revendiqué : la file est SQLite et la livraison répétable. La frontière annulée ne publie aucun travail ; le dispatcher retrouve l’outbox après commit ou perte de l’accusé.

Temps serveur injecté, bail de dix unités du banc ; pas durée produit ou mesure d’horloge matérielle. Autorité booléenne, pas moteur complet d’autorisations. Renouvellement, suspension, effets partiels, restauration des jetons et effets externes non qualifiés. Pas charge, quotas/équité ni capacité de production mesurés. ASY-01–07/MPD-04 restent ouverts.

[Résultats et traces](RESULTATS_PROTOTYPE_PT05.json), [banc](../../../spec/prototypes/pt05/README.md). Coût cloud nul.
