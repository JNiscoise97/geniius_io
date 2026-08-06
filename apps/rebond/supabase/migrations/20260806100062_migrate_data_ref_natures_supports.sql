-- Copie les données existantes de public.* vers rebond.* pour ce lot.
-- Additive, réversible. Idempotent (ON CONFLICT (id) DO NOTHING).

insert into rebond.ref_natures
  (id, code, label, note, description, created_at, updated_at)
select
  id, code, label, note, description, created_at, updated_at
from public.ref_natures
on conflict (id) do nothing;

insert into rebond.ref_supports
  (id, code, label, note, description, created_at, updated_at)
select
  id, code, label, note, description, created_at, updated_at
from public.ref_supports
on conflict (id) do nothing;

-- Vérification manuelle après exécution :
-- select 'ref_natures', (select count(*) from public.ref_natures), (select count(*) from rebond.ref_natures)
-- union all select 'ref_supports', (select count(*) from public.ref_supports), (select count(*) from rebond.ref_supports);
