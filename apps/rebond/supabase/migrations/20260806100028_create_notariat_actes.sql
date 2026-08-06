-- Actes notariés (ventes, successions, contrats de mariage...). Renommée
-- depuis public.actes : le nom générique "actes" entrait en collision avec
-- etat_civil_actes alors qu'il s'agit d'un domaine à part (notariat), sans
-- rapport avec l'état civil — voir schema-docs/notariat_actes.md.
--
-- Écarts volontaires vs public.actes :
--   - created_at passé de `timestamp without time zone` à `timestamp with time
--     zone` : seule table de toute la migration à utiliser le type sans fuseau,
--     incohérence corrigée pour matcher toutes les autres tables.
--   - updated_at ajouté (absent de l'originale, alors que présent partout
--     ailleurs).
--
-- notaire_registre_id et unite_documentaire_id restent cross-schema vers
-- public.* (tables pas encore migrées).

create table if not exists rebond.notariat_actes (
  id uuid not null default gen_random_uuid(),
  type_operation text[] null,
  label text not null,
  origine_propriete text null,
  clauses text[] null,
  statut text null,
  tags text[] null,
  origine_acte jsonb null,
  numero_acte text null,
  notaire_registre_id uuid null,
  source text null,
  unite_documentaire_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint notariat_actes_pkey primary key (id),
  constraint notariat_actes_notaire_registre_id_fkey
    foreign key (notaire_registre_id) references public.notaire_registres (id) on delete set null,
  constraint notariat_actes_unite_documentaire_id_fkey
    foreign key (unite_documentaire_id) references public.ref_unites_documentaires (id) on delete set null
);

create index if not exists idx_notariat_actes_ud_id
  on rebond.notariat_actes using btree (unite_documentaire_id);

comment on table rebond.notariat_actes is
  'Actes notariés. Voir apps/rebond/supabase/schema-docs/notariat_actes.md';
