-- ===================================================
-- JOURNAL Sprint 1 v3 — Mise à jour du schéma
-- Appliquer APRÈS 20260603000000_journal.sql
-- ===================================================

-- =====================
-- journal_sessions
-- =====================

alter table journal_sessions
  add column if not exists interviewer_person_id uuid,
  add column if not exists interviewer_is_self   boolean not null default false,
  add column if not exists subject_raw           text,
  add column if not exists theme_type            text,
  -- 'person' | 'place' | 'event' | 'legal' | 'family' | 'free'
  add column if not exists theme_value           text,
  add column if not exists intent                text,
  -- 'confirm' | 'enrich' | 'discover' | 'free'
  add column if not exists known_facts           jsonb;

-- Renommer 'mode' pour aligner avec v3 (déjà présent, vérif valeurs)
-- 'direct' | 'import' | 'import_multi'
-- On garde la colonne, on met à jour le check
alter table journal_sessions
  drop constraint if exists journal_sessions_mode_check;
alter table journal_sessions
  add constraint journal_sessions_mode_check
    check (mode in ('direct', 'import', 'import_multi', 'thematic', 'auto'));
-- Note : 'thematic' et 'auto' conservés pour compatibilité avec les sessions déjà créées

alter table journal_sessions
  drop constraint if exists journal_sessions_intent_check;
alter table journal_sessions
  add constraint journal_sessions_intent_check
    check (intent in ('confirm', 'enrich', 'discover', 'free') or intent is null);

-- =====================
-- journal_proposals
-- =====================

alter table journal_proposals
  add column if not exists confidence text,
  -- 'certain' | 'probable' | 'uncertain'
  add column if not exists birth_place text; -- prévu dans les field values

alter table journal_proposals
  drop constraint if exists journal_proposals_confidence_check;
alter table journal_proposals
  add constraint journal_proposals_confidence_check
    check (confidence in ('certain', 'probable', 'uncertain') or confidence is null);

-- Étendre les valeurs de field
alter table journal_proposals
  drop constraint if exists journal_proposals_field_check;
alter table journal_proposals
  add constraint journal_proposals_field_check
    check (field in (
      'identity', 'birth_date', 'birth_place', 'death_date',
      'profession', 'location', 'relation', 'note', 'event', 'new_person'
    ));

alter table journal_proposals
  drop constraint if exists journal_proposals_status_check;
alter table journal_proposals
  add constraint journal_proposals_status_check
    check (status in ('pending', 'accepted', 'rejected', 'modified'));

-- =====================
-- journal_threads_open
-- =====================

alter table journal_threads_open
  add column if not exists priority text not null default 'normal';

alter table journal_threads_open
  drop constraint if exists journal_threads_open_priority_check;
alter table journal_threads_open
  add constraint journal_threads_open_priority_check
    check (priority in ('high', 'normal', 'low'));
