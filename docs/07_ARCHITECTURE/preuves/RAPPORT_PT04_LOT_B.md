# PT04 — Lot B : anomalies et politiques avant reprise

**Six scénarios réussis ; PT04 partiel, non clos.**

Campagne UTC : 2026-10-13T13:47:31.893289+00:00 → 2026-10-13T13:47:34.256269+00:00. OS : Windows-11-10.0.26200-SP0.

Transactions SQLite WAL/FULL et processus distincts. Checkpoint de fixture couvre intentions, purges et politiques actuelles ; une politique omise à génération identique invalide l’empreinte et refuse la reprise. Barrière fermée durablement avant toute réconciliation.

| Cas | Expérience | Verdict |
|---|---|---|
| PT04-B01 | Effet contradictoire : anomalie et service fermé | PASS |
| PT04-B02 | Effet perdu devenu inadmissible : pas de reconstruction | PASS |
| PT04-B03 | Restriction actuelle appliquée avant ouverture et ancien index retiré | PASS |
| PT04-B04 | Fermeture globale : aucune cible visible et ancienne session refusée | PASS |
| PT04-B05 | Politique omise à génération identique : refus de fraîcheur | PASS |
| PT04-B06 | Panne avant commit des politiques : barrière puis reprise | PASS |

Effet contradictoire : la transaction est annulée, l’effet existant n’est pas écrasé, anomalie effect_conflict et service fermé. Effet perdu devenu inadmissible : aucun nouvel effet, anomalie effect_not_reconstructible et fermeture. Les données anciennes peuvent rester physiquement en base après rollback, mais la barrière interdit leur consultation. Aucun workflow de résolution opérateur n’est livré par ces essais.

Sans anomalie, restrictions/fermeture et retrait des index concernés sont publiés avec l’ouverture dans la même transaction applicative. Une nouvelle époque invalide l’ancienne session synthétique. Le service peut être ouvert tout en n’accordant aucune donnée après fermeture globale : open est une barrière de cohérence, pas une permission métier. Panne avant commit : anciennes données conservées sous barrière, puis reprise valide.

Politiques allow/deny et fermeture globale simplifiées, pas traduction exhaustive des actes légaux ou du contrat d’autorisation. Ordonnancement global des politiques, nouvelles protections et droits complets restent à qualifier. Checkpoint fiable injecté ; même poste et disque, aucune durabilité indépendante démontrée. Pas de transport, secrets/chiffrement, médias volumineux ou RPO/RTO représentatifs ; NF05 et PER-01–07 restent ouverts.

Total PT04 : 14 essais A/B. [Résultats](RESULTATS_PT04_LOT_B.json), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul.
