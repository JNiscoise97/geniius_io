# Validation indépendante — traduction relationnelle des autorisations

Date : 12/10/2026. Référence normative : contrat comportemental V1.6 gelé. Périmètre : report V1.6 § 3, MLD V1.1-f, dictionnaire V1.3. Revue documentaire indépendante ; aucun SQL de production n'est exécuté. Le contrat gelé n'est pas modifié.

## 1. Conclusion sur l'état reçu

La traduction reçue n'est pas encore gelable. Elle pose les bonnes catégories mais plusieurs faits nécessaires à leur évaluation ne sont pas persistés explicitement. La priorité normative du contrat évite une seconde politique ; elle ne remplace pas les colonnes, clés, états et transitions requis dans un MLD. Les constats ci-dessous sont des écarts de traduction, sans nouveau choix métier demandé.

## 2. Constats et preuves relationnelles

Chaque preuve indique un état de départ et une variante qui doivent rester distinguables dans les données. Une correction est vérifiable quand le schéma encode cette distinction et que la contrainte nomme sa transaction et son oracle.

| ID | Gravité | Écart reçu et référence | Scénario d'origine et variante / oracle indépendant | Minimum de clôture |
|---|---|---|---|---|
| AR-01 | Majeur | MLD § 5.2 : `lien_compte_personne` impose UQ(personne_id) sur liens vérifiés ; pas de lien acteur → personne concordant explicite. Contrat § 1/A3. | Deux comptes A1/A2 vérifiés de P doivent coexister. Interdire A1 sur O doit aussi interdire A2 ; variante A2 appartenant à Q n'est pas frappée. | Autoriser plusieurs comptes par personne ; identité de sécurité stable et concordance compte/acteur/personne ; pas de confusion avec un rapprochement scientifique de personnes historiques. |
| AR-02 | Majeur | MLD § 3.4 conserve « interdiction l'emporte toujours » ; OB-05 dictionnaire reste absolu. Contrat § 14. | Protection interne sur O et dérogation valide : `voir` accordé. Variante restriction non levable : jamais accordé. | Un seul ordre intégral de § 14 dans DD/OB/MLD ; enlever l'ancien algorithme. |
| AR-03 | Majeur | Report : fondements polymorphes `reference_id` « FK typées au MPD » ; `perimetre_signataire_id` sans FK nommée. | HP fondée sur HI existante : valide ; même identifiant inexistant ou d'une protection : non valide. Sélection étendue hors périmètre RS à l'acte : non servie. | Colonnes alternatives exclusives ou sous-tables FK typées au MLD ; FK périmètre et instantané fermé du périmètre signataire. |
| AR-04 | Majeur | Admission HP ne conserve que l'admetteur/exclusions, sans ses propres fondements. Contrat § 8.3. | F1 fonde HP ; F2 admet P. Perte du fondement de F2 retire le droit de cette admission ; variante perte F1 avec autre fondateur valide conserve HP, sans créer un fondement F2. | Fondements et échéances propres de l'admission ; aucune promotion implicite de l'admetteur en fondateur global. |
| AR-05 | Majeur | Report ne définit pas historique logique de droits ni de leurs associations ; journal événement ne porte pas état complet typé. MLD-02/A7. | HI créée avec `{voir}` puis restreinte : état actuel différent de l'acte initial. Variante HP prolongée par F2 : origine de F1 conservée avec sa couverture. | Catégories [HS] / [N], historiques append-only/versions relationnelles et associations reconstructibles ; auteurs d'actes, dates et anciens états accessibles à l'audit. |
| AR-06 | Majeur | Actes d'approbation `acte_id typé` sans table cible définie ; indépendance/subordination/liens d'intérêt non structurés. Contrat § 12.7. | Deux approbateurs distincts sans intérêt : admissibles. Variante membre devenu administrateur d'un espace du dossier après acte : dérogation cesse de couvrir la cible. | Actes sensibles identifiables, FK réelles ; dossier objets/espaces, membres autorité, liens d'intérêt/subordination, indépendance à l'acte et à l'évaluation. |
| AR-07 | Majeur | Gardes, constat de décès/succession et autorité compétente en prose ; approbation genre omet constat de décès/contestation explicites. | Décès de P constaté : tous comptes inactifs, tous objets personnels non publics gelés dans tous espaces. Variante décision succession change titulaire de O1 mais maintient O2 gelé. | Tables acte/décès/succession, décisions par objet et acceptation ayant droit ; désignation garde/racine, dossiers et approbations typées. |
| AR-08 | Majeur | Propriété a racine « concordante » sans lien ni unicité structurelle ; nominations admin/autorité plateforme non décrites. | E non clos : un propriétaire et une racine système concordants. Variante transfert : K remplace C atomiquement ; HI tiers demeure. | Racine FK habilitation système, unicité espace, création/transfert/clos contrôlés ; nominations administratives et membres d'autorité définis sans droit de contenu. |
| AR-09 | Majeur | Transfert stocke empreinte/engagement « représentation figée » mais aucune version de présentation ni structure complète des engagements. | Présentation P1 couvre HI suspendue ; autorité légale lève protection et élargit effectivité : acceptation exige renouvellement. Variante retrait : acceptation possible. | Présentation identifiée immuable/versionnée ; instantanés relationnels complets bénéficiaires/actions/périmètres/exclusions/fondateurs/admissions/effectivité ; sous-types FK engagements ; vue K filtrée distincte du scellé d'audit. |
| AR-10 | Majeur | Réémissions annoncées, consentement réintégration et verrou sans structures complètes. | HP annoncée puis close avant acceptation : réémission abandonnée sans bloquer transfert. Variante ancien C via second compte : consentement unique par acte requis ; transfert suivant invalide consentement. | Réémission proposée liée origine/préparation et admissions annoncées ; verrou par personne/espace/transfert ; consentement lié acte et transfert/version propriété ; consommation atomique ; jointure actions réelle. |
| AR-11 | Majeur | Protection générale réduit restriction légale à `base_legale`, manque portée structurée/contestation ; garde personne sans historique. | Restriction légale externe vise O et copies, sauf portée explicitement limitée. Variante contestation maintient restriction jusqu'à annulation. Héritée levée sur original reste active copie. | Origine interne/externe, autorité émettrice/compétente, portée/référence validité, contestation et issue ; garde datée/historique ; origine héritée conservée après purge. |
| AR-12 | Majeur | Finalité/version textes libres ; renouvellement_de unique ne démontre pas maximum sur toutes demandes recoupées. | D1 rang1, D2 rang2 cibles communes ; D3 recoupe les deux sous autre finalité : rang3. Variante carence écoulée : nouveau rang possible. | Référentiel finalités versionné FK, niveau requis gouverné ; rang calculé sur ensemble complet et historique ; aucune confiance dans seul parent choisi. |
| AR-13 | Majeur | Report impose mode admission « immuable » sans clause correspondante ; contrat § 9.4 prévoit mode courant pour différé. | Admission mise en attente en notification ; variante mode changé avant traitement : aucune admission automatique. Cible devenant sensible après admission : pas de droit automatique sur elle. | Ne pas inventer immutabilité ; état/mode courant et évolution tracée, contrôle exigeant à chaque accès, différé réévalué intégralement. |
| AR-14 | Majeur | Appendices MLD : `transfert_gouvernance.designation_garde_id` et anciennes colonnes admissions ; contexte sans définition relationnelle exhaustive. | FK vers table supprimée doit être refusée par contrôle du catalogue. Variante contexte dérogation opération/finalité incompatible : refus journalisé, sans mutation de droits. | Tous renvois de tables/colonnes migrés ; contexte [N] explicite FK et contraintes, liens sensibles typés, aucune FK fantôme ni alias qui réintroduit anciennes règles. |
| AR-15 | Moyen | PK générales « références et début » incompatibles avec jointures sans début (`autorisation_action`, exclusions) ; NN/CK/états souvent non explicités. | Double action identique refusée ; action distincte admise. Variante admission close puis nouvelle admission : identifiant neuf, ancienne non réactivée. | PK/UQ/NN par table ; domaines fermés états/actions, fin > début, transitions terminales et unicité courants ; pas de PK générique ambiguë. |

## 3. Contraintes transversales à rendre opératoires

Les CP doivent désigner les données lues et écrites, l'instant de validation et la portée de la transaction. Les scénarios suivants n'exigent aucun nouveau concept métier :

- **A3/I-2, nomination croisée :** RS A nomme RS B dans son périmètre, permis ; variante B utilise un groupe qu'il gère pour s'admettre, interdit sur tous ses comptes. Une relation hiérarchique ou appartenance ne suffit pas à calculer les effets par personne.
- **A4, HP suspendue :** HI fondement suspendue rend HP inopérante ; variante retrait définitif de tous fondements clôt HP. Lever suspension ne réactive pas HP close. Garder état courant et histoire des ruptures, sans mutation pendant un échec d'évaluation.
- **P-2, versement :** titulaire verse avec accord d'un autre RS ; ses rôles antérieurs s'appliquent au seul O devenu contenu. Variante sans accord ou gain sur O2 : refus. Persister accord et changement de régime dans une transaction.
- **AC/NC :** archivage ferme écriture scientifique et admissions automatiques, mais titulaire conserve écriture personnelle ; clôture éteint HI/HP contenu définitivement. Variante réouverture archive réévalue le différé, sans résurrection d'états terminaux.
- **Copies :** protection ultérieure sur ascendant propagée aux copies dans tous espaces avant prise d'effet observable ; variante échec propagation impose barrière de refus. La levée sur ascendant ne lève pas l'héritée. Sensibilité/licence/droits tiers/non-levables sont évalués même après purge du contenu original.
- **Transfert :** perte des qualités de C concerne sa personne entière ; CT-28 conserve HP données par titulaire tiers sur objet personnel. Variante HP dépendant du contenu transféré tombe. Acceptation et incréments époques sont atomiques, admissions différées ne s'élargissent pas silencieusement.
- **Orpheline P-3 :** dernière garde perdue crée un passage courant et un signalement minimal ; variante nouveau passage après nouvelle garde puis perte produit nouveau signalement. Deux approbateurs indépendants requis pour désigner gardien ; jamais résolution de cible depuis notification.
- **Inexistence :** cible cachée/inexistante donnent mêmes résultats sur erreur FK applicative, compteur, unicité, export et présentation filtrée. Le schéma donne les faits nécessaires ; la preuve du délai réel appartient au logiciel/MPD.

## 4. Limites et conditions de clôture

Les tests Python antérieurs établissent des comportements du contrat, pas les FK d'un schéma nouveau. La présente revue constate que les distinctions ci-dessus sont requises par le texte gelé et demande leur représentation explicite. La correction peut être accompagnée d'un contrôle reproductible du catalogue et de scénarios de transactions logiques ; elle ne constitue pas une recette PostgreSQL.

Le gel global reste distinct de la correction des autorisations : réserves CDCF hors ligne, paramètres MPD/gouvernance, demandes de changement MCD et validation scientifique doivent rester visibles. Cette revue ne ratifie aucun gel global à la place du porteur.

## 5. Recontrôle du catalogue explicite V1.1-g

Source lue : `GENIIUS_MLD_AUTORISATIONS_V1_6.md`, catalogue de 60 tables et inventaire `spec/validation/schema_autorisations.json`, le 12/10/2026. Les constats § 2 décrivent l'état reçu initial, pas automatiquement l'état corrigé.

| Constat | Résultat du recontrôle documentaire |
|---|---|
| AR-01 | Catalogue identité de sécurité ajouté avec concordance ; suppression de l'ancienne UQ(personne_id) à vérifier dans MLD principal. |
| AR-02 | Ordre principal et OB-05 en cours de correction par l'intégrateur ; non reconduits comme validés à ce stade. |
| AR-03 | FK typées désormais explicites, périmètre signataire figé et référencé : correction documentaire satisfaisante sous contrôle du catalogue. |
| AR-04 | `autorisation_admission_fondement` distingue les propres fondements/échéances de l'admetteur, exclusion indépendante : correction satisfaisante. |
| AR-05 | HS/N, miroirs, révisions et événements avant/après définis : correction logique satisfaisante. Le générateur doit matérialiser les colonnes de validité des miroirs, pas seulement les mentionner ; vérifier également associations HS. |
| AR-06 | Actes, dossiers objets/espaces, identité et approbations, subordination/intérêts et autorité structurés : correction documentaire satisfaisante. Indépendance reste une CP procédurale à revérifier à l'accès. |
| AR-07 | Décès et succession par objet, garde/approbations documentés ; domaines des états succession à fermer explicitement. |
| AR-08 | Propriété → racine FK et nominations administratives : satisfaisant, sous transaction concordance et compte distinct de personne. |
| AR-09 | **Majeur persistant :** instantané aplati perd associations fondateur/admission → exclusions et fondement → objets du périmètre ; bénéficiaire genre/rôle/espace/groupe/acteur non figé explicitement. Voir témoins ci-dessous. |
| AR-10 | Réémission, admissions reprises, verrou et consentement lié transfert/révision propriété/acte : correction satisfaisante, sous oracle d'abandon de réémission sans blocage. |
| AR-11 | Origine légale, autorités, portée, contestation et garde historisée : correction satisfaisante ; énumérer le domaine genre et les obligations conditionnelles légales. |
| AR-12 | Finalités FK versionnées et tous prédécesseurs : correction satisfaisante. **Incohérence de cycle :** finalite_version classée N mais comporte active/fin ; toute fermeture ultérieure ne peut modifier cette insertion. Classer HS ou décrire fermeture par nouvel événement immuable. |
| AR-13 | **Rectification du constat initial :** les justifications M010/M033 acceptées précisent qu'aucun changement de mode n'existe après création en V1.6. La présence d'une lecture du mode courant au traitement différé ne crée pas ce pouvoir. Le scénario de bascule du § 2 est donc hors états atteignables et ne bloque pas la traduction. Le catalogue respecte cette distinction en interdisant UPDATE libre. |
| AR-14 | Contexte explicite ajouté ; références résiduelles du MLD principal encore à contrôler par l'intégrateur. |
| AR-15 | PK/NN/FK par table ajoutés ; restent états succession/différé et genre protection, domaines d'action des jointures, et validité explicite des miroirs. |

### Témoins structurels d'AR-09

1. HP a deux fondateurs F1 et F2. État S : F1 exclut O1 et ne couvre que O2 ; F2 exclut O2 et ne couvre que O1. Variante S' : F1 couvre O1 et exclut O2, F2 couvre O2 et exclut O1. Les listes aplaties `engagement_personne` et `engagement_objet` sont identiques dans S/S'. Après perte du fondement F2, leur portée diffère. Il faut associer exclusion/couverture à son fondateur/fondement, ou référencer exactement les révisions historiques de toutes associations qui la portent.
2. Admission A1 exclut O1, A2 exclut O2. Variante exclusions permutées : mêmes personnes/objets dans clichés aplatis, droits individuels différents. Ajouter admission_id aux exclusions figées d'engagement et conserver l'état/échéance de chaque admission.
3. Bénéficiaire est rôle `lecteur` de E1 ; variante rôle `lecteur` de E2 avec mêmes personnes momentanément admises. Le contrat exige de conserver le rôle désigné sans composition d'un autre espace. La seule FK vers `autorisation_beneficiaire` courant ne fixe pas le genre, espace_role et rôle de l'acte. Ajouter cliché de ces colonnes ou référence à révision immuable contrôlée.

Ces témoins ne sont pas des tests du modèle Python : ils prouvent que deux états contractuellement différents doivent avoir deux représentations relationnelles distinguables. Le paragraphe final du catalogue qui affirme conservation complète ne suffit pas si ses colonnes n'expriment pas les associations.

## 6. Recontrôle final après corrections

Le 12/10/2026, nouvelle lecture des trois sources canoniques et du catalogue régénéré. **Aucun constat bloquant ou majeur de cette revue ne reste ouvert dans la traduction logique des autorisations.** Ce verdict ne vaut ni recette d'une base déployée ni gel global du dictionnaire/MLD.

| Constats | Correction lue et preuve de distinction |
|---|---|
| AR-01 | `lien_compte_personne` UQ compte_id, pas personne_id ; autorisation_identite relie acteur/personne vérifiée avec concordance des comptes. A1 et A2 de P coexistent, Q reste distinct. |
| AR-02 | MLD-13 et § 22.2 portent l'ordre complet § 14 ; OB-05 distingue non-levables et dérogation avant protections internes. Les deux variantes avec restriction interne/non-levable ont des branches distinctes. |
| AR-05 | Chaque HS comporte révision, début/fin de validité et événement ; convention `_hist` reproduit colonnes et PK avec révision, périodes continues et écritures atomiques. Les états à l'acte et courants sont distinguables. |
| AR-07 / AR-15 | Succession et différé ont leurs états fermés ; protection a ses neuf genres explicites ; catégories, PK/FK et conventions temporelles sont décrites par table. |
| AR-09 | Engagement fige genre/acteur/groupe/espace_role/rôle du bénéficiaire et révision ; régime/périmètre figés. Objets portent fondateur_personne, admission_source et fondement_snapshot ; personnes portent admission/fondateur source, état/début/fin/automatique/révision ; fondement conserve source/révision/état/dates et couverture liée aux objets. Les permutations des trois témoins § 5 produisent désormais des lignes distinctes. La complétude du cliché et la concordance de ses références doivent être contrôlées en fin de transaction, comme prescrit au catalogue. |
| AR-12 | Référentiel finalite_version devient HS ; fermeture/activation crée révision, sans mutation d'une table N. |
| AR-14 | Appendice DESTINER_TRANSFERT référence autorisation_transfert.designation_id → autorisation_designation_garde ; contexte relationnel explicite ; report § 3 pointe vers le catalogue plutôt que maintenir un schéma concurrent. |

AR-03/04/06/08/10/11 restent corrigés selon § 5 ; AR-13 est retiré pour sa demande implicite de pouvoir absent du contrat. Les anciennes mentions REGLE_ACCES dans les tableaux de correspondance décrivent l'origine conceptuelle historique et ne sont pas des tables ou FK actives du moteur.

Les contraintes procédurales (inclusion, anti-élévation multi-actes, concordance des snapshots, garde actuelle, propagation interespaces, indépendance, réponses et délais indistinguables) demeurent des obligations d'implémentation et de recette. Le catalogue les rend représentables ; il ne prétend pas les prouver en production. Les réserves CDCF/MPD/gouvernance du contrat gelé restent inchangées.
