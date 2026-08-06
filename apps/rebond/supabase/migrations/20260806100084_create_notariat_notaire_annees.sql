-- Résumé annuel du nombre d'actes par notaire (minutier). Renommée depuis
-- public.notaire_registres : les contraintes originales étaient déjà nommées
-- "notaire_annees" (notaire_annees_pkey, notaire_annees_annee_check...),
-- incohérentes avec le nom de la table — le contenu (annee, nombre_actes,
-- complet, numero_acte_min/max) est un résumé par année, pas un registre en
-- tant qu'objet. Renommage validé avec l'utilisateur, suit le préfixe
-- notariat_ comme notariat_actes. Voir schema-docs/notariat_notaire_annees.md.
--
-- notaire_id reste cross-schema vers public.notaires (table pas encore
-- migrée).

create table if not exists rebond.notariat_notaire_annees (
  id uuid not null default gen_random_uuid(),
  notaire_id uuid not null,
  annee integer not null,
  nombre_actes integer not null,
  complet boolean not null default false,
  numero_acte_min integer null,
  numero_acte_max integer null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint notariat_notaire_annees_pkey primary key (id),
  constraint notariat_notaire_annees_notaire_id_annee_key unique (notaire_id, annee),
  constraint notariat_notaire_annees_notaire_id_fkey
    foreign key (notaire_id) references public.notaires (id) on delete cascade,
  constraint notariat_notaire_annees_annee_check check (annee > 1500 and annee < 2100),
  constraint notariat_notaire_annees_nombre_actes_check check (nombre_actes >= 0)
);

comment on table rebond.notariat_notaire_annees is
  'Résumé annuel du nombre d''actes par notaire. Voir apps/rebond/supabase/schema-docs/notariat_notaire_annees.md';
