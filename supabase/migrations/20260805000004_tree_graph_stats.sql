-- ===================================================
-- TABLE TREE_GRAPH_STATS — métadonnées légères du graphe analysé pour un arbre.
--
-- Le graphe complet (personnes/familles, potentiellement plusieurs dizaines
-- de Mo pour un gros GEDCOM) est stocké en JSON dans le bucket tree-files,
-- au chemin {tree_id}/graph/graph.json — pas en base, pour rester cohérent
-- avec la façon dont l'app charge déjà son graphe de démo (fetch d'un fichier
-- JSON statique, cf. loadGraph.ts).
--
-- Cette table ne garde que les compteurs, pour afficher un tableau de bord
-- honnête sans avoir à retélécharger tout le graphe à chaque visite.
-- ===================================================

create table public.tree_graph_stats (
  tree_id       uuid primary key references public.trees(id) on delete cascade,
  person_count  integer not null default 0,
  family_count  integer not null default 0,
  media_count   integer not null default 0,
  parsed_at     timestamptz not null default now()
);

alter table public.tree_graph_stats enable row level security;

create policy "tree_graph_stats_owner_select"
on public.tree_graph_stats
for select
to authenticated
using (public.user_owns_tree(tree_id::text));

create policy "tree_graph_stats_owner_insert"
on public.tree_graph_stats
for insert
to authenticated
with check (public.user_owns_tree(tree_id::text));

create policy "tree_graph_stats_owner_update"
on public.tree_graph_stats
for update
to authenticated
using (public.user_owns_tree(tree_id::text))
with check (public.user_owns_tree(tree_id::text));

create policy "tree_graph_stats_owner_delete"
on public.tree_graph_stats
for delete
to authenticated
using (public.user_owns_tree(tree_id::text));
