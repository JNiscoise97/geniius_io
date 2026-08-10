-- Actes hypothécaires individuels (une transcription, une inscription, un
-- dépôt) au sein d'un registre. type_acte_ref reste nullable et n'a de sens
-- que pour un acte appartenant à un registre de type "transcription"
-- (mutation/saisie immobilière) — décision explicite de l'utilisateur,
-- 2026-08-10 : pas de sous-type pour les dépôts/inscriptions.

create table if not exists rebond.hypotheques_actes (
  id uuid not null default gen_random_uuid(),
  registre_id uuid not null,
  type_acte_ref uuid null,
  numero_acte text not null,
  label text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint hypotheques_actes_pkey primary key (id),
  constraint hypotheques_actes_unique unique (registre_id, numero_acte),
  constraint hypotheques_actes_registre_id_fkey
    foreign key (registre_id) references rebond.hypotheques_registres (id) on delete cascade,
  constraint hypotheques_actes_type_acte_ref_fkey
    foreign key (type_acte_ref) references rebond.ref_hypotheques_type_acte (id) on delete restrict
);

create index if not exists idx_hypotheques_actes_registre_id
  on rebond.hypotheques_actes using btree (registre_id);

create index if not exists idx_hypotheques_actes_type_acte_ref
  on rebond.hypotheques_actes using btree (type_acte_ref);

comment on table rebond.hypotheques_actes is
  'Actes hypothécaires individuels (dépôt, transcription, inscription). Équivalent hypothèques de etat_civil_actes.';
