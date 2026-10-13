# Dossier de clôture des autorisations V1.6

**Date :** 12 octobre 2026. **Statut : clôturé — contrat comportemental V1.6 GELÉ par décision explicite du porteur le 12/10/2026**, avec les réserves des §§ 16 et 17.3. Dictionnaire V1.3 et MLD V1.1-f candidats.

## 1. Décisions acquises et corrections

Le porteur a demandé la clôture et le report, puis validé explicitement P-1, P-2 et P-3 et deux contrôles par agents séparés.

- P-1 : nominations par un autre RS dans son périmètre permises ; aucune auto-attribution par composition des ensembles gérés. Une admission explicite par un habilitant indépendant reste possible.
- P-2 : versement avec accord d'un RS d'une autre personne ; seuls droits préexistants des rôles et habilitations du contenu devenus applicables au seul objet versé. Le témoin indépendant CA-01 exigeait d'inclure une HI `valider` préexistante pour un collaborateur ; texte corrigé et test explicite ajouté.
- P-3 : chaque orphelinage est signalé à l'autorité, avec seul identifiant opaque de protection ; aucune cible, espace ou métadonnée scientifique révélée. Exception explicitée dans I-5, § 11.2 et § 15 ; la notification n'ouvre aucun accès.

Les anciens moteurs d'accès, d'embargo et de transfert sont remplacés dans le dictionnaire et le MLD candidats. Les versions antérieures sont conservées dans `historique/GENIIUS_DICTIONNAIRE_DONNEES_V1_3_AVANT_REPORT_AUTORISATIONS.md` et `historique/GENIIUS_MLD_V1_1_E_AVANT_REPORT_AUTORISATIONS.md`.

## 2. Vérifications réellement exécutées

| Vérification | Résultat | Portée |
|---|---|---|
| Suite initiale avant corrections | 459 tests, OK | État initial, ne vaut pas preuve des corrections |
| Suite après corrections et six tests indépendants | **465 tests, OK** (dernier passage : 291,909 s) | `python -m unittest discover -s spec/autorisation/tests -t spec/autorisation/tests` ; paramètres de propriétés par défaut 40 graines × 50 pas ; comptages publiés |
| Validité des mutants | **260 cibles uniques, zéro cible invalide, zéro syntaxe invalide** | `python spec/autorisation/mutations/lancer.py --verifier` |
| Banc complet, puis correction et rejeu ciblé M103 | **252 détectées / 260 ; 33 / 33 indépendantes détectées** | Paramètres du banc 6 graines × 40 pas ; huit survivantes inchangées |
| M103 après correction | Détection par `Attaques.test_a17_2_gardien_orphelin_pendant_le_gel` | Import valide et test comportemental échoué ; son ancienne SyntaxError n'est plus comptée comme preuve |
| Contrôle A indépendant | CA-01 et CA-05 corrigés et revérifiés ; aucun autre majeur établi dans la portée examinée | [Rapport A](CONTROLE_CLOTURE_TEXTE_MODELE_V1_6.md) |
| Contrôle B indépendant | Six nouveaux tests réussis ; avis favorable ciblé sur justifications, défaut M103 trouvé | [Rapport B](CONTROLE_CLOTURE_COUVERTURE_V1_6.md) |
| Batterie générée | 322 scénarios nommés, attaques/contrôles et six contrôles de clôture documentés | Générée par `spec/autorisation/generer_batterie.py`, sans rédaction manuelle de la batterie |
| Diff documentaire | `git diff --check` sans erreur | Ne vaut ni validation métier ni contrôle SQL |

Les deux contrôles sont indépendants de l'auteur des corrections, mais connaissent les arbitrages et le contexte de clôture : ils ne sont pas présentés comme entièrement aveugles. Aucun test d'un logiciel de production, d'une base SQL ou d'une égalité réelle de délais n'a été exécuté. Les sondes structurelles de survivantes ne sont pas des oracles de sécurité ; l'oracle métamorphique P-2 compare le préétat par opérations publiques et est complété par les attendus explicites des tests indépendants. Aucun résultat ne constitue une preuve exhaustive de tous les états.

Les empreintes SHA-256 du modèle, des tests, du banc et des résultats sont consignées dans [PREUVES_CLOTURE_AUTORISATIONS_V1_6.json](PREUVES_CLOTURE_AUTORISATIONS_V1_6.json). Elles identifient l'état contrôlé et permettent de détecter une modification ultérieure ; elles ne remplacent pas les contrôles indépendants.

## 3. Décisions finales du porteur

### 3.1 Huit justifications

Accepter les justifications documentées de **M010, M013, M032, M033, M104, M312, M330 et M331** pour la surface actuelle. Six défenses redondantes, deux équivalences, examinées par A/B. Toute extension des opérations, modification du gel, des admissions ou de l'héritage impose un réexamen. [Démonstrations](../../../spec/autorisation/mutations/JUSTIFICATIONS.md).

**Décision : acceptée explicitement par le porteur le 12/10/2026.**

### 3.2 Ratification des choix explicitement non arbitrés (§ 17.2)

Ratifier les choix suivants, tels que rédigés dans le contrat :

1. Pas de gardien automatique ; protection possible contre RS/racine sans cascade.
2. Archivage, réouverture et clôture réservés au propriétaire.
3. Passage privé→projet soumis au versement ; action Core du RS avec diffusabilité ; droits d'écriture du titulaire conservés dans un espace archivé/clos.
4. Dérogation à un approbateur uniquement pour les finalités techniques fermées et cas admissibles ; indépendance et nombre renforcé dans les autres cas (§ 12).
5. Décès constaté par deux approbateurs ; gel des objets personnels non publics de la personne dans tous les espaces.
6. Admissions et exclusions anti-auto-élévation de G-2 ; mandat obligatoire pour importer au nom d'un déposant.
7. Nomination soumise aux droits effectivement exécutables ; identité renforcée pour créer une protection.
8. Protection orpheline non franchissable par dérogation ; versement ou purge sans usage du contenu possible malgré consentement retiré, sous autres conditions légales.
9. Mise en examen des HI seulement ; verrou de réintégration couvrant l'acceptation de nomination.

Reconnaître le résidu hors ligne déjà déclaré au § 17.3 : un appareil déconnecté peut conserver un accès jusqu'à son échéance opposable. L'écart avec CDCF § 122.2 reste ouvert pour un avenant amont, et ne constitue pas une cohérence totale de la chaîne. Les durées d'exemple du modèle, notamment 30 jours hors ligne, ne sont pas adoptées comme engagements produit ; les paramètres § 16 restent réservés au MPD ou à la gouvernance.

**Décision : acceptée explicitement par le porteur le 12/10/2026.**

### 3.3 Gel décidé

Après acceptation explicite de 3.1 et 3.2, le porteur a prononcé le gel du **contrat comportemental V1.6**, avec réserves explicites § 16 et § 17.3. Le modèle de référence, les tests, les justifications, les résultats et les contrôles identifient la preuve locale de clôture. La V1.3 du dictionnaire et la V1.1-f du MLD restent candidates : le gel du contrat ne vaut pas validation globale de la traduction relationnelle, des corrections hors accès ou du CDC technique.

## 4. Report livré et suite du MLD

[Report V1.6](../../05_MLD/preuves/REPORT_AUTORISATIONS_V1_6.md), avec concepts, attributs, tables, clés et correspondances DI/CP. Les documents canoniques renvoient à cette source unique, remplacent les clauses incompatibles et marquent les preuves relationnelles comme candidates. Restent avant le gel MLD : contrôle exhaustif de la traduction relationnelle et des FK typées, historiques et transactions ; consolidation des projections d'appartenance ; crash-test MLD et vérification des constats hors accès ; validation du dictionnaire V1.3 ; instruction des écarts amont déclarés. Ces travaux ne sont pas assimilés aux tests Python de clôture du contrat.

## 5. Procès-verbal

**Gel prononcé le 12 octobre 2026 par le porteur.** Réponses explicites à la demande de clôture :

- « Oui, accepter les huit justifications » : M010, M013, M032, M033, M104, M312, M330 et M331 acceptées pour le modèle actuel.
- « Oui, ratifier et geler la V1.6 avec ces réserves » : les neuf groupes du § 3.2 sont ratifiés et le contrat comportemental V1.6 est gelé.

**Réserves maintenues :** paramètres § 16 à fixer au MPD/gouvernance, écart hors ligne avec CDCF § 122.2 déclaré et à instruire, limites § 17.3 reconnues. La traduction du dictionnaire et du MLD reste candidate jusqu’à validation globale. Aucun gel du CDC technique n’est prononcé.

Les fichiers et preuves sont consignés dans l’espace de travail ; aucun commit Git n’est créé par cette opération.
