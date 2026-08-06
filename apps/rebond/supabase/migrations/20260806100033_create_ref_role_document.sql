-- Référentiel des rôles qu'un document peut jouer (acte primaire, instrument
-- de recherche, registre compilé...). Portée à l'identique depuis
-- public.ref_role_document, aucun écart de colonnes.
--
-- Référencée par public.ref_unites_documentaires.role_document_ref (table pas
-- encore migrée, la jointure embarquée ref_role_document!role_document_ref
-- utilisée dans patrimoine.service.ts continue de fonctionner sans
-- modification puisque public.ref_role_document n'est pas touchée).

create table if not exists rebond.ref_role_document (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  description text null,
  note text null,
  position integer null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_role_document_pkey primary key (id),
  constraint ref_role_document_code_uniq unique (code),
  constraint ref_role_document_code_upper_chk check (code = upper(code))
);

comment on table rebond.ref_role_document is
  'Référentiel des rôles de document. Voir apps/rebond/supabase/schema-docs/ref_role_document.md';
