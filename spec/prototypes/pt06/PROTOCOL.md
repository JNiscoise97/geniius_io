# PT06 — Contrats API, livraison et récupération

14 octobre 2026. **Préparé, non exécuté ; PT06 non clos.** Prérequis : PT01–PT05 clos sur leurs périmètres réduits. Référence : [alternatives technologiques, PT06](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_09_ALTERNATIVES_TECHNOLOGIQUES.md), [déploiement](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_08_DEPLOIEMENT.md), contrats API/compatibilité et dossiers propriétaires CDC/Core. Aucun choix de pile ou déploiement public autorisé par ce protocole.

## Lot A — Frontière API et compatibilité

| Expérience préspécifiée | Attendu |
|---|---|
| Opération inconnue, enveloppe invalide ou champ sémantique inconnu | Refus explicite ou dépôt isolé selon contrat ; aucun effet canonique ni suppression des deltas. |
| Réception durable répétée, même origine avec autre empreinte | Accusé technique distinct d'intégration ; un reçu, conflit non destructif. |
| Même cible cachée/absente, mauvais contexte compte/appareil | Réponse générique, pas détail FK/identité/correspondance révélé. |
| Ancien client capable de recevoir mais incapable d'appliquer les retraits | Pas d'ajouts ni consultation protégée ; journal privé conservé et chemin sûr de récupération. |
| Version convertible vs version ambiguë/inconnue | Provenance conservée ; conversion déterministe seulement, attente explicite sinon. |
| Session/appareil révoqué pendant suite de requêtes | Recontrôle par requête/portion, pas autorisation héritée d'une négociation initiale. |

Première exécution : HTTP loopback et corpus synthétique, sans exposer de service externe. Statuts/en-têtes/corps et effets durables publiés ; réutiliser des primitives de PT01–03 lorsque pertinent, sans prétendre que le banc livre le Core complet. Aucun framework/API fournisseur ratifié par la réussite des essais.

## Lots complémentaires

- **B — Identité/MFA.** Comptes/appareils distincts, session/réauthentification, facteur/recovery codes et rejeu. Séparer politique injectée de preuve cryptographique réelle ; un booléen mfa=true ne qualifie pas MFA. Aucun compte utilisateur réel modifié, biométrie stockée ou service d'identité payant engagé.
- **C — Livraison/rollback.** Artefact/manifeste versionné, migration interrompue, retour applicatif compatible avec schéma/données, ancienne version incapable de protéger les données refusée. Journal/contributions conservés ; aucune restauration d'anciens droits pour faciliter rollback. Procédure/opérateur et anomalie de reprise explicités.
- **D — Accessibilité.** Parcours et interface réelle sur composants candidats, clavier, focus, annonces d'erreur/états et technologies d'assistance. Une spécification ou inspection de JSON n'atteste pas une recette d'accessibilité ; périmètre/client/outillage et observations doivent être déclarés.
- **E — Récupération/export patrimonial.** Corpus et médias, manifeste/intégrité/provenance, versions et protections ; reprise d'export interrompu et réimport de contrôle. Autorisation actuelle à chaque sortie ; aucun export d'une cible retirée depuis une ancienne autorisation. La réversibilité d'un petit fixture ne prouve pas la migration complète d'un fournisseur.
- **F — Alternatives/budget/exploitation.** Consolider preuves des six prototypes, coûts et responsabilités, procédures de livraison/récupération ; devis hypothèses et dimensions déclarés. Ne pas proposer une pile comme gelée sans décision du porteur et qualification des réserves antérieures.

## Conditions de preuve et réserve de gel

Publier contrats et scénarios, sources/empreintes, sorties observables et états durables, versions/OS/capacités, secrets/outils et limites. Aucun PASS par omission ou tests purement déclaratifs. Clôture réduite uniquement sur mécanismes réellement éprouvés ; qualification identité, accessibilité et PRA nécessite ses preuves propres. Les réserves PT01–05, NF10/NF05, MPD-04, domaines de panne et profils représentatifs restent opposables au gel/livraison.

Budget préalable de 100 €/mois, lancement visé décembre 2026, six prototypes avant lancement selon préférence du porteur. Aucun service payant engagé ; les coûts de production ne sont pas déduits du seul coût cloud nul des bancs locaux. PT06 préparé ici ne signifie pas fin du jalon des six prototypes ni autorisation de publication/merge/déploiement.
