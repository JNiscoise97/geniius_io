# CDC technique V1.2 — Référentiel unique de traçabilité et recettes

**Statut : référentiel documentaire gelé le 13/10/2026, recettes non exécutées.** Partie intégrante du CDC V1.2 gelé ; procès-verbal dans `docs/06_CDC_TECHNIQUE/preuves/PROCES_VERBAL_GEL_CDC_V1_2.md`. Source structurée : `spec/validation/cdc_recettes_v1_2.json` ; génération reproductible `generer_recettes_cdc.py`.

Chaque recette a un identifiant unique. Une responsabilité est un rôle fonctionnel, à affecter nominativement avant décision ou campagne ; elle ne confère aucun droit de contenu. Le protocole et le manifeste du CDC § 14.3 s’appliquent. Les résultats attendus constituent des critères de recette, jamais des résultats déjà obtenus.

## Matrice des 33 exigences

| TECH | Origine localisée / justification | Contrat | Recette dédiée | Rôle responsable |
|---|---|---|---|---|
| TECH-001 | § 3, § 44 (applications comme portes d'entrée) — aucune exigence de surface ; Justification technique (ECD-19) | 5 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH001 | Produit / architecture |
| TECH-002 | Aucune ; Justification technique (ECD-19) | 7 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH002 | Core / sécurité |
| TECH-003 | § 4.4 (filiation sans synchronisation forcée), § 64 (conflits d'édition) ; critère 24 ; Fonctionnelle + technique | 7 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH003 | Core / données scientifiques |
| TECH-004 | § 84 (import externe) — aucune exigence d'application installée ; Justification technique (ECD-19) | 7 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH004 | Applications / stockage |
| TECH-005 | § 64 — la synchronisation entre appareils n'est pas traitée (§ 85 porte sur la synchronisation externe) ; Justification technique (ECD-19) | 9 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH005 | Core / applications |
| TECH-006 | § 18 (reproductions), § 15.2, § 97 ; critère 2 ; Fonctionnelle | 10 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH006 | Stockage / exploitation |
| TECH-007 | § 95 (MFA, sessions et appareils), § 90 ; Fonctionnelle | 11 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH007 | Sécurité / produit |
| TECH-008 | § 2.3, § 43, § 44 ; critère 22 ; Fonctionnelle | 10 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH008 | Architecture / Core |
| TECH-009 | § 88 (pérennité) — volumétrie issue des échanges (association de 40 généalogistes) ; Justification technique (ECD-19) | 6 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH009 | Architecture / exploitation |
| TECH-010 | § 83, § 84 ; Fonctionnelle | 10 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH010 | Core / données scientifiques |
| TECH-011 | § 61, § 62, § 73–75, § 49 ; critères 8, 11 ; Fonctionnelle | 11 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH011 | Sécurité / Core |
| TECH-012 | § 95 (sauvegardes chiffrées, restauration testée), § 88 ; Fonctionnelle | 11 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH012 | Exploitation / sécurité |
| TECH-013 | — ; Justification technique | 10 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH013 | Core / exploitation |
| TECH-014 | § 42 (recherche globale) ; Justification technique | 11 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH014 | Architecture / qualité |
| TECH-015 | § 41 (résultats dynamiques) ; critère 41 ; Fonctionnelle + technique | 13 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH015 | Core / données scientifiques |
| TECH-016 | § 42, § 43, § 7 (variantes de noms) ; Fonctionnelle | 12 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH016 | Sécurité / recherche |
| TECH-017 | § 41–42, § 93, § 94 ; critère 14 ; Fonctionnelle | 14 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH017 | Données scientifiques / sécurité |
| TECH-018 | § 79 (API), § 5 ; critère 44 ; Fonctionnelle | 12 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH018 | Architecture / Core |
| TECH-019 | § 95 ; Fonctionnelle | 10 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH019 | Sécurité / exploitation |
| TECH-020 | § 66–72, § 96, § 97 ; critère 25 ; Fonctionnelle | 13 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH020 | Sécurité / données / juridique |
| TECH-021 | § 95 (logs d'audit), § 90 ; Fonctionnelle | 12 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH021 | Sécurité / exploitation |
| TECH-022 | — ; Justification technique | 12 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH022 | Exploitation / qualité |
| TECH-023 | — ; Justification technique | 13 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH023 | Exploitation / architecture |
| TECH-024 | § 101 (CU), § 103 (critères de recette) ; Fonctionnelle | 14 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH024 | Qualité / Core |
| TECH-025 | § 106 (UX transversales) ; critère 12 ; Fonctionnelle | 13 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH025 | Produit / qualité |
| TECH-026 | § 82–84, § 88 ; critères 45, 46 ; Fonctionnelle | 13 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH026 | Core / données scientifiques |
| TECH-027 | § 49.2, § 62 ; Fonctionnelle | 13 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH027 | Exploitation / sécurité |
| TECH-028 | § 88 (partiel) ; Justification technique | 12 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH028 | Exploitation / qualité |
| TECH-029 | § 100 (monétisation) ; Fonctionnelle (partielle) | 14 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH029 | Produit / exploitation |
| TECH-030 | § 95 (politique de vulnérabilités, réponse aux incidents) ; Fonctionnelle | 15 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH030 | Sécurité / exploitation |
| TECH-031 | § 31, § 40 ; critère 48 ; Fonctionnelle | 16 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH031 | Données scientifiques / Core |
| TECH-032 | Partie XVIII, § 115 ; Fonctionnelle (gouvernance) | 14 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH032 | Architecture / porteur |
| TECH-033 | § 99, § 19.3 ; Fonctionnelle | 15 clauses au § 3 du CDC ; liens § 10 et § 14 | REC-CDC-TECH033 | Produit / qualité |

## Recettes dédiées et critères de preuve

### REC-CDC-TECH001

**Scénario :** Ouvrir un même espace autorisé sur Web, Desktop et Mobile ; comparer données et actions.
**Attendu :** Surfaces conformes à TECH-001, mêmes objets et autorisations, aucune nouvelle vérité par application.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-001. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Produit / architecture.

### REC-CDC-TECH002

**Scénario :** Synchroniser une base structurée autorisée, couper réseau, expirer une échéance et consulter.
**Attendu :** Lecture hors ligne permise avant échéance, inaccessible après pour données protégées ; delta non synchronisé conservé ; aucune réplication dérogatoire.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-002. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Core / sécurité.

### REC-CDC-TECH003

**Scénario :** Créer un delta hors ligne puis modifier sa base, retirer un droit, interrompre et rejouer synchronisation.
**Attendu :** Réception privée conservée avant résolution ; intégration à droits courants et conflits explicites, aucun écrasement ni perte du delta.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-003. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Core / données scientifiques.

### REC-CDC-TECH004

**Scénario :** Importer des fichiers locaux, renommer/déplacer un original et simuler indisponibilité.
**Attendu :** Originaux inchangés par GENIIUS ; identité documentaire préservée et lien rompu explicitement détecté.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-004. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Applications / stockage.

### REC-CDC-TECH005

**Scénario :** Deux appareils modifient le même objet ; révoquer un collaborateur avant la reprise.
**Attendu :** Versions et conflits explicites ; retraits avant ajouts, réévaluation serveur, aucun doublon ni réactivation de droit clos.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-005. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Core / applications.

### REC-CDC-TECH006

**Scénario :** Déposer deux fois un même binaire, corrompre une copie et restaurer un original.
**Attendu :** Identités de dépôts distinctes, aucune révélation de déduplication ; original récupérable et integrity/state de fichier contrôlés avant usage scientifique.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-006. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Stockage / exploitation.

### REC-CDC-TECH007

**Scénario :** Perdre un moyen d’authentification puis récupérer le compte ; tenter auto-approbation avec second compte.
**Attendu :** Récupération contrôlée, aucun élargissement des habilitations ; personne identique reconnue pour interdits sensibles.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-007. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Sécurité / produit.

### REC-CDC-TECH008

**Scénario :** Un module tente de contourner l’API/Core ou d’accéder directement à une donnée protégée.
**Attendu :** Contrats entre modules respectés, vérification commune des autorisations, aucun accès implicite ni effet de module sur vérité d’un autre.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-008. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Architecture / Core.

### REC-CDC-TECH009

**Scénario :** Charger le profil programme 50/500/1 million, puis profils patrimoniaux déclarés et montée de charge.
**Attendu :** Volumes, capacité, saturation et dégradation mesurés selon manifeste ; aucune donnée perdue ni limite commerciale prise pour limite scientifique.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-009. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Architecture / exploitation.

### REC-CDC-TECH010

**Scénario :** Inventorier plusieurs sources, interrompre migration à chaque étape, reprendre et réimporter à l’identique.
**Attendu :** Migration non destructive, reprenable, provenance et bilan ; aucune double preuve ni validation scientifique d’un fait par import seul.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-010. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Core / données scientifiques.

### REC-CDC-TECH011

**Scénario :** Comparer état où objet caché existe et état où il n’existe pas ; tenter administration et dérogation.
**Attendu :** Sorties filtrées selon § 14/15, non-levables jamais franchies, dérogation seulement bornée ; variante P-3 minimale explicitement séparée.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-011. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Sécurité / Core.

### REC-CDC-TECH012

**Scénario :** Sauvegarder, révoquer/purger ensuite, injecter catastrophe et restaurer.
**Attendu :** Patrimoine cohérent et autorisations/purges courantes avant accès ; RPO structuré ≤ 5 min, RTO ≤ 4 h selon protocole ; aucun contenu/droit ressuscité.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-012. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Exploitation / sécurité.

### REC-CDC-TECH013

**Scénario :** Interrompre une opération asynchrone durable et rejouer en concurrence.
**Attendu :** Un effet logique, état observable, reprise sans perte, absence de validation automatique ou résultat partiel définitif.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-013. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Core / exploitation.

### REC-CDC-TECH014

**Scénario :** Mesurer séparément temps serveur, retour perceptible client et premiers résultats de recherche aux profils/caches/réseaux déclarés.
**Attendu :** p95 lecture serveur ≤ 1 s hors réseau ; retour perceptible client < 1 s nominal ; p95 premiers résultats recherche ≤ 2 s. Exactitude et autorisation conservées ; distributions et erreurs publiées.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-014. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Architecture / qualité.

### REC-CDC-TECH015

**Scénario :** Corriger une preuve, interrompre propagation et consulter résultats aval avant/après reprise.
**Attendu :** Direct marqué au commit, transitif visible et idempotent ; aucune fausse certitude ni disparition du signalement ; délai à comparer après fixation MPD-04.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-015. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Core / données scientifiques.

### REC-CDC-TECH016

**Scénario :** Indexer une cible, retirer le droit, rechercher avec pagination, suggestion et agrégat.
**Attendu :** Aucun résultat/compteur/indice protégé servi par cache/index ; échec de vérification fermé.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-016. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Sécurité / recherche.

### REC-CDC-TECH017

**Scénario :** IA propose une identification ; demander envoi d’attribut sensible à un fournisseur.
**Attendu :** Proposition traçable sans validation ni modification du Core automatique ; données interdites non transmises.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-017. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Données scientifiques / sécurité.

### REC-CDC-TECH018

**Scénario :** Exécuter même opération par interface/API, inclure références invisibles et ancien client incompatible.
**Attendu :** Contrat et erreurs d’accès cohérents ; compatibilité explicitement négociée, refus sans fuite ni état partiellement écrit.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-018. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Architecture / Core.

### REC-CDC-TECH019

**Scénario :** Tenter lecture de données/fichiers/sauvegardes sans secrets, puis restauration autorisée.
**Attendu :** Confidentialité au repos et séparation des secrets ; droits actuels également vérifiés, chiffrement ne remplaçant pas autorisation.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-019. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Sécurité / exploitation.

### REC-CDC-TECH020

**Scénario :** Effacer un objet à plusieurs versions avec activités/références, restaurer ensuite et vérifier résidus.
**Attendu :** Contenus, codes/dates reconstructifs neutralisés, traces minimales seulement ; aucun réimport/restauration ne reconstitue donnée effacée.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-020. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Sécurité / données / juridique.

### REC-CDC-TECH021

**Scénario :** Créer, modifier et retirer un accès/conclusion puis lire journaux sous plusieurs rôles.
**Attendu :** Auteur/acte/versions/fondements auditables sans contenu indiscret ni cible cachée ; événements obligatoires conservés.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-021. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Sécurité / exploitation.

### REC-CDC-TECH022

**Scénario :** Lancer tests/migrations dans un environnement distinct avec corpus synthétique ou autorisé.
**Attendu :** Isolation de production, secrets séparés et aucune donnée privée diffusée dans preuves de test.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-022. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Exploitation / qualité.

### REC-CDC-TECH023

**Scénario :** Échouer un déploiement/migration et reprendre ou revenir à l’état compatible précédent.
**Attendu :** Patrimoine cohérent, aucune migration partielle exposée, aucune corruption ni résurrection de permissions.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-023. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Exploitation / architecture.

### REC-CDC-TECH024

**Scénario :** Modifier un composant de droits, synchronisation, purge ou propagation et préparer livraison.
**Attendu :** Non-régression correspondante lancée et résultats/version conservés ; cas positifs, négatifs et variantes d’attaque présents.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-024. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Qualité / Core.

### REC-CDC-TECH025

**Scénario :** Parcours clavier, technologie d’assistance, erreur et date historique incertaine sur toutes surfaces.
**Attendu :** Information lisible et fidèle, état/interruption/reprise compréhensibles ; accessibilité et représentation scientifique conformes aux contrats.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-025. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Produit / qualité.

### REC-CDC-TECH026

**Scénario :** Exporter puis réimporter patrimoine autorisé avec versions, provenance et divergences.
**Attendu :** Distinctions scientifiques conservées, exclusions invisibles non listées ; aucun transfert de droit implicite ni perte de portabilité.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-026. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Core / données scientifiques.

### REC-CDC-TECH027

**Scénario :** Support/exploitation tente accès scientifique sans habilitation ; répéter avec dérogation valide puis expirée.
**Attendu :** Pas d’administration donnant lecture, accès borné et audité si admissible, expiration effective sur chaque étape et sortie.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-027. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Exploitation / sécurité.

### REC-CDC-TECH028

**Scénario :** Sonder parcours essentiels pendant un mois civil et incidents déclarés.
**Attendu :** SLI calculé sur durée/version/périmètre publiés, objectif 99,9 %, budget et exclusions explicites ; aucune sécurité sacrifiée.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-028. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Exploitation / qualité.

### REC-CDC-TECH029

**Scénario :** Atteindre quotas/plafonds, rejouer imputations concurrentes et mesurer consommation par catégorie.
**Attendu :** Aucune perte, aucune double imputation ni plafond dépassé, coût/unités documentés ; valeurs commerciales restent dimensionnées.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-029. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Produit / exploitation.

### REC-CDC-TECH030

**Scénario :** Injecter incident sécurité/exploitation sur opération scientifique et exercer reprise.
**Attendu :** Opérations incomplètes identifiées, protections maintenues, traces préservées sous droits, reprise/postmortem documentés.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-030. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Sécurité / exploitation.

### REC-CDC-TECH031

**Scénario :** Changer un référentiel/concept, relire interprétation antérieure et réimporter ancienne version.
**Attendu :** Versions de référentiels explicites et historique reproductible ; aucune réécriture silencieuse de la science.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-031. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Données scientifiques / Core.

### REC-CDC-TECH032

**Scénario :** Instruire ADR et décision MPD différée avec alternatives et conséquences.
**Attendu :** Origine, contraintes, critères, responsables et échéance explicites ; aucun abandon d’invariant P0 par décision technique.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-032. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Architecture / porteur.

### REC-CDC-TECH033

**Scénario :** Changer préférence sur plusieurs clients, manipuler Unicode/textes longs/dates et langues livrées.
**Attendu :** Au moins deux langues d’interface en V1, dont français ; préférence persistée/repli explicite, sources et contributions inchangées ; liste des langues validée avant livraison.
**Méthode :** Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses TECH-033. **Preuve :** rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé. **Responsable :** Produit / qualité.

## Recettes héritées et projets

| Identifiant canonique | Alias historique | Scénario | Résultat attendu |
|---|---|---|---|
| REC-A02 | REC-A02 | Assertion privée, contribuée explicitement à un projet partagé, puis modifiée dans l'espace privé | La version partagée reste inchangée. Provenance conservée, divergence signalable. Aucune publication ou synchronisation sans opération autorisée. Aucune donnée privée nouvelle révélée. |
| REC-K01 | REC-K01 | Contester l'identification d'une mention sans contester sa transcription | Transcription inchangée ; contestation historisée |
| REC-K02 | REC-K02 | Corriger une transcription utilisée par plusieurs assertions et conclusions | Dépendances signalées ; aucune modification silencieuse des conclusions |
| REC-K03 | REC-K03 | Déduire une naissance approximative d'un âge déclaré | Estimation dérivée ; la source ne reçoit jamais une date qu'elle ne contient pas |
| REC-K04 | REC-K04 | Importer une transcription avec identification proposée | Provenance conservée ; identification non validée automatiquement |
| REC-I01 | REC-I01 | Deux Jean CARMEN homonymes | Deux identités conservées ; rapprochement possible sans fusion automatique |
| REC-I02 | REC-I02 | Charles TANCRÈDE identifié à tort comme une seule personne | Scission intellectuelle possible, sans effacer les anciennes hypothèses ni leurs auteurs |
| REC-I03 | REC-I03 | Variantes BLUKER / BICLAIR | Recherche sur les variantes, sans correction arbitraire des sources |
| REC-I04 | REC-I04 | Deux mentions rapprochées comme une même personne | Décision, auteur, justification et version conservés |
| REC-I05 | REC-I05 | Une nouvelle preuve conduit à dissocier les mentions | Révision sans destruction des mentions et sources |
| REC-I06 | REC-I06 | La dissociation affecte des filiations ou publications | Dépendances identifiées, réexamen proposé, pas de correction silencieuse |
| REC-I07 | REC-I07 | Deux projets conservent des identifications divergentes | Divergence autorisée, documentée, non fusionnée |
| REC-T01 | REC-T01 | Emploi attesté en 1834, 1837 et 1841 | Trois attestations, sans emploi continu présenté comme établi |
| REC-T02 | REC-T02 | Deshaies en 1802, Pointe-à-Pitre en 1810 | Aucun itinéraire précis présenté comme historique sans justification |
| REC-T03 | REC-T03 | Première attestation en 1802 | Ni naissance ni arrivée déduites automatiquement |
| REC-T04 | REC-T04 | Date approximative ou intervalle | Incertitude conservée dans les API et interfaces |
| REC-T05 | REC-T05 | Deux sources aux périodes contradictoires | Les deux assertions restent accessibles selon les droits |
| REC-T06 | REC-T06 | Lieu connu par localisation relative | Aucune coordonnée précise inventée |
| REC-T07 | REC-T07 | Carte ou chronologie reconstruite | Fait attesté et interprétation distingués explicitement |
| REC-R01 | REC-R01 | Convoi de 24 personnes, une seule identifiée | Collectif de 24 positions, sans 23 personnes fictives |
| REC-R02 | REC-R02 | Deux voisins sur un cadastre | Contiguïté spatiale conservée, sans relation d'amitié créée |
| REC-S01 | REC-S01 | Original → photographie → copie → recadrage → transcription | Filiation documentaire complète ; pas de multiplication des preuves indépendantes |
| REC-S02 | REC-S02 | Reconstruction d'un registre disparu | Reconstructions concurrentes possibles ; hypothèses et lacunes visibles |
| REC-S03 | REC-S03 | Série passant de l'acte 86 à l'acte 88 | N° 87 signalé non observé, sans conclure à sa destruction |
| REC-S04 | REC-S04 | Trois travaux citent la même source primaire | Dépendance documentaire identifiable |
| REC-S05 | REC-S05 | Deux sources réellement indépendantes | Indépendance justifiée et conservée |
| REC-S06 | REC-S06 | Origine d'une information inconnue | Indépendance qualifiée d'**indéterminée**, non présumée |
| REC-S07 | REC-S07 | Dépendance découverte ultérieurement | Évaluations concernées signalées pour réexamen |
| REC-S08 | REC-S08 | Reconstruction à partir d'indices incomplets | Hypothèses, sources et méthode identifiables |
| REC-S09 | REC-S09 | Période sans source connue | Lacune explicite, pas de conclusion d'absence |
| REC-S10 | REC-S10 | Nouvelle source contredisant une reconstruction publiée | Impact détecté, révision proposée |
| REC-S11 | REC-S11 | Synthèse faits / hypothèses / inconnues | Distinction conservée dans les exports et publications |
| REC-RB01 | REC-RB01 | Deux chercheurs exploitent le même acte, dont l'un en lecture indépendante | Attribution préservée ; comparaison possible après la lecture (CP-19) |
| REC-RB02 | REC-RB02 | CHARBONNET (source A) et CHARBONNIER (source B) | Deux lectures distinctes ; B ne corrige pas A |
| REC-RB03 | REC-RB03 | Annotation d'une signature sans transcription intégrale | Annotation conservée et localisée |
| REC-RB04 | REC-RB04 | Interventions successives sur un document | Contributions, auteurs et étapes conservés |
| REC-RB05 | REC-RB05 | Transcription corrigée après exploitation | Ancienne version conservée ; dépendants signalés |
| REC-RB06 | REC-RB06 | Deux lectures concurrentes d'un passage | Aucune n'écrase l'autre automatiquement |
| REC-RB07 | REC-RB07 | Extraction automatisée de mentions | Résultats qualifiés comme propositions, soumis à examen humain |
| REC-J01 | REC-J01 | Souvenir incomplet, complété des mois après | Versions et contexte initial conservés |
| REC-J02 | REC-J02 | Identification d'une photo avant et après suggestion d'un nom | Deux réponses distinctes avec leur contexte |
| REC-J03 | REC-J03 | Anecdote partageable, audio original sous embargo | Texte accessible ; audio protégé |
| REC-J04 | REC-J04 | Un témoin modifie sa déclaration | Nouvelle déclaration conservée sans effacer la première |
| REC-J05 | REC-J05 | Révocation d'une autorisation de publication | Divulgations futures conformes ; obligations de conservation et publications déjà diffusées traitées selon leur régime |
| REC-J06 | REC-J06 | Souvenir spontané | Déclaration originale et contexte conservés |
| REC-J07 | REC-J07 | Photo ou nom présenté avant la réponse | Influence potentielle documentée |
| REC-J08 | REC-J08 | Retour sur une déclaration | Nouvelle déclaration reliée à l'ancienne, sans effacement |
| REC-J09 | REC-J09 | Plusieurs témoins reprennent un même récit | Dépendance possible entre témoignages représentable |
| REC-J10 | REC-J10 | Consentement à l'enregistrement, refus de publication | Enregistrement dans sa portée ; publication interdite |
| REC-J11 | REC-J11 | Consentement à la transcription, refus de l'IA | Restrictions respectées par tous les traitements |
| REC-J12 | REC-J12 | Capsule à ouverture différée | Contenu inaccessible avant réalisation des conditions |
| REC-J13 | REC-J13 | Retrait de consentement ou changement d'instructions | Effets selon le fondement juridique, les droits acquis et les obligations |
| REC-E01 | REC-E01 | Protocole accompli sans identifier les parents de Charles TANCRÈDE | Protocole accompli, question non résolue, limites conservées |
| REC-E02 | REC-E02 | Invalidation d'une identification fondant une conclusion | Conclusion à réexaminer, dépendances explicites |
| REC-E03 | REC-E03 | Fonction administrative connue, recherche de fonds possibles | Suggestions de sources, sans affirmer leur existence |
| REC-E04 | REC-E04 | Mission d'archives déléguée à un tiers | Accès limité, durée et traçabilité |
| REC-E05 | REC-E05 | Résultat négatif après consultation partielle d'un registre | Résultat qualifié par son périmètre, sans prétention d'exhaustivité |
| REC-E06 | REC-E06 | Question de recherche avec périmètre documentaire | Question, méthode et périmètre conservés |
| REC-E07 | REC-E07 | Hypothèse réfutée par une nouvelle source | Réfutation historisée, hypothèse initiale conservée |
| REC-E08 | REC-E08 | Recherche sans résultat | Résultat négatif documenté avec méthode et couverture |
| REC-E09 | REC-E09 | Synthèse issue de plusieurs hypothèses | Sources, incertitudes et état des conclusions vérifiables |
| REC-E10 | REC-E10 | Mission limitée à un corpus | Périmètre, opérations autorisées et échéance explicites |
| REC-E11 | REC-E11 | Le délégataire tente une opération hors mission | Refus, même s'il participe au projet |
| REC-E12 | REC-E12 | Mission achevée ou révoquée | Habilitations retirées ; contributions et crédits conservés |
| REC-E13 | REC-E13 | Soumission des résultats du délégataire | Attribution à l'auteur ; validation indépendante selon la gouvernance |
| REC-TR01 | REC-TR01 | Deux Trees relient Arsène CHARBONNÉ à une même entité Core | Aucun accès réciproque implicite aux données privées |
| REC-TR02 | REC-TR02 | Le Core révise une date importée dans Tree | Notification et comparaison ; aucune modification silencieuse |
| REC-TR03 | REC-TR03 | Comparaison de branches autorisées | Limitée aux droits ; pas de contribution automatique au Core |
| REC-TR04 | REC-TR04 | Import GEDCOM de personnes potentiellement connues | Aucun rapprochement validé automatiquement |
| REC-TR05 | REC-TR05 | Un utilisateur gère plusieurs arbres indépendants avec des rôles distincts | Voir sous-scénarios |
| REC-TR06 | REC-TR06 | Deux arbres partagent une branche | Découvertes signalées sans synchronisation scientifique automatique |
| REC-TR07 | REC-TR07 | Depuis le Core, afficher les arbres publics réutilisant une connaissance | Arbres protégés jamais révélés |
| REC-TR05-01 | TR05-01 | Un compte crée trois arbres | Trois espaces indépendants |
| REC-TR05-02 | TR05-02 | Chercheur dans l'arbre d'un tiers | Contribution attribuée au chercheur ; propriété conservée par le tiers |
| REC-TR05-03 | TR05-03 | Le chercheur quitte l'arbre du tiers | Contributions attribuées ; droits issus du rôle quitté cessés, titularité et autres fondements indépendants réévalués |
| REC-TR06-01 | TR06-01 | Branche commune identifiée | Correspondances documentées sans fusion |
| REC-TR06-02 | TR06-02 | Assertion évolue dans A | Proposition pertinente pour B |
| REC-TR06-03 | TR06-03 | Assertion évolue dans B | Proposition pertinente pour A |
| REC-TR06-04 | TR06-04 | Proposition refusée | Divergence conservée |
| REC-TR06-05 | TR06-05 | Proposition acceptée | Nouvelle version dans l'arbre destinataire |
| REC-TR06-06 | TR06-06 | Même modification retraitée | Ni doublon ni boucle de synchronisation |
| REC-TR06-07 | TR06-07 | Référence devenue inaccessible | Aucune information protégée divulguée |
| REC-TR07-01 | TR07-01 | Objet Core réutilisé par trois arbres publics | Les trois réutilisations accessibles présentables |
| REC-TR07-02 | TR07-02 | Un quatrième arbre privé utilise l'objet | Existence et contribution aux compteurs non révélées |
| REC-TR07-03 | TR07-03 | Deux arbres, une source, deux interprétations | Réutilisation documentaire distinguée de l'accord scientifique |
| REC-TR08-01 | TR08-01 | Créer le projet | Espace indépendant, gouvernance et périmètre historique propres |
| REC-TR08-02 | TR08-02 | Associer plusieurs arbres | Chaque arbre conserve identité, droits et versions |
| REC-TR08-03 | TR08-03 | Proposer deux branches d'un arbre personnel | Seules les branches sélectionnées sont candidates |
| REC-TR08-04 | TR08-04 | Intégrer une famille sans parenté connue | Présente sans parenté fictive |
| REC-TR08-05 | TR08-05 | Accepter une contribution | Décision du projet et provenance enregistrées |
| REC-TR08-06 | TR08-06 | Découvrir une parenté entre deux familles | Rapprochement proposé et documenté, sans fusion |
| REC-TR08-07 | TR08-07 | Modifier une conclusion dans l'arbre source | Signalement d'impact ; pas de modification silencieuse |
| REC-TR08-08 | TR08-08 | Refuser une mise à jour | Position du projet conservée, refus tracé |
| REC-TR08-09 | TR08-09 | Retirer un contributeur | Droits issus du rôle retiré cessés ; titularité et autres fondements indépendants réévalués ; contributions acceptées traitées selon leurs conditions |
| REC-TR08-10 | TR08-10 | Publier une reconstitution | Seuls les contenus autorisés exposés, y compris liens et compteurs |
| REC-TR09-01 | TR09-01 | Sélectionner le Sosa 31 comme point de départ | Branche définie à partir d'un individu identifié |
| REC-TR09-02 | TR09-02 | Ascendance paternelle seule | Aucune remontée par l'ascendance maternelle |
| REC-TR09-03 | TR09-03 | Inclure la descendance | Descendants admissibles, sous réserve des restrictions |
| REC-TR09-04 | TR09-04 | Inclure les unions pertinentes | Relations conjugales autorisées conservées |
| REC-TR09-05 | TR09-05 | Inclure le Sosa 30 comme conjoint | Conjoint visible, parents et grands-parents non ouverts |
| REC-TR09-06 | TR09-06 | Exclure la branche du Sosa 16 | Ni exposée ni **déductible** |
| REC-TR09-07 | TR09-07 | BOURBON et BOVALO partagés séparément | Deux contributions aux paramètres propres |
| REC-TR09-08 | TR09-08 | Personne vivante dans la descendance | Données masquées ou exclues |
| REC-TR09-09 | TR09-09 | Prévisualiser | Liste **exacte** des personnes, relations, sources et informations transmissibles |
| REC-TR09-10 | TR09-10 | Modifier ensuite la branche source | Proposition de mise à jour, sans élargissement silencieux du périmètre |
| REC-TR09-11 | TR09-11 | Réduire ou révoquer le partage | Accès et diffusions futurs réévalués ; copies déjà autorisées selon leurs conditions |
| REC-TR09-12 | TR09-12 | Rechercher, exporter, parcourir | Aucune fuite vers les branches non sélectionnées |
| REC-TR10-01 | TR10-01 | Créer un arbre pour un tiers sans compte | Créé et administré par le chercheur |
| REC-TR10-02 | TR10-02 | Indiquer un bénéficiaire futur | Destination enregistrée, sans faux compte |
| REC-TR10-03 | TR10-03 | Effectuer des recherches | Attribuées au véritable chercheur |
| REC-TR10-04 | TR10-04 | Partager une branche avec un projet | Possible selon les droits, sans compte du bénéficiaire |
| REC-TR10-05 | TR10-05 | Préparer le cadeau | Accès du bénéficiaire non activé prématurément |
| REC-TR10-06 | TR10-06 | Générer une invitation privée | Limitée, sécurisée, révocable |
| REC-TR10-07 | TR10-07 | Acceptation de l'invitation | Accès selon le rôle proposé |
| REC-TR10-08 | TR10-08 | Transférer la propriété administrative | Explicite et audité ; auteur des recherches inchangé |
| REC-TR10-09 | TR10-09 | Le chercheur reste collaborateur | Seulement les habilitations convenues |
| REC-TR10-10 | TR10-10 | Le chercheur quitte l'arbre | Droits issus du rôle quitté cessés ; titularité et autres fondements indépendants réévalués ; contributions attribuées, liens au projet réévalués |
| REC-TR10-11 | TR10-11 | Refus ou absence de réponse | Aucun compte ni transfert forcé |
| REC-TR10-12 | TR10-12 | Invitation interceptée ou expirée | Aucun accès non autorisé |
| REC-TR11-01 | TR11-01 | Contribuer depuis son arbre GENIIUS | Référence à la branche autorisée, avec provenance |
| REC-TR11-02 | TR11-02 | Contribuer depuis l'arbre d'un tiers administré | Contribution indépendante de l'arbre personnel |
| REC-TR11-03 | TR11-03 | Contribuer depuis un arbre sans parenté connue | Intégrable sans parenté obligatoire |
| REC-TR11-04 | TR11-04 | Importer un GEDCOM Geneanet | Origine, auteur déclaré, fichier et date conservés |
| REC-TR11-05 | TR11-05 | Personne potentiellement déjà connue | Rapprochement proposé, jamais fusion automatique |
| REC-TR11-06 | TR11-06 | Assertion contradictoire importée | Les deux positions documentées |
| REC-TR11-07 | TR11-07 | Réimport d'un GEDCOM actualisé | Différences détectées sans écrasement |
| REC-TR11-08 | TR11-08 | Import répété d'un fichier identique | Aucun doublon scientifique |
| REC-TR11-09 | TR11-09 | Contribution contenant des informations privées | Exclusion ou masquage avant intégration et diffusion |
| REC-TR11-10 | TR11-10 | Publication d'une synthèse | Contenus autorisés seulement, avec crédits et provenances |
| REC-TR11-11 | TR11-11 | L'arbre externe change sur Geneanet | Aucun changement supposé connu sans nouveau flux |
| REC-TR11-12 | TR11-12 | Une source externe disparaît | Provenance et état de disponibilité conservés |
| REC-AT01 | REC-AT01 | Reconstruction d'un territoire historique | Relations historisées, sources et incertitudes conservées |
| REC-AT02 | REC-AT02 | Habitation au nord de C, bordée par une rivière, voisine de A et B | Zone plausible, sans polygone exact inventé |
| REC-AT03 | REC-AT03 | Épidémie contemporaine d'un décès | Concomitance représentée, causalité non affirmée |
| REC-AT04 | REC-AT04 | Révision d'une localisation utilisée par une carte publiée | Carte courante signalée ; ancienne publication conservée avec son état |
| REC-AT05 | REC-AT05 | Habitation localisée par zone approximative | Incertitude spatiale représentée |
| REC-AT06 | REC-AT06 | Deux cartes aux limites différentes | Reconstructions concurrentes conservées |
| REC-AT07 | REC-AT07 | Limite territoriale évolutive | Versions temporelles distinctes |
| REC-AT08 | REC-AT08 | Nouvelle source modifiant une reconstruction | Dépendances et publications affectées signalées |
| REC-AT09 | REC-AT09 | Export d'une géométrie incertaine | Incertitude, temporalité et provenance conservées |
| REC-CN01 | REC-CN01 | Identification de photos lors d'une cousinade | Réponses attribuées et vérifiables ; pas de validation automatique dans le Core |
| REC-CN02 | REC-CN02 | Invité d'un événement lié à un projet privé | Accès limité au périmètre de l'événement |
| REC-CN03 | REC-CN03 | Quiz utilisant des informations dont certaines sont privées | Aucune divulgation par questions, réponses, scores ou indices |
| REC-CN04 | REC-CN04 | Collecte de témoignages via Connect vers Journal | Consentements, provenance et séparation des espaces conservés |
| REC-X14-01 | X14-01 | Inviter à une cousinade | Accès aux seuls contenus Connect autorisés |
| REC-X14-02 | X14-02 | L'invité tente d'ouvrir l'arbre privé | Refus sans révélation |
| REC-X14-03 | X14-03 | Photo issue d'une recherche privée | Seules la version et les métadonnées autorisées exposées |
| REC-X14-04 | X14-04 | Un invité nomme une personne sur une photo | Proposition attribuée, pas une vérité |
| REC-X14-05 | X14-05 | Un invité propose une parenté | Aucune filiation créée dans Tree ou le Core |
| REC-X14-06 | X14-06 | Examen du témoignage | Acceptation, refus ou demande de précisions tracés |
| REC-X14-07 | X14-07 | Transfert vers Journal ou Rebond | Explicite, avec provenance, autorisations et statut |
| REC-X14-08 | X14-08 | Organisateur avec droits administratifs Connect seuls | Aucune lecture implicite des recherches privées |
| REC-X14-09 | X14-09 | Recherche d'un nom privé par un invité | Aucun résultat, suggestion, compteur ou indice |
| REC-X14-10 | X14-10 | Révocation d'une invitation | Accès retiré, y compris liens et téléchargements contrôlés |
| REC-X14-11 | X14-11 | Personne vivante ou mineure sur une photo | Restrictions, demandes de retrait et obligations appliquées |
| REC-X14-12 | X14-12 | Retrait d'un témoignage demandé | Traité selon les droits ; conservation seulement justifiée |
| REC-X14-13 | X14-13 | Événement associé à un projet (Les Colimaçons) | Invités non membres du projet scientifique |
| REC-X14-14 | X14-14 | Export d'album ou newsletter | Aucun contenu non autorisé, même indirectement |
| REC-X01 | REC-X01 | Un administrateur sans droit explicite ne peut ni lire ni déduire l'existence d'un contenu privé | Un administrateur sans droit explicite ne peut ni lire ni déduire l'existence d'un contenu privé |
| REC-X02 | REC-X02 | Révocation respectée côté serveur et à la prochaine synchronisation d'un appareil hors ligne | Révocation respectée côté serveur et à la prochaine synchronisation d'un appareil hors ligne |
| REC-X03 | REC-X03 | Contribution non synchronisée qui survit à une interruption prolongée et à une mise à jour du client | Contribution non synchronisée qui survit à une interruption prolongée et à une mise à jour du client |
| REC-X04 | REC-X04 | Restauration qui conserve la cohérence base / fichiers / provenance | Restauration qui conserve la cohérence base / fichiers / provenance |
| REC-X05 | REC-X05 | Export patrimonial qui conserve identifiants, versions, sources, incertitudes et droits exportables | Export patrimonial qui conserve identifiants, versions, sources, incertitudes et droits exportables |
| REC-X06 | REC-X06 | Purge légale sans réapparition par restauration ou synchronisation | Purge légale sans réapparition par restauration ou synchronisation |
| REC-X07 | REC-X07 | Changement de référentiel sans réinterprétation silencieuse | Changement de référentiel sans réinterprétation silencieuse |
| REC-X08 | REC-X08 | Recherche, statistique ou IA sans révélation hors du graphe accessible | Recherche, statistique ou IA sans révélation hors du graphe accessible |
| REC-X09 | REC-X09 | Un administrateur technique non membre scientifique tente d'accéder à un objet `projet` par interface, API, recherche et export : quatre refus sans divulgation. Après habilitation scientifique, lectures permises, sans ouverture des objets `privé`. | Un administrateur technique non membre scientifique tente d'accéder à un objet `projet` par interface, API, recherche et export : quatre refus sans divulgation. Après habilitation scientifique, lectures permises, sans ouverture des objets `privé`. |
| REC-X15 | REC-X15 | Longue période hors ligne : travaux locaux conservés sans expiration | Longue période hors ligne : travaux locaux conservés sans expiration |
| REC-X16 | REC-X16 | Synchronisation interrompue puis reprise : ni duplication ni perte de provenance | Synchronisation interrompue puis reprise : ni duplication ni perte de provenance |
| REC-X17 | REC-X17 | Deux appareils modifient une même conclusion : conflit détecté, pas de résolution scientifique automatique | Deux appareils modifient une même conclusion : conflit détecté, pas de résolution scientifique automatique |
| REC-X18 | REC-X18 | Restauration données + fichiers : cohérence objets, fichiers, versions, provenance | Restauration données + fichiers : cohérence objets, fichiers, versions, provenance |
| REC-X19 | REC-X19 | Restauration après un effacement applicable : aucune résurrection | Restauration après un effacement applicable : aucune résurrection |
| REC-X20 | REC-X20 | Migration d'une recherche ancienne : identités, références, citations, historique préservés | Migration d'une recherche ancienne : identités, références, citations, historique préservés |
| REC-X21 | REC-X21 | Transmission d'un projet à un successeur : gouvernance transférée explicitement, crédits conservés | Transmission d'un projet à un successeur : gouvernance transférée explicitement, crédits conservés |
| REC-X10-01 | X10-01 | Alice crée un espace projet | Deux habilitations actives : `propriétaire` (administrative) et `responsable scientifique` |
| REC-X10-02 | X10-02 | Alice crée un objet personnel valide | Titularité système attribuée : voir/commenter/proposer/transcrire/éditer/exporter/réutiliser et repartager, sans valider scientifique ni contribuer au Core ; protections opposables |
| REC-X10-03 | X10-03 | Un RS non racine voit sa nomination retirée ; variante propriétaire/racine | Plus de droit au titre du rôle retiré ; droits personnels indépendants conservés. La racine du propriétaire ne peut être retirée isolément dans un espace non clos |
| REC-X10-04 | X10-04 | Alice quitte l’espace mais reste titulaire de son objet personnel | Actions du titulaire maintenues sous protections ; pas de création nouvelle dans l’espace quitté |
| REC-X10-05 | X10-05 | Un chercheur possède une nomination scientifique et aucun rôle administratif | Droits scientifiques dans son périmètre ; aucun pouvoir de propriété. Après transfert, tout retour du cédant suit le verrou et le consentement par acte |
| REC-X10-06 | X10-06 | Bob est uniquement administrateur | Administre sans accès implicite aux objets `projet` et `privé` |
| REC-X10-07 | X10-07 | Bob reçoit `collaborateur` | Lit les objets `projet` selon ses droits, pas les objets privés |
| REC-X10-08 | X10-08 | Échec entre les deux attributions à la création | Transaction annulée ; aucun espace partiellement initialisé |
| REC-X11-01 | X11-01 | Bob administrateur technique sans habilitation scientifique | Aucun accès implicite `projet` ou `privé` |
| REC-X11-02 | X11-02 | Règle générale « lecture pour le rôle `administrateur` » | Ne contourne pas CP-25 |
| REC-X11-03 | X11-03 | Bob reçoit `collaborateur` | Lit les objets `projet` autorisés, pas les objets privés |
| REC-X11-04 | X11-04 | Dérogation § 12 sur un objet privé | Approbations indépendantes, garde, niveau, opérations, finalité, durée et état revérifiés ; aucune habilitation générique de support |
| REC-X11-05 | X11-05 | Expiration de l'autorisation | Refus immédiat côté serveur |
| REC-X11-06 | X11-06 | Restriction non levable malgré habilitation et dérogation ; variante restriction interne avec dérogation valide | Non levable jamais franchie ; restriction interne seulement franchie dans les bornes de § 12, sans retirer la protection |
| REC-X11-07 | X11-07 | Recherche, agrégation, export, API | Ni contenu ni indice d'existence |
| REC-X11-08 | X11-08 | Ancienne version ou résultat dérivé | Restrictions courantes appliquées |
| REC-X11-09 | X11-09 | Usage de l'accès exceptionnel | Journalisé (acteur, cible, date, opération, finalité), **sans le contenu** |
| REC-X12-01 | X12-01 | Correction de la transcription | Nouvelle version ; ancienne conservée |
| REC-X12-02 | X12-02 | Détection des dépendances | Tous les objets aval identifiés |
| REC-X12-03 | X12-03 | Propagation en cours | Aucun résultat présenté silencieusement comme réexaminé |
| REC-X12-04 | X12-04 | Propagation terminée | Éléments affectés signalés potentiellement obsolètes ou à réexaminer |
| REC-X12-05 | X12-05 | Consultation de la conclusion Echo | Avertissement et provenance du changement |
| REC-X12-06 | X12-06 | Consultation de la fiche Tree | Aucune modification automatique |
| REC-X12-07 | X12-07 | Consultation de la carte Atlas | Changement de fondement signalé |
| REC-X12-08 | X12-08 | Réexamen humain | Confirmer, corriger ou invalider, avec traçabilité |
| REC-X12-09 | X12-09 | Échec d'un traitement asynchrone | Reprise sans perte du signalement ni validation automatique |
| REC-X12-10 | X12-10 | Publication historique | Version historique conservée et distinguée de l'état actuel |
| REC-X13-01 | X13-01 | Création séparée des arbres | Identifiants, gouvernance et versions indépendants |
| REC-X13-02 | X13-02 | Référence au même document Core | Possible sans fusion |
| REC-X13-03 | X13-03 | Alice valide une identification | Rien n'est validé dans B |
| REC-X13-04 | X13-04 | Bob conteste | Deux positions traçables et distinctes |
| REC-X13-05 | X13-05 | Assertion du Core corrigée | Signalement d'impact, pas de modification automatique |
| REC-X13-06 | X13-06 | Alice accepte une mise à jour | Nouvelle version dans A ; B inchangé |
| REC-X13-07 | X13-07 | Bob refuse | Divergence conservée et documentée |
| REC-X13-08 | X13-08 | Alice rend son arbre public | Visibilité de B inchangée |
| REC-X13-09 | X13-09 | Utilisateur sans droit consulte une référence entre arbres | Ni contenu ni indice d'existence protégé |
| REC-X13-10 | X13-10 | Export d'un arbre | Identifiants, provenance, versions et divergences selon les droits |
| REC-X13-11 | X13-11 | Référence Core devenue inaccessible | Contribution propre conservée ; référence signalée inaccessible, sans copie illicite |
| REC-X13-12 | X13-12 | Conclusions incompatibles | Aucune règle de majorité ou d'autorité automatique |
| REC-NF01 | REC-NF01 | Lectures courantes | p95 ≤ 1 s dans les conditions de référence |
| REC-NF02 | REC-NF02 | Recherches courantes | p95 ≤ 2 s dans les conditions de référence |
| REC-NF03 | REC-NF03 | Montée en charge | Seuils de charge, dégradation et capacité documentés |
| REC-NF04 | REC-NF04 | Disponibilité | 99,9 % selon une méthode publiée |
| REC-NF05 | REC-NF05 | Restauration après incident | RPO ≤ 5 min et RTO ≤ 4 h pour le périmètre couvert |
| REC-NF06 | REC-NF06 | Accessibilité | Cible WCAG 2.2 AA, tests automatisés et manuels |
| REC-NF07 | REC-NF07 | Parcours multilingues | Langues, écritures, dates et noms historiques conservés |
| REC-NF08 | REC-NF08 | Limites de ressources et coûts | Aucun quota ni dépassement ne provoque une perte silencieuse |
| REC-NF09 | REC-NF09 | Traitements asynchrones | Reprises idempotentes, états visibles, pas de résultat partiel présenté comme définitif |
| REC-NF10 | REC-NF10 | Sécurité sous charge | Aucune dégradation des contrôles d'accès, y compris caches et index |
| REC-TECH04 | REC-TECH04 | Déplacement, renommage ou indisponibilité d'un fichier : identité documentaire préservée, liens rompus détectés, aucune perte silencieuse | Déplacement, renommage ou indisponibilité d'un fichier : identité documentaire préservée, liens rompus détectés, aucune perte silencieuse |
| REC-TECH07 | REC-TECH07 | Perte d'un moyen d'authentification : récupération contrôlée, sans contournement des habilitations ni divulgation | Perte d'un moyen d'authentification : récupération contrôlée, sans contournement des habilitations ni divulgation |
| REC-TECH08 | REC-TECH08 | Modification d'un module : pas d'accès direct non autorisé aux données ni de contournement des contrats entre modules | Modification d'un module : pas d'accès direct non autorisé aux données ni de contournement des contrats entre modules |
| REC-TECH13 | REC-TECH13 | Rejouer une opération après interruption : ni doublon, ni perte, ni effet scientifique supplémentaire | Rejouer une opération après interruption : ni doublon, ni perte, ni effet scientifique supplémentaire |
| REC-TECH16 | REC-TECH16 | Révoquer un droit après indexation : plus aucune information protégée dans les résultats, suggestions ou agrégations | Révoquer un droit après indexation : plus aucune information protégée dans les résultats, suggestions ou agrégations |
| REC-TECH17 | REC-TECH17 | IA proposant une identification : ni conclusion validée ni modification du Core sans décision humaine autorisée | IA proposant une identification : ni conclusion validée ni modification du Core sans décision humaine autorisée |
| REC-TECH19 | REC-TECH19 | Accès aux données et fichiers sans les secrets : confidentialité préservée, sauvegardes comprises | Accès aux données et fichiers sans les secrets : confidentialité préservée, sauvegardes comprises |
| REC-TECH21 | REC-TECH21 | Modifier une conclusion puis consulter l'historique : auteur, action, version et justification retrouvables selon les droits | Modifier une conclusion puis consulter l'historique : auteur, action, version et justification retrouvables selon les droits |
| REC-TECH22 | REC-TECH22 | Données de test hors production : ni fuite ni modification des données de production | Données de test hors production : ni fuite ni modification des données de production |
| REC-TECH23 | REC-TECH23 | Déploiement en échec : état précédent exploitable ou retour arrière contrôlé, sans corruption | Déploiement en échec : état précédent exploitable ou retour arrière contrôlé, sans corruption |
| REC-TECH24 | REC-TECH24 | Modification des règles d'accès : déclenche automatiquement la non-régression correspondante | Modification des règles d'accès : déclenche automatiquement la non-régression correspondante |
| REC-TECH26 | REC-TECH26 | Export puis réimport : identifiants de provenance, versions, incertitudes et relations préservés, sans extension des droits | Export puis réimport : identifiants de provenance, versions, incertitudes et relations préservés, sans extension des droits |
| REC-TECH27 | REC-TECH27 | Administrateur tentant un accès scientifique non attribué : refus et journalisation | Administrateur tentant un accès scientifique non attribué : refus et journalisation |
| REC-TECH30 | REC-TECH30 | Incident sur des traitements scientifiques : opérations incomplètes identifiées, traces préservées, reprise contrôlée | Incident sur des traitements scientifiques : opérations incomplètes identifiées, traces préservées, reprise contrôlée |
| REC-TECH31 | REC-TECH31 | Changement de version de référentiel : interprétations historiques reproductibles avec la version initiale | Changement de version de référentiel : interprétations historiques reproductibles avec la version initiale |
| REC-TECH32 | REC-TECH32 | Instruction d'une décision MPD différée : justification, alternatives, conséquences, respect des invariants | Instruction d'une décision MPD différée : justification, alternatives, conséquences, respect des invariants |
| REC-PR01 | REC-PR01 | Famille intégrée en V1.2 à partir d’AV-FONC-001, décision d’intégration V1 maintenue | Douze cas PR01-01 à PR01-12 au § 12 ; périmètres, isolation, reparentage, recherche/indicateurs et révocation. L’ancienne proposition est conservée dans la V1.0 archivée |
| REC-TR08 | TR08 | Famille projet collectif : exécuter TR08-01 à TR08-10 | Tous les attendus TR08-01 à TR08-10 sont respectés ; ancienne variante conservée seulement en archive |
| REC-PR01-01 | PR01-01 | Programme P, enfant E, frère F ; administrateur P sans habilitation E/F recherche et agrège | Aucun contenu/identifiant/compteur E/F ; rattachement ne confère aucun droit |
| REC-PR01-02 | PR01-02 | Rattachement P/E accepté deux parties ; terminer puis recréer | Habilitations conditionnées closes, aucune résurrection ; pas de transitivité vers F |
| REC-PR01-03 | PR01-03 | Axe incertain, ressource privée déclarée ; calcul d’avancement | Ni entité/rapport historique fictif, ni accès à ressource par déclaration ; indicateurs sur objets effectivement accessibles |
| REC-PR01-04 | PR01-04 | Bénévole avec lot et échéance ; clore puis rouvrir le lot | Droits terminés ne reviennent pas ; action nouvelle exige nouvel acte conforme |
| REC-PR01-05 | PR01-05 | Sélection avec branche exclue, proposition en attente puis réduction | Lecture sur manifeste actif réduit ; rien des ajouts non acceptés, branche exclue ou relations frontières |
| REC-PR01-06 | PR01-06 | Arbre préparé pour tiers sans compte ; identité vérifiée, présentation et acceptation | Aucun faux compte ; paternité inchangée ; inclusion des engagements et voies d’objets contrôlées ; retour du cédant soumis au verrou |
| REC-PR01-07 | PR01-07 | Accord financement valide à consommation mais expiré au traitement ; deux traitements/rejeu | Ventilation à date effective, plafond non dépassé, aucune double imputation ni perte d’accès aux données |
| REC-PR01-08 | PR01-08 | Publication approuvée ; cible/protection révoquée avant diffusion ; série autre espace | Approbation éditoriale seule ne diffuse pas ; autorisation actuelle et acceptation série exigées ; rang invisible non révélé |
| REC-PR01-09 | PR01-09 | Contributeur admis uniquement à Pointe-Noire, enfant d’un programme antillais | Voit son seul périmètre, ni parent ni projets frères du seul rattachement ; sortie ferme admissions concernées sans supprimer attributions |
| REC-PR01-10 | PR01-10 | Déplacer un sous-projet : terminer ancien lien puis proposer/faire accepter nouveau lien bilatéral | Aucun élargissement de droits, anciennes habilitations conditionnées closes ; nouveau parent ne lit pas, nouveaux droits exigent nouveaux actes |
| REC-PR01-11 | PR01-11 | Deux lecteurs aux graphes différents calculent recherche transversale/indicateur de programme | Chaque résultat, compteur, dénominateur et provenance calculé sur son graphe ; rien d’un projet caché révélé par différence de requêtes |
| REC-PR01-12 | PR01-12 | Publier un chiffre figé de programme puis corriger sa preuve ou retirer un droit | Version publiée conservée et explicable dans les droits ; nouvelle diffusion réévaluée ; impact signalé sans invalidation automatique ni mise à jour silencieuse |
| REC-CDCF-CU01 | CU-01 | Charles TANCRÈDE : Reconstituer une trajectoire 1881--1890 : - assises ; - cassation ; - nouveau procès ; - rejet pourvoi ; - commutation ; - condamnation pénitentiaire ; - évasion ; - double chaîne ; - décès aux Îles du Salut. Vérifier : - chronologie ; - décisions vs exécution ; - variantes ; - sources ; - copies ; - hypothèses ; - lacunes 1884--1888 ; - Echo ; - Atlas ; - conclusions versionnées. | Reconstituer une trajectoire 1881--1890 : - assises ; - cassation ; - nouveau procès ; - rejet pourvoi ; - commutation ; - condamnation pénitentiaire ; - évasion ; - double chaîne ; - décès aux Îles du Salut. Vérifier : - chronologie ; - décisions vs exécution ; - variantes ; - sources ; - copies ; - hypothèses ; - lacunes 1884--1888 ; - Echo ; - Atlas ; - conclusions versionnées. |
| REC-CDCF-CU02 | CU-02 | Habitation Dolé, recensement 1793 : Source de plus de 200 personnes. Vérifier : - exploitation exhaustive relative à protocole ; - personnes incomplètes ; - personnes sans descendants ; - groupes ; - relations ; - lieu ; - population ; - réutilisation par plusieurs chercheurs ; - absence de hiérarchie humaine par volume documentaire. | Source de plus de 200 personnes. Vérifier : - exploitation exhaustive relative à protocole ; - personnes incomplètes ; - personnes sans descendants ; - groupes ; - relations ; - lieu ; - population ; - réutilisation par plusieurs chercheurs ; - absence de hiérarchie humaine par volume documentaire. |
| REC-CDCF-CU03 | CU-03 | Registre perdu des nouveaux libres de Deshaies : Vérifier : - document perdu ; - structure reconstruite ; - positions ; - numéros ; - actes ultérieurs ; - hypothèses ; - dépendances ; - concurrence de reconstructions ; - citations versionnées. | Vérifier : - document perdu ; - structure reconstruite ; - positions ; - numéros ; - actes ultérieurs ; - hypothèses ; - dépendances ; - concurrence de reconstructions ; - citations versionnées. |
| REC-CDCF-CU04 | CU-04 | Projet CHARBONNÉ : Vérifier : - Tree privé ; - Core partagé ; - Rebond ; - Echo ; - Atlas ; - publications ; - contribution/import ; - snapshots ; - découverte ; - succession ; - pérennité. | Vérifier : - Tree privé ; - Core partagé ; - Rebond ; - Echo ; - Atlas ; - publications ; - contribution/import ; - snapshots ; - découverte ; - succession ; - pérennité. |
| REC-CDCF-CU05 | CU-05 | Photo familiale : Vérifier : - recto/verso ; - album ; - inscriptions ; - identification concurrente ; - témoin ; - IA visuelle ; - personne vivante ; - droits ; - publication. | Vérifier : - recto/verso ; - album ; - inscriptions ; - identification concurrente ; - témoin ; - IA visuelle ; - personne vivante ; - droits ; - publication. |
| REC-CDCF-CU06 | CU-06 | Mémoire familiale : Vérifier : - auto-entretien ; - entretien tiers ; - question ouverte ; - oubli ; - correction ; - nouveau récit ; - embargo ; - capsule ; - campagne ; - dépositaire. | Vérifier : - auto-entretien ; - entretien tiers ; - question ouverte ; - oubli ; - correction ; - nouveau récit ; - embargo ; - capsule ; - campagne ; - dépositaire. |
| REC-CDCF-CU07 | CU-07 | Mission aux archives : Vérifier : - préparation ; - cotes ; - délégation ; - micro-mission ; - consultation partielle ; - reproduction ; - transfert ; - Rebond ; - résultat négatif. | Vérifier : - préparation ; - cotes ; - délégation ; - micro-mission ; - consultation partielle ; - reproduction ; - transfert ; - Rebond ; - résultat négatif. |
| REC-CDCF-CU08 | CU-08 | Reconstruction territoriale : Vérifier : - commune ; - section ; - hameau ; - rue ; - habitation ; - maison ; - voisins ; - rivière ; - hypothèque ; - culture ; - parcelle ; - division ; - fusion ; - géométrie incertaine. | Vérifier : - commune ; - section ; - hameau ; - rue ; - habitation ; - maison ; - voisins ; - rivière ; - hypothèque ; - culture ; - parcelle ; - division ; - fusion ; - géométrie incertaine. |
| REC-CDCF-CU09 | CU-09 | Statistique historique : Vérifier : - corpus ; - méthode ; - couverture ; - identité modifiée ; - recalcul ; - résultat figé ; - résultat obsolète ; - explication du diff. | Vérifier : - corpus ; - méthode ; - couverture ; - identité modifiée ; - recalcul ; - résultat figé ; - résultat obsolète ; - explication du diff. |
| REC-CDCF-CU10 | CU-10 | Désaccord scientifique : Vérifier : - proposition ; - validations ; - liens entre validateurs ; - contestation ; - preuve nouvelle ; - réexamen ; - coexistence ; - crédit. | Vérifier : - proposition ; - validations ; - liens entre validateurs ; - contestation ; - preuve nouvelle ; - réexamen ; - coexistence ; - crédit. |
| REC-CDCF-CU11 | CU-11 | Publication à droits mixtes : Vérifier : - source publique ; - image non redistribuable ; - témoignage privé ; - carte ; - analyse ; - licences ; - masquage ; - indexation. | Vérifier : - source publique ; - image non redistribuable ; - témoignage privé ; - carte ; - analyse ; - licences ; - masquage ; - indexation. |
| REC-CDCF-CU12 | CU-12 | Pérennité : Vérifier : - export ; - format patrimonial ; - réimport ; - Core évolué ; - réconciliation ; - droits ; - succession. | Vérifier : - export ; - format patrimonial ; - réimport ; - Core évolué ; - réconciliation ; - droits ; - succession. |
| REC-CDCF-CU13 | CU-13 | « Un des fils de Jean DUPONT » : Une source ne permet pas de savoir lequel. Attendu : - mention non résolue ; - candidats ; - arguments ; - pas de faux quatrième enfant. | Une source ne permet pas de savoir lequel. Attendu : - mention non résolue ; - candidats ; - arguments ; - pas de faux quatrième enfant. |
| REC-CDCF-CU14 | CU-14 | CHARBONNET / CHARBONNIER : Deux sources donnent deux formes. Attendu : - deux formes conservées ; - aucune correction croisée ; - recherche via variantes. | Deux sources donnent deux formes. Attendu : - deux formes conservées ; - aucune correction croisée ; - recherche via variantes. |
| REC-CDCF-CU15 | CU-15 | Emploi 1834 / 1837 / 1841 : Attendu : - trois attestations ; - pas de continuité automatique ; - hypothèse éventuelle distincte. | Attendu : - trois attestations ; - pas de continuité automatique ; - hypothèse éventuelle distincte. |
| REC-CDCF-CU16 | CU-16 | Photo « Joseph / Paul » : Attendu : - deux annotations concurrentes ; - auteur/date si connus ; - témoin Journal possible ; - pas d'écrasement. | Attendu : - deux annotations concurrentes ; - auteur/date si connus ; - témoin Journal possible ; - pas d'écrasement. |
| REC-CDCF-CU17 | CU-17 | Convoi de 24 personnes : Une personne identifiée, 23 inconnues. Attendu : - collectif ; - positions non résolues ; - individualisation progressive ; - pas de 23 faux individus. | Une personne identifiée, 23 inconnues. Attendu : - collectif ; - positions non résolues ; - individualisation progressive ; - pas de 23 faux individus. |
| REC-CDCF-CU18 | CU-18 | Statistique « 47 personnes à Dolé » : Une identité est scindée. Attendu : - résultat courant peut devenir 48 ; - publication 2028 reste 47 ; - diff explicable. | Une identité est scindée. Attendu : - résultat courant peut devenir 48 ; - publication 2028 reste 47 ; - diff explicable. |
| REC-CDCF-CU19 | CU-19 | Témoignage sous embargo utilisé dans une conclusion : Attendu : - ne pas contourner embargo ; - publication possible seulement si démonstration indépendante ou règles le permettent ; - provenance masquée si nécessaire. | Attendu : - ne pas contourner embargo ; - publication possible seulement si démonstration indépendante ou règles le permettent ; - provenance masquée si nécessaire. |
| REC-CDCF-CU20 | CU-20 | Validation 2028, preuve disparue 2035 : Attendu : - validation historique conservée ; - vérifiabilité actuelle dégradée ; - Echo peut créer tâche « retrouver fondement ». | Attendu : - validation historique conservée ; - vérifiabilité actuelle dégradée ; - Echo peut créer tâche « retrouver fondement ». |
| REC-CDCF-CU21 | CU-21 | Arsène CHARBONNÉ dans deux Trees : Attendu : - deux Trees souverains ; - même entité Core possible ; - aucune mise en relation automatique des propriétaires ; - imports/contributions séparés. | Attendu : - deux Trees souverains ; - même entité Core possible ; - aucune mise en relation automatique des propriétaires ; - imports/contributions séparés. |
| REC-CDCF-CU22 | CU-22 | Recherche d'une personne sans nom : Profil : - femme ; - Deshaies ; - période ; - enfants ; - lieu ; - relations. Attendu : - recherche par contraintes ; - candidats ; - compatibilités ; - incompatibilités ; - prochaine preuve discriminante ; - pas de Personne fictive créée pour le profil. | Profil : - femme ; - Deshaies ; - période ; - enfants ; - lieu ; - relations. Attendu : - recherche par contraintes ; - candidats ; - compatibilités ; - incompatibilités ; - prochaine preuve discriminante ; - pas de Personne fictive créée pour le profil. |
| REC-CDCF-CU23 | CU-23 | Première/dernière attestation : Attendu : - « première attestation connue » ; - « dernière attestation connue » ; - pas « arrivée » ou « disparition » automatique. | Attendu : - « première attestation connue » ; - « dernière attestation connue » ; - pas « arrivée » ou « disparition » automatique. |
| REC-CDCF-CU24 | CU-24 | Autorisation de voyage : Attendu : - intention/autorisation ; - pas de voyage créé sans preuve de réalisation. | Attendu : - intention/autorisation ; - pas de voyage créé sans preuve de réalisation. |
| REC-CDCF-CU25 | CU-25 | Série d'archives avec acte manquant : Attendu : - anomalie ; - pistes ; - pas de conclusion automatique « détruit ». | Attendu : - anomalie ; - pistes ; - pas de conclusion automatique « détruit ». |
| REC-CDCF-CU26 | CU-26 | Les Colimaçons : familles, habitations et trajectoires : Un chercheur reconstitue le quartier des Colimaçons (Saint-Leu, La Réunion) : familles BOURBON, BOVALO, ANNAMALÉ, habitations, propriétaires, trajectoires. Il y contribue depuis son arbre uniquement BOURBON (Sosa 27) et BOVALO (Sosa 31). Pour BOVALO : ascendance paternelle, descendance et unions ; le Sosa 30 apparaît comme conjoint, sans son ascendance ; la branche du Sosa 16 est exclue. Attendu : reconstitution propre au projet ; partage strictement limité ; aucune déduction possible des branches exclues ; aucune relation d'asservissement, de résidence ou de parenté sans assertion sourcée. | Un chercheur reconstitue le quartier des Colimaçons (Saint-Leu, La Réunion) : familles BOURBON, BOVALO, ANNAMALÉ, habitations, propriétaires, trajectoires. Il y contribue depuis son arbre uniquement BOURBON (Sosa 27) et BOVALO (Sosa 31). Pour BOVALO : ascendance paternelle, descendance et unions ; le Sosa 30 apparaît comme conjoint, sans son ascendance ; la branche du Sosa 16 est exclue. Attendu : reconstitution propre au projet ; partage strictement limité ; aucune déduction possible des branches exclues ; aucune relation d'asservissement, de résidence ou de parenté sans assertion sourcée. |
| REC-CDCF-CU27 | CU-27 | Arbre offert à un cousin : Le chercheur crée l'arbre de son cousin BOVALO, qui n'a pas de compte, y contribue au projet Les Colimaçons, puis le lui offre. Attendu : aucun faux compte ; recherches attribuées au chercheur ; invitation privée vérifiée ; partages actifs présentés avant l'acceptation ; transfert explicite et audité ; refus possible sans conséquence. | Le chercheur crée l'arbre de son cousin BOVALO, qui n'a pas de compte, y contribue au projet Les Colimaçons, puis le lui offre. Attendu : aucun faux compte ; recherches attribuées au chercheur ; invitation privée vérifiée ; partages actifs présentés avant l'acceptation ; transfert explicite et audité ; refus possible sans conséquence. |
| REC-CDCF-CU28 | CU-28 | Contribution externe : Un généalogiste importe son arbre Geneanet (GEDCOM) et propose certaines branches au projet. Attendu : provenance conservée ; rapprochements proposés, jamais imposés ; réimport sans écrasement ; aucune synchronisation continue présumée. | Un généalogiste importe son arbre Geneanet (GEDCOM) et propose certaines branches au projet. Attendu : provenance conservée ; rapprochements proposés, jamais imposés ; réimport sans écrasement ; aucune synchronisation continue présumée. |
| REC-CDCF-CU29 | CU-29 | Programme antillais fédéré : Un programme comprend des projets Guadeloupe et Martinique, organisés par commune ou par habitation. Un contributeur rejoint uniquement Pointe-Noire. Attendu : accès limité à Pointe-Noire ; aucune lecture des projets frères ni du parent par le seul fait du programme ; l'administrateur du programme ne lit pas les sous-projets ; recherches transversales filtrées. | Un programme comprend des projets Guadeloupe et Martinique, organisés par commune ou par habitation. Un contributeur rejoint uniquement Pointe-Noire. Attendu : accès limité à Pointe-Noire ; aucune lecture des projets frères ni du parent par le seul fait du programme ; l'administrateur du programme ne lit pas les sous-projets ; recherches transversales filtrées. |
| REC-CDCF-CU30 | CU-30 | Militaires réunionnais de 1914--1918 : Un projet inventorie 10 000 fiches matricules, répartit leur transcription en lots entre bénévoles, propose des identifications, les rapproche d'actes de naissance et d'arbres, puis publie des rapports. Attendu : lots à accès limité et temporaire ; avancement constaté ; fiche recensée, consultée, transcrite, personne identifiée et personne reliée à un arbre distinguées ; indicateurs avec dénominateur, incertitudes et périmètre ; rapport figé et explicable. | Un projet inventorie 10 000 fiches matricules, répartit leur transcription en lots entre bénévoles, propose des identifications, les rapproche d'actes de naissance et d'arbres, puis publie des rapports. Attendu : lots à accès limité et temporaire ; avancement constaté ; fiche recensée, consultée, transcrite, personne identifiée et personne reliée à un arbre distinguées ; indicateurs avec dénominateur, incertitudes et périmètre ; rapport figé et explicable. |
| REC-CDCF-CU31 | CU-31 | Fédération des généalogies réunionnaises : Un programme durable rapproche des arbres et projets autonomes relatifs à La Réunion, sans les fusionner. Attendu : recoupements signalés ; divergences et permissions propres conservées ; aucun « super-arbre » fusionné ; fédération sans hiérarchie imposée. | Un programme durable rapproche des arbres et projets autonomes relatifs à La Réunion, sans les fusionner. Attendu : recoupements signalés ; divergences et permissions propres conservées ; aucun « super-arbre » fusionné ; fédération sans hiérarchie imposée. |
| REC-CDCF-CR01 | Critère 1 | Corpus illustrant le critère 1, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une information affichée comme factuelle doit avoir un statut épistémique compréhensible. |
| REC-CDCF-CR02 | Critère 2 | Corpus illustrant le critère 2, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une correction de transcription ne doit pas écraser l'image/source ni les anciennes versions scientifiques. |
| REC-CDCF-CR03 | Critère 3 | Corpus illustrant le critère 3, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une autre source ne doit pas corriger silencieusement la lecture d'un document. |
| REC-CDCF-CR04 | Critère 4 | Corpus illustrant le critère 4, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une fusion historique incertaine doit rester réversible. |
| REC-CDCF-CR05 | Critère 5 | Corpus illustrant le critère 5, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une personne peut exister sans Tree. |
| REC-CDCF-CR06 | Critère 6 | Corpus illustrant le critère 6, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une personne peut exister sans descendant connu. |
| REC-CDCF-CR07 | Critère 7 | Corpus illustrant le critère 7, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une personne peut exister avec identité très incomplète. |
| REC-CDCF-CR08 | Critère 8 | Corpus illustrant le critère 8, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une donnée privée ne rejoint pas le Core partagé sans action autorisée. |
| REC-CDCF-CR09 | Critère 9 | Corpus illustrant le critère 9, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un import Core → Tree ne modifie pas silencieusement Tree. |
| REC-CDCF-CR10 | Critère 10 | Corpus illustrant le critère 10, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une comparaison Tree ↔ Tree n'alimente pas automatiquement Core. |
| REC-CDCF-CR11 | Critère 11 | Corpus illustrant le critère 11, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une publication ne contourne pas un embargo. |
| REC-CDCF-CR12 | Critère 12 | Corpus illustrant le critère 12, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une carte n'affiche pas plus de précision que les données. |
| REC-CDCF-CR13 | Critère 13 | Corpus illustrant le critère 13, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une statistique calculée conserve corpus et méthode. |
| REC-CDCF-CR14 | Critère 14 | Corpus illustrant le critère 14, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une proposition IA reste distincte d'une validation humaine. |
| REC-CDCF-CR15 | Critère 15 | Corpus illustrant le critère 15, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une citation versionnée reste résoluble. |
| REC-CDCF-CR16 | Critère 16 | Corpus illustrant le critère 16, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une preuve devenue inaccessible modifie la vérifiabilité, pas l'histoire de validation. |
| REC-CDCF-CR17 | Critère 17 | Corpus illustrant le critère 17, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Des sources dépendantes ne sont pas comptées naïvement comme indépendantes. |
| REC-CDCF-CR18 | Critère 18 | Corpus illustrant le critère 18, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une mémoire peut être capturée avant structuration. |
| REC-CDCF-CR19 | Critère 19 | Corpus illustrant le critère 19, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une recherche négative conserve son périmètre. |
| REC-CDCF-CR20 | Critère 20 | Corpus illustrant le critère 20, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une question résolue peut être rouverte si ses fondements changent. |
| REC-CDCF-CR21 | Critère 21 | Corpus illustrant le critère 21, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un projet clôturé peut être réouvert sans perdre son état de clôture. |
| REC-CDCF-CR22 | Critère 22 | Corpus illustrant le critère 22, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une nouvelle catégorie historique ne force pas une nouvelle application. |
| REC-CDCF-CR23 | Critère 23 | Corpus illustrant le critère 23, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un projet privé peut utiliser tout le modèle Core sans contribuer au commun. |
| REC-CDCF-CR24 | Critère 24 | Corpus illustrant le critère 24, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une contribution crée une filiation et non une synchronisation. |
| REC-CDCF-CR25 | Critère 25 | Corpus illustrant le critère 25, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une suppression/restriction se propage honnêtement aux dépendances. |
| REC-CDCF-CR26 | Critère 26 | Corpus illustrant le critère 26, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un terme historique offensant peut être conservé fidèlement et contextualisé. |
| REC-CDCF-CR27 | Critère 27 | Corpus illustrant le critère 27, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une classification historique n'est pas automatiquement un attribut intrinsèque. |
| REC-CDCF-CR28 | Critère 28 | Corpus illustrant le critère 28, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un groupe analytique n'est pas un groupe historique. |
| REC-CDCF-CR29 | Critère 29 | Corpus illustrant le critère 29, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une cooccurrence n'est pas une relation sociale. |
| REC-CDCF-CR30 | Critère 30 | Corpus illustrant le critère 30, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une proximité spatio-temporelle n'est pas une causalité. |
| REC-CDCF-CR31 | Critère 31 | Corpus illustrant le critère 31, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une décision institutionnelle n'est pas la réalité automatique de son exécution. |
| REC-CDCF-CR32 | Critère 32 | Corpus illustrant le critère 32, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une autorisation n'est pas une réalisation. |
| REC-CDCF-CR33 | Critère 33 | Corpus illustrant le critère 33, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une source prescrite n'est pas une source existante. |
| REC-CDCF-CR34 | Critère 34 | Corpus illustrant le critère 34, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un URL mort n'efface pas l'identité documentaire. |
| REC-CDCF-CR35 | Critère 35 | Corpus illustrant le critère 35, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un badge ne remplace pas une preuve. |
| REC-CDCF-CR36 | Critère 36 | Corpus illustrant le critère 36, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une majorité de validateurs ne remplace pas une preuve décisive. |
| REC-CDCF-CR37 | Critère 37 | Corpus illustrant le critère 37, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une personne concernée peut témoigner sans devenir propriétaire de la vérité. |
| REC-CDCF-CR38 | Critère 38 | Corpus illustrant le critère 38, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une communauté concernée peut contextualiser sans réécrire la source. |
| REC-CDCF-CR39 | Critère 39 | Corpus illustrant le critère 39, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un financement déclaré ne devient pas automatiquement un biais. |
| REC-CDCF-CR40 | Critère 40 | Corpus illustrant le critère 40, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un contributeur pseudonyme reste traçable selon les règles internes. |
| REC-CDCF-CR41 | Critère 41 | Corpus illustrant le critère 41, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un résultat peut être marqué potentiellement obsolète sans recalcul immédiat. |
| REC-CDCF-CR42 | Critère 42 | Corpus illustrant le critère 42, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un workspace privé ne modifie pas le Core. |
| REC-CDCF-CR43 | Critère 43 | Corpus illustrant le critère 43, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une Inbox accepte du brut. |
| REC-CDCF-CR44 | Critère 44 | Corpus illustrant le critère 44, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une API ne doit pas aplatir l'incertitude. |
| REC-CDCF-CR45 | Critère 45 | Corpus illustrant le critère 45, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un export patrimonial doit rester intelligible hors de GENIIUS. |
| REC-CDCF-CR46 | Critère 46 | Corpus illustrant le critère 46, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une restauration privée ne republie pas automatiquement dans le Core. |
| REC-CDCF-CR47 | Critère 47 | Corpus illustrant le critère 47, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une nouvelle publication scientifique ne réécrit pas l'ancienne. |
| REC-CDCF-CR48 | Critère 48 | Corpus illustrant le critère 48, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un ancien état de connaissance doit pouvoir être reconstitué lorsque nécessaire. |
| REC-CDCF-CR49 | Critère 49 | Corpus illustrant le critère 49, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Les personnes peu documentées ne sont pas considérées moins importantes. |
| REC-CDCF-CR50 | Critère 50 | Corpus illustrant le critère 50, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Le système doit pouvoir dire « nous ne savons pas » sans fabriquer une réponse. |
| REC-CDCF-CR51 | Critère 51 | Corpus illustrant le critère 51, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un programme est un projet ; être administrateur du programme ne donne aucun accès aux contenus privés de ses sous-projets. |
| REC-CDCF-CR52 | Critère 52 | Corpus illustrant le critère 52, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un rattachement de sous-projet exige l'accord des deux parties et n'est pas transitif. |
| REC-CDCF-CR53 | Critère 53 | Corpus illustrant le critère 53, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un axe de recherche n'établit aucune relation historique. |
| REC-CDCF-CR54 | Critère 54 | Corpus illustrant le critère 54, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un sujet incertain peut être un axe sans création d'entité fictive. |
| REC-CDCF-CR55 | Critère 55 | Corpus illustrant le critère 55, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une habilitation de groupe n’élargit pas les droits quand le groupe change, sauf mode accepté ; un départ révoque immédiatement côté serveur. Hors ligne, les objets protégés deviennent inaccessibles à la reconnexion ou à l’échéance opposable, selon ce qui arrive d’abord (§ 122.2) ; les deltas personnels sont conservés sans droit d’intégration implicite. |
| REC-CDCF-CR56 | Critère 56 | Corpus illustrant le critère 56, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Déclarer une ressource ne donne aucun accès à cette ressource. |
| REC-CDCF-CR57 | Critère 57 | Corpus illustrant le critère 57, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | La réouverture d'un lot ne rend aucun droit à un bénévole dont la délégation a expiré. |
| REC-CDCF-CR58 | Critère 58 | Corpus illustrant le critère 58, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un avancement est constaté sur les objets, jamais saisi en pourcentage global. |
| REC-CDCF-CR59 | Critère 59 | Corpus illustrant le critère 59, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un partage de branche n'ouvre pas les branches non sélectionnées, même indirectement. |
| REC-CDCF-CR60 | Critère 60 | Corpus illustrant le critère 60, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Consultation et réutilisation sont deux autorisations distinctes ; la consultation est le défaut. |
| REC-CDCF-CR61 | Critère 61 | Corpus illustrant le critère 61, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un arbre peut être préparé pour un tiers sans compte et lui être transféré sans réattribuer les recherches. |
| REC-CDCF-CR62 | Critère 62 | Corpus illustrant le critère 62, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Un indicateur affiche son unité, son dénominateur, ses incertitudes et son périmètre ; un chiffre publié reste figé et explicable. |
| REC-CDCF-CR63 | Critère 63 | Corpus illustrant le critère 63, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une approbation éditoriale n'est ni une validation scientifique ni une autorisation de diffusion. |
| REC-CDCF-CR64 | Critère 64 | Corpus illustrant le critère 64, puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé. | Une révocation retire les accès sans détruire les réutilisations légitimes ni invalider les conclusions. |

**Bilan :** 33 TECH, 381 recettes identifiées, dont 31 CU et 64 critères amont repris ; aucune exécution déclarée. Les recouvrements sont conservés comme cas complémentaires ; leur relecture et les réserves sont consignées dans le rapport de revue finale du 13/10/2026. Les fixtures et scripts de campagne restent à réaliser.

Les exigences à justification technique ECD-19 ne sont pas faussement attribuées au CDCF. La ratification technique DC-CDCF-01 au CDCF § 135 clôt ECD-19 ; aucune origine fonctionnelle historique n’est inventée. Le protocole NF fixe les mesures et objectifs existants ; les paramètres explicitement différés doivent être signés avant campagne.
