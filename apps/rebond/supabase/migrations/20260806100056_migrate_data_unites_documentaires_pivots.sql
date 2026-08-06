-- Copie les données existantes de public.* vers rebond.* pour les deux
-- pivots. Additive, réversible. Idempotent (ON CONFLICT DO NOTHING sur les
-- PK composites).

insert into rebond.unites_documentaires_bureaux (unite_id, bureau_id, created_at)
select unite_id, bureau_id, created_at
from public.ref_unites_documentaires_bureaux
on conflict (unite_id, bureau_id) do nothing;

insert into rebond.unites_documentaires_types_actes (unite_id, type_acte_id, created_at)
select unite_id, type_acte_id, created_at
from public.ref_unites_documentaires_types_actes
on conflict (unite_id, type_acte_id) do nothing;

-- Vérification manuelle après exécution :
-- select 'unites_documentaires_bureaux', (select count(*) from public.ref_unites_documentaires_bureaux), (select count(*) from rebond.unites_documentaires_bureaux)
-- union all select 'unites_documentaires_types_actes', (select count(*) from public.ref_unites_documentaires_types_actes), (select count(*) from rebond.unites_documentaires_types_actes);
