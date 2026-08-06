-- RLS pour les 7 tables de ce lot. Même policy ouverte que les lots
-- précédents (voir 20260806100009) : les tables sœurs de ce même flux
-- (ref_unites_documentaires, citations, ref_exemplaires) autorisent déjà
-- lecture/écriture sans authentification.

do $$
declare
  t text;
begin
  foreach t in array array[
    'ref_etat_civil_type_acte',
    'etat_civil_bureaux',
    'etat_civil_registres',
    'etat_civil_registres_type_acte',
    'etat_civil_actes',
    'etat_civil_repertoires',
    'notariat_actes'
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

-- Les fonctions rebond.create_registre_label / rebond.set_registre_label
-- doivent être exécutables par les rôles applicatifs (SECURITY INVOKER par
-- défaut : elles s'exécutent avec les droits de l'appelant, qui a déjà accès
-- aux tables via les policies ci-dessus — juste le droit d'appeler la fonction).
grant execute on function rebond.create_registre_label(uuid) to anon, authenticated, service_role;
