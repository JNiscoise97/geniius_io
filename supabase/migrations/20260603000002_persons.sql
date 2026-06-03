-- ===================================================
-- TABLE PERSONS — données GEDCOM importées
-- IDs sont des strings GEDCOM (ex: "7351"), pas des UUIDs
-- ===================================================

create table persons (
  id          text primary key,       -- ID GEDCOM
  first_name  text,
  last_name   text,
  nickname    text,
  sex         text check (sex in ('M', 'F', 'U')),
  birth_date  text,                   -- brut GEDCOM ex: "4 OCT 1995"
  birth_year  integer,
  birth_place text,
  death_date  text,
  death_year  integer,
  death_place text,
  occupation  text,
  famc_ids    text[] not null default '{}',  -- familles où la personne est enfant
  fams_ids    text[] not null default '{}',  -- familles où la personne est conjoint
  raw         jsonb not null default '{}',   -- objet complet pour le détail
  created_at  timestamptz not null default now()
);

-- Index full-text search (français)
create index persons_fts_idx on persons
  using gin(
    to_tsvector('french',
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name,  '') || ' ' ||
      coalesce(nickname,   '')
    )
  );

-- Index pour filtres rapides
create index persons_birth_year_idx on persons(birth_year);
create index persons_death_year_idx on persons(death_year);

-- ===================================================
-- TABLE FAMILIES — structure parentale GEDCOM
-- ===================================================

create table families (
  id          text primary key,  -- ID GEDCOM
  husband_id  text,
  wife_id     text,
  child_ids   text[] not null default '{}',
  raw         jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index families_husband_idx on families(husband_id);
create index families_wife_idx    on families(wife_id);

-- ===================================================
-- GEDCOM PERSON ID sur les proposals
-- Complète le champ person_id uuid (pour refs futures)
-- ===================================================

alter table journal_proposals
  add column if not exists gedcom_person_id text;

-- RLS pour persons et families : lecture pour tout le monde (données publiques)
alter table persons  enable row level security;
alter table families enable row level security;

create policy "persons_public_read"
  on persons for select using (true);

create policy "persons_service_write"
  on persons for all using (auth.role() = 'service_role');

create policy "families_public_read"
  on families for select using (true);

create policy "families_service_write"
  on families for all using (auth.role() = 'service_role');
