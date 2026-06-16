[← Sommaire](README.md) · [← Précédent : Echo](05-echo.md)

# Annexe — Points critiques transverses à ne pas sous-estimer

Ces éléments ressortent de l'analyse du code existant et ne rentrent pas naturellement dans une seule app — ils méritent d'être suivis comme des **risques de projet**, pas seulement des tâches.

1. **Dette de modèle de données (Rebond)** : la coexistence de 2 modèles de transcription (legacy vs versionné) est le risque n°1 — tout développement sur la transcription avant la clôture de [3.2](03-rebond.md#32-transcription-des-actes-détat-civil)/[3.3](03-rebond.md#33-mentions-marginales)/[3.11.4](03-rebond.md#3114-nettoyage-du-legacy-structurel) a un coût de double-maintenance.

2. **Tree est le maillon le plus faible en avancement mais le plus central** : tant que [1.8](01-tree.md#18-réconciliation-multi-sources-réception-rebondjournalconnect) (réconciliation multi-sources) n'existe pas, Rebond, Journal et Connect produisent de la donnée qui n'a nulle part où aller proprement.

3. **Echo est un angle mort stratégique** : sans décision ([5.1](05-echo.md#51-cadrage-stratégique-préalable-obligatoire)), c'est du code qui consomme de l'attention sans rattachement à un objectif produit — soit on le rattache explicitement à un besoin (offline Journal/Connect), soit on documente l'arrêt.

4. **RGPD n'est pas une fonctionnalité d'app, c'est une contrainte transverse ([0.5](00-geniius-io-transverse.md#05-conformité-légale--protection-des-données))** : Connect collecte des données sur des personnes vivantes (y compris via des tiers — profils délégués [4.2.3](04-connect.md#423-profils-délégués), signalements [4.6](04-connect.md#46-contribution-généalogique-participant)) ; sans cadre [0.5](00-geniius-io-transverse.md#05-conformité-légale--protection-des-données) livré en amont, chaque app réinvente sa propre politique de manière incohérente.

5. **Volume du corpus Rebond** : les opérations de fusion/migration ([3.5.2.2](03-rebond.md#352-détection-et-traitement-des-doublons), [3.3.2.1](03-rebond.md#332-migration-des-mentions-marginales-legacy), [3.11.4](03-rebond.md#3114-nettoyage-du-legacy-structurel)) portent sur des centaines de milliers de lignes — chaque DoD de ce type doit inclure un plan de rollback, pas seulement un critère de succès.

---

[← Sommaire](README.md) · [← Précédent : Echo](05-echo.md)
