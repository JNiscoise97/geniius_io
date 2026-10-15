# PT04 — Consolidation et critères de clôture réduite

14 octobre 2026. **37 essais A–F réussis ; PT04 clos sur son périmètre réduit.** Décision du porteur : « poursuis », après présentation du périmètre prêt pour décision et des cinq réserves. Sans qualification NF05/RPO/RTO, sans gel ou choix de pile. Les résultats bruts restent aux statuts expérimentaux antérieurs. [Banc et rapports](../../spec/prototypes/pt04/README.md), [contrôle consolidé](preuves/CONTROLES_PT04_CONSOLIDES.json).

## Couverture des scénarios du dossier persistance

| Référence | Preuve disponible | Limite |
|---|---|---|
| PR01 | C : média orphelin publié avant base, panne/rejeu sans duplication. | Fichier local, pas stockage objet distribué. |
| PR02 | C : média absent/corrompu rend consultation indisponible ; F : média altéré ferme la porte. | Pas remise concurrente/réseau ni inventaire complet de patrimoine. |
| PR03 | **Non exécuté** : original modifié par conversion/OCR. | Conservation original/conversion éprouvée séparément dans PT03 C ; pas pipeline documentaire PT04. |
| PR04 | **Non exécuté** : binaire mutualisé et absence d'oracle de déduplication. | D utilise des fichiers distincts ; aucun choix de mutualisation ratifié. |
| PR05 | A/D/F : purges extérieures réappliquées, dérivés/tâches/fichiers D retirés. | Portée de purge/inventaire injectés ; pas effacement forensique. |
| PR06 | B : restrictions/fermeture actuelles, suppression d'index et ancienne session refusée. | Politiques synthétiques ; répétitions de restauration/générations non qualifiées. |
| PR07 | A : intention/commit/accusé interrompus ; reprise complète ou anomalie fermée. | Un effet local déterministe, pas tous les actes du Core. |
| PR08 | A/B/F : effet perdu reconstruit si admissible, conflit/inadmissibilité ferme la reprise. | Source de reconstruction fiable et disponible ; pas effets externes. |
| PR09 | **Non exécuté dans le montage PT04** : snapshot local/curseur ancien. | PT03 D/F fournissent des preuves ciblées séparées ; pas qualification d'une reconnexion client après ce PRA. |
| PR10 | A/B : autorité absente/ancienne/tronquée ; E/F : secret absent/incorrect, archive/manifeste/média altéré. | DPAPI profil courant, secret et témoins injectés ; pas récupération après perte du profil/escrow indépendant. |
| PR11 | **Non exécuté** : effet externe avec accusé perdu. | À articuler à PT05 et contrats d'idempotence/recherche des prestataires. |
| PR12 | F : exercice combiné sur petit corpus, phases monotones et durées publiées. | **Pas qualification NF05** sur volume/capacité cible ; RPO/RTO non mesurés à cette échelle. |

Totaux : A 8, B 6, C 7, D 6, E 6, F 4. Les cas omis ne sont ni PASS ni supprimés des exigences. Même banc et même auteur ; aucune nouvelle revue indépendante revendiquée.

## Articulation effectivement éprouvée

F réutilise les primitives A/B/E : archive protégée → base restaurée → autorité/purges/politiques/intentions réconciliées → média vérifié → ouverture du superviseur. Une sauvegarde saine ne compense pas une autorité tronquée. La base peut être cohérente et rester fermée si le média manque d'intégrité. Une panne après commit d'autorité laisse la porte extérieure fermée ; une nouvelle reprise reconstruit un effet final unique.

C prouve séparément le dépôt et la réparation fichier/base, D la purge d'un corpus fini et sa réapplication aux sauvegardes. Le fichier de F est lié au seul objet conservé ; il ne monte pas tous les binaires/copies et résidus de sauvegarde de D. Le superviseur est un contrat de banc, pas un serveur soumis à des lectures concurrentes.

## Réserves opposables

- **PT04-R01 — Autorité indépendante (PER-03).** Checkpoint courant, manifeste, portée et droits fiables injectés. Magasins sur même poste, pas domaines de panne indépendants. Retour simultané base/registre/checkpoint non protégé par un témoin fiable extérieur : fraîcheur non prouvable, service doit rester fermé. Éprouver copies, signatures, checkpoints et accès avant recette.
- **PT04-R02 — Reprise des identités et effets (PER-04, SYN-03/07).** Origines synthétiques, anomalies sans workflow opérateur. Les anciens sessions/epochs après restaurations répétées restent à qualifier : incrémenter un epoch restauré peut reproduire une ancienne valeur. Une identité/génération fraîche liée à l'autorité extérieure doit être démontrée avant livraison. Effets externes non couverts ; PT05 ne permettra pas de promettre une exécution unique sans contrat prestataire.
- **PT04-R03 — Stockage, purges et intégrité (PER-02/06).** Pas de mutualisation/absence d'oracle, pipeline OCR, inventaire générique de copies ou effacement forensique. fsync/renommage local ne qualifient pas coupure électrique, stockage objet ou volumes. Supprimer les fichiers connus n'est pas certifier l'absence de toutes copies/sauvegardes. RPO médias distinct ouvert.
- **PT04-R04 — Secrets et sauvegardes (PER-01/05, MPD-05).** DPAPI utilisateur Windows et secret en mémoire/stdin ; pas escrow, récupération hors profil, HSM ou procédure d'accès opérateur. Déchiffrement avec staging clair, effacement mémoire/disque non prouvé. Reprotection sous nouveau secret ne révoque pas anciennes archives/secrets. Rétention légale et rotation restent à décider.
- **PT04-R05 — Recette PRA (PER-07, NF05).** Chronométrages F diagnostiques ; objectifs RPO structuré ≤ 5 minutes et RTO ≤ 4 heures inchangés. Déclarer corpus, incidents, service rétabli, dernier commit récupéré, capacité/coût et anomalies avant exercice représentatif. Les actes de sécurité ne deviennent pas une perte admissible de cinq minutes.

Ces réserves restent ouvertes après une éventuelle clôture du prototype. La réduction de périmètre ne réduit pas le contrat ni les exigences produit. Aucune plateforme/hébergeur ratifié ; budget préalable de 100 €/mois respecté, coût cloud des essais nul.

## Critères de clôture réduite candidats

| Porte | Critère | État |
|---|---|---|
| C1 | 37 résultats passants, sources/preuves concordantes et fichiers temporaires retirés. | Contrôle consolidé reproductible. |
| C2 | Autorité absente/ancienne/tronquée refuse ouverture, même génération ne suffit pas. | A/B, checkpoint fiable de fixture. |
| C3 | Purges/politiques et effets réconciliés avant ouverture ; conflits/inadmissibilité fermés. | A/B/F sur corpus local. |
| C4 | Dépôt fichier/base et reprise idempotente ; absence/corruption rend source indisponible. | C sur fichiers réels synthétiques. |
| C5 | Copies/dérivés/sauvegardes du corpus purgés ou résidus explicitement déclarés. | D, inventaire fini injecté ; pas forensic. |
| C6 | Archive protégée et secret/manifestes contrôlés ; montage base/média/autorité sous barrière. | E/F réels sur Windows ; confiance injectée et escrow réservé. |
| C7 | PR non exécutés et R01–R05 attribués à recette/PT05, pas de NF05 inventé. | Table et réserves ci-dessus. |
| C8 | Décision du porteur sur ce périmètre, report aux registres sans fermer PER-01–07. | **Acté le 14/10/2026** : instruction « poursuis » du porteur, [preuve de décision](preuves/DECISION_CLOTURE_PT04.json) et report aux registres. |

Clôture proposée : **preuve de faisabilité ciblée de la persistance et restauration sous barrière** sur C1–C7. Les garanties de PRA indépendant, de fraîcheur matérielle et de récupération opérationnelle ne sont pas acquises. Une preuve contradictoire sur ce périmètre devra être résolue ; une évolution des sources impose rejeu et nouvelles empreintes. Les PR hors périmètre restent réservés à leurs mécanismes réels, pas déclarés prouvés.

La décision C8 clôt la preuve de faisabilité ciblée C1–C7 avec R01–R05 maintenues. PT05 traite ensuite l'asynchrone, les reprises d'effets externes et le dimensionnement. PER-01–07 restent ouverts, PT05/06 obligatoires avant lancement. Le gel global exige aussi qualifications Core/MPD, OS, sécurité et PRA représentatif.
