-- Refonte du modèle brouillon/version de l'atelier documentaire (2026-08-08) :
-- une version doit désormais figer aussi les zones spécifiques et la qualité
-- de transcription, pas seulement le texte (contenu). Ces deux tables/champs
-- restent le "brouillon" vivant (mutable, autosave comme aujourd'hui) —
-- transcription_versions en garde un instantané dénormalisé, capturé au
-- moment du clic sur "Enregistrer une version", pour permettre un calcul de
-- "brouillon modifié depuis la dernière version" (isDirty) côté frontend et
-- une restauration complète (texte + zones + qualité) à partir d'une version.
--
-- Les commentaires ancrés sont volontairement exclus de ce mécanisme : ce
-- sont un fil de discussion/révision continu, pas un fait documentaire figé
-- par version (décision explicite, cf. mémoire agent project_atelier_documentaire).

alter table rebond.transcription_versions
  add column if not exists zones_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists qualite_snapshot jsonb not null default '{}'::jsonb;

comment on column rebond.transcription_versions.zones_snapshot is
  'Instantané des zones spécifiques (transcription_zones) au moment de l''enregistrement de cette version. Tableau de {zoneTypeId, contenu}.';
comment on column rebond.transcription_versions.qualite_snapshot is
  'Instantané des champs de qualité de transcription (mêmes clés que rebond.transcriptions : source_lecture_kind, langue_ref...) au moment de l''enregistrement de cette version.';
