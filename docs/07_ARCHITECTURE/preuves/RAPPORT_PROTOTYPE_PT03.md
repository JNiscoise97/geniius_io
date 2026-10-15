# PT03 — Lot A : réception durable et rejeu

**Huit scénarios réussis ; PT03 partiel, non clos.**

Campagne UTC : 2026-10-13T10:46:36.013394+00:00 → 2026-10-13T10:46:40.873506+00:00. OS : Windows-11-10.0.26200-SP0. SQLite : 3.50.4.

Journal privé et serveur synthétique dans deux fichiers distincts, WAL et synchronous FULL. Chaque commande métier est exécutée dans un nouveau processus Python. Les interruptions avant/après commit utilisent os._exit(73), sans fermeture normale de connexion. Les états sont relus par le parent puis les commandes rejouées. Quatre processus concurrents soumettent la même réception, puis la même intégration.

| Cas | Expérience | Verdict |
|---|---|---|
| PT03-A01 | Panne avant commit réception | PASS |
| PT03-A02 | Commit réception puis accusé perdu | PASS |
| PT03-A03 | Panne avant commit effet | PASS |
| PT03-A04 | Commit effet puis réponse perdue | PASS |
| PT03-A05 | Origine identique avec delta différent | PASS |
| PT03-A06 | Rejeux concurrents en quatre processus | PASS |
| PT03-A07 | Accusé intégré réévalué après retrait et contexte distinct | PASS |
| PT03-A08 | Réception sans FK cible ; cible cachée/absente générique | PASS |

Les réceptions ne portent aucune FK de cible ; seules les intégrations admissibles créent un effet avec référence validée. Une origine à empreinte différente ne remplace pas le delta reçu. Le statut technique received ne confirme jamais une intégration ; le rejeu d’un résultat intégré est réévalué sous la permission courante. Le journal local de l’auteur reste identique dans les huit essais.

Le contrôle d’accès est une permission synthétique, les identités des paramètres de banc. Aucune authentification ni socket HTTP, aucun moteur complet d’autorisation n’est démontré. La séparation des fichiers est logique et non cryptographique.

Limites : crash de processus, pas coupure électrique ; disque matériel et système de fichiers non qualifiés. Aucun chiffrement, magasin de clés, test veille/hibernation, horloge ni anti-rollback. SQLite est un outil de banc, aucun choix de pile. Les lots B–F restent à exécuter ; SYN-01–07 restent ouverts.

[Résultats et traces](RESULTATS_PROTOTYPE_PT03.json), [protocole](../../../spec/prototypes/pt03/PROTOCOL.md). Coût cloud : 0 €.
