# Architecture GENIIUS

**13 octobre 2026 — documents candidats, architecture non gelée.**

- [Cadrage initial V0.1](GENIIUS_CADRAGE_ARCHITECTURE_V0_1.md) : baselines et ordre des dossiers.
- [Modules, contrats et transactions du Core V0.1](GENIIUS_CORE_MODULES_TRANSACTIONS_V0_1.md) : ADR-CORE-001, 14 modules, propriétaires d’écriture, 17 transactions et 13 scénarios de crash-test.
- [Matrices de responsabilités V0.1](GENIIUS_CORE_MATRICES_V0_1.md) : inventaire des 327 tables, 53 CP et 60 obligations détaillées CP-13.
- [Contrôles documentaires V0.1](CONTROLES_CORE_V0_1.json) : preuves de structure et empreintes, sans tests d’un Core implémenté.
- [Autorisations, isolation et concurrence V0.1](GENIIUS_AUTORISATIONS_ISOLATION_CONCURRENCE_V0_1.md) : ADR-CORE-002 à 004, garde canonique partagée/exclusive, époque, caches et points de divulgation ; douze scénarios spécifiés.
- [Contrôles du dossier sécurité](CONTROLES_SECURITE_V0_1.json) : références et empreintes, cinq preuves de mécanisme encore ouvertes.
- [Synchronisation, compatibilité et horloge V0.1](GENIIUS_SYNCHRONISATION_COMPATIBILITE_HORLOGE_V0_1.md) : ADR-CORE-005 à 007, sept phases, répliques/deltas distincts, compatibilité et échéance opposable ; douze scénarios spécifiés.
- [Contrôles du dossier synchronisation](CONTROLES_SYNCHRONISATION_V0_1.json) : onze obligations ST référencées et sept décisions ouvertes, aucune preuve OS ou transactionnelle revendiquée.
- [Persistance, conservation et restauration V0.1](GENIIUS_PERSISTANCE_CONSERVATION_RESTAURATION_V0_1.md) : ADR-CORE-008 à 011, cinq phases de dépôt, sept de restauration, registres de non-résurrection ; douze scénarios spécifiés.
- [Contrôles du dossier persistance](CONTROLES_PERSISTANCE_V0_1.json) : références et empreintes, sept décisions ouvertes ; RPO/RTO non mesurés.
- [Exécution asynchrone, propagation et dimensionnement V0.1](GENIIUS_ASYNCHRONE_PROPAGATION_DIMENSIONNEMENT_V0_1.md) : ADR-CORE-012 à 014, six phases, générations d’impact, admission/équité et plan de capacité ; douze scénarios spécifiés.
- [Contrôles du dossier asynchrone](CONTROLES_ASYNCHRONE_V0_1.json) : sept décisions ouvertes, MPD-04 non fixé ; aucune charge ni capacité de production mesurée.
- [Registre consolidé V0.1](GENIIUS_REGISTRE_DECISIONS_ARCHITECTURE_V0_1.md) : 64 références liées, responsables/étapes/preuves ; 62 ouvertes, une décision amont actée, une hors V1.
- [Vues de déploiement V0.1](GENIIUS_DEPLOIEMENT_V0_1.md) : ADR-CORE-015, frontières/identités, variantes gérée et exploitée par l’équipe, quatre dossiers de preuve.
- [Alternatives technologiques V0.1](GENIIUS_ALTERNATIVES_TECHNOLOGIQUES_V0_1.md) : ADR-CORE-016, comparaison sourcée, six prototypes à réaliser ; pile non ratifiée.
- [Contrôles de consolidation](CONTROLES_CONSOLIDATION_V0_1.json) : références, statuts et empreintes, sans prototype exécuté.

Sources structurées et commandes reproductibles sous `spec/validation/` : `generer_core_architecture.py`, `controler_core_architecture.py` et `core_architecture_v0_1.json`.

Les dossiers restent candidats, avec un registre unique et seize ADR proposés. Le porteur impose 100 €/mois avant abonnements, vise décembre 2026 et demande les six prototypes avant lancement commercial ; langage/hébergeur restent ouverts. Le prochain jalon réalise les prototypes PT01 à PT06 et ferme les décisions sur leurs preuves avant validation de l’architecture et du MPD ; les comparaisons ne constituent pas une pile ratifiée, un déploiement ou une estimation de budget.
