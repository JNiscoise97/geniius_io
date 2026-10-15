# PT05 — Lot E : délais et ressources sur profil déclaré

**14 octobre 2026 — sept cas réussis, 30 répétitions mesurées ; PT05 non clos, MPD-04 non fixé.**

OS : Windows-11-10.0.26200-SP0. Python : 3.13.7.

Le manifeste DIAGNOSTIC-01 est écrit avant collecte : chaîne 64, étoile 256, arbre binaire 511 nœuds ; solo puis deux threads de lectures (100 appels maximum chacun), cinq répétitions par condition, ordre fixe, aucune exclusion. Réutilise réellement le mécanisme de propagation B. Temps monotone de début de correction à commit/contrôle de tous les signalements ; démarre avant transaction directe, donc inclut son coût et l’instrumentation.

| Graphe | Charge | Médiane ms | Maximum ms | Lectures réalisées | Pic Python KiB |
|---|---|---:|---:|---:|---:|
| chain64 | solo | 41.306 | 53.997 | 0 | 47.6 |
| chain64 | concurrent_reads | 125.924 | 134.007 | 57 | 50.8 |
| star256 | solo | 86.853 | 117.307 | 0 | 137.8 |
| star256 | concurrent_reads | 144.276 | 336.025 | 102 | 136.5 |
| tree511 | solo | 163.977 | 318.405 | 0 | 259.9 |
| tree511 | concurrent_reads | 174.977 | 262.709 | 68 | 244.3 |

Toutes les distributions et les débits sont publiés dans les résultats. Le pic tracemalloc porte sur les allocations Python, pas la RSS ni la mémoire native SQLite. CPU du processus inclut les threads et leur terminaison ; espace des fichiers observé, pas patrimoine média. Les threads peuvent attendre le verrou global ; aucun chevauchement effectif garanti à chaque répétition.

Les maxima et p95 nearest-rank de cinq observations coïncident ; aucun percentile de population ni délai maximal garanti déduit. Ordre fixe, petite taille, charge finie et cache/poste variable : une condition chargée peut apparaître plus rapide qu’une condition solo. Aucune conclusion causale ou extrapolation de capacité issue de cette seule différence.

E07 impose volontairement un budget zéro à la fixture après correction : alerte diagnostique et barrière conservée, sans finalisation. Ce cas ne qualifie pas un timeout de production ni une supervision périodique ; il ne fixe pas MPD-04. Un dépassement ne peut pas supprimer l’impact pour satisfaire un délai.

Coût cloud engagé : 0 €. Le poste, l’exploitation, stockage/réseau et prestataires ne sont pas chiffrés ; aucun budget mensuel estimé ou capacité de production qualifiée. ASY-01–07, profils NF et MPD-04 restent ouverts. Total PT05 : 34 cas A–E. [Résultats et séries](RESULTATS_PT05_LOT_E.json), [banc](../../../spec/prototypes/pt05/README.md).
