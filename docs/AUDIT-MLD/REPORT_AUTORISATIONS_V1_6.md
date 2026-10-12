# Report du contrat d'autorisation V1.6 dans le dictionnaire et le MLD

**Date :** 12 octobre 2026. **Statut :** intégration candidate du contrat comportemental V1.6 gelé ; ne vaut pas gel du dictionnaire ou du MLD.

Le contrat V1.6 est la source des dispositions ci-dessous. P-1 à P-3 ont été arbitrés par le porteur le 12/10/2026. Les huit justifications et les neuf groupes de choix métier ont été acceptés explicitement après contrôles indépendants ; le contrat comportemental V1.6 est gelé le 12/10/2026 avec réserves. La traduction relationnelle demeure candidate et aucun gel du MLD n’est déduit de cette décision.

## 1. Règle de remplacement

DD-28, DD-18 et DD-22 pour les admissions, les règles DI d'accès et les contraintes CP d'accès sont réécrites à partir du contrat, sans conserver un second moteur de décision. Les anciens schémas sont conservés dans l'historique documentaire pour comparaison, jamais utilisés pour autoriser. Le MLD demeure candidat jusqu'à vérification de sa nouvelle traduction relationnelle.

## 2. Dictionnaire : concepts et attributs

Toutes les références sont des identifiants opaques ; un ensemble de références est une association multiple, pas un champ texte. Les personnes sont distinctes des comptes ; les règles portant sur une personne concernent tous ses comptes. Les états terminaux ne sont jamais réactivés. Les dates d'effet et échéances sont des horodatages, pas les jours entiers du modèle de référence.

| Concept | Attributs et associations obligatoires ou conditionnels | Source |
|---|---|---|
| Identité d'acteur | compte → acteur → personne (ou acteur institutionnel sans personne), statut de vérification, niveau renforcé, activité, décès ; plusieurs comptes possibles par personne | § 1, A3, § 10.4 |
| Propriété administrative | espace, propriétaire unique ; désignation de garde, administrateurs distincts ; aucun accès scientifique dérivé | I-1, § 10 |
| Titularité personnelle | objet → titulaire ; espace, visibilité, paternité conservée ; procédure de création/import et mandat identifiable | § 6 |
| Habilitation institutionnelle HI | auteur signataire figé, espace, forme nomination/délégation, bénéficiaire, actions, partage, périmètre, périmètre du signataire à l'acte, dates, état, exclusions figées | § 2.1, § 7 |
| Habilitation personnelle HP | mêmes attributs utiles ; fondateurs multiples, fondements enracinés, dates de confirmation/prolongation, exclusions par fondateur | § 2.2, § 8 |
| Bénéficiaire | acteur, groupe, rôle d'un espace désigné, public ; nature exclusive ; identité par personne pour les interdits | § 1, § 9 |
| Périmètre | objet, lot fermé, contenu d'un espace ou version active de sélection ; un seul régime ; membres explicites et exclusions figées non exposées | § 1, § 2.5, § 13.3 |
| Admission | habilitation, personne admise, acteur admetteur (nul pour automatique), nature HI/HP, mode automatique/manuelle, état, exclusions ; retrait préventif par personne | § 9 |
| Restriction | type contenu/action/légale/consentement/effacement ; cible, actions, destinataires personnes, dates, base légale, autorité compétente | § 2.3, § 11 |
| Protection d'existence | type embargo/interdiction/cloisonnement/succession, cible, destinataires ou bénéficiaires personnes/ensembles, agréments, gardiens, état, origine héritée | § 2.4, § 11 |
| Garde et passage orphelin | gardiens actifs, référence à l'ascendant si héritée, passage orphelin courant, signalement minimal, désignation avec deux approbateurs indépendants | § 11.2, P-3 |
| Dérogation | personne bénéficiaire, cibles fermées, opérations, finalité versionnée, justification, début/fin, état, approbateurs, accords de gardiens, lien de renouvellement et rang | § 12 |
| Transfert | espace, cédant/cessionnaire, voies par objet, acceptations, réémissions liées, état, empreinte, présentation, expiration, compteur, admissions différées | § 10.4–10.7 |
| Consentement de réintégration | personne cédante, propriétaire consentant distinct, nature et destinataire de l'acte, périmètre, actions, échéance, empreinte, consommation unique | § 10.8 |
| Copie réutilisée | filiation conservée, titulaire copieur, licence, droits tiers, sensibilité des ascendants, protections héritées propagées | § 13.11 |
| Contexte d'accès | acteur/personne, instant, cible, opération, finalité, époque d'autorisation, fondements, dérogation éventuelle ; audit filtré et sans contenu | A6, A7, § 14–15 |

## 3. MLD : catalogue relationnel explicite V1.1-g

Le [catalogue relationnel explicite](../GENIIUS_MLD_AUTORISATIONS_V1_6.md) remplace intégralement le premier tableau sommaire : 60 tables avec colonnes, types, PK, FK typées, domaines, historiques HS, dossiers d'actes, admissions enracinées et clichés de présentations. La [source structurée](../../spec/validation/schema_autorisations.json) permet les contrôles de référence. Aucun `reference_id` polymorphe libre n'est renvoyé au MPD ; les moyens de réalisation physique y restent réservés.

Le contexte d'évaluation y est défini explicitement. Les projections d'appartenance et de groupes sont réconciliées avec ce catalogue ; aucun droit ne découle d'une écriture directe d'une ancienne table. Le chiffre historique de 271 tables est remplacé par l'inventaire reproductible du catalogue courant, qui distingue les tables de sécurité et les miroirs historiques.

## 4. Remplacement des contraintes et règles

| Ancienne référence | Disposition de remplacement | Source |
|---|---|---|
| DD-18, DI-B11/B12 | Quatre catégories distinctes, priorité des restrictions non levables, dérogation bornée avant protections internes ; aucune règle « toute interdiction prime » ignorant la dérogation | § 2, § 11–14 |
| DD-28, CP-23, DI-A39 | Titularité attribuée par système, actions § 6 ; titulaire indépendant de l'appartenance, sans validation scientifique automatique | § 6, I-2 |
| DD-28, CP-25/26, DI-B29 | Propriété/administration sans lecture ni partage ; autorité scientifique des RS distincte ; racine système | A2, § 7, § 10 |
| DD-28, CP-48 | Matrice exacte § 7.1 : RS possède aussi exporter, réutiliser, contribuer au Core et partager institutionnellement ; invité aucune action de rôle | § 7 |
| DD-22, DI-B34/B35/B36/B37/B44, CP-29/30 | HI survit au signataire ; HP dépend des fondateurs ; admissions pour tous ensembles ouverts ; exclusions figées, portée notification limitée ; rattachement condition, jamais source de droits | § 7–9, § 13.3, § 13.13 |
| DI-B30, CP-24 | Dérogation nominative bornée avec approbations et accords, finalité/version/rang ; droits ordinaires et opérations sensibles distincts | § 12 |
| CP-27 | Réévaluation à intégration ; delta refusé conservé pour auteur seul | § 13.8 |
| CP-28 | Réplique ordinaire seulement, échéance opposable, retraits avant ajouts ; résidu hors ligne déclaré | § 13.9 |
| CP-37 | Présentation, voies par objet, inclusion des engagements, gel par liste, admissions différées, transfert atomique et verrou par acte | § 10.4–10.8 |
| CP-40 | Époque, échéances, fraîcheur et réévaluation de chaque étape ; échec de vérification introuvable sans mutation | A6, § 13.10 |
| CP-46, DI embargos | Protections, gardiens effectifs, agréments personnes, orphelines, héritage, autorités légales | § 11, § 13.11 |
| CP-51, DI-A38/A41 | Copie survit à la révocation, mais restrictions non levables et sensibilité des ascendants restent opposables ; aucune redistribution blanchie | § 13.11 |
| TI-11, CP-44/45, unicités | Inexistence observable, filtrage avant compte/pagination ; rang visible seulement ; aucune unicité révélatrice | I-5, § 13.6–13.7, § 15 |
| CP-06, DI-B07 | L'identité de personne ne se réduit pas à un compte ; même personne sur plusieurs comptes pour tous interdits | § 1, A3 |

## 5. Réserves amont et aval

- **CDCF § 122.2 :** le résidu hors ligne du § 13.9 n'est pas une révocation immédiatement observable sur un appareil déconnecté. Écart déclaré, à instruire dans le CDCF avant gel de la chaîne ; l'échéance de 30 jours du modèle est un paramètre candidat, pas un engagement produit adopté.
- **MCD V1.2 gelé :** les structures nouvelles sont des réalisations logiques proposées ; si leur instruction révèle un concept métier absent, une demande de changement du MCD est nécessaire. Aucun gel amont n'est modifié silencieusement.
- **Paramètres § 16 :** valeurs du modèle distinctes des valeurs à fixer par gouvernance/MPD ; aucun test du modèle ne garantit la disponibilité ou le délai réel de non-divulgation.
- **Recette du MLD :** contrôle des FK, états, transactions, historiques et matrice DI → CP à réexécuter après report. Le test Python contrôle le contrat, pas un schéma SQL déployé.
- **CDC technique :** actualisation d'A6, hors ligne, dérogations, isolation, héritage de copies et tests de non-divulgation nécessaire au jalon suivant.

## 6. Clôture

Le [dossier de clôture](DOSSIER_CLOTURE_AUTORISATIONS_V1_6.md) enregistre les tests, le banc, les contrôles indépendants et la décision explicite du porteur : contrat comportemental V1.6 gelé le 12/10/2026 avec réserves. La présente traduction reste candidate ; sa recette relationnelle et son gel global restent distincts.
