# PT02 — Traduction relationnelle ciblée et campagne préspécifiée

13 octobre 2026. **37 scénarios réussis ; traduction ciblée et 512 requêtes de diagnostic statistique exécutées ; La qualification globale reste partielle ; PT02 est clos sur son périmètre réduit.** [Banc](../../spec/prototypes/pt02/README.md), [rapport](preuves/RAPPORT_PROTOTYPE_PT02.md), [résultats](preuves/RESULTATS_PROTOTYPE_PT02.json), [empreintes](preuves/PREUVES_PROTOTYPE_PT02.json). Architecture candidate ; aucun gel ni validation globale NF10.

## Ce qui est traduit dans PostgreSQL

Le schéma [relational.sql](../../spec/prototypes/pt02/relational.sql) stocke des faits normalisés. Le [chargeur](../../spec/prototypes/pt02/relational_probe.py) exporte des états synthétiques du modèle V1.6, sans exporter ses décisions d'accès. Les droits sont calculés par les fonctions SQL, notamment les dépendances HP récursives. Les sorties passent réellement par HTTP, sous garde canonique jusqu'à remise. Chaque comparaison a un attendu explicite, une décision du modèle et une réponse SQL/HTTP distincte.

| Table de banc | Concepts du MLD/catalogue | Traduction éprouvée |
|---|---|---|
| actor | acteur, autorisation_identite | Personne commune à deux comptes, identité du bénéficiaire ; pas de droit par qualité administrative. |
| object | objet, autorisation_titularite, filiation | Espace, titularité, copie/source, purge et non-levables d'ascendants. |
| hab | autorisation_habilitation/action/perimetre/beneficiaire/exclusion | HI/HP, rôle, état, échéance, actions, périmètre objet/contenu, acteur/groupe et exclusions. |
| founder | autorisation_fondateur/fondement | Source HP actuelle avec repartage requis ; chaîne et cycle/profondeur bornés, refus fermé. |
| member / admission | autorisation_membre_groupe/admission/admission_fondement | Appartenance au groupe distincte de l'admission ; retour au groupe ne ressuscite pas une admission close. |
| protection | autorisation_protection/personne/action, filiation | Protection matérialisée sur copie, bénéficiaires/gardiens du corpus, destinataires et actions ; levée origine ne lève pas copie. |
| derogation | autorisation_derogation, acte/approbation/finalite | Cibles, action voir, finalité, durée et niveau d'approbation actuel dans un corpus sans protection interne à franchir. |

Ces tables ne reproduisent pas tous les historiques HS, UUID, contraintes, actes et structures du MLD. Le chargeur prend une garde exclusive, remplace le corpus et incrémente l'époque dans une même transaction. Les lectures prennent une garde partagée. Les écritures métier de nomination/délégation/gouvernance sont réalisées par le modèle de référence pour construire les fixtures ; elles ne sont pas réimplémentées en SQL.

Le temps métier de ce corpus est le jour entier canonique du modèle, stocké en base. Il n'est pas fourni par le client HTTP. La preuve de temps serveur réel et de portion reste celle de DC-AUTH-02 / PT02-15/16. Ce découpage n'est pas une décision de représentation des dates au MPD.

## Constats éprouvés

| Cas | Attendu |
|---|---|
| PT02-24 | HI accorde encore après clôture du rôle du signataire. |
| PT02-25 | HP dérivée cesse après rupture de son fondement ; la forcer active dans une projection ne suffit pas à rétablir l'accès. |
| PT02-26 | Membre sans admission refusé ; admission donne accès ; retrait ferme ; réentrée seule ne ressuscite pas. |
| PT02-27 | Dérogation sans finalité refusée, bonne finalité acceptée, après échéance refusée. |
| PT02-28 | Copie protégée après protection originale ; lever l'original laisse la protection héritée opposable. |
| PT02-29 | HI expirée reste inopérante même si son indicateur active est forcé. |
| PT02-30 | Deux comptes de même personne bénéficient du même droit nominatif. |
| PT02-31 | Cible devenue sensible : dérogation à un approbateur insuffisante au niveau actuel requis. |
| PT02-32 | Non-levable d'un ascendant purgé reste opposable à sa copie. |
| PT02-33 | Filiation vers un ascendant absent : refus fermé. |
| PT02-35 | Génération périmée refusée ; compilation sous garde exclusive restaure les seuls droits canoniques. |
| PT02-36 | Instant métier changé sans nouvelle époque : projection ancienne refusée. |
| PT02-37 | Le lecteur ne peut ni compiler ni modifier la génération de projection. |

Le premier essai de PT02-31 supposait à tort que la perte de qualité d'un approbateur annulait rétroactivement son approbation. Le modèle ne suivait pas cet attendu ; le contrat § 12.3 exige explicitement le niveau actuel sur la cible. L'[essai rejeté](preuves/historique/RESULTATS_PROTOTYPE_PT02_HYPOTHESE_APPROBATEUR_REJETEE.json) est conservé. L'essai final éprouve le passage réel à une cible sensible et l'insuffisance du nombre d'approbations. Aucun changement du contrat gelé ou du modèle n'a été effectué pour rendre cet essai passant.

## Protocole fixé avant la nouvelle mesure

Le [manifeste versionné](../../spec/prototypes/pt02/nf10_campaign.json) fixe les corpus, graines, ordonnancements, effectifs et méthodes avant PT02-34. Les jumeaux sont construits par `jumeau_sans` du corpus V1.6 : même acteur, même identifiant cible et même URL, dans un état caché et un état où cette cible n'existe pas.

Trois corpus : objet personnel caché ; HP rompue ; copie sous protection héritée. Deux concurrences : 1 et 4. Chaque famille/palier utilise 32 paires, soit 384 requêtes. Les états sont installés sous garde exclusive ; un bloc de clients lit un même état, puis les clients sont joints avant changement d'état. L'ordre caché/absent est mélangé par bloc. Aucun échantillon n'est exclu pour améliorer le résultat.

Statut, corps ou en-têtes différents, accès accordé à une cible cachée ou erreur serveur constituent un échec fonctionnel. Les traces et mesures publient médiane/p95, différences appariées, p exploratoire de permutation à 1999 tirages et classifieur de latence : 16 paires d'apprentissage, 16 autres d'évaluation, aucun ajustement du seuil sur l'évaluation.

Le protocole est **diagnostique**. Son critère de conformité statistique et sa tolérance de fuite sont explicitement nuls/non définis dans le manifeste. Ni un p élevé ni une classification proche du hasard ne démontrent l'équivalence ; une différence observée doit être investiguée. La dépendance entre clients/blocs, la dérive, le petit corpus et les coûts Docker/psql limitent la portée. Aucune qualification NF10 n'est déduite du seul succès fonctionnel.

## Conditions restantes de clôture globale

- Étendre/durcir la traduction aux autres opérations, périmètres et bénéficiaires, fondements/admissions HP complets, exclusions individuelles, protection/agrément de groupes, dérogations à accords de garde, indépendance complète/subordination/intérêts, restrictions légales et succession. Les formes non prises en charge par le chargeur sont rejetées plutôt que traduites par approximation.
- Traduire les commandes métier, leurs gardes et leurs historiques dans le MPD/Core ; éprouver toutes les FK/UQ pertinentes et les surfaces recherche/rangs/statistiques/notifications/exports, pas seulement le lien synthétique.
- Fixer le protocole de qualification statistique et un modèle d'attaque avant recette représentative : puissance, effectifs/répétitions, adversaire, apprentissage/validation/test, dérive/corrélation et comparaisons multiples, sans tolérance de fuite implicitement inventée.
- Éprouver les sorties réelles, caches froids/chauds, proxy/CDN/stockage, portionnements et remises bloquées. Les coûts de création de processus de ce banc ne représentent pas la future API.

Les clôtures obtenues sont ciblées sur les mécanismes et corpus ci-dessus. La qualification globale reste partielle ; PT02 est clos sur son périmètre réduit ; les réserves SEC-03/04 et MPD-03 restent opposables au gel. Aucun service payant engagé ; plafond de 100 €/mois conservé.

## Investigation des différences de délai et variante candidate

La [campagne avant projection admissible](preuves/historique/RESULTATS_PROTOTYPE_PT02_AVANT_PROJECTION_ADMISSIBLE.json) présente des différences exploratoires : p de 0,0095 pour personnel caché à concurrence 1 et 0,0045 pour HP rompue à concurrence 1. Ce ne sont pas des critères de gel ni une preuve d'exploitation ; ils ont déclenché une mesure séparée.

Le [diagnostic SQL avant correction](preuves/historique/DIAGNOSTIC_SQL_LATENCE_PT02_AVANT_PROJECTION_ADMISSIBLE.json) mesure 12 blocs par famille, 20 itérations de chauffe puis 200 mesures par état et bloc, ordre mélangé. Médianes des médianes par bloc : personnel caché 1,0465 ms contre absent 0,22925 ms ; HP rompue 0,80075 ms contre absent 0,22375 ms. Dans les deux familles, caché coûte davantage dans 12/12 blocs. Le chronométrage serveur exclut le transport HTTP et la création du processus psql de chaque mesure ; appels et lecture d'horloge sont inclus, boucles corrélées et corpus minuscule. Il révèle une asymétrie de la primitive, pas une recette de confidentialité globale.

Le rendu initial quittait tôt sur une cible absente, tandis qu'une cible cachée sollicitait plus de fondements. La variante candidate compile les clés admissibles avec `allowed` en SQL, sous garde exclusive, puis publie époque, instant métier et génération avec les faits. La lecture garde l'autorité partagée, exige génération/époque/instant concordants, et consulte la clé admissible **avant** toute lecture de contenu. Une clé manquante ne déclenche plus l'évaluation des fondements de la cible. Une génération ou un instant périmé impose un refus fermé ; aucune décision Python n'est importée dans cette projection.

La campagne PT02-34 est rejouée contre cette variante ; [diagnostic SQL après correction](preuves/DIAGNOSTIC_SQL_LATENCE_PT02.json). Une diminution de l'écart n'établit pas à elle seule l'équivalence. Le coût de compilation exhaustive, le partage de ressources, la croissance des index, l'actualisation incrémentale et les chemins de mutation restent à éprouver. Dans ce corpus, l'instant est le jour canonique du modèle ; ce n'est pas une autorisation de quantifier l'horloge de production par jour. Cette variante n'adopte aucun égaliseur de délai ni seuil de fuite.

La campagne finale réutilise quatre connexions SQL de lecture, déclarées dans le manifeste DIAGNOSTIC-03 avant mesure, au lieu de créer un processus Docker/psql par requête. Les comparaisons antérieures sont conservées [avant réutilisation](preuves/historique/RESULTATS_PROTOTYPE_PT02_AVANT_CONNEXIONS_REUTILISEES.json). Tous les tests fonctionnels sont rejoués ; les connexions sont fermées avant retrait du conteneur. Pannes de pool, annulation et pression de production restent à qualifier.

Le diagnostic final SQL constate des médianes de blocs de 0,147 ms caché contre 0,138 ms absent pour le personnel ; 0,15775 ms contre 0,17425 ms pour HP rompue. L'asymétrie initiale est fortement réduite sur ce corpus, sans preuve d'équivalence. Les mesures HTTP finales ne retrouvent pas les mêmes signaux exploratoires dans cette répétition ; distributions et classifieurs restent publiés, sans exclusion des résultats précédents ni clôture NF10.

Trois contrôles du diagnostic vérifient le calcul SQL direct et le rendu projeté avec une génération **fraîche** : HP marquée active sans fondement, HI marquée active mais expirée, ascendant manquant. Les deux chemins refusent. Ces essais distinguent la coupure par le calcul de droits de la seule invalidation de génération des tests HTTP de corruption.

## Distinction entre clôture du prototype et recette

Les conditions de clôture globale ci-dessus concernent le Core complet et son gel. Elles ne rendent pas toute son implémentation préalable à la clôture réduite du prototype. Le [dossier de critères C1–C8](GENIIUS_ARCHITECTURE_PT02_CRITERES_CLOTURE.md) inventorie les preuves, douze tests complémentaires du modèle et le protocole NF10 futur. PT02 est clos sur ce périmètre réduit par décision du porteur le 13/10/2026 ; les réserves de livraison subsistent.
