-- Migration: privilégier les tables de référence (_ref) pour la "Qualité de la transcription"
--
-- Contexte : ec_transcriptions stocke source_lecture_kind / langue_vue / language_confidence /
-- handwriting_style / handwriting_legibility / completeness / reserve_level en texte/enum,
-- alors que l'UI (QualiteCard) utilise déjà des sélecteurs de dictionnaire (_ref).
--
-- Cette migration :
--  1. crée les tables ref_support_lecture, ref_completude_transcription, ref_niveau_reserve
--     (noms distincts des enums existants ref_source_lecture_kind / ref_transcription_completeness /
--      ref_reserve_level déjà utilisés comme types Postgres pour les colonnes legacy)
--  2. ajoute les colonnes _ref correspondantes sur ec_transcriptions
--     (langue_ref -> ref_langues, language_confidence_ref -> ref_confiance, réutilisation
--      de ref_handwriting_style / ref_handwriting_legibility déjà existantes)
--  3. active la lecture publique (RLS) sur les nouvelles tables ref_*
--  4. reprise de données best-effort depuis les anciennes colonnes texte/enum
--
-- Les anciennes colonnes ne sont pas supprimées (conservées pour historique / non utilisées par l'UI).

-- 1. Tables de référence

create table if not exists public.ref_support_lecture (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  position integer null,
  constraint ref_support_lecture_pkey primary key (id),
  constraint ref_support_lecture_code_key unique (code)
);

insert into public.ref_support_lecture (code, label, position)
values
  ('IMAGE_ORIGINALE', 'Image originale', 1),
  ('MICROFILM', 'Microfilm', 2),
  ('TRANSCRIPTION_SECONDAIRE', 'Transcription secondaire', 3),
  ('AUTRE', 'Autre', 4)
on conflict (code) do nothing;

create table if not exists public.ref_completude_transcription (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  position integer null,
  constraint ref_completude_transcription_pkey primary key (id),
  constraint ref_completude_transcription_code_key unique (code)
);

insert into public.ref_completude_transcription (code, label, position)
values
  ('COMPLETE', 'Complète', 1),
  ('PARTIAL', 'Partielle', 2),
  ('FRAGMENT', 'Fragment', 3)
on conflict (code) do nothing;

create table if not exists public.ref_niveau_reserve (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  position integer null,
  constraint ref_niveau_reserve_pkey primary key (id),
  constraint ref_niveau_reserve_code_key unique (code)
);

insert into public.ref_niveau_reserve (code, label, position)
values
  ('NONE', 'Aucune', 1),
  ('MINOR', 'Mineure', 2),
  ('MAJOR', 'Majeure', 3)
on conflict (code) do nothing;

-- 2. RLS lecture publique sur les nouvelles tables

alter table public.ref_support_lecture enable row level security;
alter table public.ref_completude_transcription enable row level security;
alter table public.ref_niveau_reserve enable row level security;

drop policy if exists "ref_support_lecture_public_read" on public.ref_support_lecture;
create policy "ref_support_lecture_public_read"
on public.ref_support_lecture
for select
to anon, authenticated
using (true);

drop policy if exists "ref_completude_transcription_public_read" on public.ref_completude_transcription;
create policy "ref_completude_transcription_public_read"
on public.ref_completude_transcription
for select
to anon, authenticated
using (true);

drop policy if exists "ref_niveau_reserve_public_read" on public.ref_niveau_reserve;
create policy "ref_niveau_reserve_public_read"
on public.ref_niveau_reserve
for select
to anon, authenticated
using (true);

-- 3. Nouvelles colonnes _ref sur ec_transcriptions

alter table public.ec_transcriptions
  add column if not exists source_lecture_kind_ref uuid null,
  add column if not exists langue_ref uuid null,
  add column if not exists language_confidence_ref uuid null,
  add column if not exists handwriting_style_ref uuid null,
  add column if not exists handwriting_legibility_ref uuid null,
  add column if not exists completeness_ref uuid null,
  add column if not exists reserve_level_ref uuid null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ec_transcriptions_source_lecture_kind_ref_fkey'
  ) then
    alter table public.ec_transcriptions
      add constraint ec_transcriptions_source_lecture_kind_ref_fkey
        foreign key (source_lecture_kind_ref) references public.ref_support_lecture (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ec_transcriptions_langue_ref_fkey'
  ) then
    alter table public.ec_transcriptions
      add constraint ec_transcriptions_langue_ref_fkey
        foreign key (langue_ref) references public.ref_langues (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ec_transcriptions_language_confidence_ref_fkey'
  ) then
    alter table public.ec_transcriptions
      add constraint ec_transcriptions_language_confidence_ref_fkey
        foreign key (language_confidence_ref) references public.ref_confiance (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ec_transcriptions_handwriting_style_ref_fkey'
  ) then
    alter table public.ec_transcriptions
      add constraint ec_transcriptions_handwriting_style_ref_fkey
        foreign key (handwriting_style_ref) references public.ref_handwriting_style (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ec_transcriptions_handwriting_legibility_ref_fkey'
  ) then
    alter table public.ec_transcriptions
      add constraint ec_transcriptions_handwriting_legibility_ref_fkey
        foreign key (handwriting_legibility_ref) references public.ref_handwriting_legibility (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ec_transcriptions_completeness_ref_fkey'
  ) then
    alter table public.ec_transcriptions
      add constraint ec_transcriptions_completeness_ref_fkey
        foreign key (completeness_ref) references public.ref_completude_transcription (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ec_transcriptions_reserve_level_ref_fkey'
  ) then
    alter table public.ec_transcriptions
      add constraint ec_transcriptions_reserve_level_ref_fkey
        foreign key (reserve_level_ref) references public.ref_niveau_reserve (id) on delete set null;
  end if;
end $$;

create index if not exists idx_ec_transcriptions_source_lecture_kind_ref on public.ec_transcriptions using btree (source_lecture_kind_ref);
create index if not exists idx_ec_transcriptions_langue_ref on public.ec_transcriptions using btree (langue_ref);
create index if not exists idx_ec_transcriptions_language_confidence_ref on public.ec_transcriptions using btree (language_confidence_ref);
create index if not exists idx_ec_transcriptions_handwriting_style_ref on public.ec_transcriptions using btree (handwriting_style_ref);
create index if not exists idx_ec_transcriptions_handwriting_legibility_ref on public.ec_transcriptions using btree (handwriting_legibility_ref);
create index if not exists idx_ec_transcriptions_completeness_ref on public.ec_transcriptions using btree (completeness_ref);
create index if not exists idx_ec_transcriptions_reserve_level_ref on public.ec_transcriptions using btree (reserve_level_ref);

-- 4. Reprise de données best-effort depuis les anciennes colonnes texte/enum

update public.ec_transcriptions t
set source_lecture_kind_ref = k.id
from public.ref_support_lecture k
where t.source_lecture_kind_ref is null
  and t.source_lecture_kind is not null
  and upper(k.code) = upper(t.source_lecture_kind::text);

update public.ec_transcriptions t
set langue_ref = l.id
from public.ref_langues l
where t.langue_ref is null
  and t.langue_vue is not null
  and (upper(l.code) = upper(t.langue_vue) or lower(l.label) = lower(t.langue_vue));

update public.ec_transcriptions t
set language_confidence_ref = c.id
from public.ref_confiance c
where t.language_confidence_ref is null
  and t.language_confidence is not null
  and upper(c.code) = upper(t.language_confidence::text);

update public.ec_transcriptions t
set handwriting_style_ref = h.id
from public.ref_handwriting_style h
where t.handwriting_style_ref is null
  and t.handwriting_style is not null
  and upper(h.code) = upper(t.handwriting_style::text);

update public.ec_transcriptions t
set handwriting_legibility_ref = l.id
from public.ref_handwriting_legibility l
where t.handwriting_legibility_ref is null
  and t.handwriting_legibility is not null
  and upper(l.code) = upper(t.handwriting_legibility::text);

update public.ec_transcriptions t
set completeness_ref = c.id
from public.ref_completude_transcription c
where t.completeness_ref is null
  and t.completeness is not null
  and upper(c.code) = upper(t.completeness::text);

update public.ec_transcriptions t
set reserve_level_ref = r.id
from public.ref_niveau_reserve r
where t.reserve_level_ref is null
  and t.reserve_level is not null
  and upper(r.code) = upper(t.reserve_level::text);

comment on column public.ec_transcriptions.source_lecture_kind is 'Déprécié : remplacé par source_lecture_kind_ref (ref_support_lecture)';
comment on column public.ec_transcriptions.langue_vue is 'Déprécié : remplacé par langue_ref (ref_langues)';
comment on column public.ec_transcriptions.language_confidence is 'Déprécié : remplacé par language_confidence_ref (ref_confiance)';
comment on column public.ec_transcriptions.handwriting_style is 'Déprécié : remplacé par handwriting_style_ref (ref_handwriting_style)';
comment on column public.ec_transcriptions.handwriting_legibility is 'Déprécié : remplacé par handwriting_legibility_ref (ref_handwriting_legibility)';
comment on column public.ec_transcriptions.completeness is 'Déprécié : remplacé par completeness_ref (ref_completude_transcription)';
comment on column public.ec_transcriptions.reserve_level is 'Déprécié : remplacé par reserve_level_ref (ref_niveau_reserve)';
