-- Bureaux d'état civil (mairies, services détenteurs de registres).
--
-- Écart volontaire vs public.etat_civil_bureaux (voir
-- schema-docs/etat_civil_bureaux.md) : created_at/updated_at passés en
-- not null (déjà défaut now() dans public, aucun impact réel).

create table if not exists rebond.etat_civil_bureaux (
  id uuid not null default gen_random_uuid(),
  nom text not null,
  commune text null,
  departement text null,
  region text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint etat_civil_bureaux_pkey primary key (id),
  constraint etat_civil_bureaux_unique unique (nom, commune, departement, region)
);

comment on table rebond.etat_civil_bureaux is
  'Bureaux d''état civil. Voir apps/rebond/supabase/schema-docs/etat_civil_bureaux.md';
