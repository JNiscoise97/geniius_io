# Bilan des prototypes et jalon Core intégré

15 octobre 2026. **Les six prototypes sont clos sur leurs périmètres réduits.** Le jalon de faisabilité demandé avant lancement est achevé à cette portée. Architecture, pile, MPD et production ne sont pas gelés ; toutes les réserves restent opposables. [Bilan probant et décisions](GENIIUS_ARCHITECTURE_PT06_CRITERES_CLOTURE.md), [contrôle des six prototypes](preuves/CONTROLES_PT06_CONSOLIDES.json).

| Prototype | Portée close | Qualification encore nécessaire |
|---|---|---|
| PT01 | Écriture/versionnement/révocation, 13 scénarios SQL. | Traduction Core/MPD, charge et gardes complètes. |
| PT02 | Filtrage, sorties et fraîcheur, 37 scénarios SQL/HTTP ; modèle séparé. | Moteur complet, surfaces réelles et NF10. |
| PT03 | Synchronisation, reprise, horloge logique et chiffrement Windows ciblé, 52 essais. | Clients/OS, chiffrement complet, anti-rollback et protocole distribué. |
| PT04 | Conservation/restauration sous barrière, 37 essais. | Autorité indépendante, secrets, stockage final et PRA/NF05. |
| PT05 | Asynchrone/propagation/équité, 34 cas et mesures locales. | Moteur intégré, prestataires réels, profil/coût et MPD-04. |
| PT06 | API/identité ciblée/livraison/accessibilité/export, 34 essais + étude F. | IdP, pipeline signé, AT/WCAG, réversibilité complète et devis. |

Ne pas sommer ces résultats comme des tests indépendants d'un logiciel assemblé : mécanismes et fixtures sont partagés, certaines preuves sont logiques et d'autres physiques. La clôture n'est pas une suppression des exigences, ni la ratification d'une pile ou des paramètres numériques de banc.

## Décisions à instruire dans l'ordre utile

Le registre contient encore **62 références ouvertes**, une décision amont actée et une capacité hors V1. Les regrouper par contrat de décision évite de demander 62 arbitrages isolés ; chaque référence conserve toutefois son état propre jusqu'à preuve/ratification.

| Lot de décision | Références principales | Résultat concret attendu |
|---|---|---|
| D1 — Tranche et pile candidate | DEC-ARCH-10/11/12/16, DEP-01/02/04 | Architecture d'exécution de la tranche, backend/API, base/médias/file, identité, environnement de qualification et responsables. Compétences et devis avant ratification. |
| D2 — Autorité et données physiques | DEC-ARCH-01/05, PAR-CDC-04, MPD-01/02/03/05/06, SEC-01–05 | MPD et rôles techniques, garde/époque, invalidation et sorties, chiffrement/clé ; pas simple tenant filter. |
| D3 — Clients et compatibilité | DEC-ARCH-03/09, PAR-CDC-03/05, SYN-01–07 | Plafonds hors ligne, support/version, canal appareil, récupération compte/journal, primitives OS et preuve temporelle. |
| D4 — Reprise et exploitation | DEC-ARCH-06/14/15, PER-01–07, PAR-CDC-08/09/10 | Autorité hors restauration, clés/sauvegardes, RPO médias, responsables et recette PRA représentative. |
| D5 — Profil, délai et coût | DEC-ARCH-07/13, PAR-CDC-01/02/06/07, ASY-01–07, MPD-04 | Profils réels, limites/admission, maximum de propagation, prestataires et coût total ; aucune extrapolation des petits bancs. |

Références non listées ici, notamment langues/identifiants publics et conservation juridique, restent dans le registre et leurs dossiers propriétaires. Ce regroupement ne les clôt pas. Le porteur tranche produit/budget ; les fonctions technique/sécurité/qualité/exploitation doivent être nommées pour la livraison réelle.

## Tranche Core intégrée proposée

Un même chemin exécutable dans la pile candidate : session/appareil authentifiés → réception privée d'un delta → résolution/droits courants → version canonique + activité + outbox dans une transaction → worker avec tentative active → résultat et consultation/export filtrés → restauration sous barrière avec autorité actuelle. Conserver l'original de l'auteur, distinguer réception/intégration/validation scientifique, et publier les anomalies.

Choisir d'abord un corpus minimal : deux comptes de personnes différentes et un second compte de même personne, deux espaces, objet scientifique/personnel et copie, HI/HP, protection/échéance/révocation, delta ambigu, média et un effet asynchrone. Les fixtures ne doivent pas se substituer à la personne/autorité réelles de la tranche.

| Porte de qualification | Preuve attendue |
|---|---|
| Q1 — Persistance et autorité | Rôles/contraintes/transactions réels, aucun effet partiel ou accès par ancienne autorisation ; contradictions modèle/SQL explicites. |
| Q2 — Identité et sortie | IdP/facteurs et API raccordés, garde de sortie et récupération ; aucune page avec jeton de banc ou journal clair utilisé comme preuve produit. |
| Q3 — Asynchrone et PRA | Outbox/bail/fencing, propagation sans fausse complétude ; restauration invalide anciennes générations/sessions et réconcilie effets/purges. |
| Q4 — Clients, accessibilité et capacité | OS/client retenus, recette AT, charge/corpus déclarés, coût et contrats prestataires ; les réserves non couvertes restent fermantes pour leur périmètre. |

Ces portes décrivent le prochain travail, pas des recettes exécutées. Pas besoin de réécrire le CDC gelé pour commencer ; les amendements DC-AUTH-01/02 restent l'autorité temporelle et leurs baselines sont préservées. L'architecture/MPD physiques évolueront comme candidats jusqu'à décision et preuves.

## Budget et calendrier

[Enveloppe F](GENIIUS_ARCHITECTURE_PT06_ALTERNATIVES_BUDGET_EXPLOITATION.md) : cibles/provisions 70 €/mois + réserve 30 €, aucun budget fournisseur/production conforme validé. Les responsables/maintenance ne sont pas financés par le seul coût infrastructure. Le premier lot D1 doit transformer cette enveloppe en configuration et devis reviewables avant engagement ; aucun service commandé.

Décembre 2026 reste le souhait de premiers abonnements. Les dates d'une livraison conforme ne peuvent pas être promises à partir de la seule fin des bancs. La clôture des six prototypes satisfait le préalable de faisabilité réduit, mais la qualification du périmètre commercial et les réserves de sécurité/PRA/clients restent nécessaires avant ouverture.

**Prochain livrable : dossier D1 de décision sur la pile et la tranche intégrée**, avec options réellement comparables, compétences/responsables et devis, puis proposition concrète au porteur. Aucun langage, hébergeur ou renoncement à une exigence n'est choisi automatiquement dans ce bilan.
