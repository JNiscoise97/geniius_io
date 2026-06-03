-- ===================================================
-- JOURNAL Sprint 1 — Geniius.io
-- ===================================================

-- pgvector pour recherche sémantique inter-sessions
create extension if not exists vector;

-- ===================================================
-- TABLES
-- ===================================================

create table journal_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users,
  subject_person_id uuid,
  interviewer_name  text,
  theme             text,
  mode              text not null default 'thematic'
                      check (mode in ('thematic', 'import', 'auto')),
  status            text not null default 'active'
                      check (status in ('active', 'completed', 'paused')),
  tree_context      jsonb not null default '{}'::jsonb,
  summary           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on column journal_sessions.tree_context is
  'Sous-arbre Tree injecté au démarrage : { persons: [...], relations: [...] }';

create table journal_messages (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references journal_sessions(id) on delete cascade,
  role                text not null check (role in ('user', 'agent')),
  content             text not null,
  audio_url           text,
  entities_extracted  jsonb default '{}'::jsonb,
  embedding           vector(1536),
  created_at          timestamptz not null default now()
);

create table journal_proposals (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references journal_sessions(id) on delete cascade,
  person_id       uuid,
  field           text not null,
  current_value   jsonb,
  proposed_value  jsonb not null,
  source          text,
  status          text not null default 'pending'
                    check (status in ('pending', 'accepted', 'rejected')),
  created_at      timestamptz not null default now()
);

comment on column journal_proposals.field is
  'Valeurs possibles : identity | birth_date | death_date | profession | location | relation | note | new_person';

create table journal_threads_open (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references journal_sessions(id) on delete cascade,
  note        text not null,
  person_id   uuid,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table person_identities (
  id              uuid primary key default gen_random_uuid(),
  person_id       uuid not null,
  label           text not null,
  source          text,
  period          text,
  social_context  text,
  created_at      timestamptz not null default now()
);

-- ===================================================
-- INDEX
-- ===================================================

create index on journal_messages(session_id, created_at);
create index on journal_proposals(session_id, status);
create index on journal_threads_open(session_id, resolved);
create index on person_identities(person_id);

-- Index vectoriel pour la recherche sémantique (HNSW)
create index on journal_messages
  using hnsw (embedding vector_cosine_ops);

-- ===================================================
-- TRIGGER updated_at
-- ===================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger journal_sessions_updated_at
  before update on journal_sessions
  for each row execute function update_updated_at();

-- ===================================================
-- RLS
-- ===================================================

alter table journal_sessions      enable row level security;
alter table journal_messages      enable row level security;
alter table journal_proposals     enable row level security;
alter table journal_threads_open  enable row level security;
alter table person_identities     enable row level security;

-- Sessions : l'utilisateur voit uniquement les siennes
create policy "users_own_sessions"
  on journal_sessions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Messages : via la session parente
create policy "users_own_messages"
  on journal_messages for all
  using (
    exists (
      select 1 from journal_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- Propositions : via la session parente
create policy "users_own_proposals"
  on journal_proposals for all
  using (
    exists (
      select 1 from journal_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- Fils ouverts : via la session parente
create policy "users_own_threads"
  on journal_threads_open for all
  using (
    exists (
      select 1 from journal_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- Identités : lecture/écriture pour les utilisateurs authentifiés
create policy "authenticated_identities"
  on person_identities for all
  using  (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
