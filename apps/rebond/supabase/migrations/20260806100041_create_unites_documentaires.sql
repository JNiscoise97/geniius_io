-- Unités documentaires — LA table centrale de l'app : les documents et
-- sources eux-mêmes, en hiérarchie (une "source" de haut niveau contient des
-- "documents" enfants via parent_ud_id). Renommée depuis
-- public.ref_unites_documentaires : ce n'est pas un référentiel (ce n'était
-- pas une petite table de vocabulaire contrôlé), le préfixe ref_ était
-- trompeur — voir schema-docs/unites_documentaires.md.
--
-- Écarts volontaires vs public.ref_unites_documentaires :
--   - Renommage de la table (ref_unites_documentaires -> unites_documentaires)
--   - statut -> statut_source, workflow_statut -> statut_document : les deux
--     colonnes ne cohabitent pas par accident, chacune n'a de sens que pour
--     un rôle de la ligne (source si parent_ud_id is null, document sinon) —
--     renommées pour le rendre explicite, en miroir des types front-end
--     SourceStatut/DocStatut. Aucun changement de valeurs ni de contrainte.
--
-- role_document_ref, serie_ref, type_unite_ref, langue_ref pointent déjà vers
-- rebond.* (migrées précédemment). producteur_ref reste cross-schema vers
-- public.ref_auteur_institutionnel (pas encore migrée).

create table if not exists rebond.unites_documentaires (
  id uuid not null default gen_random_uuid(),
  titre text not null,
  titre_norm text not null,
  identifiant_interne text null,
  description text null,
  couverture_label text null,
  couverture_sort_start integer null,
  couverture_sort_end integer null,
  type_unite_ref uuid null,
  statut_source text not null default 'a_qualifier',
  statut_document text not null default 'a_transcrire',
  niveau_fiabilite text null,
  producteur_ref uuid null,
  parent_ud_id uuid null,
  metadonnees jsonb null,
  role_document_ref uuid null,
  langue_ref uuid null,
  serie_ref uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint unites_documentaires_pkey primary key (id),
  constraint unites_documentaires_parent_ud_id_fkey
    foreign key (parent_ud_id) references rebond.unites_documentaires (id) on delete set null,
  constraint unites_documentaires_role_document_ref_fkey
    foreign key (role_document_ref) references rebond.ref_role_document (id) on delete set null,
  constraint unites_documentaires_serie_ref_fkey
    foreign key (serie_ref) references rebond.ref_series_documentaires (id) on delete restrict,
  constraint unites_documentaires_type_unite_ref_fkey
    foreign key (type_unite_ref) references rebond.ref_type_unite (id) on delete restrict,
  constraint unites_documentaires_langue_ref_fkey
    foreign key (langue_ref) references rebond.ref_langues (id) on delete restrict,
  -- Cross-schema, table pas encore migrée :
  constraint unites_documentaires_producteur_ref_fkey
    foreign key (producteur_ref) references public.ref_auteur_institutionnel (id) on delete set null,
  constraint ud_niveau_fiabilite_chk
    check (niveau_fiabilite is null or niveau_fiabilite = any (array['haute', 'moyenne', 'basse'])),
  constraint ud_parent_self_chk check (parent_ud_id <> id),
  constraint ud_statut_source_chk
    check (statut_source = any (array['actif', 'archivé', 'incomplet', 'a_qualifier'])),
  constraint ud_statut_document_chk
    check (statut_document = any (array['a_transcrire', 'decrit', 'en_cours', 'transcrit', 'annote', 'en_attente']))
);

create index if not exists idx_unites_documentaires_type_unite_ref
  on rebond.unites_documentaires using btree (type_unite_ref);

create index if not exists idx_unites_documentaires_serie_ref
  on rebond.unites_documentaires using btree (serie_ref);

create index if not exists idx_unites_documentaires_couverture_sort
  on rebond.unites_documentaires using btree (couverture_sort_start, couverture_sort_end);

create index if not exists idx_unites_documentaires_statut_source
  on rebond.unites_documentaires using btree (statut_source);

create index if not exists idx_unites_documentaires_statut_document
  on rebond.unites_documentaires using btree (statut_document);

create index if not exists idx_unites_documentaires_parent_ud_id
  on rebond.unites_documentaires using btree (parent_ud_id);

create index if not exists idx_unites_documentaires_producteur_ref
  on rebond.unites_documentaires using btree (producteur_ref);

create index if not exists idx_unites_documentaires_metadonnees
  on rebond.unites_documentaires using gin (metadonnees);

create index if not exists idx_unites_documentaires_langue_ref
  on rebond.unites_documentaires using btree (langue_ref);

create unique index if not exists ux_unites_documentaires_type_ref_titrenorm_serie_couv
  on rebond.unites_documentaires using btree (
    type_unite_ref,
    titre_norm,
    serie_ref,
    coalesce(nullif(trim(both from couverture_label), ''), '∅')
  );

comment on table rebond.unites_documentaires is
  'Unités documentaires (documents et sources). Voir apps/rebond/supabase/schema-docs/unites_documentaires.md';
