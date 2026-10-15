# PT06 — Lot C : livraison et rollback compatibles

**14 octobre 2026 — sept essais réussis ; PT06 non clos, déploiement de production non qualifié.**

Artefacts JSON versionnés contrôlés par SHA256 contre un manifeste de confiance injecté. Barrière persistée avant activation, migration additive DDL/version dans une transaction SQLite WAL/FULL. Processus distincts, interruptions os._exit avant/après commit de migration, reprise depuis état durable.

| Cas | Expérience | Verdict |
|---|---|---|
| PT06-C01 | Activation versionnée et migration conservant données | PASS |
| PT06-C02 | Panne avant commit DDL : rollback et reprise | PASS |
| PT06-C03 | Commit schéma puis panne avant activation : reprise | PASS |
| PT06-C04 | Rollback ancienne version incompatible refusé | PASS |
| PT06-C05 | Rollback compatible sans downgrade/restauration des données | PASS |
| PT06-C06 | Autorité retirée : rollback conserve génération et refus | PASS |
| PT06-C07 | Artefact altéré : activation refusée sans remplacement | PASS |

v1 est incompatible avec le schéma 2 et les protections courantes : rollback refusé et porte fermée. v1.1 est explicitement déclarée compatible dans le manifeste de fixture : activation sans downgrade ni restauration des données. Contributions et contenus initiaux conservés ; génération de protection matérialisée depuis l’autorité extérieure actuelle.

C06 conserve allowed=0/génération 2 après rollback, sans restaurer de droits depuis un artefact. La porte technique ouverte indique compatibilité/cohérence et n’accorde pas un accès scientifique ; aucune route de consultation n’est exécutée dans ce lot. La preuve porte sur l’autorité conservée, pas sur toute la politique du Core.

Manifestes/checksums ne constituent pas une signature ou chaîne de confiance autonome. Compatibilité déclarée de fichiers JSON, pas test d’un binaire ancien, CI/CD, supply chain, traffic shifting ou déploiement distant. Migration additive seulement, sans charge/lectures concurrentes, migration online ou schéma MPD complet. Fenêtre de support, protocole d’activation et responsables produit restent à qualifier.

Total PT06 : 22 essais A–C. [Résultats](RESULTATS_PT06_LOT_C.json), [banc](../../../spec/prototypes/pt06/README.md). Coût cloud nul. Accessibilité, export/récupération et alternatives/exploitation restent à traiter.
