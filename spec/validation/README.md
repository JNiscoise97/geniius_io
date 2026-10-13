# Validation documentaire dictionnaire V1.3 / MLD V1.1-g

Ces outils contrôlent des documents et un catalogue relationnel logique, pas un MPD ni un logiciel déployé.

Depuis la racine :

```text
python spec/validation/expliciter_schema_autorisations.py
python spec/validation/controler_documents.py --strict
python spec/validation/consigner_preuves.py
```

Le premier outil produit le catalogue d'autorisation et sa source JSON, sans changer le contrat gelé. Le deuxième vérifie inventaire de tables, cibles de FK, PK/FK du catalogue, définitions/matrice DI, énoncés CP-13, parenthèses et unicités logiques ; il publie ses résultats, avec les sources et lignes. Le dernier vérifie que la baseline gelée V1.6 est intacte, les liens des preuves et les empreintes finales.

Les miroirs `_hist` et macros ne sont pas développés en SQL. Les contrôles de PK/FK dans le catalogue ne prouvent ni les contraintes procédurales ni toutes les combinaisons de données. Les scénarios et variantes raisonnés sont consignés dans les deux rapports indépendants sous `docs/05_MLD/preuves/`. Les 304 correspondances ne sont pas présentées comme 304 tests sémantiques exécutés.
# CDC technique V1.1

## Architecture Core V0.1

Le banc SQL réel PT01 est dans `spec/prototypes/pt01/`. Commandes : `python spec/prototypes/pt01/run.py --image postgres:16-alpine`, puis `python spec/prototypes/pt01/report.py` et `python spec/prototypes/pt01/check_results.py`. Treize scénarios passent ; PT01 est clos sur son périmètre réduit selon DC-AUTH-01 ratifié. Contre-épreuves initiales conservées ; transposition SEC-01 au moteur complet/MPD réservée. Les contrôles documentaires ne remplacent pas cette exécution.

`python spec/validation/consolider_decisions_architecture.py` produit le registre documentaire unique depuis le CDC et les dossiers candidats. `python spec/validation/controler_consolidation_architecture.py` vérifie les 64 références, statuts/liens/sources, les seize ADR, variantes/prototypes et le périmètre du CDC gelé. Sortie : `docs/07_ARCHITECTURE/preuves/CONTROLES_CONSOLIDATION_V0_1.json`. Les références liées ne sont pas autant d’arbitrages indépendants ; les prototypes et preuves d’infrastructure restent à réaliser.

`python spec/validation/controler_architecture_asynchrone.py` contrôle les phases, scénarios, décisions ouvertes, références et conservation du CDC gelé. Sortie : `docs/07_ARCHITECTURE/preuves/CONTROLES_ASYNCHRONE_V0_1.json`. Aucun worker/file réel, test de charge, mesure de coût/capacité ou délai MPD-04 n’est validé par ce contrôle documentaire.

`python spec/validation/controler_architecture_persistance.py` contrôle dépôt, restauration, décisions responsables/étape, références et conservation du CDC gelé. Sortie : `docs/07_ARCHITECTURE/preuves/CONTROLES_PERSISTANCE_V0_1.json`. Aucune infrastructure, sauvegarde réelle, clé, transaction SQL ou mesure RPO/RTO n’est testée par cette commande.

`python spec/validation/controler_architecture_sync.py` vérifie le dossier synchronisation : phases, scénarios, décisions responsables/étape, obligations ST, références et conservation du CDC gelé. Sortie : `docs/07_ARCHITECTURE/preuves/CONTROLES_SYNCHRONISATION_V0_1.json`. Les tests de clients/serveur, de temps OS, de transport et d’anti-rollback restent à exécuter à leur étape.

`python spec/validation/controler_architecture_securite.py` contrôle le dossier autorisations/isolation/concurrence : ordre V1.6, références, douze scénarios, cinq points de preuve et conservation des documents gelés. Sortie : `docs/07_ARCHITECTURE/preuves/CONTROLES_SECURITE_V0_1.json`. Ce contrôle ne démontre ni verrou SQL ni linéarisation réelle ni non-divulgation temporelle.

`python spec/validation/generer_core_architecture.py` produit les matrices de propriétaires de tables et CP depuis le MLD, le catalogue d’autorisation et le dossier modules/transactions. `python spec/validation/controler_core_architecture.py` vérifie inventaires, responsabilité unique, contrats et références, obligations CP-13 et conservation des documents gelés. Sortie : `docs/07_ARCHITECTURE/preuves/CONTROLES_CORE_V0_1.json`. Aucun Core logiciel ni transaction SQL n’est exécuté.

**État actuel : CDC V1.2 gelé documentairement le 13/10/2026.** Les commandes ci-dessous produisent désormais le catalogue `cdc_recettes_v1_2.json`, le référentiel de recettes V1.2 et les contrôles V1.2 ; les artefacts V1.1 restent historiques. Le procès-verbal est `docs/06_CDC_TECHNIQUE/preuves/PROCES_VERBAL_GEL_CDC_V1_2.md`.

`python spec/validation/consigner_gel_cdc.py --verifier` vérifie les empreintes de la baseline scellée. Toute modification d’un document gelé suit le CDC § 13 ; la commande sans argument ne scelle qu’une seule fois et refuse d’écraser une baseline existante. Les conversions CRLF/LF constatées lors de la reprise sont déclarées dans les preuves, sans écraser celles du contrat V1.6.

`python spec/validation/generer_recettes_cdc.py` régénère le catalogue des 33 TECH et des recettes documentaires depuis le CDC.

`python spec/validation/controler_cdc_technique.py` vérifie les références structurées, champs de recette, douze cas projets, conditions de gel et liens locaux ; il consigne les empreintes des sources dans `docs/06_CDC_TECHNIQUE/travaux/CONTROLES_CDC_TECHNIQUE_V1_1.json`. Ces contrôles n’exécutent aucune recette logiciel et ne remplacent pas la revue sémantique finale.

La revue finale du 13 octobre 2026 est consignée dans `docs/06_CDC_TECHNIQUE/travaux/REVUE_FINALE_CDC_V1_1.md`. Le contrôle vérifie aussi la fidélité des attendus hérités, la couverture inverse des 31 CU et 64 critères, les matrices de relecture, les identifiants des décisions différées et les empreintes de la baseline d’autorisation gelée. Les deux réserves normatives restent déclarées ; aucun gel n’est automatique.

