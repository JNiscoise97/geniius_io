# PT04 — Lot F : exercice combiné de restauration

**14 octobre 2026 — quatre essais réussis ; PT04 non clos ; NF05/RPO/RTO non qualifiés.**

Montage réel des primitives A/B/E : archive DPAPI, snapshot SQLite, média, registre de purge/intention/politiques, réconciliation puis ouverture extérieure. Chaque reprise s’exécute dans un nouveau processus ; secret transmis par stdin, phases monotones et durée de tentative enregistrées.

| Cas | Expérience | Verdict |
|---|---|---|
| PT04-F01 | Archive ancienne protégée : purge actuelle et effet perdu réconciliés avant ouverture | PASS |
| PT04-F02 | Archive saine mais autorité tronquée : service fermé | PASS |
| PT04-F03 | Média altéré après restauration : porte fermée puis reprise | PASS |
| PT04-F04 | Panne après autorité avant média/ouverture : reprise complète | PASS |

Ordre exigé : fermeture → archive vérifiée → base restaurée → autorité réconciliée → média vérifié → ouverture. Une archive saine ne compense pas une autorité tronquée. Une base réconciliée ne suffit pas si le média restauré est altéré. Panne après commit de réconciliation : porte extérieure fermée, puis nouvelle reprise depuis l’archive avec un effet final unique.

| Cas/tentative | Durée observée ms | Sortie |
|---|---:|---|
| PT04-F01/1 | 193.412 | restored |
| PT04-F02/1 | 163.263 | closed |
| PT04-F03/1 | 202.837 | closed |
| PT04-F03/2 | 183.229 | restored |
| PT04-F04/1 | 197.022 | interruption |
| PT04-F04/2 | 195.972 | restored |

Ces durées incluent le démarrage Python sur un corpus minuscule ; elles ne mesurent ni un RTO représentatif ni un RPO. Aucun dernier commit récupéré/perdu d’un patrimoine réel n’est qualifié. Objectifs CDC inchangés, recette NF05 réservée.

Checkpoint/manifeste/secrets fiables injectés, profil Windows courant, stockage sur un seul poste ; pas durabilité indépendante de l’autorité, escrow, transport ou sauvegarde intersite. Média lié à keep ; les binaires/copies purgés et résidus de sauvegarde D restent éprouvés séparément. Service extérieur simulé, aucune lecture concurrente ni sécurité des anciennes sessions sur restaurations répétées qualifiée.

Total PT04 : 37 essais A–F. [Résultats et phases](RESULTATS_PT04_LOT_F.json), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul ; PER-01–07 restent ouverts.
