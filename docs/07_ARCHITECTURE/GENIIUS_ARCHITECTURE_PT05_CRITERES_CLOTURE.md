# PT05 — Consolidation et critères de clôture réduite

14 octobre 2026. **34 cas A–E réussis ; PT05 clos sur son périmètre réduit.** Décision du porteur : « poursuis », après présentation du périmètre prêt pour décision et des cinq réserves. Les résultats bruts restent aux statuts expérimentaux antérieurs. Aucun broker/prestataire réel, capacité NF ou coût de production qualifié ; MPD-04 non fixé. [Banc et rapports](../../spec/prototypes/pt05/README.md), [contrôle consolidé](preuves/CONTROLES_PT05_CONSOLIDES.json).

## Couverture des scénarios AS

| Référence | Preuve ciblée disponible | Limite de recette |
|---|---|---|
| AS01 | A01 : transaction métier/outbox annulée, pas de publication. | Un effet local, pas toutes les commandes Core. |
| AS02 | A02–04/08 : publication répétable, accusés perdus, effet/reçu atomiques et conflit de contenu. | Queue SQLite, pas broker/transport réel ou restauration de reçus. |
| AS03 | A05/07 : bail expiré, jeton supérieur, ancienne tentative refusée, finalisations concurrentes. | Temps injecté, pas renouvellement ni bail après PRA. |
| AS04 | A09/C01/C05 : autorité retirée avant sortie ou après effet externe, intégration/consultation locales contrôlées. | Booléen synthétique, pas consentements complets ou garde à la remise réseau. |
| AS05 | B01/06 : impact direct au commit, barrière si travail perdu/panne. | Petit graphe, barrière globale, pas frontier durable en unités bornées. |
| AS06 | B02 : seconde cause avant finalisation, ancienne génération refusée. | Intercalage déterministe, pas mutations simultanées. |
| AS07 | B03 : ajout de dépendance invalide la préparation, nouveau parcours couvre l'aval. | Parcours complet sous verrou, pas graphes de production. |
| AS08 | B04/05 : cycle de raisonnement termine, cycle de production refusé. | Indépendance des justifications non modélisée/validée. |
| AS09 | A06 : annulation avant finalisation refuse succès ancien. | **Scénario complet non exécuté** : suspension, effets partiels acquis, fermeture client et reprise ciblée. |
| AS10 | D : charge finie mixte, équité et retries bornés/isolement. | **Scénario massif non exécuté** ; pas panne prestataire dans le même montage, arrivées continues ou garantie de latence. |
| AS11 | E07 : budget diagnostic zéro dépassé, barrière conservée. | **Pas dépassement contractuel qualifié** ; MPD-04 ouvert, pas supervision/timeout de production. |
| AS12 | D/E : saturation/reprise/idempotence, 30 répétitions de propagation et ressources Python. | **Qualification NF et consommation/imputation non exécutées** au profil représentatif. |

Totaux : A 9, B 6, C 6, D 6, E 7. Les 30 répétitions d'E ne deviennent pas 30 cas supplémentaires. Les conditions non qualifiées restent réservées, pas PASS par omission. Même auteur et mêmes bancs ; aucune nouvelle revue indépendante revendiquée.

## Articulation des mécanismes

E réutilise réellement le calcul de propagation B et ses transactions. La complétude technique exige tous les signalements attendus au commit ; les impacts restent en réexamen. A/D démontrent des mécanismes distincts : A protège la finalisation par bail/jeton, D admet et répartit des tâches. **A et D ne forment pas encore un ordonnanceur intégré** ; D ne qualifie pas les baux perdus ou la préemption. C réconcilie un prestataire synthétique ; il ne partage pas une transaction avec A/B/D.

Une perte d'accusé n'autorise pas une relance aveugle : C utilise recherche ou clé idempotente, sinon état incertain sans nouvelle exécution. Un effet déjà commis à l'extérieur n'est pas supprimé par révocation. La disparition d'une tâche ou d'un message ne prouve jamais la complétude scientifique ni le délai maximal de propagation.

Les maxima locaux publiés par E, environ 54–336 ms dans cette campagne, décrivent de petits graphes sur ce poste. Cinq répétitions, ordre fixe et instrumentation : aucun percentile de population, garantie contractuelle ou extrapolation de coût n'en est déduit. Coût cloud effectivement engagé : 0 € ; budget de production non estimé.

## Réserves opposables

- **PT05-R01 — Exécution durable (ASY-01/07, PER-04).** Broker/transport, renouvellement/suspension/effets partiels, reprise d'outbox/checkpoints et durée de rétention. Après restauration, un jeton incrémenté depuis un état ancien peut répéter une ancienne valeur : fencing lié à une autorité fraîche à qualifier avec PT04-R02 avant livraison. Les retries ne doivent pas effacer un travail ou rendre indéfini le stockage des isolés.
- **PT05-R02 — Propagation et confidentialité (ASY-02, SEC-04/05).** Frontier durable par unités bornées, causes réellement concurrentes, dépendances ajoutées, cycle/indépendance scientifique et choix du périmètre conservatif. Confidentialité des diagnostics/métriques/rangs et NF10 à éprouver ; les traces privées de banc ne sont pas des sorties produit.
- **PT05-R03 — Autorité et prestataires (ASY-05, PR11).** Gardes/temps actuels à lecture, remise et intégration, consentements, capacité interne étroite. Prestataire réel : recherche fiable, idempotence/rétention, résultat absent ou tardif, compensation et workflow d'incertitude. Sans contrat correspondant, aucune promesse d'effet externe unique.
- **PT05-R04 — Équité et admission (ASY-03).** Poids/coûts variables, arrivées continues, classes de sécurité, réservations effectives de workers, pannes et multi-tenant. Places d'admission interactives ne garantissent pas latence si tous les workers sont occupés. Quotas/octets/stockage des tâches isolées à dimensionner ; valeurs D restent de fixture.
- **PT05-R05 — Profil, délai et coût (ASY-04/06, MPD-04).** Corpus/volumes/concurrence/ressources réels, montée/saturation/récupération, alerte et délai maximal avant recette NF. Débit/RSS/CPU/stockage/coût total à mesurer sur la pile retenue ; tracemalloc seul ne mesure pas la mémoire native. Aucune valeur MPD-04 ou seuil économique adopté ici.

Ces réserves demeurent après clôture du prototype et restent opposables au gel/livraison. ASY-01–07 et paramètres PAR-CDC restent ouverts ; plafond préalable de 100 €/mois et PT06 avant lancement maintenus.

## Critères de clôture réduite candidats

| Porte | Critère | État |
|---|---|---|
| C1 | 34 résultats passants, sources/preuves concordantes, nettoyage et coûts déclarés. | Contrôle consolidé reproductible. |
| C2 | Outbox atomique avec métier, livraison rejouable, finalisation unique et tentative active. | A sur primitives locales. |
| C3 | Générations/barrière et signalements sans validation scientifique implicite. | B/E sur graphes déclarés. |
| C4 | Effet externe incertain réconcilié sous contrat ou conservé sans relance aveugle. | C sur prestataire synthétique. |
| C5 | Quotas/refus, retries bornés et équité sur charge finie ; aucun accepté perdu. | D, valeurs de fixture. |
| C6 | Profil préspécifié, séries/maxima publiés, barrière conservée au dépassement du banc. | E diagnostic ; pas MPD-04 ratifié. |
| C7 | Couverture partielle AS, limites de montage et R01–R05 attribuées à recette/MPD. | Inventoriées ci-dessus. |
| C8 | Décision du porteur sur ce périmètre et report sans fermer ASY-01–07. | **Acté le 14/10/2026** : instruction « poursuis » du porteur ; [décision liée aux preuves](preuves/DECISION_CLOTURE_PT05.json), report aux registres. |

Clôture proposée : **preuve de faisabilité ciblée de l'asynchrone et de la propagation** sur C1–C7. Elle ne qualifie pas un moteur intégré de production ou un prestataire réel. Une preuve contradictoire sur ce périmètre doit être résolue ; modification des primitives impose rejeu et nouvelles empreintes. Après décision C8, PT06 peut traiter les contrats API, la compatibilité, l’identité/MFA, la livraison/rollback, l’accessibilité et la récupération/export patrimonial suivant son périmètre initial, avec les réserves de capacité et coût. Les six prototypes restent le jalon demandé avant lancement ; ils ne dispensent pas de la recette complète.
