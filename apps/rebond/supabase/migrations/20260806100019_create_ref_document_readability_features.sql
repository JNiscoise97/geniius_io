-- Table de référence : caractéristiques de lisibilité d'un document (ratures,
-- pâleur de l'encre, tache, pliure...), qualifiées par type de document
-- (manuscrit et/ou imprimé) via `applicable_to`.
--
-- Écart volontaire vs public.ref_document_readability_features (voir
-- schema-docs/ref_document_readability_features.md) :
--   - Index idx_ref_document_readability_features_code supprimé : redondant
--     avec l'index automatique de la contrainte unique sur code.

create table if not exists rebond.ref_document_readability_features (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  categorie text not null,
  note text null,
  description text null,
  applicable_to text not null default 'BOTH',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_document_readability_features_pkey primary key (id),
  constraint ref_document_readability_features_code_key unique (code),
  constraint ref_doc_readability_applicable_to_check
    check (applicable_to = any (array['BOTH', 'MANUSCRITE', 'IMPRIMEE']))
);

create index if not exists idx_ref_doc_readability_applicable_to
  on rebond.ref_document_readability_features using btree (applicable_to);

create index if not exists idx_ref_document_readability_features_categorie
  on rebond.ref_document_readability_features using btree (categorie);

comment on table rebond.ref_document_readability_features is
  'Référentiel des caractéristiques de lisibilité d''un document. Voir apps/rebond/supabase/schema-docs/ref_document_readability_features.md';
