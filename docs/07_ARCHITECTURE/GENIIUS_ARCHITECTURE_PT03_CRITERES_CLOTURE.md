# PT03 — Consolidation et critères de clôture réduite

13 octobre 2026. **52 essais exécutés et attendus satisfaits ; PT03 clos sur son périmètre réduit.** Décision du porteur : « poursuis », après présentation du dossier prêt pour décision. Aucune qualification globale des clients, de ST-06 ou de SYN-04/07, aucun gel d'architecture ni choix de pile. Les résultats bruts et preuves des lots conservent leur statut expérimental antérieur à cette décision.

## Preuves et articulation

| Lot | Essais | Preuve obtenue | Réserve de recette |
|---|---:|---|---|
| A | 8 | Réception durable, effet unique, pannes et rejeu dans de nouveaux processus. | Identité/transport, moteur complet et conservation des reçus. |
| B | 6 | Barrière durable, retraits avant ajouts, génération périmée et appareil révoqué. | Protocole réseau et registre de remise/accusés ; garde locale de banc. |
| C | 7 | Conversion avec provenance, ambiguïté/champ inconnu en attente, migration atomique et SQLITE_FULL. | Matrice réelle de versions/référentiels ; plafond SQLite ne qualifie pas le disque matériel. |
| D | 11 | Borne logique stricte, fermeture sur discontinuité, nouveau processus/snapshot de base. | Temps et confiance injectés ; pas de veille/hibernation/redémarrage OS réel. |
| E | 7 | DPAPI Windows réel, récupération dans un autre processus, refus des corruptions testées. | Petits blobs, pas bases complètes ; autres comptes/OS et récupération de clés non éprouvés. |
| F | 8 | Purges avant reconstruction, reçu extérieur conservé, chunks durables et intégrité avant disponibilité. | Autorité de purge/reçus à qualifier par PT04 ; manifeste fiable et réseau injectés. |
| G | 5 | Montage D/E : contrôle avant déchiffrement, expiration/reprise/contexte/corruption fermés, journal récupérable. | Pas de concurrence/remise locale, anti-rollback matériel ou snapshot mémoire. |

Les 52 essais comprennent **E07, contre-épreuve attendue** : un ancien blob valide reste déchiffrable par DPAPI seul. Son PASS désigne un constat reproduit, pas une garantie de fraîcheur. G02 montre uniquement qu'après expiration la barrière temporelle empêche sa lecture via le client ; il ne prouve pas le rejet d'une ancienne version pendant une autorisation encore valide.

[Banc et rapports par lot](../../spec/prototypes/pt03/README.md), [résultats G](preuves/RESULTATS_PT03_ARTICULATION.json), [contrôle consolidé](preuves/CONTROLES_PT03_CONSOLIDES.json). G réutilise réellement ClockFixture de D et transform de E, sans modifier leurs sources gelées par empreintes. Journal et réplique sont deux blobs distincts ; aucun chiffrement rétroactif des bases A–D/F n'est prétendu. Les autres articulations sont analysées ci-dessous, pas présentées comme un Core intégré exécuté.

## Contrats aux frontières et constats restants

| Frontière | Contrat de reprise | État de la preuve |
|---|---|---|
| A → B | Les retraits et la fermeture de réplique ne détruisent pas les deltas ; appareil révoqué n'active pas leur intégration. | Journal intact dans A/B, cas B06 après réception ; pas serveur A+B unifié. |
| B → C | Migration/version ne réouvre pas une barrière sans réconciliation des droits. | C conserve gate=0 jusqu'à action explicite ; réconciliation simulée. |
| D → E | Vérifier continuité/contexte/échéance avant déchiffrement, fermer sur intégrité inconnue ; récupération distincte du journal. | Cinq essais G exécutés sur Windows ; temps/identité injectés. |
| B/F → PT04 | Registre de purges/reçus et registre de remise ne peuvent revenir silencieusement avant leur autorité restaurée. | F restaure uniquement serveur, registre externe conservé. Durabilité/anti-retour de l'autorité non démontrés. |
| C/F → stockage | Une conversion ou un transfert incomplet ne devient pas vérité scientifique/disponibilité confirmée. | C conserve original sans validation ; F ne publie l'original qu'après intégrité. Pipelines non unifiés. |

**PT03-R01 — remise/registre :** publication initiale d'une cible délivrée et accusé durable entre serveur/client, sans transaction distribuée implicite. Avant recette SYN-07 ; joindre aux obligations de PT04 sans déclarer que PT04 couvrira seul le protocole réseau.

**PT03-R02 — fraîcheur locale :** DPAPI ne suffit pas à rejeter les anciennes versions. Le client ferme après perte de continuité et peut exiger reconnexion. Une consultation continue après redémarrage n'est pas promise. Gestion des anciennes versions pendant une lease valide et génération authentifiée restent à éprouver ; aucune exigence anti-rollback n'est abandonnée.

**PT03-R03 — plateforme :** sélectionner et qualifier chiffrement des magasins complets, gestion/récupération/rotation de clés, isolation des comptes et sources de temps par OS. DPAPI utilisateur n'isole pas les processus d'un même compte. Pas de résultat macOS/mobile, TPM, veille ou redémarrage OS réel.

**PT03-R04 — recette représentative :** identité/canal/anti-rejeu, référentiels réels, curseurs signés et rétention, conflits/dépendances, gros volumes, pannes matériel, délais/capacité et politique réseau. Les constantes/versions/graines du banc ne sont pas des paramètres produit ratifiés.

Le résidu de révocation hors ligne reste un écart amont déclaré : une autorisation locale ne connaît pas immédiatement une révocation survenue après déconnexion. Aucun essai ne supprime ce résidu par définition.

## Grille de clôture réduite candidate

| Porte | Critère | État |
|---|---|---|
| C1 | Sources/preuves concordantes, 52 attendus satisfaits, fichiers temporaires retirés. | Contrôle consolidé reproductible ; coût cloud nul. |
| C2 | Réception/intégration distinctes, pannes et rejeu sans double effet. | A, F sur corpus déclaré. |
| C3 | Retraits durables et journal conservé, anciennes générations/appareil révoqué refusés. | B sur protocole local de banc. |
| C4 | Compatibilité/conversions/migration, originaux et ambiguïtés conservés. | C sur formats synthétiques. |
| C5 | Borne temporelle conservative et fermeture sans continuité ; déchiffrement soumis à cette barrière. | D/G logiques, DPAPI réel E/G ; aucune qualification d'horloge OS. |
| C6 | Reconstruction après purge et intégrité avant disponibilité binaire. | F avec autorité extérieure conservée. |
| C7 | Contre-épreuve E07 conservée ; réserves R01–R04 attribuées à SYN/recette/PT04. | Documentées, restent opposables au gel/livraison. |
| C8 | Décision explicite du porteur sur ce périmètre et report fidèle dans les registres. | **Acté le 13/10/2026** : instruction « poursuis » du porteur après présentation des critères et réserves ; [preuve de décision](preuves/DECISION_CLOTURE_PT03.json), statuts consolidés mis à jour. |

La clôture proposée porte sur la **faisabilité ciblée des mécanismes de synchronisation**, pas sur la qualification d'un client hors ligne complet. Une preuve contradictoire sur ce périmètre doit être résolue avant clôture ; une modification des primitives impose un nouveau jeu de résultats. Les insuffisances déclarées des surfaces/OS restent des réserves de livraison, pas des PASS par omission. Les six lots et G ne sont pas six preuves indépendantes : même banc et même auteur, sans nouvelle revue indépendante revendiquée.

La décision C8 clôt PT03 comme preuve de faisabilité ciblée sur C1–C7, avec R01–R04 maintenues. PT04 démarre sur persistance/conservation/restauration, notamment R01 et l'autorité de purge/reçus de F. SYN-01–07 restent ouverts ; les paramètres métier et la qualification globale ne sont pas clos par cette décision. PT05/06 restent obligatoires avant lancement commercial, budget préalable de 100 €/mois maintenu.
