-- Accès numériques (URL) à un exemplaire, éventuellement via une plateforme
-- identifiée. Portée à l'identique depuis public.ref_acces_numeriques, aucun
-- écart de colonnes.
--
-- plateforme_id pointe vers rebond.ref_plateformes (déjà migrée, même
-- schéma). exemplaire_id et type_acces_id restent cross-schema vers
-- public.* (tables pas encore migrées).

create table if not exists rebond.ref_acces_numeriques (
  id uuid not null default gen_random_uuid(),
  plateforme_id uuid null,
  url_base text not null,
  schema_deep_link text null,
  restrictions text null,
  last_checked_at timestamp with time zone null,
  note text null,
  exemplaire_id uuid not null,
  type_acces_id uuid not null,
  permalink text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_acces_numeriques_pkey primary key (id),
  constraint ref_acces_numeriques_plateforme_id_fkey
    foreign key (plateforme_id) references rebond.ref_plateformes (id) on delete set null,
  -- Cross-schema, tables pas encore migrées :
  constraint ref_acces_numeriques_exemplaire_id_fkey
    foreign key (exemplaire_id) references public.ref_exemplaires (id) on delete restrict,
  constraint ref_acces_numeriques_type_acces_id_fkey
    foreign key (type_acces_id) references public.ref_type_acces (id) on delete restrict
);

create index if not exists idx_ref_acces_numeriques_exemplaire_id
  on rebond.ref_acces_numeriques using btree (exemplaire_id);

create index if not exists idx_ref_acces_numeriques_permalink
  on rebond.ref_acces_numeriques using btree (permalink);

create unique index if not exists ux_ref_acces_numeriques_exemplaire_plateforme_type
  on rebond.ref_acces_numeriques using btree (exemplaire_id, plateforme_id, type_acces_id);

comment on table rebond.ref_acces_numeriques is
  'Accès numériques à un exemplaire. Voir apps/rebond/supabase/schema-docs/ref_acces_numeriques.md';
