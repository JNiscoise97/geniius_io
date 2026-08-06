-- Plateformes numériques concrètes (ex. Geneanet, Filae, un portail d'archives
-- départementales en ligne...). Dépend de rebond.ref_plateforme_kind.
-- Portée à l'identique depuis public.ref_plateformes, aucun écart.

create table if not exists rebond.ref_plateformes (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  site_web text null,
  plateforme_kind_ref uuid null,
  auth_required boolean not null default false,
  robots_policy_note text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_plateformes_pkey primary key (id),
  constraint ref_plateformes_code_uk unique (code),
  constraint ref_plateformes_plateforme_kind_ref_fk
    foreign key (plateforme_kind_ref) references rebond.ref_plateforme_kind (id)
    on update cascade on delete set null
);

create index if not exists idx_ref_plateformes_plateforme_kind_ref
  on rebond.ref_plateformes using btree (plateforme_kind_ref);

create index if not exists idx_ref_plateformes_auth_required
  on rebond.ref_plateformes using btree (auth_required);

comment on table rebond.ref_plateformes is
  'Plateformes numériques (portails d''archives, réseaux généalogiques...). Voir apps/rebond/supabase/schema-docs/ref_plateformes.md';
