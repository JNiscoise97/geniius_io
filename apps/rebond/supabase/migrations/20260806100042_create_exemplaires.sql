-- Exemplaires — instances physiques/numériques d'une unité documentaire (ex.
-- plusieurs numérisations ou dépôts du même acte). Renommée depuis
-- public.ref_exemplaires : même raison que unites_documentaires, ce n'est
-- pas un référentiel — voir schema-docs/exemplaires.md.
--
-- depot_id, pagination_type_ref, physical_condition_ref pointent déjà vers
-- rebond.* (migrées précédemment). unite_documentaire_id pointe vers
-- rebond.unites_documentaires (ce même lot). nature_ref et support_ref
-- restent cross-schema vers public.* (pas encore migrées).

create table if not exists rebond.exemplaires (
  id uuid not null default gen_random_uuid(),
  unite_documentaire_id uuid not null,
  depot_id uuid not null,
  nature_ref uuid null,
  support_ref uuid null,
  cote_locale text null,
  identifiant_interne text null,
  localisation_interne text null,
  conditionnement text null,
  description text null,
  note text null,
  nb_pages integer null,
  source_exemplaire_id uuid null,
  couverture_label text null,
  couverture_sort_start integer null,
  couverture_sort_end integer null,
  pagination_type_ref uuid null,
  physical_condition_ref uuid null,
  document_damage_kinds_ids uuid[] null,
  document_readability_features_ids uuid[] null,
  parent_exemplaire_id uuid null,
  dans_table boolean null,
  dans_registre boolean null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint exemplaires_pkey primary key (id),
  constraint exemplaires_unite_documentaire_id_fkey
    foreign key (unite_documentaire_id) references rebond.unites_documentaires (id) on delete cascade,
  constraint exemplaires_depot_id_fkey
    foreign key (depot_id) references rebond.ref_depots (id) on delete restrict,
  constraint exemplaires_pagination_type_ref_fkey
    foreign key (pagination_type_ref) references rebond.ref_pagination_type (id) on delete set null,
  constraint exemplaires_physical_condition_ref_fkey
    foreign key (physical_condition_ref) references rebond.ref_physical_condition (id) on delete set null,
  constraint exemplaires_parent_exemplaire_id_fkey
    foreign key (parent_exemplaire_id) references rebond.exemplaires (id) on delete set null,
  constraint exemplaires_source_exemplaire_id_fkey
    foreign key (source_exemplaire_id) references rebond.exemplaires (id) on delete set null,
  -- Cross-schema, tables pas encore migrées :
  constraint exemplaires_nature_ref_fkey
    foreign key (nature_ref) references public.ref_natures (id) on delete set null,
  constraint exemplaires_support_ref_fkey
    foreign key (support_ref) references public.ref_supports (id) on delete set null,
  constraint exemplaires_couverture_sort_chk check (
    (couverture_sort_start is null and couverture_sort_end is null)
    or (couverture_sort_start is not null and couverture_sort_end is not null
        and couverture_sort_start <= couverture_sort_end)
  )
);

create index if not exists idx_exemplaires_unite
  on rebond.exemplaires using btree (unite_documentaire_id);

create index if not exists idx_exemplaires_depot
  on rebond.exemplaires using btree (depot_id);

create index if not exists idx_exemplaires_source
  on rebond.exemplaires using btree (source_exemplaire_id);

create index if not exists idx_exemplaires_pagination_type_ref
  on rebond.exemplaires using btree (pagination_type_ref);

create index if not exists idx_exemplaires_physical_condition_ref
  on rebond.exemplaires using btree (physical_condition_ref);

create index if not exists idx_exemplaires_parent_exemplaire_id
  on rebond.exemplaires using btree (parent_exemplaire_id);

comment on table rebond.exemplaires is
  'Exemplaires d''une unité documentaire. Voir apps/rebond/supabase/schema-docs/exemplaires.md';
