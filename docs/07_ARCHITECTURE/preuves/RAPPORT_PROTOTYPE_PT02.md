# PT02 — Graphe visible, recherche et remise HTTP

**Verdict expérimental : PARTIEL_UQ_GRAPHE_NF10. 37/37 scénarios réussis ; PT02 clos sur son périmètre réduit.**

Décision du porteur du 13/10/2026 : [critères C1–C8](../GENIIUS_ARCHITECTURE_PT02_CRITERES_CLOTURE.md), [preuve de décision](DECISION_CLOTURE_PT02.json). Douze tests complémentaires du modèle réussis ; qualification globale NF10 et recette Core/MPD réservées. Les résultats bruts conservent leur verdict de campagne antérieur à cette décision.

- Campagne UTC : 2026-10-13T09:54:37.305514+00:00 → 2026-10-13T09:57:46.973689+00:00.
- Serveur : PostgreSQL 16.14 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit.
- Image : sha256:57c72fd2a128e416c7fcc499958864df5301e940bca0a56f58fddf30ffc07777.
- HTTP réel sur 127.0.0.1:64065, client standard Python.
- Conteneur retiré : True. PostgreSQL sans réseau externe, port publié ni montage hôte.
- Coût cloud engagé : 0 €. Budget de 100 €/mois avant abonnements conservé.
- [Résultats HTTP/SQL et sources](RESULTATS_PROTOTYPE_PT02.json). [Banc](../../../spec/prototypes/pt02/README.md).

PT02 conserve le périmètre du registre (graphe/search/compteurs/caché-absent) et ajoute les essais de sortie annoncés : pages, flux, cache, URL et succès après commit. Les gardes et transactions sont réellement exécutées dans PostgreSQL ; les réponses passent par une socket HTTP loopback.

| Cas | Objet | Verdict |
|---|---|---|
| PT02-01 | Graphe filtré avant compte/facettes/suggestions/pagination | PASS |
| PT02-02 | Cible cachée et absente : réponses HTTP identiques | PASS |
| PT02-03 | Protection ascendant opposable à la copie | PASS |
| PT02-04 | Révocation entre deux pages | PASS |
| PT02-05 | Cache préparé non réutilisé après révocation | PASS |
| PT02-06 | Expiration entre préparation et contrôle final | PASS |
| PT02-07 | Garde conservée à la remise HTTP et révocation bloquée | PASS |
| PT02-08 | Révocation entre deux portions de flux HTTP | PASS |
| PT02-09 | Ancienne URL réévaluée après révocation | PASS |
| PT02-10 | Succès HTTP après commit confirmé et effets atomiques | PASS |
| PT02-11 | Échec de commit : aucun succès HTTP ni effet canonique | PASS |
| PT02-12 | Rôle lecture sans accès direct aux tables | PASS |
| PT02-13 | Protection ajoutée : cache/projection ancienne non opposables | PASS |
| PT02-14 | Paires caché/absent répétées : sorties identiques, délais exploratoires | PASS |
| PT02-15 | Page engagée avant échéance, remise tardive admise ; requête suivante refusée | PASS |
| PT02-16 | Portion de flux engagée avant échéance, remise tardive admise ; portion suivante refusée | PASS |
| PT02-17 | FK/UQ : collision cachée et référence absente refusées avant insertion | PASS |
| PT02-18 | UQ sur lien visible : création puis conflit admissible | PASS |
| PT02-19 | UQ concurrente : un seul lien, création/conflit cohérents | PASS |
| PT02-20 | Moteur de référence V1.6 : rôles scientifiques, graphe filtré avant compte | PASS |
| PT02-21 | Moteur de référence V1.6 : administration/autorité/invitation sans droit implicite | PASS |
| PT02-22 | Moteur de référence V1.6 : titularité personnelle et isolation interespaces | PASS |
| PT02-23 | Diagnostic statistique caché/absent sous charges 1 et 4, sans clôture NF10 | PASS |
| PT02-24 | SQL HI : survie au signataire avec comparaison à V1.6 | PASS |
| PT02-25 | SQL HP : fondement récursif rompu, projection dépendante active refusée | PASS |
| PT02-26 | SQL groupe/admission : membre seul refusé, retrait et réentrée sans résurrection | PASS |
| PT02-27 | SQL dérogation : cible/finalité/échéance opposables | PASS |
| PT02-28 | SQL copies : protection héritée opposable, levée origine sans levée copie | PASS |
| PT02-29 | SQL expiration HI opposable malgré projection active | PASS |
| PT02-30 | SQL bénéficiaire par personne : deux comptes, mêmes droits | PASS |
| PT02-31 | SQL dérogation : cible devenue sensible, niveau actuel à deux approbateurs requis | PASS |
| PT02-32 | SQL copie : non-levable sur ascendant purgé reste opposable | PASS |
| PT02-33 | SQL copie : ascendant manquant, refus fermé | PASS |
| PT02-34 | Campagne préspécifiée : même URL, trois corpus jumeaux, deux paliers de charge | PASS |
| PT02-35 | Projection : génération ancienne refusée, recompilation restaure les droits canoniques | PASS |
| PT02-36 | Projection : temps changé sans nouvelle époque, refus fermé | PASS |
| PT02-37 | Projection : lecteur sans droit de compilation ni modification | PASS |

## Résolution temporelle ratifiée

[DC-AUTH-02](../../04_CONTRAT_AUTORISATION/GENIIUS_AMENDEMENT_LECTURES_DC_AUTH_02.md) définit l’engagement de chaque portion au contrôle final serveur sous garde jusqu’à remise. Le rendu et tous ses compteurs utilisent un instant canonique unique. Une portion déjà engagée peut être remise après échéance ; chaque nouvelle requête/portion est réévaluée. Aucune borne physique d’arrêt à échéance n’est revendiquée. Les en-têtes de succès du flux sont émis sous la garde de la première portion, après son contrôle.

PT02-15 et PT02-16 injectent une pause après contrôle, constatent l’expiration côté PostgreSQL et la remise HTTP tardive, puis vérifient le refus de la requête/portion suivante. La pause est réservée au banc.

PT02-15 :
- Contrôle : 2026-10-13T09:54:50.494162+00:00, échéance : 2026-10-13T09:54:52.486757+00:00, autorisé : True.
- Contrôle : 2026-10-13T09:54:50.498227+00:00, échéance : 2026-10-13T09:54:52.486757+00:00, autorisé : True.
- Horloge serveur avant remise tardive : 2026-10-13T09:54:52.542725+00:00.
- Contrôle : 2026-10-13T09:54:52.551187+00:00, échéance : 2026-10-13T09:54:52.486757+00:00, autorisé : False.
- Contrôle : 2026-10-13T09:54:52.554858+00:00, échéance : 2026-10-13T09:54:52.486757+00:00, autorisé : False.
- Contrôle : 2026-10-13T09:54:52.562357+00:00, échéance : 2026-10-13T09:54:52.486757+00:00, autorisé : False.

PT02-16 :
- Contrôle : 2026-10-13T09:54:52.679189+00:00, échéance : 2026-10-13T09:54:54.671946+00:00, autorisé : True.
- Horloge serveur avant remise tardive : 2026-10-13T09:54:54.751273+00:00.
- Contrôle : 2026-10-13T09:54:54.762485+00:00, échéance : 2026-10-13T09:54:54.671946+00:00, autorisé : False.

[CE01 historique](historique/RESULTATS_PROTOTYPE_PT02_AVANT_DC_AUTH_02.json) reste un échec de la borne physique remplacée, sans reclassement rétroactif. [Dossier temporel](../GENIIUS_ARCHITECTURE_PT02_SORTIE_TEMPORELLE.md). Le constat temporel est résolu selon la règle ratifiée ; SEC-03 garde ses réserves de transposition et de remise bloquée.

## Délais et non-divulgation

12 requêtes appariées, ordre mélangé avec graine 20261013 ; délais complets consignés dans les traces. Cette petite campagne explore les délais, sans seuil statistique de conformité NF10 ni inférence d’équivalence. Statut, corps et en-têtes identiques sont éprouvés ; les délais indistinguables restent à démontrer par le protocole MPD-03.

## Mécanisme et portée

Le rendu SQL reconstruit le graphe admissible avant pagination, compteurs, facettes et suggestions. La protection du parent ferme sa copie. Un cache préparé est une donnée provisoire, jamais une permission : avant sortie, le rendu est recalculé depuis l’autorité canonique. Une protection nouvelle devient opposable malgré ce cache ancien. Chaque portion de flux utilise une nouvelle transaction et une nouvelle évaluation ; après révocation, la deuxième portion n’est pas émise. Une URL connue ne conserve aucun accès autonome.

La garde partagée est conservée jusqu’à wfile.write/flush puis commit. PT02-07 observe un révocateur réellement bloqué ; les octets antérieurs à sa prise d’effet restent reçus, la requête suivante est refusée. Ce point de remise est celui de l’appel socket serveur, pas l’instant de réception réseau ; les noyaux/proxies/CDN ne sont pas simulés. Les en-têtes puis le corps sont des remises distinctes ; la contre-épreuve ne les prétend pas atomiques.

Le chemin mutation utilise le protocole PT01 : aucun effet visible depuis une autre connexion avant commit et aucun HTTP de succès avant sa confirmation. Un échec du contrôle final de commit annule tous les effets et répond introuvable.

- UQ/FK sur liens synthétiques éprouvées ; pas toutes contraintes MLD ni recherche spécialisée de production.
- Moteur de référence V1.6 appelé dans HTTP sur état Python synthétique ; sa traduction relationnelle complète reste à éprouver.
- Identité synthétique fixe ; aucune API authentifiée de production, TLS, proxy, CDN ou URL signée.
- Pas de garantie statistique NF10 ni benchmark NF02 ; réponses identiques ne prouvent pas délais indistinguables.
- Portion engagée au contrôle final selon DC-AUTH-02 ; aucune borne physique d arrêt à échéance.
- Taille maximale 4096 octets uniquement pour le banc ; paramètres et traitement des remises bloquées à éprouver avant livraison.
- HTTP local standard Python de banc ; aucune pile de production choisie.

## Suites nécessaires

Le choix temporel DC-AUTH-02 est ratifié et éprouvé sur ce banc. Compléter UQ, graphe complet, compteurs/rangs de production et campagne statistique NF10/MPD-03 avant clôture globale PT02. Dimensionnement des portions, traitement des remises bloquées, proxy/CDN/stockage et Core réel restent à éprouver. La borne de 4096 octets est seulement un paramètre de banc. Aucun gel d’architecture ni choix de pile.

## Sources techniques

[Verrous PostgreSQL](https://www.postgresql.org/docs/16/explicit-locking.html), [serveur HTTP Python](https://docs.python.org/3/library/http.server.html). Le serveur standard sert seulement au banc ; sa documentation ne le recommande pas pour la production. Les preuves de ce rapport sont les résultats enregistrés.

## Extension FK/UQ et moteur de référence

PT02-17 refuse une collision cachée réelle et une référence absente avant FK/UQ avec les mêmes sorties HTTP. PT02-18 crée un lien visible puis retourne un conflit visible ; PT02-19 soumet deux créations concurrentes et constate un seul lien, une création et un conflit. Le dernier contrôle temporel de la mutation suit sa préparation et précède le commit. Ce rôle SQL est technique ; les droits métier d’édition des liens ne sont pas modélisés par ce fixture.

PT02-20 à 22 appellent le module de référence V1.6 sans le modifier, à travers une frontière HTTP sous garde SQL. Les attentes sont explicites : rôles scientifiques voient l’objet scientifique, administrateur/autorité/invité ne gagnent aucun droit implicite, le titulaire voit son objet personnel et RS2 voit l’objet de son autre espace. L’état métier est le fixture Python du modèle ; aucune transposition relationnelle complète du moteur n’est prétendue. Cette intégration ne remplace pas la batterie exhaustive amont.

## Diagnostic statistique renforcé

| Concurrence | Paires | Médiane caché ms | Médiane absent ms | p permutation exploratoire | Classifieur test |
|---|---|---|---|---|---|
| 1 | 32 | 10.174 | 10.656 | 0.0500 | 20/32 |
| 4 | 32 | 22.476 | 22.040 | 0.7115 | 15/32 |

PT02-23 exécute 128 requêtes appariées sous concurrences 1 et 4. L’ordre est mélangé avec une graine publiée. Un classifieur de latence est appris sur 16 paires et évalué sur 16 autres par palier ; un test de permutation par changement de signe des différences utilise 1999 tirages. Aucun seuil produit ni tolérance de fuite n’est adopté. Un p élevé ne prouve pas équivalence ; ces petites séries, les dépendances sous charge et le coût de lancement psql/Docker ne représentent pas une API de production. Toute différence doit être examinée, sans conclure automatiquement à sa cause ni à une fuite exploitable.

[Protocole et constats restants](../GENIIUS_ARCHITECTURE_PT02_UQ_GRAPHE_STATISTIQUES.md). [Principe des permutations appariées](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html) : implémentation stdlib dans ce banc, sans dépendance SciPy.

## Traduction relationnelle ciblée

PT02-24 à 33 utilisent des tables PostgreSQL de faits (acteurs/personnes, objets, habilitations, fondateurs, membres, admissions, protections et dérogations), exportées depuis des états synthétiques du modèle. Aucune décision d’accès précalculée n’est stockée. Le SQL calcule les droits, dont les chaînes HP récursives, puis produit la sortie HTTP sous garde canonique. Chaque comparaison confronte un attendu explicite, le modèle de référence et le résultat SQL/HTTP.

Les essais prouvent HI survivant au signataire, HP coupée malgré une projection dépendante active, admission requise pour un groupe, retrait/réentrée sans résurrection, échéance opposable malgré état actif, bénéficiaire par personne sur deux comptes, finalité/échéance/niveau actuel d’approbation de dérogation, protection héritée conservée après levée origine, non-levable sur ascendant purgé et refus sur ascendant manquant.

Portée ciblée : action voir, périmètres objet/contenu et bénéficiaires acteur/groupe. Temps métier en jours du corpus canonique, distinct de la preuve d’horloge réelle PT02-15/16. Les commandes métier d’émission, gouvernance et modification ne sont pas réimplémentées : le modèle construit les fixtures et leur chargement atomique est protégé par la garde exclusive. Les dérogations de ce corpus ne franchissent aucune protection interne ; approbations multiples/accords de garde, restrictions légales, successions et autres surfaces non éprouvées restent réservées. Le MLD complet n’est pas livré par ce banc.

## Campagne préspécifiée sur états jumeaux

Le [manifeste](../../../spec/prototypes/pt02/nf10_campaign.json) est fixé avant exécution. PT02-34 compare la même URL et le même acteur dans les états caché/absent construits par jumeau_sans du corpus V1.6. Trois familles : objet personnel caché, HP rompue et copie protégée ; concurrences 1 et 4 ; 32 paires par famille/palier, soit 384 requêtes supplémentaires. Statut/corps/en-têtes sont comparés ; ordre des deux états mélangé par bloc. Aucun critère de conformité statistique ni tolérance de fuite adopté.

| Famille | Concurrence | Paires | p exploratoire | Classifieur test |
|---|---|---|---|---|
| personnel_cache | 1 | 32 | 0.3925 | 14/32 |
| personnel_cache | 4 | 32 | 0.2610 | 18/32 |
| hp_rompue | 1 | 32 | 0.8035 | 17/32 |
| hp_rompue | 4 | 32 | 0.5575 | 14/32 |
| copie_protegee | 1 | 32 | 0.7105 | 12/32 |
| copie_protegee | 4 | 32 | 0.2165 | 20/32 |

Les p exploratoires et classifications décrivent cette campagne ; une différence observée exige investigation et une absence détectée ne démontre pas équivalence. Les corrélations de blocs, dérives, création de processus et petits corpus sont documentés. [Protocole et clôtures ciblées](../GENIIUS_ARCHITECTURE_PT02_TRADUCTION_CAMPAGNE.md). Aucun verdict global NF10, PT02 ou architecture.

## Correction candidate des chemins de refus

Les résultats [avant projection admissible](historique/RESULTATS_PROTOTYPE_PT02_AVANT_PROJECTION_ADMISSIBLE.json) ont motivé un [diagnostic SQL séparé](historique/DIAGNOSTIC_SQL_LATENCE_PT02_AVANT_PROJECTION_ADMISSIBLE.json). La variante initiale quittait tôt sur une cible absente et parcourait davantage de fondements pour une cible cachée. Le diagnostic serveur constate un coût médian supérieur pour caché dans 12/12 blocs sur les deux familles étudiées ; ce constat ne démontre pas à lui seul une exploitation HTTP.

La variante candidate compile les clés admissibles par le calcul SQL, sans importer les décisions Python. Faits, époque et génération sont publiés atomiquement sous garde exclusive. La lecture contrôle époque et jour canonique, puis consulte seulement la clé admissible avant toute lecture de contenu. Génération ou instant périmés : refus fermé. PT02-35/36 éprouvent ces refus, PT02-35 la restauration après compilation, PT02-37 les privilèges du lecteur.

Cette projection exhaustive appartient au corpus de banc. Coût de compilation, dimensionnement, mises à jour incrémentales, qualification temporelle au MPD, chemins de mutation et autres surfaces restent à éprouver ; ce n’est ni une tolérance de fuite ni un mécanisme d’égalisation par délai. [Diagnostic SQL après correction](DIAGNOSTIC_SQL_LATENCE_PT02.json), lorsqu’exécuté. La campagne rejouée demeure diagnostique, sans qualification NF10.

## Mesure SQL séparée après correction

Quatre connexions SQL sont réutilisées par HTTP ; le démarrage de Docker/psql ne fait plus partie de chaque requête. Le manifeste DIAGNOSTIC-03 consigne ce changement avant mesure. Résultats précédents conservés dans l’historique.

| Famille | Médiane de blocs caché ms | Médiane de blocs absent ms |
|---|---|---|
| personnel_cache | 0.147000 | 0.138000 |
| hp_rompue | 0.157750 | 0.174250 |

Le diagnostic inclut trois contrôles du noyau à génération fraîche : HP sans fondement, HI expirée, ascendant absent ; calcul direct et rendu projeté refusent. Les différences initiales sont réduites sur ce corpus. Ces mesures ne démontrent pas l’équivalence ni la conformité NF10.
