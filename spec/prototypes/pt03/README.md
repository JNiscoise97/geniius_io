# PT03 — Banc de synchronisation

**Statut courant : PT03 clos sur son périmètre réduit le 13/10/2026**, 52 essais A–G, réserves R01–R04 maintenues. [Décision](../../../docs/07_ARCHITECTURE/preuves/DECISION_CLOTURE_PT03.json), [critères](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT03_CRITERES_CLOTURE.md). Les statuts « non clos » ci-dessous et dans les résultats bruts décrivent les étapes expérimentales antérieures ; aucune qualification globale OS/Core/MPD ou anti-rollback matériel n'est déclarée.

**Consolidation courante : 52 essais A–G, dont la contre-épreuve E07 ; PT03 non clos.** Cinq nouveaux essais G articulent réellement la barrière de D et DPAPI de E. [Critères de clôture et réserves R01–R04](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT03_CRITERES_CLOTURE.md), [contrôle consolidé](../../../docs/07_ARCHITECTURE/preuves/CONTROLES_PT03_CONSOLIDES.json). Décision de clôture réduite à statuer ; qualification globale OS/Core/MPD réservée.

**Avancement courant : A–F exécutés, 47 essais dont une contre-épreuve de fraîcheur ; PT03 non clos.** Lot F : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT03_LOT_F.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_LOT_F.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT03_LOT_F.json). Huit essais de reconstruction après purge/restauration et reprise de chunks. Registre extérieur conservé, réseau et manifeste fiables injectés. Reste à consolider les critères de clôture réduite et les réserves Core/OS/MPD ; les paragraphes suivants décrivent les étapes antérieures.

**Avancement courant : A–E exécutés, 39 essais dont une contre-épreuve de fraîcheur ; PT03 non clos.** Lot E : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT03_LOT_E.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_LOT_E.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT03_LOT_E.json). DPAPI Windows réel sur petits enregistrements ; ancien blob valide accepté, aucun anti-rollback démontré. Autre compte OS, chiffrement des bases et montage D+E non qualifiés. Prochaine campagne : lot F, reconstruction et reprise de fichiers.

**Avancement courant : A/B/C/D exécutés, 32 scénarios réussis ; PT03 non clos.** Lot D : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT03_LOT_D.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_LOT_D.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT03_LOT_D.json). Onze essais de logique temporelle injectée ; processus réellement relancé et snapshot de base restauré. Aucune qualification d’horloge OS. Prochaine étape : lot E, chiffrement et magasin de clés/limites OS ; lot F également non exécuté. Les paragraphes ci-dessous conservent les jalons antérieurs.

**Avancement courant : lots A/B/C exécutés, 21 scénarios réussis ; PT03 non clos.** Lot C : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT03_LOT_C.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_LOT_C.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT03_LOT_C.json). Conversion déterministe, ambiguïté/champ inconnu, ancien client, crashes de migration et SQLITE_FULL par plafond de pages. Prochaine campagne : lot D, logique d’horloge et fermeture en cas de continuité inconnue. Lots D–F non exécutés.

**Lots A/B exécutés : 14 scénarios réussis ; PT03 partiel, non clos.** Lot A : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PROTOTYPE_PT03.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT03.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PROTOTYPE_PT03.json). Lot B : [rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PT03_LOT_B.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_LOT_B.json), [empreintes](../../../docs/07_ARCHITECTURE/preuves/PREUVES_PT03_LOT_B.json).

```powershell
python spec/prototypes/pt03/run.py
python spec/prototypes/pt03/check_results.py
python spec/prototypes/pt03/run_b.py
python spec/prototypes/pt03/check_b.py
python spec/prototypes/pt03/run_c.py
python spec/prototypes/pt03/check_c.py
python spec/prototypes/pt03/run_d.py
python spec/prototypes/pt03/check_d.py
python spec/prototypes/pt03/run_e.py
python spec/prototypes/pt03/check_e.py
python spec/prototypes/pt03/run_f.py
python spec/prototypes/pt03/check_f.py
python spec/prototypes/pt03/run_g.py
python spec/prototypes/pt03/consolidate.py
```

Python standard, SQLite WAL/FULL, fichiers temporaires synthétiques supprimés à la fin, aucun service payant. Journal local et serveur de banc distincts ; commandes dans des processus séparés ; interruptions os._exit avant/après commit. Huit essais de réception, effet atomique, rejeu concurrent, conflit d’empreinte, contexte/permission courants et caché/absent. Pas de réseau, chiffrement, identité produit ou qualification matérielle.

[Protocole initial préexécution](PROTOCOL.md) conservé avec son statut à la rédaction, lié par empreinte aux résultats. Lot B : six cas de retraits durables avant ajouts, génération périmée, appareil révoqué et journal conservé. La garde serveur est conservée durant le commit local synthétique ; réseau et atomicité du registre de remise restent réservés. Prochaine campagne : lot C, compatibilité et migrations. Les lots C–F, l’horloge physique, le chiffrement et les preuves OS restent réservés.
