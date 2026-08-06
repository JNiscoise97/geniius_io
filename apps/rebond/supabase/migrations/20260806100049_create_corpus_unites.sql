-- Table pivot corpus <-> unités documentaires. Portée à l'identique depuis
-- public.corpus_unites, aucun écart de colonnes. Les deux FK sont désormais
-- entièrement internes à rebond (corpus et unites_documentaires déjà
-- migrées) — plus aucune référence cross-schema sur cette table.

create table if not exists rebond.corpus_unites (
  corpus_id uuid not null,
  unite_documentaire_id uuid not null,
  ajout_at timestamp with time zone not null default now(),
  constraint corpus_unites_pkey primary key (corpus_id, unite_documentaire_id),
  constraint corpus_unites_corpus_id_fkey
    foreign key (corpus_id) references rebond.corpus (id) on delete cascade,
  constraint corpus_unites_unite_documentaire_id_fkey
    foreign key (unite_documentaire_id) references rebond.unites_documentaires (id) on delete cascade
);

create index if not exists idx_corpus_unites_corpus
  on rebond.corpus_unites using btree (corpus_id);

create index if not exists idx_corpus_unites_ud
  on rebond.corpus_unites using btree (unite_documentaire_id);

comment on table rebond.corpus_unites is
  'Pivot corpus <-> unités documentaires. Voir apps/rebond/supabase/schema-docs/corpus_unites.md';
