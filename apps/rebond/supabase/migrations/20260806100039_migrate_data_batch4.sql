-- Copie les données existantes de public.* vers rebond.* pour ce lot.
-- Additive, réversible : public.* inchangé. Idempotent (ON CONFLICT (id) DO NOTHING).
-- Aucune dépendance entre elles, ordre indifférent.
--
-- Triggers updated_at désactivés le temps de la copie (pas d'impact réel ici
-- puisque ce sont des INSERT, pas des UPDATE, mais cohérence avec le lot précédent).

insert into rebond.ref_role_document
  (id, code, label, description, note, position, created_at, updated_at)
select
  id, code, label, description, note, position, created_at, updated_at
from public.ref_role_document
on conflict (id) do nothing;

insert into rebond.ref_type_unite
  (id, code, label, note, description, position, created_at, updated_at)
select
  id, code, label, note, description, position, created_at, updated_at
from public.ref_type_unite
on conflict (id) do nothing;

insert into rebond.ref_acces_numeriques
  (id, plateforme_id, url_base, schema_deep_link, restrictions, last_checked_at, note,
   exemplaire_id, type_acces_id, permalink, created_at, updated_at)
select
  id, plateforme_id, url_base, schema_deep_link, restrictions, last_checked_at, note,
  exemplaire_id, type_acces_id, permalink, created_at, updated_at
from public.ref_acces_numeriques
on conflict (id) do nothing;

insert into rebond.ref_series_documentaires
  (id, code, label, description, note, created_at, updated_at)
select
  id, code, label, description, note, created_at, updated_at
from public.ref_series_documentaires
on conflict (id) do nothing;

-- Vérification manuelle après exécution :
-- select 'ref_role_document', (select count(*) from public.ref_role_document), (select count(*) from rebond.ref_role_document)
-- union all select 'ref_type_unite', (select count(*) from public.ref_type_unite), (select count(*) from rebond.ref_type_unite)
-- union all select 'ref_acces_numeriques', (select count(*) from public.ref_acces_numeriques), (select count(*) from rebond.ref_acces_numeriques)
-- union all select 'ref_series_documentaires', (select count(*) from public.ref_series_documentaires), (select count(*) from rebond.ref_series_documentaires);
