# PT02 — Extension des preuves FK/UQ, graphe et diagnostic statistique

13 octobre 2026. **Étape historique à 23 scénarios, désormais complétée par [la traduction ciblée et campagne à 37 scénarios](GENIIUS_ARCHITECTURE_PT02_TRADUCTION_CAMPAGNE.md).** Les constats et chiffres ci-dessous décrivent cette étape antérieure, conservée dans [les résultats archivés](preuves/historique/RESULTATS_PROTOTYPE_PT02_AVANT_TRADUCTION_RELATIONNELLE.json). [Rapport courant](preuves/RAPPORT_PROTOTYPE_PT02.md). PT02 reste partiel, sans gel ni qualification NF10.

## Preuves acquises et constats résiduels

| Constat | Preuve exécutée | Portée et résidu |
|---|---|---|
| UQ-01 : collision cachée / référence absente | PT02-17 : même statut, corps et en-têtes, collision cachée réellement présente, aucun nouvel effet | Ordre autorisation des deux extrémités avant FK/UQ démontré pour le lien synthétique ; toutes les UQ/FK métier du MLD et leurs contrôles d'édition restent à traduire. |
| UQ-02 : collision visible / concurrence | PT02-18/19 : création puis conflit visible ; deux clients simultanés, un seul lien | Unicité PostgreSQL réelle et réponses admissibles sur cette relation ; pas inventaire complet des contraintes du MPD. |
| GRAPH-01 : rôles sans accès implicite | PT02-20/21 : module de référence V1.6 appelé par HTTP, comptes scientifiques vs administrateur/autorité/invité | Intégration du moteur de référence sous garde réelle ; état Python synthétique, pas implémentation relationnelle du moteur complet. |
| GRAPH-02 : titulaire / plusieurs espaces | PT02-22 : objet personnel visible au titulaire ; objet d'un autre espace réservé à son détenteur de droits | Attentes explicites, pas produites par l'évaluateur testé ; HI/HP, ensembles, admissions, dérogations, copies/protections multiples demandent d'autres corpus d'intégration. |
| TIME-01 : contrôle final par portion | PT02-06/07/08/15/16, DC-AUTH-02 ratifié | Résolu sur le banc ; transposition aux sorties réelles, portionnement et remise bloquée réservés. |
| NF10-01 : distributions et attaque de latence | PT02-23 : 64 paires / 128 requêtes, concurrences 1 et 4, classifieur appris/testé séparément | Diagnostic seulement ; aucun critère de conformité statistique ni profil de production ratifié. |

Ces preuves éliminent les constats « aucun essai FK/UQ » et « aucun appel du moteur de référence à travers HTTP ». Elles ne ferment pas leurs traductions complètes et ne prétendent pas couvrir tout le contrat V1.6.

## Protocole statistique exécuté

Deux paliers locaux : 1 et 4 clients concurrents. À chaque palier : 32 paires, objets caché 2 et absent 999, ordre mélangé avec la graine 20261013. Statut, corps et en-têtes doivent être identiques pour chaque paire. Horodatage monotone du client autour de la requête et de la lecture complète ; traces de SQL et HTTP conservées. Pas d'exclusion opportuniste de valeurs ni de résultat de conformité déduit des médianes.

Les 16 premières paires entraînent un classifieur à un seuil de latence, fixé à la moyenne des médianes des deux classes d'apprentissage ; son orientation suit leur ordre. Les 16 paires suivantes évaluent ce seuil sans réapprentissage. Le diagnostic publie 32 observations de test par palier, médianes/p95, différences appariées et p exploratoire de permutation des signes, avec 1999 tirages et graine consignée. Les paramètres de cet outil sont des paramètres de campagne, pas des tolérances de fuite ou seuils produit.

Résultats enregistrés : 17/32 classifications correctes à concurrence 1 et 16/32 à concurrence 4. p exploratoires 0,413 et 0,369. Cela décrit cette campagne ; ni un p élevé ni une exactitude proche de 1/2 ne démontrent une équivalence ou l'impossibilité d'une meilleure attaque.

Limites : corpus minuscule, différences caché/absent sur deux identifiants fixes, apprentissage antérieur au test sensible à la dérive temporelle, dépendances sous concurrence, coût Docker/psql et instrumentation, HTTP loopback sans pile réelle. L'inférence statistique doit examiner ces facteurs. La recherche spécialisée, charge des autres modules, répétition adaptative et attaques par différenciation de graphes ne sont pas couvertes.

## Campagne nécessaire avant clôture NF10 / MPD-03

1. Corpus jumeaux et manifestes approuvés : mêmes faits visibles, variations cachées de taille, profondeur, copies, protections, appartenances et restrictions ; inclure FK/UQ, comptes/personnes et dérogations. Oracles transcrits du contrat, distincts du moteur exécuté.
2. Implémentation représentative de la frontière Core, du stockage et des sorties ; mesures indépendantes de la création de processus psql, caches froids/chauds, plusieurs charges et reprises, débit/files/erreurs documentés.
3. Protocole fixé avant mesure : attaque envisagée et avantage à détecter, puissance/effectifs, répétitions, apprentissage/validation/test indépendants, contrôle des comparaisons multiples, critères d'échec et traitement de dérive/autocorrélation. La présente campagne ne fixe pas de tolérance de fuite.
4. Reproduire les attaques contre les invariants : sortie observable différente = constat, pas compensation par délai ; différence de délai détectée = investigation, pas gel automatique. Une absence de différence détectée seule ne clôt pas NF10.

Le budget de 100 €/mois et les six prototypes avant lancement restent en vigueur. Ces essais locaux n'engagent aucun coût cloud. Cette extension ne crée pas une validation de sécurité statistique par défaut et ne remplace pas la recette du moteur relationnel complet.

Sources : [permutations appariées, documentation officielle SciPy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html). L'outil utilise uniquement la bibliothèque standard, sans installation de SciPy.
