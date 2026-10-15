# PT03 — Synchronisation, compatibilité et horloge : protocole initial

13 octobre 2026. **Préparé, non exécuté ; PT03 non clos.** Prérequis : PT01 et PT02 clos sur leurs périmètres réduits. Référence : [dossier synchronisation](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_05_SYNCHRONISATION_COMPATIBILITE_HORLOGE.md), SY01–SY12, ST-01–08/12–14. Aucun choix de pile ou de durée produit.

## Périmètre et niveaux de preuve

Le banc séparera un journal privé de deltas et une réplique consultable. Les fixtures seront synthétiques, sans secrets ni données métier réelles. Chaque panne sera injectée à une frontière nommée et suivie d'une reprise depuis les données durables, dans un nouveau processus. Les résultats indiqueront explicitement stockage utilisé, OS, opérations réelles, simulations et réserves.

Un test de machine à états n'atteste ni chiffrement ni résistance au rollback du terminal. Une enveloppe portant seulement une empreinte n'est pas chiffrée. Aucun chiffrement artisanal ne sera ajouté pour prétendre satisfaire ST-06. Le choix d'une bibliothèque cryptographique et du magasin de clés fera l'objet d'une preuve distincte ; ne pas employer des clés stockées à côté du fichier comme preuve de protection OS.

| Lot | Expérience et attendu | Preuve exigée / limite |
|---|---|---|
| A — Réception et reprise | SY02/03 : panne avant/après réception durable, réponse perdue, rejeu même origine/empreinte, collision d'empreinte. Un reçu et un effet métier ; conflit générique ; journal intact. | Transactions réellement exécutées ; relance de processus ; traces commit/accusé/effet. Réception distincte d'intégration. |
| B — Retraits | SY04/05/10 : génération changée entre pages, appareil révoqué, objet retiré avec delta propre en attente. Retraits durables avant ajouts ; aucune copie canonique dans le journal ; delta conservé. | Comparer état durable et magasin consultable ; réponse sous droits actuels, y compris au rejeu d'un ancien accusé. |
| C — Compatibilité | SY06/07 : conversion déterministe avec provenance, ambiguïté, version incapable d'appliquer les retraits, panne/disque plein à migration. | Conversion récupérable ou attente explicite ; original du delta conservé ; réplique protégée fermée lorsque capacité insuffisante. |
| D — Horloge | SY08/09 : heure murale reculée, pause, échéance, changement de démarrage, restauration de snapshot. | Vérifier U < échéance ; temps incertain ⇒ fermeture. Horloge injectée pour logique, mesures réelles séparées. Aucun renouvellement hors connexion. |
| E — Clés et OS | SY07/08/09 : magasin de clés, fichier chiffré, veille/hibernation, redémarrage et anti-rollback. | Preuves sur Windows réel puis OS cibles ; un résultat Windows ne qualifie pas macOS/mobile. Sans continuité temporelle prouvée, fermeture jusqu'à reconnexion. |
| F — Reconstruction et binaire | SY11/12 : curseur périmé, restauration avant purge, interruption/corruption de chunk. | Purges/retraits avant reprise ; pas de double effet ; intégrité avant disponibilité. Articulation avec PT04 explicitement réservée. |

## Paramètres du banc

Compte/appareil/origine distincts, formats 1/2 synthétiques, contenus courts et limites locales déclarées. Les échéances courtes servent aux essais : elles ne fixent pas SYN-01. Les versions 1/2 ne fixent pas SYN-02. Ne pas exiger un budget d'hébergement pour ces expériences : plafond antérieur de 100 €/mois conservé.

La référence temporelle sera authentifiée dans le protocole candidat. Le banc de logique calculera une borne supérieure U à partir de l'heure serveur, de l'aller-retour, du temps monotone écoulé et de l'incertitude/dérive. Une constante choisie pour une fixture ne prouve pas une borne de dérive du matériel. Une discontinuité, génération de démarrage différente ou intégrité inconnue ferme la consultation protégée en conservant les deltas privés. La politique de fermeture sûre après redémarrage peut démontrer la sécurité sans promettre une consultation hors ligne continue après redémarrage.

## Conditions de clôture à établir sur résultats

Publier résultats par SY, sources et empreintes, frontières de panne, sorties et états durables avant/après reprise. Aucune case non exécutée ne sera comptée PASS. Clôture réduite possible seulement sur les mécanismes réellement éprouvés et avec réserves identifiées ; SYN-01–07 restent ouverts jusqu'à leurs décisions propres. ST-06, preuves OS et chiffrement ne seront pas déclarés satisfaits par les lots A–D seuls. Le résidu de révocation hors ligne reste un écart amont déclaré ; PT03 ne le supprime pas par définition.

**Première exécution prévue : lot A**, puis B/C/D et preuve physique E. PT03 commence ici par son protocole ; aucun résultat d'exécution n'est encore publié.
