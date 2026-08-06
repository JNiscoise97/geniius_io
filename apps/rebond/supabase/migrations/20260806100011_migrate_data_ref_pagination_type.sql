-- Copie les données existantes de public.ref_pagination_type vers rebond.ref_pagination_type.
-- Additive, réversible : les lignes de public ne sont ni supprimées ni modifiées.
-- Idempotent (ON CONFLICT (id) DO NOTHING).

insert into rebond.ref_pagination_type
  (id, code, label, note, description, created_at, updated_at)
select
  id, code, label, note, description, created_at, updated_at
from public.ref_pagination_type
on conflict (id) do nothing;

-- Vérification manuelle après exécution :
-- select (select count(*) from public.ref_pagination_type) as public_count,
--        (select count(*) from rebond.ref_pagination_type) as rebond_count;
