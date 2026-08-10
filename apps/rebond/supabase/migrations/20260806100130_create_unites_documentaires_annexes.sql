-- Relation "est annexe de" entre deux unités documentaires, générique à
-- toute série (pas seulement hypothèques — cf. le cas déclencheur : une
-- demande d'autorisation adressée au Gouverneur, jointe à une transcription
-- hypothécaire, deux séries documentaires différentes).
--
-- Distincte de unites_documentaires_mentions ("mentionné dans" — un index
-- pointe vers un acte pour le retrouver, ne le contient pas physiquement) :
-- une annexe est un document à part entière, joint/complémentaire au
-- document principal, pas un simple renvoi de recherche. Distincte aussi de
-- parent_ud_id (containment physique réel, ex. acte écrit dans un registre) —
-- une annexe n'est pas "contenue dans" le document principal, elle lui est
-- jointe. Voir échange utilisateur du 2026-08-10.
--
-- N:M par construction, comme unites_documentaires_mentions (même pattern) :
-- un document peut avoir plusieurs annexes, et rien n'empêche qu'une même
-- annexe soit un jour jointe à plusieurs documents principaux.

create table if not exists rebond.unites_documentaires_annexes (
  id uuid not null default gen_random_uuid(),
  document_id uuid not null,
  annexe_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint unites_documentaires_annexes_pkey primary key (id),
  constraint unites_documentaires_annexes_unique unique (document_id, annexe_id),
  constraint unites_documentaires_annexes_document_id_fkey
    foreign key (document_id) references rebond.unites_documentaires (id) on delete cascade,
  constraint unites_documentaires_annexes_annexe_id_fkey
    foreign key (annexe_id) references rebond.unites_documentaires (id) on delete cascade,
  constraint unites_documentaires_annexes_not_self check (document_id <> annexe_id)
);

create index if not exists idx_unites_documentaires_annexes_document
  on rebond.unites_documentaires_annexes using btree (document_id);

create index if not exists idx_unites_documentaires_annexes_annexe
  on rebond.unites_documentaires_annexes using btree (annexe_id);

comment on table rebond.unites_documentaires_annexes is
  'Relation "est annexe de" entre unités documentaires, générique à toute série — distincte de unites_documentaires_mentions (index) et de parent_ud_id (containment physique).';

alter table rebond.unites_documentaires_annexes enable row level security;

drop policy if exists "unites_documentaires_annexes_public_select" on rebond.unites_documentaires_annexes;
create policy "unites_documentaires_annexes_public_select" on rebond.unites_documentaires_annexes
  for select to anon, authenticated using (true);

drop policy if exists "unites_documentaires_annexes_public_insert" on rebond.unites_documentaires_annexes;
create policy "unites_documentaires_annexes_public_insert" on rebond.unites_documentaires_annexes
  for insert to anon, authenticated with check (true);

drop policy if exists "unites_documentaires_annexes_public_update" on rebond.unites_documentaires_annexes;
create policy "unites_documentaires_annexes_public_update" on rebond.unites_documentaires_annexes
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "unites_documentaires_annexes_public_delete" on rebond.unites_documentaires_annexes;
create policy "unites_documentaires_annexes_public_delete" on rebond.unites_documentaires_annexes
  for delete to anon, authenticated using (true);

grant all on rebond.unites_documentaires_annexes to anon, authenticated, service_role;
