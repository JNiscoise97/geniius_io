create table public.ref_role_document (
  id uuid not null default gen_random_uuid (),
  code text not null,
  label text not null,
  description text null,
  note text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  position integer null,
  constraint ref_role_document_pkey primary key (id),
  constraint ref_role_document_code_uniq unique (code),
  constraint ref_role_document_code_upper_chk check ((code = upper(code)))
) TABLESPACE pg_default;

insert into public.ref_role_document (code, label, position) values
  ('ACTE_PRIMAIRE',           'Acte primaire',            1),
  ('REGISTRE_COMPILE',        'Registre compilé',         2),
  ('INSTRUMENT_DE_RECHERCHE', 'Instrument de recherche',  3);

create trigger trg_ref_role_document_updated_at
before update on ref_role_document
for each row execute function fn_set_updated_at();
