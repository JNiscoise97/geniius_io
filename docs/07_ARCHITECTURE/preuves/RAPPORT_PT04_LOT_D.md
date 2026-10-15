# PT04 — Lot D : purge, dérivés et sauvegardes

**Six scénarios réussis ; PT04 non clos ; aucun effacement forensique démontré.**

Campagne UTC : 2026-10-13T14:51:10.636979+00:00 → 2026-10-13T14:51:13.208812+00:00. OS : Windows-11-10.0.26200-SP0.

Corpus fini de trois objets liés (racine et deux copies), index/tâches associés et fichiers distincts ; un objet tiers sert de témoin de non-destruction. Registre de portée extérieur préinitialisé. Barrière fermée avant transaction canonique, fichiers retirés ensuite, réouverture après nettoyage. Interruptions de processus et restauration réelle de SQLite et fichiers de sauvegarde.

| Cas | Expérience | Verdict |
|---|---|---|
| PT04-D01 | Purge racine/copies, index/tâches/médias ; sauvegarde résiduelle déclarée | PASS |
| PT04-D02 | Panne avant commit canonique : fermeture et reprise | PASS |
| PT04-D03 | Panne après commit : médias résiduels puis reprise | PASS |
| PT04-D04 | Sauvegarde ancienne restaurée : purge réappliquée avant ouverture | PASS |
| PT04-D05 | Sauvegardes synthétiques retirées : périmètre fini sans résidu déclaré | PASS |
| PT04-D06 | Inventaire incomplet : pas de déclaration de purge complète | PASS |

Le succès opérationnel ne déclare pas disparition des sauvegardes : fixture_scope_complete reste faux tant qu’une sauvegarde connue subsiste ou que l’inventaire est incomplet. D05 retire uniquement les fichiers de sauvegarde synthétiques créés par le banc, puis constate absence de résidu dans ce périmètre déclaré. Ce booléen n’est pas un statut juridique ou une certification de purge complète du produit.

D04 restaure réellement la base et les médias anciens ; la sauvegarde porte une barrière fermée et le registre extérieur actuel réapplique les retraits avant ouverture. Registre courant et portée sont supposés fiables ; le banc ne calcule pas toute filiation ni toutes les copies possibles. Dépôts à fichiers mutualisés, clés partagées, exceptions de conservation et terminaux déconnectés non couverts.

DELETE SQLite et unlink ne démontrent pas effacement forensique des pages, WAL, fichiers temporaires, supports, snapshots ou copies externes. Aucun seuil de durée/rétention adopté ; absence de résidu vaut seulement pour les magasins visibles du corpus fini. NF05 et PER-01–07 restent ouverts.

Total PT04 : 27 essais A–D. [Résultats](RESULTATS_PT04_LOT_D.json), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul.
