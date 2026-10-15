# PT03 — Lot C : compatibilité et migration

**Sept scénarios réussis ; PT03 reste partiel, non clos.**

Campagne UTC : 2026-10-13T12:50:09.756493+00:00 → 2026-10-13T12:50:14.622830+00:00. OS : Windows-11-10.0.26200-SP0. SQLite : 3.50.4.

Commandes exécutées dans des processus Python distincts. Barrière consultable fermée durablement avant migration ; DDL, conversions et version de schéma dans une transaction SQLite WAL/FULL. Journal original conservé avec triggers interdisant modification et suppression. Conversion dans une table séparée, empreinte de source, identifiant du convertisseur et absence explicite de validation scientifique.

| Cas | Expérience | Verdict |
|---|---|---|
| PT03-C01 | Conversion déterministe avec original et provenance | PASS |
| PT03-C02 | Référentiel scindé laissé en attente | PASS |
| PT03-C03 | Champ inconnu conservé sans conversion permissive | PASS |
| PT03-C04 | Client incapable : consultation fermée, journal conservé | PASS |
| PT03-C05 | Panne avant commit DDL et conversion, reprise | PASS |
| PT03-C06 | Commit migration puis réponse perdue, rejeu | PASS |
| PT03-C07 | SQLITE_FULL réel par plafond de pages, rollback puis reprise | PASS |

Référentiel scindé et champ inconnu : aucun choix automatique ni élimination de champ ; original lisible conservé, conversion en attente. Client incapable d’appliquer les protections : consultation fermée même après migration. Une migration réussie ne rouvre la réplique qu’après réconciliation synthétique explicite.

SQLITE_FULL est réellement produit avec PRAGMA max_page_count et allocation de 2 Mio ; le disque physique reste disponible. La transaction contenant DDL et conversions est annulée, puis rejouée dans un processus sans cette limite. Les interruptions os._exit avant/après commit attestent rollback ou durabilité sur crash de processus, pas résistance à coupure électrique.

Versions client/protocole/schéma/référentiel et termes synthétiques ; aucune fenêtre de support ou règle scientifique produit ratifiée. Pas de transport ni négociation authentifiée, chiffrement, horloge ou anti-rollback. SYN-01–07 restent ouverts. Lots D–F à exécuter. Total : 21 essais PT03 distincts (A : 8 ; B : 6 ; C : 7).

[Résultats et traces](RESULTATS_PT03_LOT_C.json), [banc](../../../spec/prototypes/pt03/README.md). Coût cloud nul.
