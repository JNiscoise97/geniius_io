-- ===================================================
-- STORAGE — bucket privé pour les fichiers GEDCOM et médias, par arbre
-- Convention de chemin : {tree_id}/gedcom/<fichier>.ged
--                        {tree_id}/media/<fichier>
--
-- Cette migration sécurise uniquement l'endroit où les fichiers atterrissent.
-- Le parsing du GEDCOM et l'affichage des médias dans l'arbre sont une étape
-- suivante (voir persons/families, actuellement alimentées par un unique
-- fichier statique, pas encore par arbre).
-- ===================================================

insert into storage.buckets (id, name, public)
values ('tree-files', 'tree-files', false)
on conflict (id) do nothing;

create policy "tree_files_owner_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'tree-files'
  and exists (
    select 1 from public.trees t
    where t.id::text = (storage.foldername(name))[1]
      and t.owner_id = auth.uid()
  )
);

create policy "tree_files_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'tree-files'
  and exists (
    select 1 from public.trees t
    where t.id::text = (storage.foldername(name))[1]
      and t.owner_id = auth.uid()
  )
);

create policy "tree_files_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'tree-files'
  and exists (
    select 1 from public.trees t
    where t.id::text = (storage.foldername(name))[1]
      and t.owner_id = auth.uid()
  )
);

create policy "tree_files_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'tree-files'
  and exists (
    select 1 from public.trees t
    where t.id::text = (storage.foldername(name))[1]
      and t.owner_id = auth.uid()
  )
);
