-- Citations — pointeur reliant un exemplaire à une cible qu'il documente
-- (target_type/target_id : association polymorphe, ex. un acte d'état civil,
-- pas de FK possible par construction). Portée à l'identique depuis
-- public.citations, aucun écart de colonnes.
--
-- exemplaire_id -> rebond.exemplaires (ce même lot), repro_quality_ref ->
-- rebond.ref_repro_quality (déjà migrée) : plus aucune FK cross-schema sur
-- cette table.

create table if not exists rebond.citations (
  id uuid not null default gen_random_uuid(),
  exemplaire_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  is_missing boolean null,
  lacune boolean null,
  lacune_note text null,
  locating jsonb not null default '{}',
  note text null,
  repro_quality_ref uuid null,
  marks text null,
  marginalia jsonb not null default '{}',
  writing jsonb not null default '{}',
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint citations_pkey primary key (id),
  constraint citations_exemplaire_id_fkey
    foreign key (exemplaire_id) references rebond.exemplaires (id) on delete restrict,
  constraint citations_repro_quality_ref_fkey
    foreign key (repro_quality_ref) references rebond.ref_repro_quality (id) on delete restrict,
  constraint citations_target_ck check (length(trim(both from target_type)) > 0)
);

create index if not exists idx_citations_exemplaire
  on rebond.citations using btree (exemplaire_id);

create index if not exists idx_citations_target
  on rebond.citations using btree (target_type, target_id);

create index if not exists idx_citations_locating_gin
  on rebond.citations using gin (locating);

create index if not exists idx_citations_marginalia_gin
  on rebond.citations using gin (marginalia);

comment on table rebond.citations is
  'Citations reliant un exemplaire à une cible documentée. Voir apps/rebond/supabase/schema-docs/citations.md';
