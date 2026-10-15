# PT06 — Banc API, livraison et récupération

**Statut courant : PT06 clos sur son périmètre réduit le 15/10/2026**, 34 essais A–E et F documentaire, R01–R07 maintenues. [Décision](../../../docs/07_ARCHITECTURE/preuves/DECISION_CLOTURE_PT06.json), [critères](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT06_CRITERES_CLOTURE.md), [bilan et jalon Core](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_BILAN_PROTOTYPES_ET_JALON_CORE.md). Les statuts antérieurs dans les paragraphes/résultats bruts restent historiques ; architecture/pile/production non validées.

**15/10/2026 — consolidation finale : 34 essais A–E + F documentaire, PT06 non clos.** [Critères C1–C8, sept réserves et bilan des six prototypes](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT06_CRITERES_CLOTURE.md), [contrôle consolidé](../../../docs/07_ARCHITECTURE/preuves/CONTROLES_PT06_CONSOLIDES.json). PT01–05 clos réduits ; PT06 prêt pour décision sur son périmètre réduit. Architecture/pile/production non validées.

**15/10/2026 — lot F documentaire rédigé :** [alternatives, budget et procédures](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT06_ALTERNATIVES_BUDGET_EXPLOITATION.md), [contrôle](../../../docs/07_ARCHITECTURE/preuves/CONTROLES_PT06_LOT_F.json). 34 essais A–E inchangés ; aucun nouvel essai d’infrastructure compté pour F. Enveloppe cible 70 € + réserve 30 €, pas devis ou budget de production validé. **PT06 non clos**, pile non ratifiée ; prochaine étape : consolidation et critères de clôture réduite.

**14/10/2026 — avancement courant : 34 essais A–E ; PT06 non clos.** Lot E : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT06_LOT_E.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT06_LOT_E.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT06_LOT_E.json). Export filtré, manifeste/provenance/médias, interruption/reprise et réimport isolé ; révocation oppose la suite de l’export. Pas migration complète fournisseur qualifiée. Prochaine étape : lot F, consolidation alternatives/budget/exploitation et procédures, avant critères de clôture.

**14/10/2026 — avancement courant : 28 essais A–D ; PT06 non clos.** Lot D : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT06_LOT_D.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT06_LOT_D.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT06_LOT_D.json). Parcours HTML réel avec navigateur Chromium/CDP : clavier, focus, AX, erreur/statut et reflow. Pas lecteur écran ou conformité WCAG globale qualifiés. Prochaine campagne : lot E, export patrimonial et récupération/reprise.

**14/10/2026 — avancement courant : 22 essais A–C ; PT06 non clos.** Lot C : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT06_LOT_C.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT06_LOT_C.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT06_LOT_C.json). Artefacts/manifeste, migration interrompue, rollback compatible et autorité actuelle conservée. Déploiement réel/CI/CD non qualifiés. Prochaine campagne : lot D, accessibilité d’un parcours réel de banc, avec observations et limites explicites.

**14/10/2026 — avancement courant : 15 essais A/B ; PT06 non clos.** Lot B : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT06_LOT_B.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT06_LOT_B.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT06_LOT_B.json). PBKDF2/TOTP, challenges, codes de récupération à usage unique et fraîcheur/révocation réellement testés ; IdP et second appareil physique non qualifiés. Prochaine campagne : lot C, livraison, migration interrompue et rollback compatible.

**14/10/2026 — lot A exécuté : huit essais ; PT06 non clos.** [Rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PROTOTYPE_PT06.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT06.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PROTOTYPE_PT06.json).

```powershell
python spec/prototypes/pt06/run.py
python spec/prototypes/pt06/check_results.py
python spec/prototypes/pt06/run_b.py
python spec/prototypes/pt06/check_b.py
python spec/prototypes/pt06/run_c.py
python spec/prototypes/pt06/check_c.py
python spec/prototypes/pt06/run_d.py
python spec/prototypes/pt06/check_d.py
python spec/prototypes/pt06/run_e.py
python spec/prototypes/pt06/check_e.py
python spec/prototypes/pt06/check_f.py
python spec/prototypes/pt06/consolidate.py
```

Python standard, HTTP loopback et SQLite synthétique ; fichiers temporaires retirés, coût cloud nul. Contrats de réception et refus, contextes, versions et recontrôle entre requêtes. Pas TLS, identité réelle/MFA ou Core complet qualifié ; fichier de journal témoin conservé.

[Protocole initial](PROTOCOL.md) conservé au statut de préparation. Prochaine campagne : lot B, identité et MFA, avec primitives réellement éprouvées et politique injectée distincte. Lots B–F et réserves PT01–05 ouverts ; aucun fournisseur choisi.
