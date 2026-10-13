# Contrôle indépendant B — couverture et justifications de clôture V1.6

Date : 12 octobre 2026. Périmètre : contrat V1.6, modèle de référence, tests, mutations et huit justifications survivantes. Contrôle effectué par un agent distinct de l'auteur des modifications de clôture, avec accès aux artefacts et aux résultats antérieurs : **contrôle indépendant, non aveugle**.

## Verdict

Aucun contre-exemple atteignable réfutant les huit justifications n'a été trouvé dans ce contrôle. Les justifications sont recevables pour le **modèle de référence actuel**, sous les limites ci-dessous : six défenses redondantes (M010, M013, M032, M033, M330, M331) et deux équivalences (M104, M312). Leur acceptation relève du porteur conformément à H-6f ; ce rapport ne prononce aucun gel et ne remplace pas cette acceptation.

Les arbitrages P-1 à P-3 sont testés avec des attendus explicites. P-2 couvre aussi une habilitation préexistante sur le contenu, rendue applicable à l'objet versé : limiter l'exception aux seules actions de rôle laisserait ce cas contradictoire. Ce constat a été transmis à l'auteur pour correction du texte et de l'oracle de propriété.

## Contrôle des huit survivantes

| Mutation | Conclusion indépendante | Raisonnement et limites |
|---|---|---|
| M010 | Défense redondante recevable | `_auto_admettre` ne traite que les habilitations actives en notification. `_gestionnaires_exclus` inclut donc leurs gestionnaires, par personne ; le traitement différé repasse dans cette vérification. Le témoin antérieur de bascule de mode n'est plus atteignable, le mode étant immutable. Le test différé M010 du contrôle V1.5 passe. |
| M013 | Défense redondante recevable | Tous les ensembles ouverts exigent une admission. Admission manuelle et automatique excluent la personne de l'auteur ; transfert exclut la personne de K à la reprise. L'auteur reste invariant. Le témoin ancien du rôle propre sans admission n'est plus atteignable. Le test M013 du contrôle V1.5 passe. |
| M032 | Défense redondante recevable | Aucune opération publique ne renforce actions ou repartage d'une habilitation existante. Les opérations de réduction restent permises ; la nouvelle sonde vérifie qu'une réduction ne force pas artificiellement une présentation renouvelée. |
| M033 | Défense redondante recevable | Prolongation, acceptation de nomination et levée d'examen sont gelées pendant la fenêtre ; mode immutable. Écoulement du temps et restrictions réduisent seulement. Le test supplémentaire observe le refus `gel` d'une prolongation. |
| M104 | Équivalence recevable | La propagation écrit atomiquement le signalement de chaque passage orphelin. Le second passage est couvert par un test antérieur public. P-3 justifie explicitement ce canal, qui n'est pas un silence d'oracle : le nouveau test vérifie le message exact et interdit sa résolution par les opérations ordinaires. |
| M312 | Équivalence recevable | La sensibilité est calculée sur tous les ascendants conservés dans l'état ; purge logique sans suppression. Le nouveau test purge l'original sensible, puis constate que la copie reste non redistribuable et ne reçoit pas une dérogation à un seul approbateur. Cette justification ne s'étend pas à une implémentation qui supprimerait physiquement les ascendants. |
| M330 | Défense redondante recevable | Seules confirmation et prolongation ajoutent un fondateur ; elles sont gelées. Le retrait ne fait que réduire. La reprise de transfert ferme la fenêtre avant de modifier la structure. |
| M331 | Défense redondante recevable | L'effectivité testée est celle de la chaîne d'habilitation, distincte de l'exécutabilité sous protection. Admission manuelle, levée d'examen, confirmation/prolongation sont gelées ; admission automatique différée. Une levée légale peut modifier les protections et nécessite une nouvelle présentation par les autres comparaisons, comme vérifié par N32. |

## Attaques et oracles

Six tests nouveaux sont consignés dans `spec/autorisation/tests/test_cloture_v16.py`. Aucun ne dérive son attendu d'une fonction interne : ils utilisent les opérations publiques et le canal des notifications effectivement livré au destinataire.

- P-1 : nomination d'un autre RS via un second compte dans le périmètre du signataire ; gain des seules actions de rôle, sans admission automatique ni admission à soi par un autre compte. Une admission manuelle par un habilitant indépendant reste autorisée : en faire un refus aurait créé un faux oracle.
- P-2 : accord d'un autre compte de la même personne refusé ; accord d'un autre RS accepté ; droits scientifiques ordinaires après versement.
- P-2 : une HI préexistante `valider` sur le contenu devient applicable à l'objet personnel versé, sans nouvel acte d'habilitation.
- P-3 : message exact `(protection_orpheline, identifiant_protection)` à la seule autorité ; accès à la cible, explication, levée et ajout de bénéficiaire restent introuvables ; journaux et liste d'habilitations refusés sans autorisation de gouvernance.
- M312 : conservation de la sensibilité après purge de l'original.
- M033/M330 : prolongation gelée pendant la fenêtre, réduction permise et acceptation possible après réduction.

## Vérification exécutée

`python -B -m unittest discover -s spec/autorisation/tests -p test_cloture_v16.py` : **6 tests, OK**.

`python -B -m unittest discover -s spec/autorisation/tests -p test_controles_v15.py` : **55 tests, OK**.

Les résultats du banc antérieur (252/260 et 33/33 indépendantes détectées) ont été lus, mais ne sont **pas présentés comme une nouvelle exécution par ce contrôle**. L'auteur de clôture doit rejouer la suite de référence et le banc après intégration de tous les correctifs et tests, puis consigner ce résultat final.

## Limites

Ce contrôle n'est ni une preuve exhaustive d'atteignabilité ni une certification du logiciel futur. Les sondes générées de justification lisent des fonctions internes et ne constituent pas des oracles indépendants ; leur rôle doit rester distinct des tests de sécurité. La réception de P-3 est vérifiée sur le modèle, pas sur les canaux réels (identifiants opaques, liens, API et erreurs HTTP devront conserver ces garanties). Tout ajout d'opération renforçant une habilitation, tout changement de mode ou toute suppression physique d'ascendant remet en cause les justifications correspondantes.

## Complément — validité de M103 et borne de l'oracle P-2

Inspection indépendante pendant le rejeu final : la mutation M103 historique remplace un préfixe de ligne mais laisse le suffixe de commentaire `, à chaque passage`. Elle produit `if False:, à chaque passage`, donc une **SyntaxError à l'import avant tout test**. Son ancien statut « détectée », sans nom de test, est invalide comme preuve de détection de sécurité. Constat transmis immédiatement à l'auteur : corriger le remplacement pour conserver un commentaire Python valide, puis rejouer M103.

Expérience isolée, sans modification des fichiers du banc : le remplacement syntaxiquement corrigé `if False: # G-10` fait échouer le nouveau test `ClotureV16.test_p3_signalement_minimal_sans_cible_ni_titre` par assertion : absence de notification au lieu du tuple attendu. Les six tests ont été lancés, avec un échec ; il s'agit bien d'une détection comportementale, après import réussi.

Le nouvel oracle de propriété P-2 construit son jumeau **depuis le préétat**, puis change seulement titularité et visibilité de l'objet versé. Il n'importe aucune habilitation, nomination ou admission du résultat : une habilitation créée illicitement par le versement ne devient donc pas automatiquement autorisée par l'oracle. La comparaison des droits est rejouée aux échéances futures ; les pouvoirs de repartage sont bornés sur le seul objet au temps de l'acte. Les qualités de gardien et bénéficiaire restent soumises à la comparaison générale.

Cette méthode est un oracle métamorphique de borne, indépendant du résultat de la transition, mais **pas une réimplémentation indépendante de l'évaluateur d'accès** : le calcul des droits du jumeau passe par les mêmes opérations publiques que le résultat. Un défaut commun de l'évaluateur peut subsister dans les deux mondes. Elle ne prouve pas non plus à elle seule que l'accord d'un autre RS a été recueilli ; le test déterministe explicite teste notamment le refus de l'accord d'un second compte de la même personne. Les attendus explicites des tests de clôture et les mutations indépendantes restent donc indispensables.
