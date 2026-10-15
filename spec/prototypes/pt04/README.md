# PT04 — Banc de persistance et restauration

**Statut courant : PT04 clos sur son périmètre réduit le 14/10/2026**, 37 essais A–F, R01–R05 maintenues. [Décision](../../../docs/07_ARCHITECTURE/preuves/DECISION_CLOTURE_PT04.json), [critères](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT04_CRITERES_CLOTURE.md). NF05/RPO/RTO et PRA indépendant restent non qualifiés. Les statuts « non clos » ci-dessous et dans les lots sont historiques.

**14/10/2026 — consolidation : 37 essais A–F vérifiés, PT04 non clos.** [Critères C1–C8, couverture PR et réserves R01–R05](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT04_CRITERES_CLOTURE.md), [contrôle consolidé](../../../docs/07_ARCHITECTURE/preuves/CONTROLES_PT04_CONSOLIDES.json). Périmètre réduit prêt pour décision ; NF05/PRA indépendant, génération après restaurations répétées et PR hors montage restent réservés.

**14/10/2026 — avancement courant : 37 essais A–F ; PT04 non clos.** Lot F : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT04_LOT_F.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT04_LOT_F.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT04_LOT_F.json). Exercice combiné archive/base/média/autorité, phases et durées diagnostiques publiées. NF05/RPO/RTO non qualifiés. Prochaine étape : consolidation des preuves, articulation et critères de clôture réduite avec réserves.

**14/10/2026 — avancement courant : 33 essais A–E ; PT04 non clos.** Lot E : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT04_LOT_E.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT04_LOT_E.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT04_LOT_E.json). Sauvegarde DPAPI avec secret injecté, refus et reprise sous porte extérieure. Pas escrow indépendant, récupération hors profil ou révocation des anciennes archives. Prochaine étape : exercice consolidé base/média/autorité et chronologie de reprise, sans qualification NF05 sur ce petit corpus.

**Avancement courant : 27 essais A–D réussis ; PT04 non clos.** Lot D : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT04_LOT_D.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT04_LOT_D.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT04_LOT_D.json). Purge de corpus/copies/dérivés, restauration ancienne et résidus de sauvegarde éprouvés. Inventaire/portée injectés, pas effacement forensique ou qualification juridique. Prochaine campagne : sauvegarde protégée, secret indisponible et récupération contrôlée, puis exercice de restauration consolidé. Les statuts ci-dessous sont les jalons antérieurs.

**Avancement courant : 21 essais A/B/C réussis ; PT04 non clos.** Lot C : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT04_LOT_C.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT04_LOT_C.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT04_LOT_C.json). Fichier/base, pannes, rejeu, média manquant/corrompu et conflit éprouvés sur fichiers synthétiques. Prochaine campagne : purge des copies/dérivés et réapplication aux sauvegardes, sans statut abusif de purge complète. Les paragraphes suivants sont les jalons antérieurs.

**Avancement courant : 14 essais A/B réussis ; PT04 non clos.** Lot B : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT04_LOT_B.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT04_LOT_B.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT04_LOT_B.json). Effets contradictoires/inadmissibles refusés ; restrictions, retrait d’index et invalidation d’ancienne session avant reprise. Prochaine campagne : dépôt documentaire et cohérence base/médias avant confirmation. Les paragraphes suivants décrivent le jalon précédent.

**Lot A exécuté : huit essais réussis ; PT04 partiel, non clos.** [Rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PROTOTYPE_PT04.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT04.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PROTOTYPE_PT04.json).

```powershell
python spec/prototypes/pt04/run.py
python spec/prototypes/pt04/check_results.py
python spec/prototypes/pt04/run_b.py
python spec/prototypes/pt04/check_b.py
python spec/prototypes/pt04/run_c.py
python spec/prototypes/pt04/check_c.py
python spec/prototypes/pt04/run_d.py
python spec/prototypes/pt04/check_d.py
python spec/prototypes/pt04/run_e.py
python spec/prototypes/pt04/check_e.py
python spec/prototypes/pt04/run_f.py
python spec/prototypes/pt04/check_f.py
python spec/prototypes/pt04/consolidate.py
```

Python standard, SQLite WAL/FULL, snapshots réels et processus interrompus. Fichiers synthétiques temporaires retirés à la fin ; aucun coût cloud. Registre absent/ancien/tronqué refuse l’ouverture. Intention conservée permet de reconstruire un effet local perdu, avec rejeu sans doublon.

Le checkpoint courant est **injecté**, hors des snapshots restaurés ; sa confiance et sa durabilité indépendante ne sont pas démontrées. Stockages sur un même poste, pas domaines de panne indépendants. NF05, RPO/RTO, clés/chiffrement et médias restent non qualifiés. [Protocole initial](PROTOCOL.md) conservé au statut de sa rédaction.

Prochaine campagne : refus sur effet contradictoire ou devenu non admissible, puis restrictions/fermetures actuelles avant ouverture. Ces preuves complètent la réconciliation avant d’étendre aux médias, secrets et exercice PRA représentatif.
