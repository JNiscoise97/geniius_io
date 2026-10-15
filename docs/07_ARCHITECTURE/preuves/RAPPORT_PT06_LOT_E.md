# PT06 — Lot E : export patrimonial et récupération

**14 octobre 2026 — six essais réussis ; PT06 non clos, réversibilité complète non qualifiée.**

Export réel de deux objets visibles, leurs versions/provenance/protections déclarées et médias, vers fichiers JSON/base64 ; troisième objet caché omis. Manifeste comporte format/protocole/schéma/référentiel, contexte/génération et empreintes. SQLite sous garde jusqu’à publication locale de chaque portion (flush/fsync/replace) ; contrôle final avant manifeste d’achèvement.

| Cas | Expérience | Verdict |
|---|---|---|
| PT06-E01 | Export filtré avec provenance/médias et réimport identique | PASS |
| PT06-E02 | Interruption après portion : reprise sans faux achèvement | PASS |
| PT06-E03 | Révocation entre portions : ancienne génération refusée | PASS |
| PT06-E04 | Portion corrompue : réimport atomique refusé | PASS |
| PT06-E05 | Version inconnue : pas réinterprétation silencieuse | PASS |
| PT06-E06 | Mauvais compte/appareil : aucune portion publiée | PASS |

Panne réelle os._exit après première portion : aucun manifeste d’achèvement, reprise recontrôle/reproduit les portions sans doublon. Retrait du second objet avec changement de génération : reprise ancienne refusée, aucune seconde portion publiée. La première portion déjà délivrée n’est pas effacée à distance, conformément à la limite des contenus sortis du contrôle serveur.

Réimport de contrôle : schéma supporté, chemins/identifiants simples, ensemble manifeste/fichiers et empreintes du JSON/média vérifiés avant transaction de création dans une base isolée. Comparaison complète des lignes aux sources visibles (y compris bytes média). Corruption/schéma inconnu : aucune base import créée. Les protections copiées sont des métadonnées, jamais une nouvelle permission ; aucun import dans le Core ou les données du projet.

Pas manifeste signé ou authenticité fournisseur, stockage/réseau final, archiving/compression, gros volume, quotas/attaques d’archive ou import concurrent. Compte/appareil et autorité de fixture ; pas moteur complet de droits ou récupération authentifiée d’un journal réel. fsync/replace local ne qualifient pas une coupure matérielle. Export contrôlé à la remise filesystem, pas qualification de la sortie HTTP.

Total PT06 : 34 essais A–E. [Résultats](RESULTATS_PT06_LOT_E.json), [banc](../../../spec/prototypes/pt06/README.md). Coût cloud nul. Lot F (alternatives/budget/exploitation) et réserves de recette restent ouverts.
