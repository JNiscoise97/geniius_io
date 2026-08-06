-- Dépôts physiques ou virtuels rattachés à une institution (une salle de
-- lecture, un site de numérisation en ligne...). Dépend de rebond.ref_institutions,
-- rebond.ref_depot_type, rebond.ref_mode_acces, rebond.ref_plateformes.
--
-- Écarts volontaires vs public.ref_depots (voir schema-docs/ref_depots.md) :
--   - Contrainte unique (institution_id, nom) supprimée : elle faisait double
--     emploi avec l'index unique insensible à la casse (institution_id, lower(nom))
--     déjà présent dans public — ce dernier suffit (il bloque tout ce que
--     l'autre bloquait, plus les doublons de casse).
--   + ON DELETE RESTRICT rendu explicite sur mode_acces_ref et plateforme_ref
--     (comportement inchangé, juste documenté — cf. note sur ref_institutions).

create table if not exists rebond.ref_depots (
  id uuid not null default gen_random_uuid(),
  institution_id uuid not null,
  nom text null,
  adresse text null,
  ville text null,
  code_postal text null,
  pays text null,
  note text null,
  conditions_communication text null,
  modalites_repro text null,
  delais_communication text null,
  type_ref uuid null,
  meme_adresse_institution boolean not null default true,
  mode_acces_ref uuid null,
  plateforme_ref uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_depots_pkey primary key (id),
  constraint ref_depots_institution_id_fkey
    foreign key (institution_id) references rebond.ref_institutions (id)
    on delete restrict,
  constraint ref_depots_type_ref_fkey
    foreign key (type_ref) references rebond.ref_depot_type (id)
    on delete restrict,
  constraint ref_depots_mode_acces_ref_fkey
    foreign key (mode_acces_ref) references rebond.ref_mode_acces (id)
    on delete restrict,
  constraint ref_depots_plateforme_ref_fkey
    foreign key (plateforme_ref) references rebond.ref_plateformes (id)
    on delete restrict
);

create unique index if not exists ref_depots_institution_lower_nom_uk
  on rebond.ref_depots using btree (institution_id, lower(nom));

create index if not exists idx_ref_depots_institution_id
  on rebond.ref_depots using btree (institution_id);

comment on table rebond.ref_depots is
  'Dépôts rattachés à une institution. Voir apps/rebond/supabase/schema-docs/ref_depots.md';
