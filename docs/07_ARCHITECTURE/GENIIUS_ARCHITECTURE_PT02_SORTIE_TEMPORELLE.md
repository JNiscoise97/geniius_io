# PT02 — Expiration entre contrôle et remise au transport

13 octobre 2026. **Option du contrôle final par portion ratifiée explicitement.** [DC-AUTH-02](../04_CONTRAT_AUTORISATION/GENIIUS_AMENDEMENT_LECTURES_DC_AUTH_02.md) adapte les lectures, avec conservation des baselines V1.6/CDC V1.2. [Rapport](preuves/RAPPORT_PROTOTYPE_PT02.md) et [traces](preuves/RESULTATS_PROTOTYPE_PT02.json) : seize scénarios réussis. Le constat temporel est résolu sur le banc ; PT02 reste partiel et SEC-03 conserve ses réserves d'implémentation.

## Constat

La garde d'autorité reste partagée pendant le contrôle, les en-têtes et la remise du corps HTTP. Une révocation exclusive attend donc la fin de cette remise. Chaque nouvelle page/portion relit l'autorité ; cache préparé et URL connue ne conservent pas l'accès.

Une expiration est différente : le temps passe sans acquérir de verrou. CE01 injecte une pause après le dernier contrôle, attend l'expiration vérifiée par l'horloge PostgreSQL, puis constate le contenu effectivement reçu par un client HTTP. Un contrôle préalable, une seconde vérification ou une marge fixe ne suffisent pas à prouver une borne physique sous pause serveur. Les en-têtes et le corps sont eux-mêmes des remises distinctes. Les octets déjà remis au transport peuvent arriver plus tard au client.

DC-AUTH-01 n'autorise que le commit tardif d'une mutation contrôlée avant échéance. Il ne s'applique pas automatiquement à une divulgation tardive.

## Option ratifiée : portion engagée au contrôle final

Règle ratifiée :

> Chaque page ou portion bornée de réponse est engagée au contrôle final serveur d'autorisation, sous garde canonique conservée jusqu'à sa remise au transport. Tous les fondements sont valides à cet instant. Une échéance survenant après ce contrôle ne rappelle pas cette portion déjà engagée ; toute portion, page, reprise ou réponse suivante exige un nouveau contrôle. Aucun rendu préparé ni cache n'est directement diffusé sans ce contrôle final. Une révocation explicite prend effet selon la garde canonique. Le Core ne place aucune portion contrôlée dans une file différée réutilisable après relâchement de la garde.

Exemple : contrôle de la portion à 11:59:59.900, expiration à 12:00:00, pause serveur, remise au transport à 12:00:00.100. Cette portion peut sortir selon cette option ; la suivante est refusée. **Cela autorise explicitement des octets remis après échéance**, même si les droits ont été contrôlés avant. Ce n'est pas une garantie physique d'arrêt à l'échéance.

La taille maximale d'une portion, les timeouts et l'abandon d'une remise bloquée doivent être fixés et éprouvés avant livraison. Le banc plafonne les corps/portions à 4096 octets, sans en faire une valeur produit. Le premier statut/en-tête révélateur est désormais remis sous garde après contrôle de la première portion. Le rendu, les compteurs et les facettes utilisent un même instant serveur canonique. Une annulation à échéance peut réduire le risque, sans prouver à elle seule l'absence d'octets tardifs. DC-AUTH-02 modifie explicitement A6/I-6 et l'architecture des lectures, distinctement de PT01.

## Alternative non retenue : maintenir la borne physique stricte

Garder SEC-03 et le constat temporel PT02 ouverts. La primitive HTTP/SQL éprouvée ne satisfait pas cette exigence. Poursuivre l'étude d'un mécanisme de divulgation démontrable ; une validation suivie d'un autre appel socket présente encore un intervalle. Aucun timeout ou buffering client ne permet à ce dossier de prononcer une clôture.

## Autres conditions de clôture PT02

La totalité de PT02 exige encore des preuves sur UQ, graphe complet, recherche/rangs et statistiques MPD-03/NF10. Les douze mesures de délais appariées sont exploratoires : ni seuil ni équivalence temporelle adoptés. La décision ratifiée et les tests PT02-15/16 résolvent le constat temporel sur ce banc, sans fermer ces autres constats. La contre-épreuve antérieure reste dans [l'historique](preuves/historique/RESULTATS_PROTOTYPE_PT02_AVANT_DC_AUTH_02.json). Aucun gel d'architecture ni choix de technologie.
