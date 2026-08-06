-- Notaires. Renommée depuis public.notaires : cohérence de préfixe avec
-- notariat_actes / notariat_notaire_annees.
--
-- Écarts volontaires vs public.notaires :
--   - created_at passé de `timestamp without time zone` à `timestamp with
--     time zone`, même correction que notariat_actes.
--   - updated_at ajouté (absent de l'originale).

create table if not exists rebond.notariat_notaires (
  id uuid not null default gen_random_uuid(),
  nom text not null,
  prenom text null,
  titre text null,
  etude text null,
  lieu_exercice text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint notariat_notaires_pkey primary key (id)
);

comment on table rebond.notariat_notaires is
  'Notaires. Voir apps/rebond/supabase/schema-docs/notariat_notaires.md';
