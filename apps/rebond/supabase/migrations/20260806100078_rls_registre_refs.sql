-- RLS pour les 8 tables de ce lot, même policy ouverte que les lots précédents.

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
    execute format('alter table rebond.%I enable row level security', t);

    execute format('drop policy if exists "%s_public_select" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_select" on rebond.%I for select to anon, authenticated using (true)',
      t, t
    );

    execute format('drop policy if exists "%s_public_insert" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_insert" on rebond.%I for insert to anon, authenticated with check (true)',
      t, t
    );

    execute format('drop policy if exists "%s_public_update" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_update" on rebond.%I for update to anon, authenticated using (true) with check (true)',
      t, t
    );

    execute format('drop policy if exists "%s_public_delete" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_delete" on rebond.%I for delete to anon, authenticated using (true)',
      t, t
    );

    execute format('grant all on rebond.%I to anon, authenticated, service_role', t);
  end loop;
end $$;
