# Validation documentaire dictionnaire V1.3 / MLD V1.1-g

Ces outils contrôlent des documents et un catalogue relationnel logique, pas un MPD ni un logiciel déployé.

Depuis la racine :

```text
python spec/validation/expliciter_schema_autorisations.py
python spec/validation/controler_documents.py --strict
python spec/validation/consigner_preuves.py
```

Le premier outil produit le catalogue d'autorisation et sa source JSON, sans changer le contrat gelé. Le deuxième vérifie inventaire de tables, cibles de FK, PK/FK du catalogue, définitions/matrice DI, énoncés CP-13, parenthèses et unicités logiques ; il publie ses résultats, avec les sources et lignes. Le dernier vérifie que la baseline gelée V1.6 est intacte, les liens des preuves et les empreintes finales.

Les miroirs `_hist` et macros ne sont pas développés en SQL. Les contrôles de PK/FK dans le catalogue ne prouvent ni les contraintes procédurales ni toutes les combinaisons de données. Les scénarios et variantes raisonnés sont consignés dans les deux rapports indépendants sous `docs/AUDIT-MLD/`. Les 304 correspondances ne sont pas présentées comme 304 tests sémantiques exécutés.
# CDC technique V1.1

**État actuel : CDC V1.2 gelé documentairement le 13/10/2026.** Les commandes ci-dessous produisent désormais le catalogue `cdc_recettes_v1_2.json`, le référentiel de recettes V1.2 et les contrôles V1.2 ; les artefacts V1.1 restent historiques. Le procès-verbal est `docs/AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md`.

`python spec/validation/consigner_gel_cdc.py --verifier` vérifie les empreintes de la baseline scellée. Toute modification d’un document gelé suit le CDC § 13 ; la commande sans argument ne scelle qu’une seule fois et refuse d’écraser une baseline existante. Les conversions CRLF/LF constatées lors de la reprise sont déclarées dans les preuves, sans écraser celles du contrat V1.6.

`python spec/validation/generer_recettes_cdc.py` régénère le catalogue des 33 TECH et des recettes documentaires depuis le CDC.

`python spec/validation/controler_cdc_technique.py` vérifie les références structurées, champs de recette, douze cas projets, conditions de gel et liens locaux ; il consigne les empreintes des sources dans `docs/AUDIT-CDC-TECH/CONTROLES_CDC_TECHNIQUE_V1_1.json`. Ces contrôles n’exécutent aucune recette logiciel et ne remplacent pas la revue sémantique finale.

La revue finale du 13 octobre 2026 est consignée dans `docs/AUDIT-CDC-TECH/REVUE_FINALE_CDC_V1_1.md`. Le contrôle vérifie aussi la fidélité des attendus hérités, la couverture inverse des 31 CU et 64 critères, les matrices de relecture, les identifiants des décisions différées et les empreintes de la baseline d’autorisation gelée. Les deux réserves normatives restent déclarées ; aucun gel n’est automatique.

