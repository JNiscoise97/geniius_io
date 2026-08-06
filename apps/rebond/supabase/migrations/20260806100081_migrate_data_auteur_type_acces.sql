-- Copie les données existantes de public.* vers rebond.* pour ce lot.
-- Additive, réversible. Idempotent (ON CONFLICT (id) DO NOTHING).

insert into rebond.ref_auteur_institutionnel
  (id, code, label, categorie, position, description, note, created_at, updated_at)
select
  id, code, label, categorie, position, description, note, created_at, updated_at
from public.ref_auteur_institutionnel
on conflict (id) do nothing;

insert into rebond.ref_type_acces
  (id, code, label, description, note, created_at, updated_at)
select
  id, code, label, description, note, created_at, updated_at
from public.ref_type_acces
on conflict (id) do nothing;

-- Vérification manuelle après exécution :
-- select 'ref_auteur_institutionnel', (select count(*) from public.ref_auteur_institutionnel), (select count(*) from rebond.ref_auteur_institutionnel)
-- union all select 'ref_type_acces', (select count(*) from public.ref_type_acces), (select count(*) from rebond.ref_type_acces);
