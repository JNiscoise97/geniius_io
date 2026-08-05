-- ===================================================
-- FIX — rend la migration du bucket tree-files idempotente.
-- La version précédente utilisait `create policy` sans garde : rejouée une
-- deuxième fois (ou si une policy a échoué à la création), l'erreur
-- "policy already exists" arrête le script en plein milieu et laisse
-- certaines policies manquantes (typiquement l'INSERT) → upload bloqué par
-- RLS avec "new row violates row-level security policy".
-- Cette migration recrée les 4 policies proprement, sans risque à rejouer.
-- ===================================================

insert into storage.buckets (id, name, public)
values ('tree-files', 'tree-files', false)
on conflict (id) do nothing;

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
