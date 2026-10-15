# PT05 — Asynchrone, propagation et capacité

14 octobre 2026. **Préparé, non exécuté ; PT05 non clos.** Prérequis : PT01–PT04 clos sur leurs périmètres réduits. [Dossier asynchrone](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_07_ASYNCHRONE_PROPAGATION_DIMENSIONNEMENT.md), AS01–12, ASY-01–07. Réserves PT04-R02/R05 et PR11 maintenues ; aucune pile ou valeur MPD-04 ratifiée.

## Lot A — Livraison répétable et tentative active

| Expérience préspécifiée | Attendu |
|---|---|
| Transaction annulée après préparation d'outbox | Aucun travail accepté ou publié depuis un état non commis. |
| Commit métier + outbox, dispatcher interrompu avant/après publication | Travail retrouvable et livraison rejouable ; pas de suppression prématurée de l'outbox. |
| Publication/consommation répétée et accusé perdu | Un effet local et checkpoint durable ; rejet d'une origine réutilisée avec autre empreinte. |
| Bail expiré, reprise par un second worker puis retour du premier | Jeton de tentative/fencing actuel exigé ; ancien worker ne finalise ni n'écrase. |
| Annulation/suspension entre préparation et finalisation | Effets acquis conservés ; aucun succès ancien après arrêt opposable. |
| Deux finalisations concurrentes | Un seul effet canonique admissible ; états et traces durables concordants. |

Commencer par transactions locales réelles, subprocess distincts et pannes aux frontières nommées. Temps injecté pour ordonnancement déterministe, essais d'horloge réelle séparés. La livraison répétable n'est pas une promesse de transport exactement une fois. Un worker ne gagne pas des droits par son rôle technique ; le contrôle métier actuel à la finalisation reste une obligation.

## Lots complémentaires

- **B — Propagation/générations (AS05–08).** Marquage direct au commit, barrière conservative sur aval possiblement concerné, deux causes concurrentes, nouvelle dépendance pendant parcours, cycles. Une ancienne génération ne clôt pas un impact récent ; pas de fausse complétude ni de fuite de cause cachée.
- **C — Autorité/effets externes (AS04, PR11).** Révocation pendant traitement, résultat prestataire après perte d'accusé : rechercher/réconcilier ou réutiliser sa clé d'idempotence. Sans ce contrat, état incertain et arrêt contrôlé, pas relance aveugle ou garantie universelle d'effet unique. Prestataire synthétique d'abord, sans messages réels ni service payant.
- **D — Admission/équité (AS10/12).** Charge mixte, retries bornés, quotas, concurrence et ressources réservées ; saturation/refus visibles et non destructifs. Éprouver la famine et la récupération, pas seulement vérifier une priorité configurée.
- **E — Délais/capacité/coût (AS11/12).** Corpus/profil/graines déclarés avant collecte ; mesurer maximum de propagation, débit/attente/mémoire et écarts sous saturation. MPD-04 reste à fixer après mesure ; aucun percentile favorable ne remplace un maximum contractuel. Mesures locales de faisabilité distinctes de NF/volumes de production.

## Preuves et limites

Publier scénario AS, sources/empreintes, supports, ordre commit/publication/prise de bail/effet/accusé, état après panne, temps et surface observable. Pas de PASS par omission ; ordonnance et temps injectés déclarés. Primitives réelles et procédures de récupération identifiées avant clôture réduite. Tous les AS ne seront pas automatiquement démontrés par une seule file synthétique.

ASY-01–07, profils PAR-CDC-01/02/06/07 et MPD-04 restent ouverts tant que leurs preuves/décisions propres manquent. Aucune charge NF représentative ni coût fournisseur acquis avant mesure. Budget préalable de 100 €/mois, aucun service payant engagé ; PT06 reste requis avant lancement et choix de pile final.
