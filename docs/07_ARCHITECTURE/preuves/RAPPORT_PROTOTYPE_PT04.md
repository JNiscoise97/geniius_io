# PT04 — Lot A : autorité et restauration sous barrière

**Huit scénarios réussis ; PT04 partiel, non clos ; NF05 non qualifié.**

Campagne UTC : 2026-10-13T13:30:34.429544+00:00 → 2026-10-13T13:30:37.444669+00:00. OS : Windows-11-10.0.26200-SP0. SQLite : 3.50.4.

Transactions SQLite WAL/FULL, snapshots sauvegardés/restaurés via backup, commandes dans de nouveaux processus. Fermeture persistée avant contrôle ; ouverture seulement après comparaison du registre à un checkpoint courant puis réapplication des purges et réconciliation des effets dans la transaction applicative. Intention, effet canonique et accusé sont trois frontières distinctes ; interruptions réelles os._exit après intention ou effet.

| Cas | Expérience | Verdict |
|---|---|---|
| PT04-A01 | Purge actuelle avant ouverture du snapshot ancien | PASS |
| PT04-A02 | Autorité absente : fermeture | PASS |
| PT04-A03 | Autorité restaurée ancienne : checkpoint courant refuse | PASS |
| PT04-A04 | Registre tronqué à génération identique : fermeture | PASS |
| PT04-A05 | Intention durable sans effet : reconstruction unique | PASS |
| PT04-A06 | Effet commis sans accusé : effet reconnu sans doublon | PASS |
| PT04-A07 | Effet perdu malgré reçu : reconstruction et rejeu | PASS |
| PT04-A08 | Panne de réconciliation : barrière puis reprise | PASS |

Le registre est comparé intégralement par empreinte et génération au checkpoint. Le cas A04 retire une purge en gardant la génération : le service reste fermé. Le cas A03 restaure une ancienne autorité SQLite alors que le checkpoint courant reste extérieur. Ce témoin est fourni par l’orchestrateur du banc, pas un mécanisme de confiance autonome.

A07 restaure réellement la base applicative avant un effet dont l’intention et le reçu restent dans le registre extérieur. La reprise reconstruit l’effet, puis le rejeu ne crée aucun doublon. A06 retrouve un effet commis avant perte de l’accusé ; A05 complète une intention dont l’effet n’avait pas encore été commis. Ces effets sont déterministes et locaux ; aucune nouvelle exécution aveugle d’un paiement ou d’une notification externe n’est qualifiée.

La politique candidate ferme la reprise sur conflit d’effet ou reconstruction non admissible, mais ces deux branches ne sont pas encore éprouvées dans ce lot. Les restrictions/fermetures complètes, secrets indisponibles et sauvegardes compromises restent également à tester.

Limites : checkpoint/droits fiables injectés, fichiers sur même poste, pas de domaines de panne indépendants ou de signature. Retour simultané de toutes les données et du témoin non couvert. Chiffrement, clés, médias, capacité et RPO/RTO représentatifs non éprouvés. Les objectifs CDC restent ouverts à recette ; aucun résultat NF05 acquis. PER-01–07 restent ouverts.

[Résultats et traces](RESULTATS_PROTOTYPE_PT04.json), [protocole initial](../../../spec/prototypes/pt04/PROTOCOL.md), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul.
