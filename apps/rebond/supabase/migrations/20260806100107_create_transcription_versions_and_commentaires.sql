-- Historique de versions + commentaires ancrés pour l'atelier documentaire.
--
-- rebond.transcriptions reste le brouillon courant (autosave continu). Une
-- version est un instantané explicite (bouton "Enregistrer une version"),
-- numéroté automatiquement par transcription_id. Un commentaire est ancré au
-- texte via une marque Tiptap (id du commentaire embarqué dans le document,
-- pas de relocalisation par citation) — voir supabase/schema-docs pour le détail.

create table if not exists rebond.transcription_versions (
  id uuid not null default gen_random_uuid(),
  transcription_id uuid not null,
  version integer null,
  contenu jsonb not null default '{}'::jsonb,
  change_summary text null,
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  constraint transcription_versions_pkey primary key (id),
  constraint fk_transcription_versions_transcription
    foreign key (transcription_id) references rebond.transcriptions (id) on delete cascade,
  constraint uq_transcription_versions_transcription_version unique (transcription_id, version)
);

create index if not exists idx_transcription_versions_transcription
  on rebond.transcription_versions using btree (transcription_id);

create or replace function rebond.fn_transcription_versions_autonumber()
returns trigger
language plpgsql
as $$
begin
  if new.version is null then
    select coalesce(max(version), 0) + 1 into new.version
    from rebond.transcription_versions
    where transcription_id = new.transcription_id;
  end if;
  return new;
end;
$$;

create trigger trg_transcription_versions_autonumber
  before insert on rebond.transcription_versions
  for each row execute function rebond.fn_transcription_versions_autonumber();

comment on table rebond.transcription_versions is
  'Instantanés nommés de rebond.transcriptions.contenu, créés explicitement (bouton "Enregistrer une version"). Voir apps/rebond/supabase/schema-docs/transcription_versions.md';

create table if not exists rebond.transcription_commentaires (
  id uuid not null default gen_random_uuid(),
  transcription_id uuid not null,
  contenu text not null,
  statut text not null default 'ouvert',
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  resolved_at timestamp with time zone null,
  resolved_by uuid null,
  constraint transcription_commentaires_pkey primary key (id),
  constraint fk_transcription_commentaires_transcription
    foreign key (transcription_id) references rebond.transcriptions (id) on delete cascade,
  constraint chk_transcription_commentaires_statut check (statut in ('ouvert', 'resolu'))
);

create index if not exists idx_transcription_commentaires_transcription
  on rebond.transcription_commentaires using btree (transcription_id);

comment on table rebond.transcription_commentaires is
  'Commentaires ancrés à un passage précis du texte via une marque Tiptap (id du commentaire embarqué dans le contenu JSON, pas de relocalisation par citation). Voir apps/rebond/supabase/schema-docs/transcription_commentaires.md';
