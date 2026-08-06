-- Copie les données existantes de public.* vers rebond.* pour les 7 tables
-- migrées dans ce lot. Les lignes de public.* ne sont PAS supprimées ni
-- modifiées (migration additive, réversible) — le nettoyage/dépréciation du
-- schéma public se fera dans une étape séparée, une fois le code d'apps/rebond
-- rebranché et vérifié.
--
-- Les id d'origine (public.*) sont préservés à l'identique dans rebond.* pour
-- que toute table encore dans public qui référence ces lignes (par uuid)
-- continue de résoudre correctement, y compris avant que ces tables-là soient
-- elles-mêmes migrées.
--
-- Idempotent : ré-exécutable sans dupliquer (ON CONFLICT (id) DO NOTHING).
-- Ordre : respecte les dépendances de clé étrangère entre les 7 tables.

-- 1) ref_institution_type (aucun écart de colonnes vs public)
insert into rebond.ref_institution_type
  (id, code, label, categorie, note, description, position, created_at, updated_at)
select
  id, code, label, categorie, note, description, position, created_at, updated_at
from public.ref_institution_type
on conflict (id) do nothing;

-- 2) ref_depot_type (note/description/created_at/updated_at n'existaient pas
--    dans public -> valeurs par défaut : null pour note/description, now()
--    pour les timestamps, faute de mieux)
insert into rebond.ref_depot_type
  (id, code, label, is_online, note, description, created_at, updated_at)
select
  id, code, label, is_online, null, null, now(), now()
from public.ref_depot_type
on conflict (id) do nothing;

-- 3) ref_mode_acces (aucun écart de colonnes vs public)
insert into rebond.ref_mode_acces
  (id, code, label, note, description, created_at, updated_at)
select
  id, code, label, note, description, created_at, updated_at
from public.ref_mode_acces
on conflict (id) do nothing;

-- 4) ref_plateforme_kind (aucun écart de colonnes vs public)
insert into rebond.ref_plateforme_kind
  (id, code, label, categorie, note, description, created_at, updated_at)
select
  id, code, label, categorie, note, description, created_at, updated_at
from public.ref_plateforme_kind
on conflict (id) do nothing;

-- 5) ref_plateformes (dépend de ref_plateforme_kind, déjà migrée ci-dessus)
insert into rebond.ref_plateformes
  (id, code, label, site_web, plateforme_kind_ref, auth_required, robots_policy_note, created_at, updated_at)
select
  id, code, label, site_web, plateforme_kind_ref, auth_required, robots_policy_note, created_at, updated_at
from public.ref_plateformes
on conflict (id) do nothing;

-- 6) ref_institutions (dépend de ref_institution_type et ref_plateformes, déjà migrées)
insert into rebond.ref_institutions
  (id, nom, sigle, pays, region, departement, commune, site_web, note, type_institution_ref, plateforme_ref, created_at, updated_at)
select
  id, nom, sigle, pays, region, departement, commune, site_web, note, type_institution_ref, plateforme_ref, created_at, updated_at
from public.ref_institutions
on conflict (id) do nothing;

-- 7) ref_depots (dépend de ref_institutions, ref_depot_type, ref_mode_acces, ref_plateformes)
insert into rebond.ref_depots
  (id, institution_id, nom, adresse, ville, code_postal, pays, note,
   conditions_communication, modalites_repro, delais_communication,
   type_ref, meme_adresse_institution, mode_acces_ref, plateforme_ref,
   created_at, updated_at)
select
  id, institution_id, nom, adresse, ville, code_postal, pays, note,
  conditions_communication, modalites_repro, delais_communication,
  type_ref, meme_adresse_institution, mode_acces_ref, plateforme_ref,
  created_at, updated_at
from public.ref_depots
on conflict (id) do nothing;

-- Vérification rapide : compare les comptages public vs rebond pour ce lot.
-- (à lancer manuellement après exécution, pas une assertion automatique)
-- select 'ref_institution_type', (select count(*) from public.ref_institution_type), (select count(*) from rebond.ref_institution_type)
-- union all select 'ref_depot_type', (select count(*) from public.ref_depot_type), (select count(*) from rebond.ref_depot_type)
-- union all select 'ref_mode_acces', (select count(*) from public.ref_mode_acces), (select count(*) from rebond.ref_mode_acces)
-- union all select 'ref_plateforme_kind', (select count(*) from public.ref_plateforme_kind), (select count(*) from rebond.ref_plateforme_kind)
-- union all select 'ref_plateformes', (select count(*) from public.ref_plateformes), (select count(*) from rebond.ref_plateformes)
-- union all select 'ref_institutions', (select count(*) from public.ref_institutions), (select count(*) from rebond.ref_institutions)
-- union all select 'ref_depots', (select count(*) from public.ref_depots), (select count(*) from rebond.ref_depots);
