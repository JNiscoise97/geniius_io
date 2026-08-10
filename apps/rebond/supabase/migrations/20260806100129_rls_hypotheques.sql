-- RLS pour les tables du domaine Hypothèques — même policy ouverte
-- anon+authenticated que le reste du schéma rebond (voir 20260806100032).

do $$
declare
  t text;
begin
  foreach t in array array[
    'ref_hypotheques_type_registre',
    'ref_hypotheques_type_acte',
    'hypotheques_conservations',
    'hypotheques_bureaux',
    'hypotheques_registres',
    'hypotheques_actes',
    'hypotheques_repertoire_entrees',
    'hypotheques_table_entrees',
    'hypotheques_table_entree_refs'
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

-- Pas de grant execute nécessaire sur rebond.set_hypotheques_registre_label() :
-- fonction trigger pure (jamais appelée directement en RPC par l'app,
-- contrairement à rebond.create_registre_label pour etat_civil) — s'exécute
-- avec les droits du propriétaire de la table, pas du rôle appelant.
