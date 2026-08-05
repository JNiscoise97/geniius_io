-- ===================================================
-- FIX 2 — durcit la vérification d'appartenance de l'arbre pour les policies
-- storage.objects.
--
-- Deux changements par rapport à la version précédente :
-- 1. `split_part(name, '/', 1)` à la place de `storage.foldername(name)` —
--    comportement standard Postgres, garanti, plutôt que de dépendre d'un
--    helper interne au schéma storage dont la signature peut varier.
-- 2. La vérification d'appartenance passe par une fonction SECURITY DEFINER
--    (`public.user_owns_tree`). Ça évite tout souci de contexte de rôle
--    quand la policy de storage.objects référence une autre table (trees)
--    qui a elle-même des policies RLS — cas connu pour se comporter
--    différemment selon la façon dont le service Storage exécute la requête.
-- ===================================================

create or replace function public.user_owns_tree(tree_id_text text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trees t
    where t.id::text = tree_id_text
      and t.owner_id = auth.uid()
  );
$$;

drop policy if exists "tree_files_owner_select" on storage.objects;
drop policy if exists "tree_files_owner_insert" on storage.objects;
drop policy if exists "tree_files_owner_update" on storage.objects;
drop policy if exists "tree_files_owner_delete" on storage.objects;

create policy "tree_files_owner_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'tree-files'
  and public.user_owns_tree(split_part(name, '/', 1))
);

create policy "tree_files_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'tree-files'
  and public.user_owns_tree(split_part(name, '/', 1))
);

create policy "tree_files_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'tree-files'
  and public.user_owns_tree(split_part(name, '/', 1))
)
with check (
  bucket_id = 'tree-files'
  and public.user_owns_tree(split_part(name, '/', 1))
);

create policy "tree_files_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'tree-files'
  and public.user_owns_tree(split_part(name, '/', 1))
);
