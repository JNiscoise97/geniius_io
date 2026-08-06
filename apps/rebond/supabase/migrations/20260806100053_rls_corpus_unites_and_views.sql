-- RLS pour corpus_unites (même policy ouverte que les lots précédents) et
-- grants de lecture pour les deux vues (les vues n'ont pas leur propre RLS —
-- elles héritent des policies des tables sous-jacentes au moment de
-- l'exécution, déjà ouvertes ; il faut juste leur donner le droit SELECT
-- explicitement, un GRANT sur une vue est distinct des GRANT sur ses tables
-- source).

alter table rebond.corpus_unites enable row level security;

drop policy if exists "corpus_unites_public_select" on rebond.corpus_unites;
create policy "corpus_unites_public_select"
  on rebond.corpus_unites for select
  to anon, authenticated using (true);

drop policy if exists "corpus_unites_public_insert" on rebond.corpus_unites;
create policy "corpus_unites_public_insert"
  on rebond.corpus_unites for insert
  to anon, authenticated with check (true);

drop policy if exists "corpus_unites_public_update" on rebond.corpus_unites;
create policy "corpus_unites_public_update"
  on rebond.corpus_unites for update
  to anon, authenticated using (true) with check (true);

drop policy if exists "corpus_unites_public_delete" on rebond.corpus_unites;
create policy "corpus_unites_public_delete"
  on rebond.corpus_unites for delete
  to anon, authenticated using (true);

grant all on rebond.corpus_unites to anon, authenticated, service_role;

grant select on rebond.v_sources to anon, authenticated, service_role;
grant select on rebond.v_exemplaires_pick to anon, authenticated, service_role;
