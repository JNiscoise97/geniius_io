-- Relation "mentionné dans" : une table/répertoire (instrument de recherche)
-- référence un acte sans le contenir physiquement. Jusqu'ici cette relation
-- était confondue avec le containment physique via unites_documentaires.
-- parent_ud_id (acte → table → registre), ce qui est archivistiquement faux :
-- l'acte est physiquement enregistré dans le registre, la table ne fait que
-- pointer vers lui pour la recherche (comme un index de livre ne contient
-- pas les chapitres). Voir migration suivante pour la séparation des deux
-- relations sur les données déjà en place.
--
-- N:M par construction (une table peut mentionner plusieurs actes, et
-- rien n'empêche qu'un acte soit un jour mentionné par plusieurs tables,
-- ex. un index général en plus de l'index annuel).

create table if not exists rebond.unites_documentaires_mentions (
  id uuid not null default gen_random_uuid(),
  mentionnant_id uuid not null,
  mentionne_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint unites_documentaires_mentions_pkey primary key (id),
  constraint unites_documentaires_mentions_unique unique (mentionnant_id, mentionne_id),
  constraint unites_documentaires_mentions_mentionnant_id_fkey
    foreign key (mentionnant_id) references rebond.unites_documentaires (id) on delete cascade,
  constraint unites_documentaires_mentions_mentionne_id_fkey
    foreign key (mentionne_id) references rebond.unites_documentaires (id) on delete cascade,
  constraint unites_documentaires_mentions_not_self check (mentionnant_id <> mentionne_id)
);

create index if not exists idx_unites_documentaires_mentions_mentionnant
  on rebond.unites_documentaires_mentions using btree (mentionnant_id);

create index if not exists idx_unites_documentaires_mentions_mentionne
  on rebond.unites_documentaires_mentions using btree (mentionne_id);

comment on table rebond.unites_documentaires_mentions is
  'Relation "mentionné dans" entre unités documentaires (ex. table → acte), distincte du containment physique porté par parent_ud_id.';

alter table rebond.unites_documentaires_mentions enable row level security;

drop policy if exists "unites_documentaires_mentions_public_select" on rebond.unites_documentaires_mentions;
create policy "unites_documentaires_mentions_public_select" on rebond.unites_documentaires_mentions
  for select to anon, authenticated using (true);

drop policy if exists "unites_documentaires_mentions_public_insert" on rebond.unites_documentaires_mentions;
create policy "unites_documentaires_mentions_public_insert" on rebond.unites_documentaires_mentions
  for insert to anon, authenticated with check (true);

drop policy if exists "unites_documentaires_mentions_public_update" on rebond.unites_documentaires_mentions;
create policy "unites_documentaires_mentions_public_update" on rebond.unites_documentaires_mentions
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "unites_documentaires_mentions_public_delete" on rebond.unites_documentaires_mentions;
create policy "unites_documentaires_mentions_public_delete" on rebond.unites_documentaires_mentions
  for delete to anon, authenticated using (true);

grant all on rebond.unites_documentaires_mentions to anon, authenticated, service_role;
