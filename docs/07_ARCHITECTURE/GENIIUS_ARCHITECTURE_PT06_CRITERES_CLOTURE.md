# PT06 — Consolidation finale et critères de clôture réduite

15 octobre 2026. **34 essais A–E réussis, lot F documentaire contrôlé ; PT06 clos sur son périmètre réduit.** Décision du porteur : « ok poursuis », après présentation du dossier prêt pour décision. Résultats bruts conservés à leurs statuts expérimentaux antérieurs ; aucune pile, capacité, identité de production, conformité WCAG globale ou budget fournisseur validés. [Banc et rapports](../../spec/prototypes/pt06/README.md), [contrôle consolidé](preuves/CONTROLES_PT06_CONSOLIDES.json).

## Couverture et nature des preuves

| Lot | Essais réels | Ce qui est démontré | Ce qui reste réservé |
|---|---:|---|---|
| A — API/compatibilité | 8 | HTTP loopback, refus d'enveloppe, reçu durable/idempotent, contextes et session révoquée. | Tokens/capacités injectés ; pas TLS, négociation sûre ou Core/MLD complet. |
| B — Identité | 7 | PBKDF2, TOTP/vecteurs RFC6238, challenge/compteur, récupération concurrente unique, fraîcheur/révocation. | Seed clair temporaire, même poste ; pas enrôlement, possession de second appareil, magasin de secrets ou anti-bruteforce. |
| C — Livraison | 7 | Artefact/manifeste de fixture, migration SQLite interrompue, rollback compatible sans perte. | Fichiers JSON déclaratifs ; pas binaire signé, CI/CD, trafic ou déploiement réel. |
| D — Accessibilité | 6 | Navigateur réel/CDP, tabulation, focus, noms/rôles AX, formulaire HTTP, reflow 320 px. | Pas lecteur d'écran, annonce sonore ou audit WCAG global. |
| E — Export/récupération | 6 | Fichiers/manifeste/médias, reprise, autorité par portion, réimport isolé comparé à la source. | Pas signature, gros patrimoine, migration fournisseur, import Core ou sortie réseau qualifiée. |
| F — Alternatives/budget/exploitation | **0 supplémentaire** | Arithmétique, liens aux preuves, comparaison/procédures/rôles à nommer. | Étude documentaire, pas devis accepté, coût total ou exploitation opérationnelle. |

Les 34 essais ne comptent ni les six vecteurs RFC séparément ni les contrôles documentaires F comme des essais d'infrastructure. Échecs initiaux de navigateur/harness conservés dans l'historique, correction puis rejeu ; aucune nouvelle revue indépendante revendiquée.

## Articulation et limites du montage

D utilise réellement A via HTTP : le formulaire dépose un reçu, gère le refus après révocation et conserve un texte synthétique. **B n'est pas raccordé à A/D** ; les jetons codés en dur de la page sont exclusivement un dispositif de banc et ne doivent pas être repris dans le produit. Le localStorage clair de D ne réalise pas le journal chiffré requis par PT03.

C ne livre pas A/B/D/E sous forme de logiciel signé : les versions et capacités des artefacts sont déclarées dans du JSON. E réalise un export sous garde de publication filesystem, pas via le transport de A. F relie les preuves des six prototypes et décrit les procédures, sans nommer fictivement un exploitant ni convertir une provision en prix fournisseur.

Les petits mécanismes sont cohérents à leur frontière déclarée ; **ils ne constituent pas une application Core intégrée prête à livrer**. La clôture du prototype porte sur faisabilité et contrats de reprise, pas sur l'assemblage final ni toutes les qualités de production.

## Réserves opposables

- **PT06-R01 — API et compatibilité.** Identité authentifiée/capacités négociées, TLS/proxy, validation complète et limites anti-abus ; API réelle raccordée aux transactions/MLD et autorisations. Le reçu technique ne prouve pas intégration ; ancien client insuffisant ne conserve pas un accès protégé par simple déclaration de version.
- **PT06-R02 — Identité/MFA.** Enrôlement, facteur sur autre appareil, protection/rotation/récupération des seeds, politique de mots de passe et KDF calibré, anti-bruteforce, session/réauth et perte de codes après PRA. Réussite TOTP de banc ne qualifie pas IdP de production ou résistance au phishing.
- **PT06-R03 — Livraison.** Chaîne de confiance/signature, artefact réel et migration MPD, compatibilité prouvée sur ancien exécutable, activation sous trafic, rollback et responsables. Aucune restauration d'ancienne autorité pour rendre un rollback possible.
- **PT06-R04 — Accessibilité.** Recette lecteur d'écran et utilisateurs, parcours complets/clients cibles, contraste/zoom/focus/annonces/mobiles et audit WCAG approprié. AX/live et styles calculés ne prouvent pas une annonce auditive ni une conformité globale.
- **PT06-R05 — Récupération patrimoniale.** Manifestes authentiques, types/volumes/historiques réels, protection de l'export, corruption/quotas/archives et réimport du Core. Une portion déjà délivrée ne peut être effacée par révocation ultérieure ; pas réversibilité fournisseur complète déduite de deux objets.
- **PT06-R06 — Choix/budget/exploitation.** Langage/frameworks/hébergement encore candidats, compétences et responsables à nommer. Enveloppe cible 70 € + 30 € réserve, pas production chiffrée/conforme démontrée. Devis, contrats, coûts de maintien/astreinte, alertes et capacité à qualifier avant engagement.
- **PT06-R07 — Réserves des prototypes précédents.** NF10, NF05/RPO/RTO, chiffrement/horloge multi-OS, autorité indépendante, générations après restauration, propagation/MPD-04, effet externe, équité et capacité représentative restent ouverts selon leurs dossiers. La fin de PT06 ne clôt pas ces obligations par transitivité.

## Critères de clôture réduite candidats

| Porte | Critère | État |
|---|---|---|
| C1 | 34 résultats passants, preuves/sources et nettoyage concordants. | Contrôle consolidé reproductible. |
| C2 | Contrats API/réception/compatibilité et recontrôle courant. | A sur HTTP synthétique. |
| C3 | Identité fondée sur primitives testées, anti-rejeu/récupération et limites explicites. | B, sans IdP produit qualifié. |
| C4 | Migration/reprise/rollback sans perte ni ancienne autorité permissive. | C sur artefacts de fixture. |
| C5 | Parcours réel clavier/AX/erreurs/statut ; absence de recette AT déclarée. | D sur navigateur réel. |
| C6 | Export/reprise/réimport de contrôle, manifeste et portions sous autorité. | E sur petits fichiers locaux. |
| C7 | Alternatives, budget/procédures et R01–R07 reliés aux preuves ; pas devis/qualifications inventés. | F documentaire et présent dossier. |
| C8 | Décision du porteur sur ce périmètre et report fidèle aux registres. | **Acté le 15/10/2026** : instruction « ok poursuis » du porteur, [décision liée aux preuves](preuves/DECISION_CLOTURE_PT06.json) et report aux registres. |

Clôture proposée : **faisabilité ciblée des contrats API, livraison et récupération**, avec R01–R07 maintenues. Toute contradiction dans le périmètre démontré doit être résolue ; modification d'une primitive impose rejeu/empreintes. Les surfaces non qualifiées restent réserves de livraison, pas PASS par omission.

## Bilan des six prototypes et prochain jalon

| Prototype | État actuel | Preuve de portée |
|---|---|---|
| PT01 | Clos réduit — 13/10/2026 | Rapport/empreintes, 13 scénarios, règle temporelle DC-AUTH-01. |
| PT02 | Clos réduit — 13/10/2026 | Décision C1–C8, 37 scénarios SQL/HTTP et contrôles du modèle distincts, NF10 réservé. |
| PT03 | Clos réduit — 13/10/2026 | 52 essais, contre-épreuve DPAPI incluse, réserves R01–R04. |
| PT04 | Clos réduit — 14/10/2026 | 37 essais, réserves R01–R05, NF05 non qualifié. |
| PT05 | Clos réduit — 14/10/2026 | 34 cas, réserves R01–R05, capacité/MPD-04 non qualifiés. |
| PT06 | Clos réduit — 15/10/2026 | 34 essais A–E + F documentaire, réserves R01–R07 maintenues. |

Ces nombres ont des corpus/natures distincts ; aucun total ne doit être présenté comme des tests indépendants d'un logiciel intégré. La décision C8 achève le jalon des six prototypes **sur leurs périmètres réduits**, sans gel de l'architecture ni autorisation de lancement. Les sept réserves PT06 et celles des autres prototypes restent opposables.

Prochain travail concret : (1) revue unique des réserves et des 62 décisions encore ouvertes dans le registre architectural ; (2) choix candidats de pile/identité/exploitation avec compétences et devis dans 100 €/mois, décisions explicites du porteur ; (3) tranche Core intégrée de qualification (autorisation/versionnement, réception, outbox, sortie et reprise) et MPD physique ; (4) recette sécurité/OS/accessibilité/PRA/capacité sur périmètres réellement livrés. Les arbitrages numériques, fournisseurs et renoncements à une exigence ne sont pas acquis par « prototype clos ».

Le souhait d'abonnements en décembre 2026 et d'achèvement des prototypes avant lancement demeure une cible du porteur. Aucun planning de livraison, conformité globale ou financement acquis n'est déduit des bancs locaux. Coût cloud engagé : nul ; budget de production non validé.
