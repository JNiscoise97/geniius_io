# PT05 — Lot D : admission et équité sous charge mixte

**14 octobre 2026 — six essais réussis ; PT05 non clos, capacité de production non qualifiée.**

Queue SQLite transactionnelle, commandes dans des processus distincts ; quatre admissions identiques concurrentes. Paramètres de fixture : 12 travaux actifs, 8 de fond, 4 par acteur, budget déclaré 100 unités, 2 workers, 3 tentatives, cycle interactif/interactif/fond. Aucun paramètre produit ratifié.

| Cas | Expérience | Verdict |
|---|---|---|
| PT05-D01 | Saturation background : places interactives conservées et refus visible | PASS |
| PT05-D02 | Charge mixte : partage de classes et alternance des acteurs | PASS |
| PT05-D03 | Worker background lent : autre place pour interactif, concurrence bornée | PASS |
| PT05-D04 | Retries avec attente puis isolement, autre travail terminé | PASS |
| PT05-D05 | Admission concurrente/rejeu : un travail, conflit non destructif | PASS |
| PT05-D06 | Budget octets : refus, rejeu puis récupération des ressources | PASS |

D01 sature huit travaux de fond puis accepte quatre interactifs. D02 répartit six travaux de fond et six interactifs entre quatre acteurs : cycle pondéré et alternance des acteurs de fond, tous terminés. Refus de quota explicite, rejeu d’origine avant quotas, contenu différent refusé. Les tâches isolées sont conservées ; les effets terminés sont uniques.

D03 laisse un worker de fond occupé et termine un interactif sur l’autre place ; un troisième claim est busy. Les places réservées à l’admission ne sont pas des workers réservés : deux travaux de fond peuvent occuper les deux workers. Aucune préemption ni borne de latence interactive démontrée. D04 injecte le temps, impose une attente exponentielle puis isole après trois échecs, sans bloquer le travail sain.

Charge finie, poids égaux et temps injecté ; pas preuve universelle d’absence de famine avec arrivées continues, durées variables ou prestataire lent. Budget size déclaratif, pas mémoire/médias réels. Rétention/quotas de stockage pour tâches isolées, classes de sécurité, baux perdus, équité multi-tenant et charge représentative restent réservés. ASY-01–07/MPD-04 non clos.

Total PT05 : 27 essais A–D. [Résultats](RESULTATS_PT05_LOT_D.json), [banc](../../../spec/prototypes/pt05/README.md). Coût cloud nul.
