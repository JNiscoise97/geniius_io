# DC-AUTH-02 — Instant d'autorisation des portions de lecture

**RATIFIÉ par le porteur le 13 octobre 2026.** Référence courante : contrat V1.6 + DC-AUTH-01 (mutations) + DC-AUTH-02 (lectures). Les baselines V1.6 et CDC V1.2 et leurs empreintes initiales sont conservées. Aucun gel global V1.7 ou d'architecture n'est prononcé.

## Autorisation et règle normative

Le porteur a répondu : « Oui, retenir le contrôle final pour chaque portion et adapter les règles de lecture ». La question présentait explicitement le cas contrôle 11:59:59.900, expiration 12:00:00, envoi 12:00:00.100 autorisé, portion suivante refusée. Elle précisait que cela autorise des octets envoyés après expiration et modifie les règles gelées des lectures, distinctement de DC-AUTH-01.

Chaque page ou portion bornée de réponse est engagée au contrôle final serveur d'autorisation, sous garde canonique conservée jusqu'à sa remise au transport. Tous les fondements sont valides à cet instant. Une échéance survenant après ce contrôle ne rappelle pas cette portion déjà engagée ; toute portion, page, reprise ou réponse suivante exige un nouveau contrôle. Aucun rendu préparé ni cache n'est directement diffusé sans ce contrôle final. Une révocation explicite prend effet selon la garde canonique. Le Core ne place aucune portion contrôlée dans une file différée réutilisable après relâchement de la garde.

La portion comprend les métadonnées sensibles nécessaires à son émission, notamment statut/en-têtes révélateurs et corps. Le premier statut/en-tête révélateur n'est pas remis avant le contrôle de la première portion. Les métadonnées génériques de transport et de terminaison n'accordent aucun accès au contenu. Les portionnements suivants n'utilisent jamais le contrôle de la première portion ni un cache d'autorisation expiré.

Le serveur utilise un instant canonique unique par contrôle final : rendu, compteurs, facettes et références de la portion sont évalués au même instant, sous la même garde. Les portions restent bornées ; la taille maximale, les timeouts, l'abandon d'une remise bloquée et les chemins proxy/CDN/stockage doivent être spécifiés et éprouvés avant livraison. La valeur 4096 octets utilisée par PT02 est un paramètre du banc, pas un engagement produit.

Une portion contrôlée avant échéance peut donc être remise après échéance en cas de pause serveur. Aucune borne physique d'arrêt des octets à l'échéance, ni de durée contrôle→remise, n'est promise par cet amendement. Les octets déjà remis au transport peuvent parvenir plus tard au destinataire. Une vérification impossible entraîne refus fermé avant toute nouvelle portion de contenu.

## Report ciblé dans la chaîne normative — changement CDC § 13

| Référence | Conséquence |
|---|---|
| Contrat V1.6, A6 / I-6 | L'autorisation temporelle d'une portion est évaluée à son contrôle final sous garde ; une portion suivante est un nouvel accès et réévalue ses fondements. |
| Contrat V1.6, § 13.9 et sorties paginées/différées | Ni réception, cache, URL connue ni rendu préparé ne valent engagement ; chaque nouvelle portion passe le contrôle final serveur. Le résidu hors ligne conserve ses règles propres. |
| CDC V1.2, § 14.1 ; architecture sécurité § 3, AC09/12, SEC-03 | Point logique de portion distinct de remise socket et de réception client. Protection/restriction/révocation explicites restent coordonnées par la garde canonique. |
| Dictionnaire V1.3 et MLD V1.1-g | Faits d'autorité/expirations inchangés ; instant du contrôle final distinct des horodatages de transport. Aucune nouvelle table ni colonne canonique adoptée ; instrumentation/protocole à traduire au MPD et dans le Core réel. |

## Preuves et réserves

[Rapport PT02](../07_ARCHITECTURE/preuves/RAPPORT_PROTOTYPE_PT02.md), [résultats](../07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT02.json), [empreintes](../07_ARCHITECTURE/preuves/PREUVES_PROTOTYPE_PT02.json). PT02-06 refuse une sortie dont l'expiration précède le contrôle final. PT02-07/08 éprouvent l'ordre face à la révocation. PT02-15/16 éprouvent page et portion engagées avant échéance, remises après échéance, suivies du refus de la nouvelle requête/portion.

La contre-épreuve historique CE01 reste une réfutation de la borne physique antérieure, conservée sans reclassement rétroactif. Le constat temporel est résolu sur le banc selon la nouvelle règle. PT02 reste partiel : UQ, graphe complet, recherche/rangs de production et statistiques NF10/MPD-03 restent à éprouver. SEC-03 conserve les réserves d'implémentation des chemins de sortie réels et des remises bloquées. Aucun choix de pile ni nouvelle garantie NF10 n'est ratifié.
