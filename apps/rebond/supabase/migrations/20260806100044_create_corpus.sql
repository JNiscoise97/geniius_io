-- Corpus — collections nommées d'unités documentaires (généalogique,
-- patrimonial, territorial, communauté). Portée à l'identique depuis
-- public.corpus, aucun écart de colonnes.
--
-- created_by pointe vers auth.users, le schéma interne fixe de Supabase Auth
-- — jamais migré, référencé tel quel dans les deux schémas.

create table if not exists rebond.corpus (
  id uuid not null default gen_random_uuid(),
  nom text not null,
  description text null,
  type text not null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint corpus_pkey primary key (id),
  constraint corpus_created_by_fkey foreign key (created_by) references auth.users (id) on delete set null,
  constraint corpus_type_chk
    check (type = any (array['genealogique', 'patrimonial', 'territorial', 'communaute']))
);

comment on table rebond.corpus is
  'Corpus (collections nommées d''unités documentaires). Voir apps/rebond/supabase/schema-docs/corpus.md';
