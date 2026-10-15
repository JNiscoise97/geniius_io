# PT03 — Lot F : reconstruction et reprise binaire

**Huit scénarios réussis ; PT03 partiel, non clos.**

Campagne UTC : 2026-10-13T13:08:45.093812+00:00 → 2026-10-13T13:08:53.606515+00:00. OS : Windows-11-10.0.26200-SP0.

Transactions SQLite WAL/FULL dans des processus distincts ; snapshots SQLite réellement sauvegardés/restaurés. Barrière locale fermée durablement avant reconstruction, purge serveur réappliquée depuis un registre extérieur puis publication atomique de la réplique et du curseur. Journal propre conservé ; reçu durable extérieur évite un nouvel effet au rejeu.

| Cas | Expérience | Verdict |
|---|---|---|
| PT03-F01 | Curseur ancien : purge avant reconstruction | PASS |
| PT03-F02 | Panne de reconstruction : barrière puis reprise | PASS |
| PT03-F03 | Serveur restauré avant purge : registre extérieur et reçu empêchent résurrection/double effet | PASS |
| PT03-F04 | Panne avant commit chunk, reprise | PASS |
| PT03-F05 | Chunk durable et accusé perdu, rejeu | PASS |
| PT03-F06 | Chunk corrompu refusé puis reprise saine | PASS |
| PT03-F07 | Manifeste global incohérent : disponibilité refusée | PASS |
| PT03-F08 | Réseau non autorisé : transfert différé puis reprise | PASS |

Le banc ordonne explicitement une reconstruction depuis un curseur synthétique ancien ; il ne qualifie ni délai de rétention ni détection d’expiration de curseur signé. F03 restaure le serveur avant la purge mais conserve le registre de purge/reçus extérieur. Restaurer également ce registre n’est pas couvert : protection et restauration de l’autorité persistante relèvent de PT04. Droits et génération sont réduits aux fixtures, aucune orchestration distribuée complète n’est revendiquée.

Trois chunks synthétiques sont validés individuellement et stockés durablement avant accusé. Un rejeu ne duplique pas un chunk. L’original n’est publié qu’après présence de tous les chunks, validation de leurs empreintes et validation de l’empreinte globale. Pannes os._exit avant/après commit, reprise dans un nouveau processus ; corruption et manifeste global incohérent refusés.

Manifeste supposé fiable, authenticité non éprouvée. Réseau autorisé/inadmissible injecté, pas détection OS. Données minuscules stockées en BLOB SQLite, pas stockage objet, gros fichiers, débit ou reprise HTTP qualifiés. Pas de chiffrement dans ce lot ni qualification de coupure électrique.

Total : 47 essais A–F, incluant E07 comme contre-épreuve de fraîcheur. Tous les lots ont un périmètre exécuté, mais la qualification globale reste partielle : montage entre lots, chiffrement complet, identité/canal, horloge OS, magasin de clés multiplateforme et restauration du registre réservés. SYN-01–07 restent ouverts ; PT03 non clos.

[Résultats et traces](RESULTATS_PT03_LOT_F.json), [banc](../../../spec/prototypes/pt03/README.md). Coût cloud nul.
