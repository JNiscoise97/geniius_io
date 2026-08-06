-- Migration additive des données public.notaire_registres → rebond.notariat_notaire_annees.
-- Idempotent (id préservé, ON CONFLICT DO NOTHING). Ne touche pas à public.*.

insert into rebond.notariat_notaire_annees (
  id, notaire_id, annee, nombre_actes, complet,
  numero_acte_min, numero_acte_max, created_at, updated_at
)
select
  id, notaire_id, annee, nombre_actes, complet,
  numero_acte_min, numero_acte_max, created_at, updated_at
from public.notaire_registres
on conflict (id) do nothing;
