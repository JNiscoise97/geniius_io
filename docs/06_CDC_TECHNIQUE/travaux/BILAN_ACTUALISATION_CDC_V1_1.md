# Bilan d’actualisation du CDC technique V1.1

**Actualisation du 12 octobre 2026 ; revue finale du 13 octobre 2026 — candidat, gel non prononcé.** Actualisation autorisée par le porteur. Ce bilan ne ratifie aucune nouvelle décision métier et ne choisit aucune technologie.

Le [CDC](../GENIIUS_CDC_TECHNIQUE.md) prend pour références le CDCF V1.2, le dictionnaire V1.3 validé, le MLD V1.1-g stabilisé et le contrat d’autorisation V1.6 gelé. La [V1.0 antérieure](../historique/GENIIUS_CDC_TECHNIQUE_V1_0_AVANT_ACTUALISATION_V1_1.md) est conservée.

## Résultat et preuve

L’ordre d’autorisation, les fondements personnels, la racine propriétaire, les copies protégées, les révocations et les restaurations sont actualisés. AV-FONC-001 est intégré avec douze scénarios projets/programmes. Les 33 TECH disposent d’un contrat, d’une origine ou justification technique explicite, d’une recette dédiée et d’un rôle responsable. Le catalogue rassemble 381 identifiants ; ce nombre inclut des familles et ne représente pas 381 tests exécutés.

Le [référentiel de recettes](../historique/GENIIUS_CDC_TECHNIQUE_RECETTES_V1_1.md) et sa source JSON sont générés par `spec/validation/generer_recettes_cdc.py`. Le contrôle `spec/validation/controler_cdc_technique.py` produit les [preuves structurelles](CONTROLES_CDC_TECHNIQUE_V1_1.json), avec empreintes des sources. Il vérifie les présences, identifiants et références structurées ; il ne démontre pas la couverture sémantique exhaustive ni une implémentation. Aucune recette logiciel n’a été exécutée dans cette étape.

## Conditions de gel

| Réf. | Verdict de revue finale | Preuve / limite |
|---|---|---|
| GEL-01 | Satisfaite documentairement | Registre : MLD V1.1-g unique avec catalogue V1.6 ; archives non concurrentes. Le gel formel du MLD reste distinct. |
| GEL-02 | Satisfaite documentairement | Les seize lacunes ont contrats et recettes ; matrice L01–L16 du rapport. Réserve hors ligne isolée sous GEL-07. |
| GEL-03 | Sous réserve R-CDC-02 | 33 TECH relues, origines ou justifications explicites, contrats et rôles ; 31 CU et 64 critères repris. Régularisation ECD-19 / AV-FONC-002 à décider par le porteur. |
| GEL-04 | Satisfaite documentairement | 381 identifiants, familles comprises ; transcription des attendus et recouvrements corrigée. Les recettes restent non exécutées. |
| GEL-05 | Satisfaite documentairement | Ordre V1.6, protections, dérogations et titularité cohérents après corrections RF-02/03 ; P-3 explicitement borné. |
| GEL-06 | Satisfaite documentairement | Marquage direct transactionnel, transitive asynchrone, aucun faux état à jour, reprise idempotente ; délai MPD-04 encadré. |
| GEL-07 | Sous réserve R-CDC-03 | Non-résurrection, réception privée et droits actuels définis ; contradiction amont CDCF § 122.2 / critère 55 maintenue et doit recevoir une disposition explicite. |
| GEL-08 | Satisfaite documentairement avec reports encadrés | Protocole NF corrigé sans changer les seuils ; reports R-CDC-04/05/06 ont responsable, étape et preuve, avant campagne/livraison. |


## Réserves et prochaine étape

| Réserve | Responsable fonctionnel | Résolution et preuve attendue |
|---|---|---|
| R-CDC-01 — revue finale de cohérence | Produit / données / sécurité / qualité | Clôturée par le [rapport de revue finale](REVUE_FINALE_CDC_V1_1.md), corrections RF-01 à RF-10 et contrôles versionnés ; réserves RF-11/12 conservées. |
| R-CDC-02 — ECD-19 / AV-FONC-002 | Porteur / produit | Régulariser ou accepter explicitement les exigences à justification technique, sans leur inventer une origine fonctionnelle. |
| R-CDC-03 — résidu hors ligne | Porteur / produit / sécurité | Traiter l’écart CDCF § 122.2 avec le contrat V1.6 ; conserver l’expiration opposable et ne pas promettre une révocation instantanée hors connexion. |
| R-CDC-04 — paramètres de mesure | Architecture / exploitation / qualité | Fixer les profils de charge complémentaires, sondes et exclusions de disponibilité, RPO des binaires et protocole d’attaque temporelle avant campagne. Les seuils existants sont conservés. |
| R-CDC-05 — paramètres métier et MPD | Produit / architecture | Fixer les langues V1, quotas, durées et délai de propagation MPD-04 à leur étape affectée ; tracer décision, unités et recettes avant mise en œuvre. |
| R-CDC-06 — affectation des responsables | Porteur | Nommer les responsables des décisions et campagnes avant celles-ci ; les rôles du catalogue ne sont pas des nominations. |

Les reports à l’architecture ou au MPD peuvent être acceptés au gel documentaire lorsqu’ils sont encadrés ; ils ne doivent pas être présentés comme des mesures déjà satisfaites. Le gel exige un bilan final explicite des huit conditions et des réserves. La revue finale est réalisée, favorable sous réserves ; il ne prononce pas le gel du CDC, du dictionnaire ou du MLD.
