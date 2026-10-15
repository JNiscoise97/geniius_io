# PT02 — Critères de clôture du prototype et qualification différée

13 octobre 2026. **PT02 clos sur son périmètre réduit — décision du porteur du 13/10/2026.** Ce document précise le jalon d'architecture sans modifier NF10, le contrat V1.6 ou DC-AUTH-02. Les décisions SEC-03/04 et MPD-03 restent ouvertes. Il ne ratifie aucune pile.

## Deux niveaux de preuve

La clôture du prototype démontre la faisabilité du filtrage avant divulgation et du contrôle final sous garde, sur un corpus synthétique déclaré. La recette du Core qualifie l'implémentation complète, ses surfaces et ses conditions d'exploitation. Livrer toutes les commandes du Core et tout le MLD n'est pas un préalable à une clôture réduite de PT02 ; ces obligations restent des conditions de livraison et de gel global.

Les [37 cas PostgreSQL/HTTP](preuves/RAPPORT_PROTOTYPE_PT02.md) et leurs [empreintes](preuves/PREUVES_PROTOTYPE_PT02.json) demeurent inchangés. La preuve complémentaire [variantes du modèle](preuves/RESULTATS_PT02_VARIANTES_MODELE.json) comporte **12 tests réussis**, rejouables avec `python spec/prototypes/pt02/validate_scope.py`. Il s'agit de tests du modèle de référence en mémoire, sans SQL ni HTTP ; ils ne portent pas le total SQL/HTTP à 49.

| Variante | Preuve complémentaire exécutée | Limite et obligation de recette |
|---|---|---|
| Admissions HP | N06 : admission sans droit de repartage refusée ; N07 : retrait par tiers refusé ; a11 : rupture du fondateur coupe l'admission. | Traduire commandes, fondements et clôture dans le Core ; comparer SQL au modèle sur ces mêmes états. |
| Exclusions | N08 : retrait puis second compte de même personne ne contourne pas l'exclusion. | Matérialiser les exclusions par personne et les exclusions de fondateur ; le chargeur actuel rejette ces dernières. |
| Protections de groupes | S44 : ajout du gestionnaire à son groupe refusé ; S129 : membre non agréé refusé ; essai complémentaire : agrément donne accès, retrait du groupe le coupe. | Traduire appartenance et agrément distinctement ; le chargeur SQL actuel rejette les bénéficiaires de protection de type groupe. |
| Accords de garde | Matrice de 64 combinaisons cible/nombre/accord/finalité (§ 12.3) ; changement de gardien rend l'ancien accord inopérant. | SQL actuel ne franchit aucune protection interne par dérogation ; ne pas lui soumettre ces fixtures comme traduction complète. |
| Indépendance | S232 : subordination refusée ; S233 : intérêt dans le dossier refusé ; a16 : dérogation à son second compte refusée. | Traduire validation des actes, personnes, intérêts et subordination. La cardinalité des approbateurs testée en SQL ne remplace pas ces contrôles. |

Les 64 combinaisons sont des sous-tests d'une méthode, comptée une seule fois parmi les 12. Ces essais ont des attendus rédigés dans la batterie amont ; ils n'attestent pas une nouvelle revue indépendante. Les sources amont restent inchangées.

## Grille de clôture réduite

| Porte | Critère vérifiable | État actuel |
|---|---|---|
| C1 | Résultats SQL/HTTP passants, traces et empreintes concordantes, conteneur retiré. | Démontré par les 37 cas et le contrôleur PT02. |
| C2 | Filtrage avant comptes/facettes/pagination et avant FK/UQ ; sortie cachée/absente identique sur le corpus. | Démontré sur les surfaces synthétiques, pas sur toutes les surfaces produit. |
| C3 | Garde conservée à la remise ; révocation concurrente ; portion suivante réévaluée ; contrat temporel explicite. | Démontré ; DC-AUTH-02 ratifié ; borne de 4096 octets du banc seulement. |
| C4 | HI/HP, admissions, copie, échéance et génération fraîche comparés à des attendus et au modèle. | Démontré pour la traduction ciblée déclarée. |
| C5 | Variantes non traduites inventoriées, oracles amont rejoués, limites attribuées à la recette. | 12 tests passants ; tableau ci-dessus. Aucune équivalence SQL prétendue. |
| C6 | Asymétrie temporelle initiale investiguée, correction candidate et mesures conservées. | Démontré sur trois familles ; coût de compilation et interférences non qualifiés. |
| C7 | Protocole futur fixé avant mesure ; verdict d'absence de détection distingué de la conformité NF10. | Spécifié ci-dessous ; campagne de qualification non exécutée. |
| C8 | Périmètre réduit retenu dans une décision de clôture et reporté dans les registres, sans fermer les réserves produit. | **Acté le 13/10/2026** : réponse « ok fais le » du porteur à la proposition de statuer sur la clôture réduite, puis d’enchaîner PT03. Les résultats bruts sont conservés. |

Un FAIL fonctionnel non expliqué, une preuve incohérente ou un signal temporel reproductible non traité sur le périmètre revendiqué empêchent la clôture réduite. Un changement d'algorithme, de projection ou de garde impose de rejouer les cas concernés et de renouveler leurs empreintes. La clôture réduite permet d'enchaîner PT03 ; elle ne permet pas de livrer un Core non qualifié.

## Protocole NF10 de recette, fixé avant sa campagne

Statut : **spécification candidate, campagne non exécutée**. Le manifeste DIAGNOSTIC-03 et ses 512 requêtes restent des diagnostics historiques. Les effectifs ci-dessous ne leur sont pas appliqués rétrospectivement. Toute modification du protocole sera versionnée avant collecte ; l'ancien résultat sera conservé.

**Attaquant.** Acteur externe sans droit sur la cible, connaissant ou devinant son identifiant et capable de répéter les appels autorisés à son compte, d'observer statut, corps, taille, en-têtes et temps de réponse. Il connaît l'algorithme et dispose d'un corpus d'apprentissage distinct. Il peut charger ses propres routes dans les limites de débit prévues. Les compromissions du serveur/DB et les canaux physiques sont hors de ce protocole ; partager CPU, pool et caches avec d'autres comptes reste dans le périmètre des interférences à tester.

**Corpus.** États jumeaux caché/absent : même personne, identifiant, URL, données visibles et charge. Trois familles minimales : personnel caché, HP rompue, copie protégée. Ajouter les familles des variantes du tableau dès leur traduction, ainsi que protections sensibles et légales. Tester les surfaces réellement livrées : cible directe, recherche, rangs, facettes, compte, pagination, liens/conflits, notifications et export. Une surface manquante est « non qualifiée », jamais PASS par omission.

**Plan minimal par surface.** Pour les trois familles initiales : concurrences 1 et 4, caches froids et chauds, trois répétitions indépendantes à des dates/créneaux distincts. Chaque condition/répétition comprend 2 000 paires (4 000 réponses), soit **144 000 réponses par surface** pour ce socle. Les nouvelles familles augmentent cet effectif. Taille/index/cardinalités représentatifs, limites de débit et matériel sont inscrits avant mesure ; ils restent à fixer lors du dimensionnement. Exécuter d'abord localement, sans service payant ; toute campagne hébergée doit tenir dans l'enveloppe de 100 €/mois.

**Ordonnancement.** Ordre des mondes randomisé par bloc avec graines publiées ; monde installé atomiquement et clients joints avant changement. Préparer les caches selon le mode déclaré. Séparer chauffe et mesure avant collecte ; publier les deux. Aucun retrait d'observation pour améliorer le résultat. Timeouts, resets, erreurs, censures et traces de charge sont conservés ; un incident invalide une répétition entière avec justification, et son fichier reste archivé. Fractionner apprentissage/validation/test par blocs entiers pour éviter que des clients corrélés se retrouvent dans des partitions différentes.

**Apprentissage.** Par condition/répétition : premières 500 paires pour apprendre, 500 suivantes pour fixer les paramètres, 1 000 dernières pour un test scellé. Trois attaques préenregistrées : seuil univarié de latence, combinaison linéaire des observations disponibles, agrégation de 16 appels successifs. Publication des paramètres avant ouverture du test ; pas de choix du meilleur seuil sur le test. Un bloc/une séquence constitue l'unité statistique, pas chaque client concurrent. Pour l'agrégation, les séquences incomplètes sont conservées et signalées, sans ajouter des appels choisis après verdict.

**Analyse et répétitions.** Publier distributions, médiane/p95, différences appariées, exactitude et intervalles obtenus au niveau des blocs. Tester l'association monde/prédiction par permutation des étiquettes au niveau des blocs, 100 000 tirages et graines fixées. Corriger les comparaisons multiples par Holm à risque familial 5 % sur toutes les attaques/conditions/surfaces effectivement préenregistrées ; publier aussi les p bruts. Vérifier dérive entre répétitions, autocorrélation et dépendance de la charge. Si l'hypothèse d'échangeabilité des blocs ne tient pas, verdict statistique « indéterminé » et protocole révisé avant une nouvelle collecte.

**Sensibilité du banc.** Avant le test réel, injecter dans un corpus séparé une différence artificielle permettant 60 % de classification par l'attaque de seuil, puis vérifier sa détection sur au moins 90 % de 100 simulations selon le même plan de blocs/correction. Ces nombres qualifient la capacité du banc à détecter ce signal ; **ils n'autorisent aucune fuite à 59 %**, et ne sont pas un seuil NF10 produit. Une sensibilité insuffisante impose d'augmenter les effectifs avant collecte réelle.

**Verdicts prévus.** Toute différence déterministe de sortie ou accès indu est un échec fonctionnel immédiat. Un signal statistique corrigé déclenche une investigation et empêche la qualification de la condition concernée tant que sa cause n'est pas résolue ; une réplication confirme ou limite le constat, sans effacer le premier signal. Une campagne complète sans signal est « aucun canal détecté par ces attaques sur ce corpus », avec limites publiées. Une campagne incomplète, instable ou sans sensibilité vérifiée est « indéterminée ». **Aucun de ces verdicts ne constitue seul une preuve universelle d'indistinguabilité.** La conformité NF10 requiert également analyse des mécanismes et revue des surfaces ; aucune marge d'équivalence ou tolérance de fuite n'est créée ici.

## Réserves de livraison et gel global

À porter dans la recette Core/MPD : traduction complète et actes historiques ; indépendance et accords actuels ; toutes les FK/UQ métier ; identités HTTP ; TLS/proxy/CDN/stockage ; cache multi-compte ; annulation/panne de pool ; remises bloquées ; plafonds et précision temporelle ; coût de compilation/invalidation sous charge ; corpus/volumes représentatifs ; campagne NF10 et analyse de ses limites. Ces réserves restent opposables à SEC-03/04 et MPD-03 après une éventuelle clôture réduite.

**Décision consignée :** le périmètre C1–C8 est retenu ; PT02 est clos comme preuve de faisabilité ciblée. La [preuve de décision](preuves/DECISION_CLOTURE_PT02.json) lie les résultats exécutés et ce périmètre par empreintes. La qualification NF10 reste non acquise. PT03 traite ensuite synchronisation, compatibilité et horloge ; PT04–PT06 restent obligatoires avant le lancement demandé.
