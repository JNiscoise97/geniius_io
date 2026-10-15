# PT05 — Lot B : propagation et générations

**14 octobre 2026 — six essais réussis ; PT05 non clos ; MPD-04 non fixé.**

Petit graphe SQLite réel, mutations et finalisations dans des processus distincts. Marquage direct et barrière conservative au commit de correction. Chaque cause conserve sa version ; ajout de cause ou de dépendance change la génération. Le travail préparé d’une ancienne génération est refusé, puis un nouveau parcours couvre les descendants.

| Cas | Expérience | Verdict |
|---|---|---|
| PT05-B01 | Worker perdu : barrière puis signalements sans validation scientifique | PASS |
| PT05-B02 | Nouvelle cause : ancienne génération ne clôt pas l’impact récent | PASS |
| PT05-B03 | Dépendance ajoutée après préparation : reprise couvre le nouvel aval | PASS |
| PT05-B04 | Cycle de raisonnement : parcours termine sans indépendance fabriquée | PASS |
| PT05-B05 | Cycle de production tenté : mutation refusée | PASS |
| PT05-B06 | Panne avant commit propagation : barrière puis rejeu | PASS |

La clôture technique publie les signalements et retire la seule barrière propagation_en_cours ; les impacts restent à 1 et la sortie reexamen. Aucun effacement d’impact ni validation scientifique automatique. Signalements uniques par cause/version/cible, rejeu sans doublon. Le parcours avec ensemble de visites termine sur le cycle join/tail ; une arête créant un cycle de production est refusée sans mutation.

Les deux causes sont intercalées de manière déterministe, pas commises simultanément. Parcours complet et recalcul final sous verrou sur petit corpus ; frontier durable par unités bornées, croissance, capacité et délai maximal restent à éprouver. Barrière globale conservative, pas choix de périmètre physique ratifié. Les sorties publiques portent uniquement le statut générique ; corpus/rôles, canaux indirects et NF10 non qualifiés. Les causes sont présentes dans les traces privées du banc.

Indépendance des justifications scientifiques non modélisée ; terminaison de parcours ne la démontre pas. ASY-01–07/MPD-04 et qualification représentative restent ouverts. Total PT05 : 15 essais A/B. [Résultats](RESULTATS_PT05_LOT_B.json), [banc](../../../spec/prototypes/pt05/README.md). Coût cloud nul.
