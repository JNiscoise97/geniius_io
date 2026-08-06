-- Table pivot : types d'acte contenus dans un registre (many-to-many).
-- Portée à l'identique depuis public.etat_civil_registres_type_acte, seuls
-- les index sont renommés pour cohérence (ec_ -> etat_civil_).

create table if not exists rebond.etat_civil_registres_type_acte (
  registre_id uuid not null,
  type_acte_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint etat_civil_registres_type_acte_pkey primary key (registre_id, type_acte_id),
  constraint etat_civil_registres_type_acte_registre_id_fkey
    foreign key (registre_id) references rebond.etat_civil_registres (id) on delete cascade,
  constraint etat_civil_registres_type_acte_type_acte_id_fkey
    foreign key (type_acte_id) references rebond.ref_etat_civil_type_acte (id) on delete restrict
);

create index if not exists idx_etat_civil_registres_type_acte_registre
  on rebond.etat_civil_registres_type_acte using btree (registre_id);

create index if not exists idx_etat_civil_registres_type_acte_type_acte
  on rebond.etat_civil_registres_type_acte using btree (type_acte_id);

comment on table rebond.etat_civil_registres_type_acte is
  'Pivot registre <-> types d''acte. Voir apps/rebond/supabase/schema-docs/etat_civil_registres_type_acte.md';
