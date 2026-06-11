-- Migration: privilégier les tables de référence (_ref) pour les signatures transcrites
--
-- Contexte : ec_transcription_signatures stockait signature_kind / confidence / legibility
-- en texte libre (enums hardcodés côté UI), alors que les autres parties de la
-- transcription (ec_transcription_marginal_mentions) utilisent des colonnes *_ref
-- pointant vers des tables ref_* éditables (dictionnaires partagés).
--
-- Cette migration :
--  1. crée la table ref_signature_kind (type de marque : signature, paraphe, ...)
--  2. ajoute signature_kind_ref -> ref_signature_kind et confidence_ref -> ref_confiance
--  3. réutilise la colonne handwriting_legibility_ref existante (-> ref_handwriting_legibility)
--     pour la lisibilité, au lieu d'une colonne "legibility" dédiée
--  4. tente une reprise de données best-effort depuis les anciennes colonnes texte
--
-- Les anciennes colonnes signature_kind / confidence / legibility sont conservées
-- (non supprimées) pour ne pas perdre d'historique, mais ne sont plus utilisées par l'UI.

-- 1. Table de référence "type de marque"
create table if not exists public.ref_signature_kind (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  position integer null,
  constraint ref_signature_kind_pkey primary key (id),
  constraint ref_signature_kind_code_key unique (code)
);

insert into public.ref_signature_kind (code, label, position)
values
  ('signature', 'Signature', 1),
  ('paraphe', 'Paraphe', 2),
  ('initiales', 'Initiales', 3),
  ('marque', 'Marque / croix / X', 4),
  ('tampon', 'Tampon / cachet', 5),
  ('autre', 'Autre', 6)
on conflict (code) do nothing;

-- 2. Nouvelles colonnes _ref sur ec_transcription_signatures
alter table public.ec_transcription_signatures
  add column if not exists signature_kind_ref uuid null,
  add column if not exists confidence_ref uuid null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ec_transcription_signatures_signature_kind_ref_fkey'
  ) then
    alter table public.ec_transcription_signatures
      add constraint ec_transcription_signatures_signature_kind_ref_fkey
        foreign key (signature_kind_ref) references public.ref_signature_kind (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ec_transcription_signatures_confidence_ref_fkey'
  ) then
    alter table public.ec_transcription_signatures
      add constraint ec_transcription_signatures_confidence_ref_fkey
        foreign key (confidence_ref) references public.ref_confiance (id) on delete set null;
  end if;
end $$;

create index if not exists idx_ec_transcription_signatures_signature_kind_ref
  on public.ec_transcription_signatures using btree (signature_kind_ref);

create index if not exists idx_ec_transcription_signatures_confidence_ref
  on public.ec_transcription_signatures using btree (confidence_ref);

-- 3. Reprise de données best-effort (ne fait rien si les codes ne correspondent pas)
update public.ec_transcription_signatures s
set signature_kind_ref = k.id
from public.ref_signature_kind k
where s.signature_kind_ref is null
  and s.signature_kind is not null
  and k.code = s.signature_kind;

update public.ec_transcription_signatures s
set confidence_ref = c.id
from public.ref_confiance c
where s.confidence_ref is null
  and s.confidence is not null
  and c.code = s.confidence;

update public.ec_transcription_signatures s
set handwriting_legibility_ref = l.id
from public.ref_handwriting_legibility l
where s.handwriting_legibility_ref is null
  and s.legibility is not null
  and l.code = s.legibility;

comment on column public.ec_transcription_signatures.signature_kind is 'Déprécié : remplacé par signature_kind_ref (ref_signature_kind)';
comment on column public.ec_transcription_signatures.confidence is 'Déprécié : remplacé par confidence_ref (ref_confiance)';
comment on column public.ec_transcription_signatures.legibility is 'Déprécié : remplacé par handwriting_legibility_ref (ref_handwriting_legibility)';
