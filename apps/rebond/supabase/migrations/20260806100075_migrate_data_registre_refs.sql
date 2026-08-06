-- Copie les données existantes de public.* vers rebond.* pour ce lot.
-- Additive, réversible. Idempotent (ON CONFLICT (id) DO NOTHING).

insert into rebond.ref_etat_civil_registre_fonction
  (id, code, label, note, description, created_at, updated_at)
select id, code, label, note, description, created_at, updated_at
from public.ref_registre_fonction
on conflict (id) do nothing;

insert into rebond.ref_etat_civil_registre_mode
  (id, code, label, note, description, created_at, updated_at)
select id, code, label, note, description, created_at, updated_at
from public.ref_registre_mode
on conflict (id) do nothing;

insert into rebond.ref_etat_civil_registre_norme
  (id, code, label, note, description, created_at, updated_at)
select id, code, label, note, description, created_at, updated_at
from public.ref_registre_norme
on conflict (id) do nothing;

insert into rebond.ref_etat_civil_registre_ordre_numerotation
  (id, code, label, note, description, created_at, updated_at)
select id, code, label, note, description, created_at, updated_at
from public.ref_registre_ordre_numerotation
on conflict (id) do nothing;

insert into rebond.ref_etat_civil_registre_pagination
  (id, code, label, note, description, created_at, updated_at)
select id, code, label, note, description, created_at, updated_at
from public.ref_registre_pagination
on conflict (id) do nothing;

insert into rebond.ref_etat_civil_registre_regime_fiscal_support
  (id, code, label, note, description, created_at, updated_at)
select id, code, label, note, description, created_at, updated_at
from public.ref_registre_regime_fiscal_support
on conflict (id) do nothing;

insert into rebond.ref_etat_civil_registre_statut_juridique
  (id, code, label, note, description, created_at, updated_at)
select id, code, label, note, description, created_at, updated_at
from public.ref_registre_statut_juridique
on conflict (id) do nothing;

insert into rebond.ref_etat_civil_registre_support
  (id, code, label, note, description, created_at, updated_at)
select id, code, label, note, description, created_at, updated_at
from public.ref_registre_support
on conflict (id) do nothing;

-- Vérification manuelle après exécution :
-- select 'fonction', (select count(*) from public.ref_registre_fonction), (select count(*) from rebond.ref_etat_civil_registre_fonction)
-- union all select 'mode', (select count(*) from public.ref_registre_mode), (select count(*) from rebond.ref_etat_civil_registre_mode)
-- union all select 'norme', (select count(*) from public.ref_registre_norme), (select count(*) from rebond.ref_etat_civil_registre_norme)
-- union all select 'ordre_numerotation', (select count(*) from public.ref_registre_ordre_numerotation), (select count(*) from rebond.ref_etat_civil_registre_ordre_numerotation)
-- union all select 'pagination', (select count(*) from public.ref_registre_pagination), (select count(*) from rebond.ref_etat_civil_registre_pagination)
-- union all select 'regime_fiscal_support', (select count(*) from public.ref_registre_regime_fiscal_support), (select count(*) from rebond.ref_etat_civil_registre_regime_fiscal_support)
-- union all select 'statut_juridique', (select count(*) from public.ref_registre_statut_juridique), (select count(*) from rebond.ref_etat_civil_registre_statut_juridique)
-- union all select 'support', (select count(*) from public.ref_registre_support), (select count(*) from rebond.ref_etat_civil_registre_support);
