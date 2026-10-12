# MLD — Catalogue relationnel des autorisations V1.6

**Version : V1.1-g candidat — 12/10/2026.** Partie intégrante du MLD ; réalise le contrat comportemental V1.6 gelé sans le modifier.

Source structurée reproductible : `spec/validation/schema_autorisations.json`, produite par `expliciter_schema_autorisations.py`. Ce catalogue est logique : aucune technologie de base n’est choisie et aucun SQL de production n’est déclaré exécuté.

## Conventions et écriture atomique

`HS` désigne un état d’autorisation courant, avec un miroir relationnel `_hist` de toutes les colonnes et associations, indexé par clé primaire et révision. Chaque transition crée un événement/acte, conserve avant et après, ferme la période précédente et ouvre la nouvelle dans la même transaction ; les périodes ne se chevauchent pas et ne laissent pas de trou. Pour une PK composite, `_hist` utilise cette PK plus révision. `N` désigne une insertion seule. Cette historisation de sécurité ne réécrit pas VERSION_OBJET scientifique et n’est jamais une source de droit courant. La neutralisation légale reste soumise à CP-16 et laisse seulement les traces minimales admissibles.

Toutes les FK doivent exister en fin de transaction, y compris cycles de création propriété/racine et présentation/transfert ; leur mécanisme relève du MPD, pas leur résultat obligatoire. Les colonnes non marquées `?` sont obligatoires. Les états/actions sont fermés. Toute fin renseignée est postérieure au début. Toute mutation de droit incrémente l’époque avant qu’un accès puisse observer le nouvel état ; échec de vérification = introuvable sans mutation. Aucun accès direct ne peut modifier ces tables hors opérations du contrat.

## Tables

### autorisation_identite [HS]

```text
  id  uuid  NN
  acteur_id  uuid  NN
  personne_id  uuid
  niveau  code  NN
  statut  code  NN
  depuis  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (acteur_id) → acteur_geniius(id)
  FK (personne_id) → personne(id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ acteur_id WHERE statut = vérifiée AND fin IS NULL
```

- **Contrainte logique :** niveau ∈ {standard, renforcé}.
- **Contrainte logique :** statut ∈ {déclarée, vérifiée, révoquée}.
- **Contrainte logique :** personne_id requis pour acteur personne vérifié ; nul pour acteur institutionnel.
- **Contrainte logique :** aucune unicité sur personne_id : plusieurs comptes/acteurs de la même personne.
- **Contrainte logique :** concordance avec liens compte-acteur et compte-personne, en fin de transaction.

### autorisation_propriete [HS]

```text
  id  uuid  NN
  espace_id  uuid  NN
  proprietaire_id  uuid  NN
  racine_id  uuid  NN
  depuis  ts  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (espace_id) → espace(id)
  FK (proprietaire_id) → acteur_geniius(id)
  FK (racine_id) → autorisation_habilitation(id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ espace_id
```

- **Contrainte logique :** racine système active bénéficiaire du propriétaire courant et couvrant cet espace.
- **Contrainte logique :** un propriétaire et une racine par espace non clos ; transfert atomique.

### autorisation_titularite [HS]

```text
  id  uuid  NN
  objet_id  uuid  NN
  titulaire_id  uuid  NN
  depuis  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (objet_id) → objet(id)
  FK (titulaire_id) → acteur_geniius(id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ objet_id WHERE fin IS NULL
```

- **Contrainte logique :** titularité créée seulement par procédures système § 6.
- **Contrainte logique :** objet personnel exige titularité ; aucune visibilité projet.

### autorisation_perimetre [HS]

```text
  id  uuid  NN
  genre  code  NN
  espace_id  uuid  NN
  titulaire_regime_id  uuid
  objet_id  uuid
  lien_id  uuid
  selection_id  uuid
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (espace_id) → espace(id)
  FK (titulaire_regime_id) → acteur_geniius(id)
  FK (objet_id) → objet(id)
  FK (lien_id) → lien(id)
  FK (selection_id) → selection_partage(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** genre ∈ {objet, lien, lot, contenu, sélection}.
- **Contrainte logique :** alternatives et jointures cohérentes avec genre.
- **Contrainte logique :** un seul régime ; cible lien soumise aux droits des deux extrémités.

### autorisation_perimetre_objet [N]

```text
  perimetre_id  uuid  NN
  objet_id  uuid  NN
  PK (perimetre_id, objet_id)
  FK (perimetre_id) → autorisation_perimetre(id)
  FK (objet_id) → objet(id)
```

- **Contrainte logique :** liste fermée figée ; toute évolution crée nouveau périmètre ; régime unique.

### autorisation_beneficiaire [HS]

```text
  id  uuid  NN
  genre  code  NN
  acteur_id  uuid
  groupe_id  uuid
  espace_role_id  uuid
  role  code
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (acteur_id) → acteur_geniius(id)
  FK (groupe_id) → groupe(id)
  FK (espace_role_id) → espace(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** genre ∈ {acteur, groupe, rôle, public}.
- **Contrainte logique :** acteur : seul acteur_id ; groupe : seul groupe_id ; rôle : espace_role_id et role ; public : aucun FK.

### autorisation_habilitation [HS]

```text
  id  uuid  NN
  nature  code  NN
  forme  code  NN
  espace_id  uuid  NN
  auteur_id  uuid
  beneficiaire_id  uuid  NN
  perimetre_id  uuid  NN
  perimetre_signataire_id  uuid
  role  code
  repartager  bool  NN
  mode  code
  etat  code  NN
  debut  ts  NN
  fin  ts
  reemission_de_id  uuid
  rattachement_id  uuid
  lot_id  uuid
  echeance_hors_ligne  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (espace_id) → espace(id)
  FK (auteur_id) → acteur_geniius(id)
  FK (beneficiaire_id) → autorisation_beneficiaire(id)
  FK (perimetre_id) → autorisation_perimetre(id)
  FK (perimetre_signataire_id) → autorisation_perimetre(id)
  FK (reemission_de_id) → autorisation_habilitation(id)
  FK (rattachement_id) → relation_projets(id)
  FK (lot_id) → tache(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** nature ∈ {HI, HP, système}.
- **Contrainte logique :** forme ∈ {nomination, délégation, racine}.
- **Contrainte logique :** etat ∈ {proposée, active, suspendue, close, expirée}.
- **Contrainte logique :** mode ∈ {notification, approbation préalable} ou nul hors ensemble ouvert.
- **Contrainte logique :** auteur requis HI/HP, nul uniquement système ; signataire et périmètre à l’acte figés pour HI.
- **Contrainte logique :** fin nulle ou fin > debut ; états close/expirée terminaux.
- **Contrainte logique :** les opérations autorisées sont exclusivement celles du contrat ; aucun UPDATE libre du mode ou des actions.

### autorisation_action [HS]

```text
  habilitation_id  uuid  NN
  action  code  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (habilitation_id, action)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** action ∈ {voir, commenter, proposer, transcrire, éditer, valider, exporter, réutiliser, contribuer au Core}.

### autorisation_fondateur [HS]

```text
  id  uuid  NN
  habilitation_id  uuid  NN
  fondateur_id  uuid  NN
  debut  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (fondateur_id) → acteur_geniius(id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ habilitation_id, fondateur_id WHERE fin IS NULL
```

- **Contrainte logique :** HP seulement ; auteur initial inclus, admetteur pas automatiquement fondateur global.

### autorisation_fondement [HS]

```text
  id  uuid  NN
  fondateur_id  uuid  NN
  action  code  NN
  nature  code  NN
  titularite_id  uuid
  nomination_id  uuid
  habilitation_id  uuid
  perimetre_id  uuid  NN
  repartager  bool  NN
  debut  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (fondateur_id) → autorisation_fondateur(id)
  FK (titularite_id) → autorisation_titularite(id)
  FK (nomination_id) → autorisation_habilitation(id)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (perimetre_id) → autorisation_perimetre(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** nature ∈ {titulaire, rôle, HI, HP}.
- **Contrainte logique :** exactement une référence : titulaire→titularite, rôle→nomination, HI/HP→habilitation de nature concordante.
- **Contrainte logique :** chaîne enracinée acyclique, couverture action/partage/périmètre/durée à l’acte et évaluation, suspensions ≠ ruptures.

### autorisation_exclusion [HS]

```text
  id  uuid  NN
  habilitation_id  uuid  NN
  objet_id  uuid  NN
  fondateur_id  uuid
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (objet_id) → objet(id)
  FK (fondateur_id) → autorisation_fondateur(id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ habilitation_id, objet_id, fondateur_id avec null égal
```

- **Contrainte logique :** figée à l’acte ; accès audit seul.

### autorisation_admission [HS]

```text
  id  uuid  NN
  habilitation_id  uuid  NN
  personne_id  uuid  NN
  admetteur_id  uuid
  nature  code  NN
  automatique  bool  NN
  etat  code  NN
  debut  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (personne_id) → personne(id)
  FK (admetteur_id) → acteur_geniius(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** nature ∈ {HI, HP}.
- **Contrainte logique :** etat ∈ {active, close}.
- **Contrainte logique :** automatique implique admetteur nul ; manuelle admetteur requis.
- **Contrainte logique :** auteur jamais admis (personne) ; automatique exclut gestionnaires et cibles exigeantes à chaque accès.
- **Contrainte logique :** HP manuelle : propres fondements de l’admetteur, ne dépend pas des seuls fondateurs globaux.

### autorisation_admission_fondement [HS]

```text
  id  uuid  NN
  admission_id  uuid  NN
  action  code  NN
  nature  code  NN
  titularite_id  uuid
  nomination_id  uuid
  habilitation_id  uuid
  perimetre_id  uuid  NN
  repartager  bool  NN
  debut  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (admission_id) → autorisation_admission(id)
  FK (titularite_id) → autorisation_titularite(id)
  FK (nomination_id) → autorisation_habilitation(id)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (perimetre_id) → autorisation_perimetre(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** exactement une FK typée conforme à nature, comme fondement HP.
- **Contrainte logique :** étendue jamais supérieure à celle de l’admetteur ; clôture admission si sa chaîne rompt.

### autorisation_admission_exclusion [N]

```text
  admission_id  uuid  NN
  objet_id  uuid  NN
  PK (admission_id, objet_id)
  FK (admission_id) → autorisation_admission(id)
  FK (objet_id) → objet(id)
```


### autorisation_exclusion_personne [HS]

```text
  id  uuid  NN
  habilitation_id  uuid  NN
  personne_id  uuid  NN
  date  ts  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (personne_id) → personne(id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ habilitation_id, personne_id
```

- **Contrainte logique :** retrait préventif empêche auto-admission de tous comptes.

### autorisation_protection [HS]

```text
  id  uuid  NN
  genre  code  NN
  cible_objet_id  uuid
  cible_lien_id  uuid
  createur_id  uuid
  etat  code  NN
  debut  ts  NN
  fin  ts
  autorite_emettrice_id  uuid
  autorite_levee_id  uuid
  heritee_de_id  uuid
  origine  code  NN
  portee  code  NN
  base_legale  text
  reference_legale  text
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (cible_objet_id) → objet(id)
  FK (cible_lien_id) → lien(id)
  FK (createur_id) → acteur_geniius(id)
  FK (autorite_emettrice_id) → acteur_geniius(id)
  FK (autorite_levee_id) → acteur_geniius(id)
  FK (heritee_de_id) → autorisation_protection(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** exactement une cible ; genre ∈ {embargo contenu, interdiction action, restriction légale, consentement refusé ou retiré, effacement légal, embargo existence, interdiction existence, cloisonnement, gel succession}.
- **Contrainte logique :** etat ∈ {active, levée, expirée}.
- **Contrainte logique :** origine ∈ {interne, légale interne, externe, système, héritée}.
- **Contrainte logique :** portee ∈ {cible et copies, cible seulement} ; limitation expresse seulement pour restriction légale.
- **Contrainte logique :** héritée : ascendant et origine conservés ; levée origine ne lève pas copie ; sensibilité/non-levables de tous ascendants.

### autorisation_protection_action [HS]

```text
  protection_id  uuid  NN
  action  code  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (protection_id, action)
  FK (protection_id) → autorisation_protection(id)
  FK (evenement_id) → autorisation_evenement(id)
```


### autorisation_protection_personne [HS]

```text
  id  uuid  NN
  protection_id  uuid  NN
  personne_id  uuid  NN
  qualite  code  NN
  depuis  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (protection_id) → autorisation_protection(id)
  FK (personne_id) → personne(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** qualite ∈ {destinataire, bénéficiaire, gardien}.
- **Contrainte logique :** garde valide exige identité renforcée et droit sur cible ou ascendant ; perte signalée avant exposition.

### autorisation_protection_ensemble [HS]

```text
  id  uuid  NN
  protection_id  uuid  NN
  beneficiaire_id  uuid  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (protection_id) → autorisation_protection(id)
  FK (beneficiaire_id) → autorisation_beneficiaire(id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ protection_id, beneficiaire_id
```

- **Contrainte logique :** ensemble ouvert : agrément personne requis, jamais bénéficiaire par seule composition.

### autorisation_agrement [HS]

```text
  id  uuid  NN
  protection_id  uuid  NN
  personne_id  uuid  NN
  gardien_id  uuid  NN
  debut  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (protection_id) → autorisation_protection(id)
  FK (personne_id) → personne(id)
  FK (gardien_id) → acteur_geniius(id)
  FK (evenement_id) → autorisation_evenement(id)
```


### autorisation_passage_orphelin [HS]

```text
  id  uuid  NN
  protection_id  uuid  NN
  debut  ts  NN
  fin  ts
  signale_le  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (protection_id) → autorisation_protection(id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ protection_id WHERE fin IS NULL
```

- **Contrainte logique :** à chaque passage signalement minimal P-3, dans même écriture que perte de garde.

### autorisation_acte [N]

```text
  id  uuid  NN
  type  code  NN
  acteur_id  uuid
  instant  ts  NN
  espace_id  uuid
  contexte_id  uuid
  justification  text
  PK (id)
  FK (acteur_id) → acteur_geniius(id)
  FK (espace_id) → espace(id)
  FK (contexte_id) → contexte_evaluation(id)
```

- **Contrainte logique :** actes sensibles ∈ {dérogation, décès, succession, garde, autorité légale, contestation, versement, nomination admin, transfert, réintégration} ; autres opérations contractuelles identifiées.
- **Contrainte logique :** identité et indépendance vérifiées à l’acte puis à l’évaluation lorsque § 12 le demande.

### autorisation_dossier_objet [N]

```text
  acte_id  uuid  NN
  objet_id  uuid  NN
  PK (acte_id, objet_id)
  FK (acte_id) → autorisation_acte(id)
  FK (objet_id) → objet(id)
```


### autorisation_dossier_espace [N]

```text
  acte_id  uuid  NN
  espace_id  uuid  NN
  PK (acte_id, espace_id)
  FK (acte_id) → autorisation_acte(id)
  FK (espace_id) → espace(id)
```


### autorisation_approbation [N]

```text
  id  uuid  NN
  acte_id  uuid  NN
  approbateur_id  uuid  NN
  identite_id  uuid  NN
  date  ts  NN
  qualite_verifiee  bool  NN
  PK (id)
  FK (acte_id) → autorisation_acte(id)
  FK (approbateur_id) → acteur_geniius(id)
  FK (identite_id) → autorisation_identite(id)
  UQ acte_id, approbateur_id
```

- **Contrainte logique :** comptes même personne comptent une seule fois ; nombre/accords du § 12.3.
- **Contrainte logique :** pas d’intérêt, subordination ou rôle interdit sur dossier ; absence identité vérifiée entraîne refus.

### autorisation_membre_autorite [HS]

```text
  id  uuid  NN
  acteur_id  uuid  NN
  autorite  code  NN
  debut  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (acteur_id) → acteur_geniius(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** autorite ∈ {dérogation, externe} ; qualité sans droit de contenu.

### autorisation_subordination [HS]

```text
  id  uuid  NN
  subordonne_personne_id  uuid  NN
  superieur_personne_id  uuid  NN
  debut  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (subordonne_personne_id) → personne(id)
  FK (superieur_personne_id) → personne(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** indépendance revérifiée à chaque accès dérogatoire.

### autorisation_interet [HS]

```text
  id  uuid  NN
  personne_id  uuid  NN
  objet_id  uuid
  espace_id  uuid
  nature  code  NN
  debut  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (personne_id) → personne(id)
  FK (objet_id) → objet(id)
  FK (espace_id) → espace(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** exactement une cible dossier ; personne commune à tous comptes ; interdits § 12.7.

### autorisation_nomination_admin [HS]

```text
  id  uuid  NN
  espace_id  uuid  NN
  acteur_id  uuid  NN
  nomme_par_id  uuid  NN
  debut  ts  NN
  fin  ts
  etat  code  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (espace_id) → espace(id)
  FK (acteur_id) → acteur_geniius(id)
  FK (nomme_par_id) → acteur_geniius(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** propriétaire seul nomme ; aucun droit de contenu ; etat ∈ {active, close, expirée}.

### autorisation_designation_garde [HS]

```text
  id  uuid  NN
  espace_id  uuid  NN
  beneficiaire_personne_id  uuid  NN
  acte_id  uuid  NN
  debut  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (espace_id) → espace(id)
  FK (beneficiaire_personne_id) → personne(id)
  FK (acte_id) → autorisation_acte(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** destination de gouvernance seulement ; ne confère aucune titularité ou lecture.

### autorisation_deces [N]

```text
  id  uuid  NN
  personne_id  uuid  NN
  acte_id  uuid  NN
  date_constat  ts  NN
  PK (id)
  FK (personne_id) → personne(id)
  FK (acte_id) → autorisation_acte(id)
```

- **Contrainte logique :** deux approbateurs indépendants ; effet personne sur tous comptes et tous espaces.

### autorisation_succession [HS]

```text
  id  uuid  NN
  deces_id  uuid  NN
  objet_id  uuid  NN
  acte_id  uuid  NN
  sort  code  NN
  ayant_droit_id  uuid
  rs_id  uuid
  etat  code  NN
  accepte_le  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (deces_id) → autorisation_deces(id)
  FK (objet_id) → objet(id)
  FK (acte_id) → autorisation_acte(id)
  FK (ayant_droit_id) → acteur_geniius(id)
  FK (rs_id) → acteur_geniius(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** sort ∈ {transmission, versement, purge, maintien gel}.
- **Contrainte logique :** etat ∈ {en instruction, proposée, acceptée, refusée, exécutée}.
- **Contrainte logique :** transmission exige ayant droit vérifié et acceptation ; décision par objet, autres objets restent gelés.

### autorisation_contestation [HS]

```text
  id  uuid  NN
  protection_id  uuid  NN
  acte_id  uuid  NN
  resultat  code  NN
  date_decision  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (protection_id) → autorisation_protection(id)
  FK (acte_id) → autorisation_acte(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** resultat ∈ {en attente, maintenue, annulée} ; protection continue tant que non annulée selon autorité compétente.

### autorisation_finalite_version [HS]

```text
  id  uuid  NN
  version  int  NN
  active  bool  NN
  depuis  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ version
```


### autorisation_finalite [N]

```text
  id  uuid  NN
  version_id  uuid  NN
  code  code  NN
  niveau  code  NN
  PK (id)
  FK (version_id) → autorisation_finalite_version(id)
  UQ version_id, code
```

- **Contrainte logique :** niveau ∈ {technique admissible à un approbateur, renforcé} ; liste fermée gouvernée.

### autorisation_derogation [HS]

```text
  id  uuid  NN
  beneficiaire_personne_id  uuid  NN
  acte_id  uuid  NN
  finalite_id  uuid  NN
  justification  text  NN
  debut  ts  NN
  fin  ts  NN
  etat  code  NN
  renouvellement_de_id  uuid
  rang  int  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (beneficiaire_personne_id) → personne(id)
  FK (acte_id) → autorisation_acte(id)
  FK (finalite_id) → autorisation_finalite(id)
  FK (renouvellement_de_id) → autorisation_derogation(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** etat ∈ {active, suspendue, close, expirée}.
- **Contrainte logique :** fin > debut ; durée ≤ paramètre gouverné.
- **Contrainte logique :** rang calculé sur toutes demandes antérieures recoupant cibles/personne, sans partition par finalité ; carence § 12.6.
- **Contrainte logique :** parent descriptif ne remplace pas ensemble des prédécesseurs ; protections orphelines et non-levables jamais franchies.

### autorisation_derogation_cible [N]

```text
  derogation_id  uuid  NN
  objet_id  uuid  NN
  operation  code  NN
  PK (derogation_id, objet_id, operation)
  FK (derogation_id) → autorisation_derogation(id)
  FK (objet_id) → objet(id)
```


### autorisation_derogation_predecesseur [N]

```text
  derogation_id  uuid  NN
  precedent_id  uuid  NN
  PK (derogation_id, precedent_id)
  FK (derogation_id) → autorisation_derogation(id)
  FK (precedent_id) → autorisation_derogation(id)
```


### autorisation_accord_gardien [N]

```text
  id  uuid  NN
  derogation_id  uuid  NN
  protection_id  uuid  NN
  gardien_id  uuid  NN
  date  ts  NN
  PK (id)
  FK (derogation_id) → autorisation_derogation(id)
  FK (protection_id) → autorisation_protection(id)
  FK (gardien_id) → acteur_geniius(id)
```


### autorisation_transfert [HS]

```text
  id  uuid  NN
  espace_id  uuid  NN
  cedant_id  uuid  NN
  cessionnaire_id  uuid  NN
  designation_id  uuid
  etat  code  NN
  presentation_courante_id  uuid
  presentations  int  NN
  debut  ts  NN
  fin  ts
  carence_fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (espace_id) → espace(id)
  FK (cedant_id) → acteur_geniius(id)
  FK (cessionnaire_id) → acteur_geniius(id)
  FK (designation_id) → autorisation_designation_garde(id)
  FK (presentation_courante_id) → autorisation_presentation(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** etat ∈ {préparé, présenté, accepté, expiré, refusé, annulé}.
- **Contrainte logique :** un transfert courant par espace ; personnes distinctes et identité établie.
- **Contrainte logique :** expiration présentation interdit acceptation ; fin fenêtre réévalue différés ; compteur/plafond/carence § 5.6.

### autorisation_transfert_objet [HS]

```text
  id  uuid  NN
  transfert_id  uuid  NN
  objet_id  uuid  NN
  voie  code  NN
  acceptation_b  bool  NN
  copie_complementaire  bool  NN
  copie_id  uuid
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (transfert_id) → autorisation_transfert(id)
  FK (objet_id) → objet(id)
  FK (copie_id) → objet(id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ transfert_id, objet_id
```

- **Contrainte logique :** voie ∈ {a, b, purge, g} ; copie c seulement complément de a/b, licence/protections requises.

### autorisation_presentation [N]

```text
  id  uuid  NN
  transfert_id  uuid  NN
  numero  int  NN
  instant  ts  NN
  expiration  ts  NN
  empreinte  hash  NN
  PK (id)
  FK (transfert_id) → autorisation_transfert(id)
  UQ transfert_id, numero
```


### autorisation_transfert_engagement [N]

```text
  id  uuid  NN
  presentation_id  uuid  NN
  genre  code  NN
  habilitation_id  uuid
  admission_id  uuid
  membre_id  uuid
  administration_id  uuid
  protection_id  uuid
  voie_id  uuid
  reemission_id  uuid
  beneficiaire_id  uuid
  beneficiaire_genre  code
  beneficiaire_acteur_id  uuid
  beneficiaire_groupe_id  uuid
  beneficiaire_espace_role_id  uuid
  beneficiaire_role  code
  revision_beneficiaire  int
  perimetre_id  uuid
  perimetre_genre  code
  regime_espace_id  uuid
  regime_titulaire_id  uuid
  echeance  ts
  etat  code
  mode  code
  repartager  bool  NN
  effectif  bool  NN
  revision_source  int  NN
  PK (id)
  FK (presentation_id) → autorisation_presentation(id)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (admission_id) → autorisation_admission(id)
  FK (membre_id) → autorisation_membre_groupe(id)
  FK (administration_id) → autorisation_nomination_admin(id)
  FK (protection_id) → autorisation_protection(id)
  FK (voie_id) → autorisation_transfert_objet(id)
  FK (reemission_id) → autorisation_reemission(id)
  FK (beneficiaire_id) → autorisation_beneficiaire(id)
  FK (beneficiaire_acteur_id) → acteur_geniius(id)
  FK (beneficiaire_groupe_id) → groupe(id)
  FK (beneficiaire_espace_role_id) → espace(id)
  FK (perimetre_id) → autorisation_perimetre(id)
  FK (regime_espace_id) → espace(id)
  FK (regime_titulaire_id) → acteur_geniius(id)
```

- **Contrainte logique :** genre et exactement une FK cible concordants ; instantanés relationnels ci-dessous, pas référence à état mutable.
- **Contrainte logique :** avant acceptation comparaison inclusion de tous engagements, pas simple égalité hash ; vue K filtrée distincte.

### autorisation_membre_groupe [HS]

```text
  id  uuid  NN
  groupe_id  uuid  NN
  acteur_id  uuid  NN
  ajoute_par_id  uuid  NN
  debut  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (groupe_id) → groupe(id)
  FK (acteur_id) → acteur_geniius(id)
  FK (ajoute_par_id) → acteur_geniius(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** gestionnaire identité renforcée ; pas ajout de soi (personne) ; fin clôt admissions, pas résurrection.

### autorisation_engagement_action [N]

```text
  engagement_id  uuid  NN
  action  code  NN
  PK (engagement_id, action)
  FK (engagement_id) → autorisation_transfert_engagement(id)
```


### autorisation_engagement_objet [N]

```text
  id  uuid  NN
  engagement_id  uuid  NN
  objet_id  uuid  NN
  role  code  NN
  fondateur_personne_id  uuid
  admission_source_id  uuid
  fondement_snapshot_id  uuid
  PK (id)
  FK (engagement_id) → autorisation_transfert_engagement(id)
  FK (objet_id) → objet(id)
  FK (fondateur_personne_id) → personne(id)
  FK (admission_source_id) → autorisation_admission(id)
  FK (fondement_snapshot_id) → autorisation_engagement_fondement(id)
  UQ engagement_id, objet_id, role, fondateur_personne_id, admission_source_id, fondement_snapshot_id avec null égal
```

- **Contrainte logique :** role ∈ {cible, exclusion, exclusion fondateur, admission exclusion, aperçu} ; ensemble fermé présenté.

### autorisation_engagement_personne [N]

```text
  id  uuid  NN
  engagement_id  uuid  NN
  personne_id  uuid  NN
  role  code  NN
  admission_source_id  uuid
  fondateur_source_id  uuid
  debut  ts
  fin  ts
  etat  code
  automatique  bool
  revision_source  int
  PK (id)
  FK (engagement_id) → autorisation_transfert_engagement(id)
  FK (personne_id) → personne(id)
  FK (admission_source_id) → autorisation_admission(id)
  FK (fondateur_source_id) → autorisation_fondateur(id)
  UQ engagement_id, personne_id, role, admission_source_id, fondateur_source_id avec null égal
```

- **Contrainte logique :** role ∈ {bénéficiaire, fondateur, admis, membre, gardien, gestionnaire, destinataire}.

### autorisation_engagement_fondement [N]

```text
  id  uuid  NN
  engagement_id  uuid  NN
  fondateur_personne_id  uuid
  admission_source_id  uuid
  action  code  NN
  nature  code  NN
  source_habilitation_id  uuid
  source_titularite_id  uuid
  revision_source  int  NN
  perimetre_id  uuid  NN
  debut  ts  NN
  fin  ts
  etat  code  NN
  repartager  bool  NN
  PK (id)
  FK (engagement_id) → autorisation_transfert_engagement(id)
  FK (fondateur_personne_id) → personne(id)
  FK (admission_source_id) → autorisation_admission(id)
  FK (source_habilitation_id) → autorisation_habilitation(id)
  FK (source_titularite_id) → autorisation_titularite(id)
  FK (perimetre_id) → autorisation_perimetre(id)
```

- **Contrainte logique :** nature typée ; couvertures et objets du périmètre copiés dans engagement_objet ; état à présentation, pas jointure courante.

### autorisation_reemission [HS]

```text
  id  uuid  NN
  transfert_id  uuid  NN
  origine_id  uuid  NN
  nouvelle_id  uuid
  perimetre_id  uuid  NN
  beneficiaire_id  uuid  NN
  repartager  bool  NN
  fin  ts
  etat  code  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (transfert_id) → autorisation_transfert(id)
  FK (origine_id) → autorisation_habilitation(id)
  FK (nouvelle_id) → autorisation_habilitation(id)
  FK (perimetre_id) → autorisation_perimetre(id)
  FK (beneficiaire_id) → autorisation_beneficiaire(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** etat ∈ {annoncée, réalisée, abandonnée}.
- **Contrainte logique :** identique ou plus étroite ; source devenue invalide abandonnée sans bloquer acceptation.
- **Contrainte logique :** exclusion du nouveau signataire et permissions à acceptation.

### autorisation_reemission_action [N]

```text
  reemission_id  uuid  NN
  action  code  NN
  PK (reemission_id, action)
  FK (reemission_id) → autorisation_reemission(id)
```


### autorisation_reemission_admission [HS]

```text
  id  uuid  NN
  reemission_id  uuid  NN
  origine_admission_id  uuid  NN
  nouvelle_admission_id  uuid
  personne_id  uuid  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (reemission_id) → autorisation_reemission(id)
  FK (origine_admission_id) → autorisation_admission(id)
  FK (nouvelle_admission_id) → autorisation_admission(id)
  FK (personne_id) → personne(id)
  FK (evenement_id) → autorisation_evenement(id)
```


### autorisation_admission_differee [HS]

```text
  id  uuid  NN
  espace_id  uuid  NN
  origine  code  NN
  transfert_id  uuid
  habilitation_id  uuid  NN
  personne_id  uuid  NN
  date  ts  NN
  etat  code  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (espace_id) → espace(id)
  FK (transfert_id) → autorisation_transfert(id)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (personne_id) → personne(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** origine ∈ {transfert, cycle espace} ; FK transfert requis seulement origine transfert.
- **Contrainte logique :** etat ∈ {en attente, traitée, abandonnée}.
- **Contrainte logique :** mode courant, membre, habilitant, identité/exclusions/protections réévalués ; aucune auto-admission si non notification.

### autorisation_verrou_reintegration [HS]

```text
  id  uuid  NN
  espace_id  uuid  NN
  transfert_id  uuid  NN
  cedant_personne_id  uuid  NN
  depuis  ts  NN
  fin  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (espace_id) → espace(id)
  FK (transfert_id) → autorisation_transfert(id)
  FK (cedant_personne_id) → personne(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** s’applique à tous comptes du cédant ; consentement pour chaque acte sensible de retour.

### autorisation_consentement_reintegration [HS]

```text
  id  uuid  NN
  verrou_id  uuid  NN
  signataire_id  uuid  NN
  propriete_id  uuid  NN
  revision_propriete  int  NN
  acte_id  uuid  NN
  beneficiaire_id  uuid  NN
  perimetre_id  uuid  NN
  fin  ts
  empreinte_acte  hash  NN
  consomme_le  ts
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (verrou_id) → autorisation_verrou_reintegration(id)
  FK (signataire_id) → acteur_geniius(id)
  FK (propriete_id) → autorisation_propriete(id)
  FK (acte_id) → autorisation_acte(id)
  FK (beneficiaire_id) → autorisation_beneficiaire(id)
  FK (perimetre_id) → autorisation_perimetre(id)
  FK (evenement_id) → autorisation_evenement(id)
```

- **Contrainte logique :** propriétaire courant d’autre personne, acte couvert et consommation unique atomique.
- **Contrainte logique :** transfert suivant ou changement propriétaire invalide consentement antérieur.

### autorisation_consentement_action [N]

```text
  consentement_id  uuid  NN
  action  code  NN
  PK (consentement_id, action)
  FK (consentement_id) → autorisation_consentement_reintegration(id)
```


### autorisation_epoque [HS]

```text
  id  uuid  NN
  espace_id  uuid  NN
  valeur  int  NN
  revision  int  NN
  debut_validite  ts  NN
  fin_validite  ts
  evenement_id  uuid  NN
  PK (id)
  FK (espace_id) → espace(id)
  FK (evenement_id) → autorisation_evenement(id)
  UQ espace_id
```

- **Contrainte logique :** incrément avant prise d’effet ; propagation interespaces atomique ou barrière de refus.

### autorisation_evenement [N]

```text
  id  uuid  NN
  acte_id  uuid  NN
  instant  ts  NN
  acteur_id  uuid
  operation  code  NN
  PK (id)
  FK (acte_id) → autorisation_acte(id)
  FK (acteur_id) → acteur_geniius(id)
```

- **Contrainte logique :** état antérieur complet dans _hist ; événement ne réécrit jamais auteur/paternité/filiation.

### contexte_evaluation [N]

```text
  id  uuid  NN
  acteur_id  uuid
  identite_id  uuid
  audience  code  NN
  espace_id  uuid  NN
  projet_id  uuid
  instant  ts  NN
  operation  code  NN
  finalite_id  uuid
  canal  code  NN
  epoque_autorisation  int  NN
  habilitation_id  uuid
  derogation_id  uuid
  appareil_ref  uuid
  PK (id)
  FK (acteur_id) → acteur_geniius(id)
  FK (identite_id) → autorisation_identite(id)
  FK (espace_id) → espace(id)
  FK (projet_id) → projet(id)
  FK (finalite_id) → autorisation_finalite(id)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (derogation_id) → autorisation_derogation(id)
```

- **Contrainte logique :** dérogation implique finalité, opération et cible couverts à instant ; aucune donnée contenu dans journal.
- **Contrainte logique :** appareil du schéma technique requis réplication ; public peut avoir acteur nul.

### autorisation_decision [N]

```text
  id  uuid  NN
  contexte_id  uuid  NN
  cible_objet_id  uuid
  cible_lien_id  uuid
  action  code  NN
  instant  ts  NN
  epoque  int  NN
  resultat  code  NN
  PK (id)
  FK (contexte_id) → contexte_evaluation(id)
  FK (cible_objet_id) → objet(id)
  FK (cible_lien_id) → lien(id)
```

- **Contrainte logique :** exactement une cible ; trace ne constitue jamais un droit courant.

### autorisation_decision_fondement [N]

```text
  id  uuid  NN
  decision_id  uuid  NN
  genre  code  NN
  titulaire_id  uuid
  habilitation_id  uuid
  admission_id  uuid
  fin  ts
  PK (id)
  FK (decision_id) → autorisation_decision(id)
  FK (titulaire_id) → autorisation_titularite(id)
  FK (habilitation_id) → autorisation_habilitation(id)
  FK (admission_id) → autorisation_admission(id)
```

- **Contrainte logique :** genre ∈ {titulaire, rôle, HI, HP, visibilité, dérogation}.
- **Contrainte logique :** FK et genre concordants ; visibilité sans référence ; dérogation portée par contexte.

## Réconciliation et périmètre

Les appartenances scientifiques sont des projections des nominations HI actives ; les appartenances administratives reflètent propriété et nomination admin, les membres de groupe reflètent autorisation_membre_groupe. Les anciennes colonnes ne constituent aucun fondement autonome. Identité de sécurité : acteur→personne vérifiée, concordante avec les comptes ; elle est distincte d’un rapprochement historique scientifique. Les rôles plateforme sont des qualifications, jamais des droits de contenu.

Les clichés de transfert sont indépendants de l’état courant : pour chaque engagement, les jointures figées conservent actions, cibles/exclusions, personnes, fondateurs/fondements, admissions, garde, rôle et régime, état/effectivité, partage et échéances. La liste d’objets de tout périmètre dynamique est copiée à la présentation ; une vue filtrée distincte ne livre à K que ce que § 10.6 lui permet. Toute propriété d’inclusion exigée par ce paragraphe constitue un invariant procédural en fin de transaction ; les seuls FK ne prouvent pas l’inclusion.

Mode : la traduction n’ajoute aucune opération de changement de mode au contrat. Toute donnée de mode lue lors d’un différé est celle de l’habilitation courante, pas celle de sa mise en attente. Les paramètres de durée, carence, profondeur et finalité restent les réserves du contrat § 16 ; aucune constante du modèle Python n’est promue implicitement en engagement produit.
