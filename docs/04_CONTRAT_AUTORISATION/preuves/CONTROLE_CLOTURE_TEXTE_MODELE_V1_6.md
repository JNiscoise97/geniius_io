# Contrôle indépendant A — clôture du texte et du modèle V1.6

**Date :** 12 octobre 2026. **Contrôleur :** agent séparé de l'auteur des corrections.

## Portée et méthode

Lecture du contrat V1.6, du modèle exécutable, des justifications des huit mutations survivantes et des sondes associées. Vérification ciblée des arbitrages P-1 à P-3, des admissions différées, de la propagation des protections orphelines, des fondements des HP et des engagements de transfert. Le modèle et le contrat ne sont pas modifiés par ce contrôleur. Un témoin public P-2 a été exécuté avec Python, sans modifier les constantes du modèle ni injecter d'état.

Ce contrôle est ciblé, pas une preuve exhaustive de toutes les combinaisons. Les résultats du banc consignés dans le dépôt ne sont pas assimilés à une preuve indépendante. Le passage complet des tests et des mutations relève du contrôle B et de l'instructeur.

## Constats

| ID | Niveau | Constat et conséquence |
|---|---|---|
| CA-01 | Majeur corrigé, revérifié | L'exception P-2 d'I-2, dans sa première rédaction, limitait les gains au rôle scientifique préexistant. Le témoin ci-dessous reproduit aussi un gain `valider` pour un collaborateur via une HI nominative dynamique préexistante. La rédaction finale d'I-2, du § 6.3 et du § 17.2 inclut désormais les rôles et habilitations préexistants du contenu sur le seul objet versé ; elle couvre ce témoin sans modifier le modèle. |
| CA-02 | Décision du porteur | Les ajouts du § 17.2 restent explicitement non arbitrés. La validation de P-1 à P-3 et l'autorisation de deux contrôles ne ratifient pas, à elles seules, chacun de ces ajouts. Ils doivent être présentés au porteur avant un gel proclamé. |
| CA-03 | Écart amont assumé | CDCF § 122.2 exige le retrait immédiat des droits dérivés, répliques hors ligne comprises. Le contrat § 13.9 admet un résidu jusqu'à l'échéance locale. L'écart est déjà déclaré au § 17.3 ; il doit rester explicite dans le report et nécessitera un avenant amont. |
| CA-04 | Précision contrôlée | P-1 permet une nomination par autrui, et limite l'interdit aux gains par les habilitations d'ensembles ouverts dans une suite dont les seuls auteurs sont leurs gestionnaires ou les administrateurs de l'espace cible. Une admission prononcée par un habilitant indépendant, hors de cette suite, reste possible. Ne pas traduire cet arbitrage par une interdiction absolue de tout droit d'un gestionnaire sur l'espace. |
| CA-05 | Précision corrigée, revérifiée | P-3 figure désormais explicitement dans I-5, § 11.2 et les observations § 15 : le signalement d'orpheline révèle uniquement à l'autorité le fait d'orphelinage et un identifiant opaque de protection. Il ne permet ni de résoudre la cible ni de franchir la protection. La notification du modèle contient le type du signalement et l'identifiant de protection, sans cible ni espace. |

### Témoin public CA-01

1. Créer R et T, puis E dont R est la racine.
2. R nomme T collaborateur ; T crée un objet personnel o.
3. R délègue nominativement `valider` à T sur le périmètre dynamique `('contenu', 'E')`.
4. `acces(T, o, 'valider')` retourne `refus` : o reste personnel, et le titulaire n'a pas cette action scientifique.
5. `verser(T, o, R)` réussit, avec l'accord de R, personne distincte.
6. `acces(T, o, 'valider')` retourne `ok`, fondement `HI`.

Le rôle collaborateur ne comporte pas `valider` (§ 7.1). Le gain provient donc de l'HI préexistante, et non du rôle. Le titulaire et le RS d'accord n'ont créé aucune nouvelle habilitation à l'étape du versement.

## Examen des huit justifications

| Mutation | Avis du contrôleur |
|---|---|
| M010 | Défense redondante cohérente : pour une habilitation active en notification, les gestionnaires de son ensemble sont inclus dans l'exclusion transversale sur son espace. Le contrôle est réévalué lors du traitement du différé ; aucune bascule de mode n'existe en V1.6. |
| M013 | Défense redondante cohérente : toute habilitation à un ensemble requiert une admission ; auteur et signataire ne peuvent être admis, y compris à la réémission. La règle d'évaluation demeure utile comme défense en profondeur. |
| M032 | Défense redondante cohérente dans l'API actuelle : aucun acte ne rajoute actions ou partage à une habilitation existante. Restriction et clôture ne font que réduire. |
| M033 | Défense redondante cohérente : prolongation, acceptation de nomination et levée d'examen sont gelées. Le mode est immuable. |
| M104 | Équivalence cohérente pour les protections actives non purgées : chaque passage sans gardien est signalé par propagation, et le retour d'un gardien remet le témoin de passage à zéro. Une protection héritée évalue la qualité sur son ascendant. |
| M312 | Équivalence cohérente : sensibilité évaluée sur tous les ascendants ; une purge marque l'objet sans retirer sa filiation ni l'objet de l'état. La copie locale de l'attribut n'est pas la seule défense. |
| M330 | Défense redondante cohérente : les seuls actes ajoutant un fondateur, confirmation et prolongation, sont gelés. |
| M331 | Défense redondante cohérente dans les transitions examinées : rétablissement par examen, nouveaux fondateurs et admission manuelle gelés ; admission automatique différée. Les protections sont distinctes de l'effectivité structurelle des HP. Aucun contre-exemple atteignable par les opérations publiques n'a été établi. |

Ces avis sont favorables aux justifications dans la surface actuelle, sans remplacer leur acceptation explicite par le porteur. Les sondes lisent les internes du modèle et confirment des conditions structurelles : ce ne sont pas des oracles indépendants de sécurité. Une extension future des opérations impose de réexaminer ces défenses.

## Ratifications concrètes encore nécessaires

Le § 17.2 demande encore examen des choix suivants : absence de gardien d'office ; protections pouvant viser RS ou racine sans cascade ; cycles d'espace réservés au propriétaire ; passage privé→projet valant versement ; action Core du RS ; procédure à un approbateur ; constat de décès à deux approbateurs et gel de tous les espaces ; forme retenue de G-2 ; écriture du titulaire dans un espace archivé ou clos ; mandat d'import. Les ajouts V1.6 sont également à ratifier : nominations soumises au § 2.5 ; comptes non vérifiés ne créant pas de protection ; impossibilité de dérogation sur protection orpheline ; versement ou purge malgré consentement retiré ; examen limité aux HI ; verrou sur acceptation de nomination.

L'acceptation des huit justifications de mutations survivantes constitue une décision distincte, prévue par le critère de gel. P-1 à P-3 ne la remplacent pas.

## Verdict

**Gel non prononcé par ce contrôle.** CA-01 et CA-05 corrigés et revérifiés dans le texte final. Aucun autre contre-exemple bloquant ou majeur n'a été établi dans la portée examinée. La clôture technique peut être documentée sous réserve des contrôles automatisés et du contrôle B ; le gel normatif reste conditionné aux décisions explicites ci-dessus. Le dictionnaire et le MLD peuvent recevoir le report des règles corrigées avec leur statut réel, sans transformer une candidature en décision du porteur.

## Vérification ciblée du report documentaire

DD-28 et MLD §§ 5.3 et 22 traduisent correctement la séparation administration/contenu, l'ordre d'évaluation, la primauté des restrictions non levables, l'exception P-3 et le caractère candidat. La migration résiduelle des références hors accès et de la matrice DI→CP est déclarée ; ce contrôle ne la clôt pas.

Trois erreurs de traduction ont été signalées à l'instructeur dans la première rédaction du report relationnel : voies de transfert `{a,b,c}` omettant purge et maintien du gel, alors que c est seulement un complément d'a/b ; engagement limité par FK obligatoire à une habilitation alors que les engagements comprennent aussi membres, administrateurs, protections, voies et réémissions ; différé attaché obligatoirement à un transfert, omettant le différé d'un espace archivé. **Ces trois constats sont clos après revérification des lignes corrigées du report** : voies `{a,b,purge,g}` avec copie complémentaire à a/b ; union typée des sept catégories d'engagement ; origine du différé `transfert` ou `cycle espace` avec transfert nullable et espace requis. Cette clôture documentaire ne vaut pas recette du schéma relationnel ni gel du MLD. Ces constats portent sur la traduction relationnelle candidate, pas sur une nouvelle faille du contrat ou du modèle.
