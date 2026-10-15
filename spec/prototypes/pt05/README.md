# PT05 — Banc asynchrone

**Statut courant : PT05 clos sur son périmètre réduit le 14/10/2026**, 34 cas et R01–R05 maintenues. [Décision](../../../docs/07_ARCHITECTURE/preuves/DECISION_CLOTURE_PT05.json), [critères](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT05_CRITERES_CLOTURE.md). MPD-04, capacité/coût production et prestataires réels restent non qualifiés. Les statuts antérieurs « non clos » ci-dessous et dans les résultats bruts sont historiques.

**14/10/2026 — consolidation : 34 cas A–E vérifiés, PT05 non clos.** [Critères C1–C8 et réserves R01–R05](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT05_CRITERES_CLOTURE.md), [contrôle consolidé](../../../docs/07_ARCHITECTURE/preuves/CONTROLES_PT05_CONSOLIDES.json). Périmètre réduit prêt pour décision ; moteur intégré, prestataires, capacité et MPD-04 réservés.

**14/10/2026 — avancement courant : 34 cas A–E, PT05 non clos.** Lot E : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT05_LOT_E.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT05_LOT_E.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT05_LOT_E.json). Trente répétitions sur trois graphes, mesures locales et barrière conservée au dépassement synthétique. MPD-04/capacité/coût production non qualifiés. Prochaine étape : consolidation des preuves et critères de clôture réduite.

**14/10/2026 — avancement courant : 27 essais A–D, PT05 non clos.** Lot D : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT05_LOT_D.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT05_LOT_D.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT05_LOT_D.json). Quotas/charge mixte/équité/retries bornés et admission concurrente éprouvés. Pas garantie de latence interactive, charge continue ou capacité de production qualifiée. Prochaine campagne : lot E, délais et capacité/coût sur profil déclaré.

**14/10/2026 — avancement courant : 21 essais A–C, PT05 non clos.** Lot C : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT05_LOT_C.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT05_LOT_C.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT05_LOT_C.json). Prestataire synthétique : recherche/idempotence ou incertitude sans relance ; révocation et intégration locales. Aucun service réel qualifié. Prochaine campagne : lot D, admission, quotas et équité sous charge mixte.

**14/10/2026 — avancement courant : 15 essais A/B, PT05 non clos.** Lot B : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT05_LOT_B.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT05_LOT_B.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT05_LOT_B.json). Barrière, causes/générations, ajout de dépendance, cycles et reprise éprouvés. La fin de propagation conserve le réexamen scientifique. Prochaine campagne : lot C, autorité et effets externes incertains ; capacité/frontier bornée et MPD-04 réservés.

**14/10/2026 — lot A exécuté : neuf essais réussis ; PT05 non clos.** [Rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PROTOTYPE_PT05.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT05.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PROTOTYPE_PT05.json).

```powershell
python spec/prototypes/pt05/run.py
python spec/prototypes/pt05/check_results.py
python spec/prototypes/pt05/run_b.py
python spec/prototypes/pt05/check_b.py
python spec/prototypes/pt05/run_c.py
python spec/prototypes/pt05/check_c.py
python spec/prototypes/pt05/run_d.py
python spec/prototypes/pt05/check_d.py
python spec/prototypes/pt05/run_e.py
python spec/prototypes/pt05/check_e.py
python spec/prototypes/pt05/consolidate.py
```

Python standard, deux bases SQLite WAL/FULL synthétiques temporaires, subprocess distincts et pannes aux frontières. Outbox, livraison répétable, contenu d’origine, bail/jeton, annulation et autorité simplifiée. Aucun broker réseau, prestataire, capacité représentative ou choix de pile qualifié. Temps injecté ; valeurs de bail réservées au banc. Fichiers retirés, coût cloud nul.

[Protocole initial](PROTOCOL.md) conservé avec son statut de préparation. Prochaine campagne : lot B, propagation/générations et barrière de fraîcheur des résultats aval. Lots B–E et ASY-01–07/MPD-04 restent ouverts.
