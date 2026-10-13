# Validation documentaire du dictionnaire V1.3 et stabilisation du MLD

**Date :** 12 octobre 2026. **Résultat :** dictionnaire V1.3 validé documentalement comme référence amont ; MLD V1.1-g stabilisé et revu, candidat au gel. Aucun gel formel du dictionnaire ou du MLD, ni recette de production, n'est prononcé.

## 1. Mandat et sources

Le porteur a demandé de « valider le dictionnaire V1.3 et stabiliser le MLD, avec les preuves de clôture des constats », puis a autorisé deux nouvelles revues indépendantes. Cette validation documentaire exécute ce mandat ; elle ne se présente pas comme une ratification du porteur d'un gel global.

Sources contrôlées : dictionnaire V1.3, MLD V1.1-g, catalogue relationnel explicite V1.6, contrat comportemental V1.6 gelé, audits AC-01 à AC-32 et NC-01 à NC-15, décisions d'instruction déjà retenues. Le MCD V1.2 et le contrat gelés ne sont pas modifiés. Les versions avant correction sont conservées dans `historique/…_AVANT_VALIDATION_V1_3.md`.

## 2. Corrections contrôlées

- **Autorisation :** 60 tables logiques explicites avec PK/FK typées, états et historiques HS ; identité multi-comptes concordante ; fondements propres aux admissions HP ; actes, dossiers, indépendance, garde, décès/succession, finalités et renouvellements. Les clichés de transfert conservent les associations entre bénéficiaires, fondateurs, admissions, exclusions et couvertures ; ils sont distincts de la vue filtrée du cessionnaire.
- **Traçabilité :** 304 DI actuelles identifiées et localisées ; disparition des preuves trompeuses « contrôle des 207 lignes ». Les 60 règles seulement listées dans CP-13 ont un énoncé normatif individuel, une portée, un contrôle atomique et une réserve de recette au MPD.
- **Purge :** colonnes de contenu/reconstruction neutralisables ; CK conditionnels hors purge ; activité neutralisée avec ses associations, codes et dates ; versions neutralisées exclues de l'unicité du courant. Les contraintes ne bloquent plus l'effacement de plusieurs versions. Les preuves tierces et les obligations légales restent distinctes de la projection effacée.
- **Versions et fidélité scientifique :** manifestes écrits à la création, confirmation sans réécriture, réductions calculées sur la version active ; prise en charge active implique acceptations, sans réactivation par acceptations anciennes ; périodes certaines inversées refusées et temps de situation exclusivement dans son extension.
- **Unicités et diffusion :** base privée si et seulement si auteur ; visibilité vérifiée avant unicités et filtrage des extrémités ; parution inter-espace avec acte d'acceptation référencé, sans occupation préalable du rang.
- **Hors ligne :** réception technique privée sans FK sur identifiants client avant résolution ; conservation du delta d'un commentateur extérieur ou d'une cible inexistante, puis contribution métier à FK réelles et réévaluation à l'intégration.

## 3. Preuves réellement obtenues

Commande reproductible : `python spec/validation/controler_documents.py --strict`.

| Contrôle | Résultat | Limite |
|---|---|---|
| Inventaire actuel | 327 tables nommées, hors développement des miroirs historiques | Catalogue logique, pas nombre de tables physiques déployées |
| FK dans le DDL logique principal | 497 références lues, aucune cible absente | Les macros et les obligations inter-tables ne sont pas une exécution SQL |
| Catalogue d'autorisation structuré | 60 tables ; aucune PK/FK locale ou cible typée absente | Vérification de représentation, pas simulation exhaustive d'accès |
| DI | 304 définitions et 304 lignes correspondantes, aucun manque dans les deux sens | Couverture nominative et localisation, pas 304 preuves sémantiques individuelles |
| CP-13 | 60/60 énoncés identiques aux définitions sources ; scénarios et variantes dans la revue données | Raisonnement documentaire, recette de production à implémenter |
| Syntaxe des contraintes logiques | Aucun déséquilibre de parenthèses ou double WHERE détecté | Ce contrôle ne remplace pas un parseur SQL d'une technologie choisie |
| Revue données indépendante | Avis final favorable sur les constats de son périmètre | [Rapport données](../../05_MLD/preuves/VALIDATION_DONNEES_ET_TRACABILITE_V1_3.md) |
| Revue autorisations indépendante | Aucun bloquant/majeur restant dans la traduction logique | [Rapport autorisations](../../05_MLD/preuves/VALIDATION_AUTORISATIONS_RELATIONNELLES_V1_3.md), § 6 |

Résultats et empreintes : [CONTROLES_STRUCTURELS_V1_3.json](../../05_MLD/preuves/CONTROLES_STRUCTURELS_V1_3.json). Clôture par constat : [REGISTRE_CLOTURE_CONSTATS_V1_3.md](../../05_MLD/preuves/REGISTRE_CLOTURE_CONSTATS_V1_3.md). Les recontrôles remplacent les verdicts initiaux défavorables sans les effacer.

L'état final des sources et l'intégrité de la baseline gelée sont consignés dans [PREUVES_VALIDATION_DICTIONNAIRE_MLD_V1_3.json](PREUVES_VALIDATION_DICTIONNAIRE_MLD_V1_3.json), reproductible avec `python spec/validation/consigner_preuves.py`.

Les 465 tests de l'autorisation V1.6 et les mutations antérieures concernent le contrat gelé. Ils ne sont pas revendiqués comme des tests du nouveau schéma. Les empreintes de cette baseline sont vérifiées séparément : aucun modèle, test ou règle d'autorisation gelée n'est changé pour rendre le report conforme.

## 4. Statuts retenus

**Dictionnaire V1.3 : VALIDÉ DOCUMENTAIREMENT**, utilisable comme référence amont du MLD, sur la base des corrections et des recontrôles indépendants. Cette qualification atteste la clôture documentaire des constats instruits ; elle ne signifie ni preuve sémantique exhaustive des 304 règles ni gel formel.

**MLD V1.1-g : STABILISÉ, CANDIDAT AU GEL.** Son catalogue d'autorisation, ses projections et ses obligations métier sont des parties intégrantes de la version de référence. Les constats identifiés ont des réponses et preuves documentaires ; aucune réalisation de production n'est affirmée. La décision de gel global est un jalon distinct.

## 5. Réserves et travaux aval

- Écart déclaré CDCF § 122.2 / hors ligne : résidu accepté lors du gel V1.6, à instruire par changement amont avant gel de toute la chaîne.
- Paramètres du contrat § 16 : gouvernance/MPD ; aucune durée d'exemple adoptée implicitement.
- Délais/fondements d'effacement, déduplication/chiffrement et rétentions : obligations déjà posées, réalisation juridique et MPD réservée ; aucune durée nouvelle.
- ECD-09/16/17/18 : obligations ST-12 à ST-15 et réalisation par schéma technique ; report encadré, pas omission.
- ECD-19 / AV-FONC-002 et actualisation du CDC technique : exigences techniques sans origine fonctionnelle complète restent à régulariser ; elles ne sont pas déclarées résolues par ce dossier.
- Recette MPD/logiciel : FK concrètes, contraintes de contenu, purge/transactions concurrentes, historique complet, propagations, inclusion de transfert et délais indistinguables à tester sur l'implémentation choisie. Aucun SQL de production n'a été exécuté ici.
- Si la préparation du MPD révèle un concept métier absent du MCD gelé, demande de changement explicite ; aucune modification amont silencieuse.

La prochaine étape documentaire peut prendre le dictionnaire validé et le MLD stabilisé pour actualiser le CDC technique. Le gel global et les choix d'architecture doivent conserver les réserves ci-dessus. Les fichiers sont consignés dans l'espace de travail ; aucun commit Git n'est créé.
