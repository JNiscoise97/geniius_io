-- Copie les données existantes de public.* vers rebond.* pour ce lot.
-- Additive, réversible : public.* inchangé. Idempotent (ON CONFLICT (id) DO NOTHING).
-- Ordre : respecte les dépendances de clé étrangère au sein du lot.
--
-- Triggers d'audit désactivés le temps de la copie en masse pour ne pas
-- polluer public.app_audit_log avec une entrée par ligne migrée (ce n'est pas
-- une action utilisateur) — réactivés à la fin.

alter table rebond.etat_civil_bureaux disable trigger trg_audit_etat_civil_bureaux;
alter table rebond.etat_civil_registres disable trigger trg_audit_etat_civil_registres;
alter table rebond.etat_civil_registres disable trigger trg_set_registre_label;
alter table rebond.etat_civil_actes disable trigger trg_audit_etat_civil_actes;

-- 1) ref_etat_civil_type_acte (ex ref_ec_type_acte) — created_at/updated_at
--    n'existaient pas dans public, initialisés à now().
insert into rebond.ref_etat_civil_type_acte
  (id, code, label, label_pluriel, description, note, color, position, categorie, created_at, updated_at)
select
  id, code, label, label_pluriel, description, note, color, position, categorie, now(), now()
from public.ref_ec_type_acte
on conflict (id) do nothing;

-- 2) etat_civil_bureaux
insert into rebond.etat_civil_bureaux
  (id, nom, commune, departement, region, created_at, updated_at)
select
  id, nom, commune, departement, region,
  coalesce(created_at, now()), coalesce(updated_at, now())
from public.etat_civil_bureaux
on conflict (id) do nothing;

-- 3) etat_civil_registres (dépend de etat_civil_bureaux migrée ci-dessus ;
--    FK cross-schema vers public.ref_registre_* laissées telles quelles,
--    ces id restent valides puisque ces tables ne sont pas touchées)
insert into rebond.etat_civil_registres
  (id, bureau_id, annee, type_acte, nombre_actes_estime, numero_acte_min, numero_acte_max,
   transcription_terminee, registre_mode_ref, registre_ordre_numerotation_ref,
   registre_statut_juridique_ref, registre_support_ref, registre_pagination_ref,
   registre_fonction_ref, registre_norme_ref, registre_langue_ref, label,
   registre_regime_fiscal_support_ref, unite_documentaire_id, created_at, updated_at)
select
  id, bureau_id, annee, type_acte, nombre_actes_estime, numero_acte_min, numero_acte_max,
  transcription_terminee, registre_mode_ref, registre_ordre_numerotation_ref,
  registre_statut_juridique_ref, registre_support_ref, registre_pagination_ref,
  registre_fonction_ref, registre_norme_ref, registre_langue_ref, label,
  registre_regime_fiscal_support_ref, unite_documentaire_id,
  coalesce(created_at, now()), coalesce(updated_at, now())
from public.etat_civil_registres
on conflict (id) do nothing;

-- 4) etat_civil_registres_type_acte (dépend de etat_civil_registres et
--    ref_etat_civil_type_acte migrées ci-dessus)
insert into rebond.etat_civil_registres_type_acte
  (registre_id, type_acte_id, created_at)
select
  registre_id, type_acte_id, created_at
from public.etat_civil_registres_type_acte
on conflict (registre_id, type_acte_id) do nothing;

-- 5) etat_civil_actes (dépend de etat_civil_bureaux et etat_civil_registres ;
--    FK cross-schema status/auteur_institutionnel_ref/preferred_transcription_id
--    laissées telles quelles)
insert into rebond.etat_civil_actes
  (id, bureau_id, annee, transcription, source, reference, numero_acte, multi, type_acte,
   date, mentions_marginales, comparution_mairie, comparution_observations, contrat_mariage,
   enfants_legitimes, enfants_nombre, label, registre_id, heure, lieu_situation,
   lieu_transport_raison, type_acte_ref, redaction_bureau_id, auteur_institutionnel_ref,
   preferred_transcription_id, status, created_at, updated_at)
select
  id, bureau_id, annee, transcription, source, reference, numero_acte, multi, type_acte,
  date, mentions_marginales, comparution_mairie, comparution_observations, contrat_mariage,
  enfants_legitimes, enfants_nombre, label, registre_id, heure, lieu_situation,
  lieu_transport_raison, type_acte_ref, redaction_bureau_id, auteur_institutionnel_ref,
  preferred_transcription_id, status,
  coalesce(created_at, now()), coalesce(updated_at, now())
from public.etat_civil_actes
on conflict (id) do nothing;

-- 6) etat_civil_repertoires (ex ec_tables, dépend de etat_civil_bureaux ;
--    unite_documentaire_id cross-schema laissée telle quelle)
insert into rebond.etat_civil_repertoires
  (id, unite_documentaire_id, bureau_id, periodicite, classement, annee_debut, annee_fin,
   type_acte_ids, label, created_at, updated_at)
select
  id, unite_documentaire_id, bureau_id, periodicite, classement, annee_debut, annee_fin,
  type_acte_ids, label, created_at, updated_at
from public.ec_tables
on conflict (id) do nothing;

-- 7) notariat_actes (ex actes) — created_at casté en timestamptz (colonne
--    source sans fuseau), updated_at absent de la source, initialisé à now().
insert into rebond.notariat_actes
  (id, type_operation, label, origine_propriete, clauses, statut, tags, origine_acte,
   numero_acte, notaire_registre_id, source, unite_documentaire_id, created_at, updated_at)
select
  id, type_operation, label, origine_propriete, clauses, statut, tags, origine_acte,
  numero_acte, notaire_registre_id, source, unite_documentaire_id,
  coalesce(created_at::timestamptz, now()), now()
from public.actes
on conflict (id) do nothing;

alter table rebond.etat_civil_bureaux enable trigger trg_audit_etat_civil_bureaux;
alter table rebond.etat_civil_registres enable trigger trg_audit_etat_civil_registres;
alter table rebond.etat_civil_registres enable trigger trg_set_registre_label;
alter table rebond.etat_civil_actes enable trigger trg_audit_etat_civil_actes;

-- Vérification manuelle après exécution :
-- select 'ref_etat_civil_type_acte', (select count(*) from public.ref_ec_type_acte), (select count(*) from rebond.ref_etat_civil_type_acte)
-- union all select 'etat_civil_bureaux', (select count(*) from public.etat_civil_bureaux), (select count(*) from rebond.etat_civil_bureaux)
-- union all select 'etat_civil_registres', (select count(*) from public.etat_civil_registres), (select count(*) from rebond.etat_civil_registres)
-- union all select 'etat_civil_registres_type_acte', (select count(*) from public.etat_civil_registres_type_acte), (select count(*) from rebond.etat_civil_registres_type_acte)
-- union all select 'etat_civil_actes', (select count(*) from public.etat_civil_actes), (select count(*) from rebond.etat_civil_actes)
-- union all select 'etat_civil_repertoires', (select count(*) from public.ec_tables), (select count(*) from rebond.etat_civil_repertoires)
-- union all select 'notariat_actes', (select count(*) from public.actes), (select count(*) from rebond.notariat_actes);
