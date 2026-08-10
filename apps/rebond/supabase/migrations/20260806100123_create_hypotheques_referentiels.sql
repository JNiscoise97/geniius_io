-- Référentiels du domaine Hypothèques (conservation des hypothèques, régime
-- antérieur à la réforme de 1955 — dépôt/transcription/inscription).
--
-- ref_hypotheques_type_registre couvre DEUX familles de registres, distinguées
-- par la colonne "famille" (voir échange avec l'utilisateur, 2026-08-10) :
--   - formalites : les registres LÉGAUX qui portent les actes eux-mêmes
--     (depot, transcription, inscription).
--   - ordre : les REGISTRES D'ORDRE, des instruments de recherche, pas des
--     actes (table_alphabetique, repertoire_formalites). Une "table
--     alphabétique générale" et une "table alphabétique des noms les plus
--     courants" (vu en usage réel, conservations de La Réunion) restent toutes
--     deux du code table_alphabetique — la nuance reste dans le label du
--     registre, pas un sous-type contrôlé de plus (même doctrine que le reste
--     du projet : ne pas fragmenter le référentiel sans besoin structurel réel).
--
-- ref_hypotheques_type_acte ne qualifie QUE les actes d'un registre de type
-- "transcription" (mutation, saisie immobilière) — décision explicite de
-- l'utilisateur : dépôts et inscriptions n'ont pas ce sous-type.

create table if not exists rebond.ref_hypotheques_type_registre (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  famille text not null,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_hypotheques_type_registre_pkey primary key (id),
  constraint ref_hypotheques_type_registre_code_key unique (code),
  constraint ref_hypotheques_type_registre_famille_check
    check (famille in ('formalites', 'ordre'))
);

comment on table rebond.ref_hypotheques_type_registre is
  'Types de registre hypothécaire (formalités légales vs registres d''ordre). Voir échange utilisateur du 2026-08-10.';

insert into rebond.ref_hypotheques_type_registre (code, label, famille, position) values
  ('depot',                'Registre des dépôts',                       'formalites', 10),
  ('transcription',        'Registre des transcriptions',               'formalites', 20),
  ('inscription',          'Registre des inscriptions',                 'formalites', 30),
  ('table_alphabetique',   'Table alphabétique',                        'ordre',      10),
  ('repertoire_formalites','Répertoire des formalités hypothécaires',   'ordre',      20)
on conflict (code) do nothing;

create table if not exists rebond.ref_hypotheques_type_acte (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_hypotheques_type_acte_pkey primary key (id),
  constraint ref_hypotheques_type_acte_code_key unique (code)
);

comment on table rebond.ref_hypotheques_type_acte is
  'Types d''acte au sein d''un registre des transcriptions hypothécaires (mutation, saisie immobilière). Voir échange utilisateur du 2026-08-10.';

insert into rebond.ref_hypotheques_type_acte (code, label, position) values
  ('mutation',            'Mutation',              10),
  ('saisie_immobiliere',  'Saisie immobilière',    20)
on conflict (code) do nothing;
