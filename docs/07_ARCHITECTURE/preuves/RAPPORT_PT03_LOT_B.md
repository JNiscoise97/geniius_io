# PT03 — Lot B : retraits et appareil révoqué

**Six scénarios réussis ; PT03 reste partiel, non clos.**

Campagne UTC : 2026-10-13T12:09:09.113786+00:00 → 2026-10-13T12:09:16.823076+00:00. OS : Windows-11-10.0.26200-SP0. SQLite : 3.50.4.

Chaque commande repart dans un nouveau processus. Fermeture du magasin consultable persistée avant application des retraits. Suppression de réplique, miniatures/index et accusé de génération dans une transaction locale ; journal privé indépendant. Interruptions os._exit avant/après commit, puis réouverture et rejeu.

| Cas | Expérience | Verdict |
|---|---|---|
| PT03-B01 | Panne avant commit retraits, barrière fermée et reprise | PASS |
| PT03-B02 | Commit retraits puis accusé perdu, rejeu sans résurrection | PASS |
| PT03-B03 | Page ancienne après changement de génération refusée | PASS |
| PT03-B04 | Retraits limités aux cibles délivrées, sans motif ni oracle | PASS |
| PT03-B05 | Révocation entre préparation et application, métier refusé | PASS |
| PT03-B06 | Delta reçu avant révocation, intégration refusée et journal intact | PASS |

Les retraits ne visent que le corpus déjà délivré et ne portent aucun motif. Un changement de génération invalide pages et retraits préparés ; une nouvelle réconciliation est exigée. Le canal de retrait peut fermer une réplique d’appareil révoqué, sans autoriser pages, réception ou intégration métier ; il est simulé, son authentification/anti-rejeu restent ouverts. Les deltas privés sont inchangés dans les six cas.

Limite de faisabilité : garde SQLite serveur conservée pendant le commit SQLite local, sans réseau. Deux bases distinctes ne forment pas une transaction distribuée ; aucun commit atomique entre serveur et client n’est revendiqué. Le registre des cibles déjà délivrées est préinitialisé ; perte de la connexion entre remise locale et publication du registre n’est pas qualifiée. Cette réserve devra être traitée par protocole de remise/accusé ou fermeture de périmètre avant SYN-07.

Pas de chiffrement, identité produit, test d’horloge, anti-rollback ou interruption électrique. SQLite est un outil de banc. SYN-01–07 restent ouverts. Lots C–F à exécuter ; [lot A](RAPPORT_PROTOTYPE_PT03.md) : huit cas passants, soit quatorze essais PT03 distincts au total.

[Résultats et traces](RESULTATS_PT03_LOT_B.json), [sources et commandes](../../../spec/prototypes/pt03/README.md). Coût cloud nul.
