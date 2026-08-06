-- RLS pour les 7 référentiels d'enrichissement d'exemplaire. Même policy
-- ouverte que les lots précédents (voir 20260806100009), pour rester cohérent
-- avec le même écran (EnrichirExemplaireActePage) qui lit déjà d'autres
-- tables (citations, ref_exemplaires) sans authentification requise.

do $$
declare
  t text;
begin
  foreach t in array array[
    'ref_physical_condition',
    'ref_repro_quality',
    'ref_document_damage_kinds',
    'ref_langues',
    'ref_ecritures',
    'ref_handwriting_legibility',
    'ref_document_readability_features'
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

    execute format(
      'grant all on rebond.%I to anon, authenticated, service_role', t
    );
  end loop;
end $$;
