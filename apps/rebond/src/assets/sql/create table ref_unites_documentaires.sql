create table public.ref_unites_documentaires (
  id uuid not null default gen_random_uuid (),
  titre text not null,
  identifiant_interne text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  serie_ref uuid not null,
  couverture_label text null,
  couverture_sort_start integer null,
  couverture_sort_end integer null,
  titre_norm text not null,
  type_unite_ref uuid null,
  date_start date null,
  date_end date null,
  statut text not null default 'a_qualifier'::text,
  role_document_ref uuid null,
  workflow_statut text not null default 'a_transcrire'::text,
  niveau_fiabilite text null,
  producteur_ref uuid null,
  parent_ud_id uuid null,
  metadonnees jsonb null,
  constraint ref_unites_documentaires_pkey primary key (id),
  constraint ref_unites_documentaires_producteur_ref_fkey foreign key (producteur_ref) references ref_auteur_institutionnel (id) on delete set null,
  constraint ref_unites_documentaires_serie_ref_fkey foreign key (serie_ref) references ref_series_documentaires (id) on delete restrict,
  constraint ref_unites_documentaires_type_unite_ref_fkey foreign key (type_unite_ref) references ref_type_unite (id) on delete restrict,
  constraint ref_unites_documentaires_role_document_ref_fkey foreign key (role_document_ref) references ref_role_document (id) on delete set null,
  constraint ref_unites_documentaires_parent_ud_id_fkey foreign key (parent_ud_id) references ref_unites_documentaires (id) on delete set null,
  constraint ud_statut_chk check (
    statut = any (array['actif'::text, 'archivé'::text, 'incomplet'::text, 'a_qualifier'::text])
  ),
  constraint ud_workflow_statut_chk check (
    workflow_statut = any (array['a_transcrire'::text, 'en_cours'::text, 'transcrit'::text, 'annote'::text, 'en_attente'::text])
  ),
  constraint ud_niveau_fiabilite_chk check (
    (niveau_fiabilite is null) or (
      niveau_fiabilite = any (array['haute'::text, 'moyenne'::text, 'basse'::text])
    )
  ),
  constraint ud_parent_self_chk check ((parent_ud_id <> id))
) TABLESPACE pg_default;

create index if not exists idx_ref_unites_documentaires_type_unite_ref on public.ref_unites_documentaires using btree (type_unite_ref) TABLESPACE pg_default;
create index if not exists idx_ref_unites_documentaires_date_range on public.ref_unites_documentaires using btree (date_start, date_end) TABLESPACE pg_default;
create index if not exists idx_ref_unites_documentaires_serie_ref on public.ref_unites_documentaires using btree (serie_ref) TABLESPACE pg_default;
create index if not exists idx_ref_unites_documentaires_couverture_sort on public.ref_unites_documentaires using btree (couverture_sort_start, couverture_sort_end) TABLESPACE pg_default;
create index if not exists idx_ud_statut on public.ref_unites_documentaires using btree (statut) TABLESPACE pg_default;
create index if not exists idx_ud_workflow_statut on public.ref_unites_documentaires using btree (workflow_statut) TABLESPACE pg_default;
create index if not exists idx_ud_role_document_ref on public.ref_unites_documentaires using btree (role_document_ref) TABLESPACE pg_default;
create index if not exists idx_ud_parent_ud_id on public.ref_unites_documentaires using btree (parent_ud_id) TABLESPACE pg_default;
create index if not exists idx_ud_producteur_ref on public.ref_unites_documentaires using btree (producteur_ref) TABLESPACE pg_default;
create index if not exists idx_ud_metadonnees on public.ref_unites_documentaires using gin (metadonnees) TABLESPACE pg_default;

create unique index if not exists ux_ref_unites_type_ref_titrenorm_serie_couv on public.ref_unites_documentaires using btree (
  type_unite_ref,
  titre_norm,
  serie_ref,
  coalesce(nullif(trim(both from couverture_label), ''::text), '∅'::text)
) TABLESPACE pg_default;

create trigger trg_ref_unites_documentaires_titre_norm before insert
or update of titre on ref_unites_documentaires for each row
execute function fn_set_unite_titre_norm ();

create trigger trg_ref_unites_documentaires_updated_at before update
on ref_unites_documentaires for each row
execute function fn_set_updated_at ();
