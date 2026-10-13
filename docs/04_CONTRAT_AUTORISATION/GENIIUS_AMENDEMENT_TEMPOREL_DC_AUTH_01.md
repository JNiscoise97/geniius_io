# DC-AUTH-01 — Instant temporel d'intégration des mutations

**RATIFIÉ par le porteur le 13 octobre 2026.** Référence courante : contrat V1.6 + cet amendement ciblé. Les baselines gelées du contrat V1.6 et du CDC V1.2 restent conservées avec leurs empreintes initiales. Cet amendement remplace, pour les mutations, l'assimilation de l'instant d'intégration à une obligation de commit physique avant échéance.

## Décision et règle normative

Le porteur a répondu explicitement : « Oui, retenir l'instant du contrôle final et adapter le contrat et PT01 », après présentation de l'exemple contrôle 11:59:59.900, échéance 12:00:00, commit 12:00:00.100. Cet exemple est accepté sous les conditions suivantes. La décision ne ratifie aucune technologie et ne gèle pas l'architecture.

Pour une mutation, l'instant d'évaluation temporelle est l'instant serveur du contrôle final d'autorisation, effectué après acquisition de toutes les gardes et comme dernière instruction métier avant la fin de la transaction. Tous les fondements nécessaires doivent être valides à cet instant. Les gardes d'autorité et d'agrégat restent détenues jusqu'au commit ou à l'abandon. La mutation ne produit aucun effet canonique ni résultat de succès avant commit. Une échéance survenant après ce contrôle final ne révoque pas rétroactivement cette mutation ; les opérations et divulgations suivantes réévaluent l'autorisation à leur propre instant. Une révocation concurrente est ordonnée par la garde canonique et devient effective à son commit.

Le Core de confiance possède la transaction. Le demandeur ne pilote ni les instructions SQL ni l'appel au contrôle final. Après ce contrôle, aucune nouvelle mutation métier n'est ajoutée à la transaction. Après conflit, rollback ou reprise, recommencer toutes les évaluations avec un nouvel instant ; aucun certificat d'une transaction abandonnée n'est réutilisé. Une impossibilité de vérifier impose refus fermé et annulation de tous les effets.

Le commit demeure le point d'atomicité, de persistance et de visibilité. Aucune borne maximale entre contrôle et commit n'est introduite. Une lecture, page, reprise, sortie différée ou nouvelle opération après expiration reste soumise à A6 et à son instant propre ; le succès d'une mutation ne donne aucun droit de lecture supplémentaire.

## Report normatif ciblé — procédure de changement CDC § 13

| Référence | Conséquence |
|---|---|
| Contrat V1.6, A6 et I-6 | Aucun nouvel accès après expiration ; décision finale de mutation antérieure soumise à la règle ci-dessus. |
| Contrat V1.6, § 13.9 | L'instant d'intégration pour l'autorisation d'une opération hors ligne est le contrôle final serveur, distinct de réception et date client ; succès uniquement après commit. |
| CDC V1.2, § 14.1 et § 14.2 | Réévaluation actuelle et intégration au temps serveur appliquent cet amendement ratifié, avec conservation de la baseline gelée. |
| Dictionnaire V1.3 et MLD V1.1-g | Expirations et faits d'autorité inchangés ; instant du contrôle final distinct de réception, validation scientifique et commit. Traduction physique au MPD ; aucune nouvelle structure relationnelle adoptée ici. |
| Architecture sécurité, AC03 / SEC-01 | Refus si échéance atteinte avant contrôle final ; commit tardif permis si contrôle valide et gardes conservées. Obligation de borne physique remplacée. |

## Preuves et limites

[Rapport PT01](../07_ARCHITECTURE/preuves/RAPPORT_PROTOTYPE_PT01.md), [résultats](../07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT01.json), [empreintes](../07_ARCHITECTURE/preuves/PREUVES_PROTOTYPE_PT01.json). PT01-03 éprouve le refus avant contrôle final ; PT01-11 le déclenchement anticipé sans certificat ; PT01-12 le commit tardif, l'absence de visibilité préalable et l'ordre de révocation ; PT01-13 l'annulation du certificat et le rejeu après expiration.

Ce corpus réduit ne vaut pas nouvelle campagne exhaustive du modèle V1.6, preuve HTTP, recette du MPD complet ou gel global V1.7. Le [dossier temporel](../07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT01_RESOLUTION_TEMPORELLE.md) précise le protocole. Les contre-épreuves initiales restent archivées comme réfutations de l'exigence physique remplacée.
