-- ===================================================
-- TABLE TREES — arbres généalogiques rattachés à un compte
-- Premier jalon du multi-tenant pour Tree : chaque utilisateur authentifié
-- peut posséder plusieurs arbres, visibles uniquement par lui (RLS).
-- ===================================================

create table public.trees (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index trees_owner_idx on public.trees(owner_id);

alter table public.trees enable row level security;

create policy "trees_owner_select"
on public.trees
for select
to authenticated
using (auth.uid() = owner_id);

create policy "trees_owner_insert"
on public.trees
for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "trees_owner_update"
on public.trees
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "trees_owner_delete"
on public.trees
for delete
to authenticated
using (auth.uid() = owner_id);

-- Garde updated_at à jour automatiquement
create or replace function public.set_trees_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trees_set_updated_at
before update on public.trees
for each row
execute function public.set_trees_updated_at();
