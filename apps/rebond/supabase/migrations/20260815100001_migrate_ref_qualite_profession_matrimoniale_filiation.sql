-- Migration de 4 référentiels de l'ancien modèle (schéma public) vers le
-- nouveau schéma `rebond` (2026-08-15, demande explicite). Suit exactement
-- le précédent déjà établi pour ref_natures/ref_type_unite/ref_supports :
-- une COPIE dans `rebond`, l'original reste intact dans `public` — cassé
-- sinon rebond_deprecated, qui lit ces tables via le client par défaut
-- (schéma public). Voir apps/rebond/src/lib/supabase/refSchemaRouting.ts.
--
-- Utilisées par IndividuFiche.tsx (module Individu rapatrié, onglet
-- "Informations à valider" > "Par acte") via RefSinglePickerSmart pour les
-- champs qualite/profession_brut/statut_brut/filiation de la fiche acteur.

create table if not exists rebond.ref_qualite (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  genre text null,
  rang integer null,
  description text null,
  note text null,
  constraint ref_qualite_pkey primary key (id),
  constraint uq_ref_qualite_code unique (code)
);

create table if not exists rebond.ref_profession (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  description text null,
  note text null,
  label_m text null,
  label_f text null,
  invariable boolean not null default true,
  constraint ref_profession_pkey primary key (id),
  constraint uq_ref_profession_code unique (code)
);

create table if not exists rebond.ref_situation_matrimoniale (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  description text null,
  note text null,
  label_m text null,
  label_f text null,
  invariable boolean not null default true,
  constraint ref_situation_matrimoniale_pkey primary key (id),
  constraint uq_ref_situation_matrimoniale_code unique (code)
);

create table if not exists rebond.ref_filiation (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  description text null,
  note text null,
  constraint ref_filiation_pkey primary key (id),
  constraint uq_ref_filiation_code unique (code)
);

comment on table rebond.ref_qualite is 'Titres de civilité (monsieur, dame, sieur...) — copie de public.ref_qualite, migrée pour le module Individu.';
comment on table rebond.ref_profession is 'Professions — copie de public.ref_profession, migrée pour le module Individu.';
comment on table rebond.ref_situation_matrimoniale is 'Situations matrimoniales — copie de public.ref_situation_matrimoniale, migrée pour le module Individu.';
comment on table rebond.ref_filiation is 'Filiations (naturel/reconnu/légitime...) — copie de public.ref_filiation, migrée pour le module Individu.';

-- Données copiées depuis public.* le 2026-08-15 (74 lignes au total).

insert into rebond.ref_qualite (id, code, label, genre, rang, description, note) values
  ('4e2c0d73-948e-47a0-a0fc-58ec7f904879', 'DAME', 'dame', 'F', 10, 'forme d’adresse féminine (épouse/femme de condition)', null),
  ('ab3edc5c-45b0-4ff6-8702-5d181b8b8336', 'DEMOISELLE', 'demoiselle', 'F', 20, 'jeune femme non mariée (ancien régime / xixᵉ)', null),
  ('8402c678-f822-4dd4-997e-09bd23d432db', 'MADEMOISELLE', 'mademoiselle', 'F', 21, 'variante orthographique moderne de demoiselle', null),
  ('66cb6803-c85b-49af-b1e8-52347fde5b8b', 'MONSIEUR', 'monsieur', 'M', 10, 'forme d’adresse courante (après révolution)', null),
  ('51d5cc95-1d34-4667-ae88-03a4c8fc047b', 'SIEUR', 'sieur', 'M', 20, 'titre d’usage sous l’ancien régime / début xixᵉ', null)
on conflict (code) do nothing;

insert into rebond.ref_profession (id, code, label, description, note, label_m, label_f, invariable) values
  ('58388ab7-a9f2-496f-bc52-b1a9be045275', 'AGENT_DE_POLICE', 'agent de police', null, null, null, null, true),
  ('96f7d877-85e9-405e-8978-f807dadc19c0', 'AGRICULTEUR', 'agriculteur', null, null, null, null, true),
  ('0794e41e-0a3e-47c1-a5b3-efe1ee1a319e', 'APPRENTI_CHARPENTIER', 'apprenti charpentier', null, null, null, null, true),
  ('e23ef55c-c0f2-4c26-80e9-318cf584c3fd', 'B_CHERON', 'bûcheron', null, null, null, null, true),
  ('f42ad8a5-ba4c-463e-b3b1-d2a1a052d9e8', '_B_NISTE', 'ébéniste', null, null, null, null, true),
  ('3a686d4e-9364-4ea1-9b8f-eddeb80e3b1c', 'BOULANGER', 'boulanger/boulangère', null, null, 'boulanger', 'boulangère', false),
  ('57e6fe5e-b098-409c-8476-bc084f3789b1', 'CHARPENTIER', 'charpentier', null, null, null, null, true),
  ('ac9ef69e-62bd-4374-91bd-720c7da3b934', 'CHERCHEUR_D_OR', 'chercheur d''or', null, null, null, null, true),
  ('a5eafcf9-4320-494a-891d-013f012443bb', 'COMMERCANT', 'commerçant/commerçante', null, null, 'commerçant', 'commerçante', false),
  ('4285f33f-989e-4ac6-9a2d-5806530133a1', 'COMPTABLE', 'comptable', null, null, null, null, true),
  ('84c34069-6e76-4d53-a296-91e12e6bdd11', 'CORDONNIER', 'cordonnier', null, null, null, null, true),
  ('1fcf3dce-8b42-4d88-a0f4-e0430b9736a3', 'COUVREUR', 'couvreur', null, null, null, null, true),
  ('8660fe03-5b5a-49a8-9bf6-4f751ddecb80', 'CUISINIER', 'cuisinier', null, null, null, null, false),
  ('a36d6518-c1a3-4a95-9d00-b056c1c10420', 'CULTIVATEUR', 'cultivateur/cultivatrice', null, null, 'cultivateur', 'cultivatrice', false),
  ('fa3b71b3-cd27-4ff6-b74f-9a1462e06650', 'DOMESTIQUE', 'domestique', null, null, null, null, false),
  ('469cc7d6-0758-4b3f-b713-e0808a284297', 'FERBLANTIER', 'ferblantier', null, null, null, null, true),
  ('6272907d-fd8f-45e4-a047-5ff595480f8b', 'FERMIER', 'fermier', null, null, null, null, true),
  ('f94e9966-bde7-45fb-9b84-9f1b4efddfc6', 'FORGERON', 'forgeron', null, null, null, null, true),
  ('49414215-3319-4a15-bc28-92d05940f679', 'FOSSOYEUR', 'fossoyeur', null, null, null, null, true),
  ('ccfc7043-01f5-4de1-adf0-b2a3bf1e8471', 'GARDE_D_ARTILLERIE', 'garde d''artillerie', null, null, null, null, true),
  ('7513b493-8a80-4d7b-b5a8-bee05411c399', 'GARDE_DE_POLICE', 'garde de police', null, null, null, null, false),
  ('b7f65ed4-42fa-46b5-8b56-36dbde08be41', 'JOURNALIER', 'journalier/journalière', null, null, 'journalier', 'journalière', false),
  ('4fd3b6ce-3cf0-4d85-9ec3-71fd3c40c8dd', 'LABOUREUR', 'laboureur', null, null, null, null, true),
  ('caa6707d-7bae-4ec0-9dbc-60d36ee5a85e', 'LAMPISTE', 'lampiste', null, null, null, null, true),
  ('b942ee4c-f04a-4bb9-9dbf-c01671d7d4dc', 'LESSIVI_RE', 'lessivière', null, null, null, null, true),
  ('54ed8431-1f30-49f1-88cf-473dd9d10d4b', 'MA_ON', 'maçon', null, null, null, null, true),
  ('f1bb5dac-feb0-4201-8067-57350cd2bee8', 'MARCHAND', 'marchand/marchande', null, null, 'marchand', 'marchande', false),
  ('53f66078-f00e-46cd-89d7-3daa531f933d', 'MARIN', 'marin', null, null, null, null, true),
  ('3b9a1e73-1852-4f35-970a-acb6842fe8e3', 'MATELASSIER', 'matelassier', null, null, null, null, true),
  ('6c5be2d2-02b4-4a0e-a6c1-47910ccfb3c1', 'MA_TRE_B_NISTE', 'maître ébéniste', null, null, null, null, true),
  ('345a30f8-9d72-4ac1-baff-bd0a0605d041', 'MA_TRE_CHARPENTIER', 'maître charpentier', null, null, null, null, true),
  ('83abf86b-d69c-4aee-a1eb-e0a79073ca8e', 'MA_TRE_CORDONNIER', 'maître cordonnier', null, null, null, null, false),
  ('b848ef40-ab10-4664-b3ad-8fbc7f92d1ba', 'MA_TRE_DE_FERME', 'maître de ferme', null, null, null, null, false),
  ('78c8fadb-0aff-4ac3-8e43-4e7973747642', 'MA_TRE_MA_ON', 'maître maçon', null, null, null, null, true),
  ('f5e50f8b-2c36-4e61-9f39-7c6905b36b97', 'M_CANICIEN', 'mécanicien', null, null, null, null, true),
  ('3105fb6e-5d14-434e-baf8-bea4f5ad7c46', 'MINEUR', 'mineur', null, null, null, null, true),
  ('8fcfa28a-ef07-4038-aa17-0b218b80cdc4', 'M_NAG_RE', 'ménagère', null, null, null, null, true),
  ('ea72eb2d-723c-4de2-b209-077d45f11de4', 'ORF_VRE', 'orfèvre', null, null, null, null, true),
  ('9c04341a-a211-4c7d-97a2-122b29b882f0', 'OUVRIER', 'ouvrier', null, null, null, null, true),
  ('40f7a8cf-1544-43af-87a1-b3989736d940', 'PEINTRE', 'peintre', null, null, null, null, false),
  ('58fd4f9e-d971-420d-aa4f-6b8ade48aa10', 'PHARMACIEN', 'pharmacien', null, null, null, null, true),
  ('a8543cb2-a0c1-4b08-a923-2a2f6ff69460', 'PIQUEUR_DES_PONTS_ET_CHAUSS_ES', 'piqueur des Ponts et Chaussées', null, null, null, null, true),
  ('a3ce511a-e08f-4dbc-9509-e0fad49f1840', 'RENTIER', 'rentier', null, null, null, null, true),
  ('725dce46-dd10-4727-be36-f25879b77e90', 'SAGE_FEMME', 'sage-femme', null, null, null, null, true),
  ('fc18f1be-6f6a-4289-ac42-d07554537c44', 'SANS_PROFESSION', 'sans profession', null, null, null, null, true),
  ('f6460d91-39d7-4bd9-bdb9-1fb2150f0b3b', 'SEINEUR', 'seineur', null, null, null, null, true),
  ('ecb7b883-f2b5-4e02-8dfb-e218cc603575', 'SERVANTE', 'servante', null, null, null, null, true),
  ('d4739d05-10cd-421e-9c03-651fd15e5406', 'SOUS_BRIGADIER_DE_POLICE', 'sous brigadier de police', null, null, null, null, true),
  ('d17fc183-07d3-44f1-8a5c-6a35ad0cde7f', 'SURVEILLANT', 'surveillant', null, null, null, null, true),
  ('6c3c4cd5-b1b5-40de-b09a-48292bc7b61d', 'SURVEILLANT_DES_TRAVAUX', 'surveillant des travaux', null, null, null, null, true),
  ('f8c4f4e7-a3f6-444f-8617-f52d618d97f9', 'SURVEILLANT_T_L_PHONIQUE', 'surveillant téléphonique', null, null, null, null, true),
  ('f6f0df31-5680-47cb-ac5e-0385d42c4176', 'TAILLEUR', 'tailleur', null, null, null, null, true),
  ('352c85ed-b11c-49f3-92e5-81d354bdc738', 'TANNEUR', 'tanneur', null, null, null, null, true),
  ('7ce98428-f58d-40af-8ad5-f5cb630afaf8', 'TONNELIER', 'tonnelier', null, null, null, null, true)
on conflict (code) do nothing;

insert into rebond.ref_situation_matrimoniale (id, code, label, description, note, label_m, label_f, invariable) values
  ('d93bf81f-9fac-4531-b02e-f300ceeaf51b', 'AUTRE', 'autre', 'situation particulière non classée.', null, null, null, true),
  ('78ff7bfd-eb00-4b96-ae1f-ff3892bcd9ff', 'CELIBATAIRE', 'célibataire', 'personne non mariée.', null, null, null, true),
  ('a153a9e2-2fd2-4b28-aa1c-724e478298a5', 'CONCUBIN', 'concubin/concubine', 'personne vivant en concubinage.', null, 'concubin', 'concubine', false),
  ('63d1b832-994e-4f7c-8a47-9648dc79df66', 'DIVORCE', 'divorcé/divorcée', 'personne dont le mariage a été dissous par divorce.', null, 'divorcé', 'divorcée', false),
  ('329e9a27-45f4-4edc-9955-ad05fa98f957', 'FIANCE', 'fiancé/fiancée', 'personne fiancée mais non mariée.', null, 'fiancé', 'fiancée', false),
  ('535c4e5a-e2b4-4be5-95fa-d2a737b8d7d5', 'MARIE', 'marié/mariée', 'personne actuellement mariée.', null, 'marié', 'mariée', false),
  ('a3241d4d-525f-4097-be65-83e54b85b715', 'REMARIE', 'remarié/remariée', 'personne remariée après veuvage ou divorce.', null, 'remarié', 'remariée', false),
  ('3a106512-2112-4c39-a55e-f922da3ff517', 'SEPARE', 'séparé/séparée', 'personne séparée légalement.', null, 'séparé', 'séparée', false),
  ('eb765931-7c61-4e19-b332-6a16d6d88552', 'VEUF', 'veuf/veuve', 'personne dont le conjoint est décédé.', null, 'veuf', 'veuve', false)
on conflict (code) do nothing;

insert into rebond.ref_filiation (id, code, label, description, note) values
  ('3d3ab89c-a35e-459f-90b4-ef9ef03e43b2', 'ADOPTIF', 'adoptif', 'enfant adopté (formes variables selon période).', null),
  ('ebe0647e-f63e-4092-86e9-7a118f89eede', 'INCONNU', 'inconnu', 'filiation non précisée ou indéterminée.', null),
  ('8e505b87-adbb-4676-b3c5-95f6a82c181d', 'LEGITIME', 'légitime', 'enfant né de parents mariés.', null),
  ('1ea8736c-ed8c-4d06-b37a-767e0a81a648', 'LEGITIME_SUBSEQUENT', 'légitimé', 'enfant naturel légitimé par mariage subséquent ou décision.', null),
  ('78318c76-9c7b-4f26-a69d-8280c896031e', 'NATUREL', 'naturel', 'enfant né hors mariage, non légitimé.', null),
  ('e905ecc0-d43f-45f5-b573-0f3864dc45c6', 'PUPILLE', 'pupille', 'enfant pupille (assistance publique/autorité tutélaire).', null),
  ('54687f11-ecef-4b52-a2d1-c289ee0ab889', 'RECONNU', 'reconnu', 'enfant naturel reconnu par un parent (père, mère ou les deux).', null),
  ('58de2c14-bb1c-4f2b-bf99-896dd57a2980', 'TROUVE_EXPOSE', 'trouvé/exposé', 'enfant trouvé ou exposé ; parents inconnus.', null)
on conflict (code) do nothing;

-- RLS : même policy ouverte que le reste du schéma rebond.
do $$
declare
  t text;
begin
  foreach t in array array[
    'ref_qualite',
    'ref_profession',
    'ref_situation_matrimoniale',
    'ref_filiation'
  ]
  loop
    execute format('alter table rebond.%I enable row level security', t);

    execute format('drop policy if exists "%s_public_select" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_select" on rebond.%I for select to anon, authenticated using (true)',
      t, t
    );

    execute format('drop policy if exists "%s_public_insert" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_insert" on rebond.%I for insert to anon, authenticated with check (true)',
      t, t
    );

    execute format('drop policy if exists "%s_public_update" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_update" on rebond.%I for update to anon, authenticated using (true) with check (true)',
      t, t
    );

    execute format('drop policy if exists "%s_public_delete" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_delete" on rebond.%I for delete to anon, authenticated using (true)',
      t, t
    );

    execute format('grant all on rebond.%I to anon, authenticated, service_role', t);
  end loop;
end $$;
