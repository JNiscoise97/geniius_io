-- RLS pour les 7 tables migrées dans ce lot.
--
-- Ce projet active RLS par défaut sur les nouvelles tables (voir
-- supabase/migrations/20260610000001_ref_signature_kind_rls.sql à la racine
-- du repo) et les tables sœurs directement utilisées par le même flux
-- ("Patrimoine documentaire" / assistant de référencement) — ref_unites_documentaires,
-- ref_exemplaires, citations, ec_tables — autorisent déjà lecture/écriture sans
-- authentification (voir 20260624000001_ec_tables_rls_open.sql). On réplique
-- volontairement cette même policy ouverte ici, pour que le même flux ne se
-- heurte pas à des 403 incohérents selon la table touchée.
--
-- ⚠️ Permissif par cohérence avec l'existant, pas par choix de sécurité posé
-- ici. À resserrer (auth requise, RLS par propriétaire...) quand le modèle
-- d'accès de rebond sera redéfini au-delà de ce premier lot de tables.

do $$
declare
  t text;
begin
  foreach t in array array[
    'ref_institution_type',
    'ref_depot_type',
    'ref_mode_acces',
    'ref_plateforme_kind',
    'ref_plateformes',
    'ref_institutions',
    'ref_depots'
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
  end loop;
end $$;

-- Le schéma rebond doit aussi être ajouté à la liste des "Exposed schemas"
-- du projet (Dashboard Supabase -> Project Settings -> API -> Exposed schemas)
-- pour être accessible via l'API REST/PostgREST utilisée par le client JS.
-- Ce n'est pas pilotable en SQL, à faire manuellement une seule fois.
grant usage on schema rebond to anon, authenticated, service_role;
grant all on all tables in schema rebond to anon, authenticated, service_role;
alter default privileges in schema rebond grant all on tables to anon, authenticated, service_role;
