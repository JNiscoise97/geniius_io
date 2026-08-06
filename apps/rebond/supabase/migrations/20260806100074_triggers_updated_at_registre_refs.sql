-- Triggers updated_at pour les 8 référentiels de registre d'état civil.
-- Réutilisation de public.set_updated_at() — nom différent de
-- public.fn_set_updated_at() utilisée ailleurs dans la migration (probable
-- doublon/incohérence de convention dans la base d'origine, non résolu ici),
-- même hypothèse de fonction générique schéma-agnostique.

do $$
declare
  t text;
begin
  foreach t in array array[
    'ref_etat_civil_registre_fonction',
    'ref_etat_civil_registre_mode',
    'ref_etat_civil_registre_norme',
    'ref_etat_civil_registre_ordre_numerotation',
    'ref_etat_civil_registre_pagination',
    'ref_etat_civil_registre_regime_fiscal_support',
    'ref_etat_civil_registre_statut_juridique',
    'ref_etat_civil_registre_support'
  ]
  loop
    execute format(
      'create trigger trg_%s_updated_at before update on rebond.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;
