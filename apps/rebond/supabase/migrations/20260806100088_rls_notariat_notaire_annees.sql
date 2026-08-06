-- RLS pour rebond.notariat_notaire_annees, même policy ouverte que le reste du schéma.

alter table rebond.notariat_notaire_annees enable row level security;

drop policy if exists "notariat_notaire_annees_public_select" on rebond.notariat_notaire_annees;
create policy "notariat_notaire_annees_public_select" on rebond.notariat_notaire_annees
  for select to anon, authenticated using (true);

drop policy if exists "notariat_notaire_annees_public_insert" on rebond.notariat_notaire_annees;
create policy "notariat_notaire_annees_public_insert" on rebond.notariat_notaire_annees
  for insert to anon, authenticated with check (true);

drop policy if exists "notariat_notaire_annees_public_update" on rebond.notariat_notaire_annees;
create policy "notariat_notaire_annees_public_update" on rebond.notariat_notaire_annees
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "notariat_notaire_annees_public_delete" on rebond.notariat_notaire_annees;
create policy "notariat_notaire_annees_public_delete" on rebond.notariat_notaire_annees
  for delete to anon, authenticated using (true);

grant all on rebond.notariat_notaire_annees to anon, authenticated, service_role;
