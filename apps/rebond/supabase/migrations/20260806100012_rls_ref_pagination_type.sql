-- RLS pour rebond.ref_pagination_type — même policy ouverte que le lot
-- précédent (voir 20260806100009_rls_institutions_plateformes.sql), pour
-- rester cohérent avec les tables sœurs déjà migrées et utilisées par le
-- même écran d'enrichissement d'exemplaire.

alter table rebond.ref_pagination_type enable row level security;

drop policy if exists "ref_pagination_type_public_select" on rebond.ref_pagination_type;
create policy "ref_pagination_type_public_select"
  on rebond.ref_pagination_type for select
  to anon, authenticated using (true);

drop policy if exists "ref_pagination_type_public_insert" on rebond.ref_pagination_type;
create policy "ref_pagination_type_public_insert"
  on rebond.ref_pagination_type for insert
  to anon, authenticated with check (true);

drop policy if exists "ref_pagination_type_public_update" on rebond.ref_pagination_type;
create policy "ref_pagination_type_public_update"
  on rebond.ref_pagination_type for update
  to anon, authenticated using (true) with check (true);

drop policy if exists "ref_pagination_type_public_delete" on rebond.ref_pagination_type;
create policy "ref_pagination_type_public_delete"
  on rebond.ref_pagination_type for delete
  to anon, authenticated using (true);

grant all on rebond.ref_pagination_type to anon, authenticated, service_role;
