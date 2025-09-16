create table public.etat_civil_registres (
  id uuid primary key default gen_random_uuid(),

  -- Lien avec le bureau d'état civil
  bureau_id uuid not null references etat_civil_bureaux(id) on delete cascade,

  -- Année du registre
  annee integer not null,

  -- Mode d'organisation du registre
  mode_registre text not null check (mode_registre in ('par_type', 'chronologique_mixte')),

  -- Type d’acte (nullable si mode_registre = 'chronologique_mixte')
  type_acte text null,

  -- Statut juridique du registre
  statut_juridique text check (statut_juridique in ('esclave', 'nouveau_libre')),

  -- Ordre de numérotation des actes
  ordre_numerotation text null check (ordre_numerotation in ('par_type', 'globale')),

  -- Métadonnées archivistiques
  cote text null,
  source text null,
  nombre_actes_estime integer null,
  numero_acte_min integer null,
  numero_acte_max integer null,
  complet boolean null,
  lacunes_connues text null,

  -- Transcription
  transcription_terminee boolean null,
  transcription_progression integer null,
  transcription_par text null,
  transcription_commentaire text null,

  -- Consultation
  consultable_en_ligne boolean null,
  lien_consultation text null,
  notes_archivistiques text null,

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Contrainte d’unicité logique
  unique (bureau_id, annee, type_acte, mode_registre, statut_juridique)
);
