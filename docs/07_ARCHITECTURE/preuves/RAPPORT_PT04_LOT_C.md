# PT04 — Lot C : dépôt documentaire et cohérence base/média

**Sept scénarios réussis ; PT04 partiel, non clos ; NF05 non qualifié.**

Campagne UTC : 2026-10-13T14:43:59.133263+00:00 → 2026-10-13T14:44:02.594777+00:00. OS : Windows-11-10.0.26200-SP0.

Fichiers réels synthétiques et métadonnées SQLite WAL/FULL. Écriture de staging, flush/fsync, vérification taille/empreinte et publication par remplacement local ; métadonnées commises ensuite, confirmation après commit seulement. Commandes dans de nouveaux processus, interruptions os._exit aux quatre frontières. Aucune transaction atomique entre fichier et base n’est revendiquée.

| Cas | Expérience | Verdict |
|---|---|---|
| PT04-C01 | Fichier partiel : aucune confirmation puis reprise | PASS |
| PT04-C02 | Média publié avant base : orphelin repris | PASS |
| PT04-C03 | Panne avant commit métadonnées : reprise unique | PASS |
| PT04-C04 | Commit base puis accusé perdu : rejeu | PASS |
| PT04-C05 | Média corrompu : consultation et dépôt refusés | PASS |
| PT04-C06 | Média perdu : indisponibilité détectée puis réparation | PASS |
| PT04-C07 | Identifiant réutilisé avec contenu différent : conflit sans écrasement | PASS |

Le média publié sans métadonnées est un orphelin récupérable : le rejeu valide son intégrité et complète la base. Après commit avec réponse perdue, le même dépôt est confirmé sans duplication. Un staging partiel n’est jamais déclaré disponible. La consultation vérifie aussi présence, taille et empreinte du média : une ligne en base ne suffit pas.

Corruption : refus de consultation et refus de réemploi du fichier ; pas de remplacement silencieux. Perte : consultation indisponible, puis réparation depuis la source synthétique disponible et fiable. Un autre contenu sous le même identifiant est refusé avant écrasement. Procédure de réparation avec source perdue et restauration de stockage objet non couvertes.

fsync et renommage local ne qualifient pas le matériel ni une coupure électrique. Manifeste et autorisation de fixture ; pas authentification, transport, concurrence entre dépôts, chiffrement, stockage objet ou gros volume. Le contrôle à la lecture n’atteste pas une garde pendant remise réseau ; réserves PT02/SEC-03 maintenues. RPO médias et NF05 restent non qualifiés, PER-01–07 ouverts.

Total PT04 : 21 essais A/B/C. [Résultats](RESULTATS_PT04_LOT_C.json), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul.
