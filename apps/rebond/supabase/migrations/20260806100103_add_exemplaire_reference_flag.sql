-- Marque un exemplaire comme "de référence" parmi tous ceux d'un même
-- document — un document peut avoir plusieurs exemplaires (dépôts/scans
-- différents) et l'utilisateur doit pouvoir désigner lequel fait autorité.
-- Index unique partiel : au plus un exemplaire de référence par UD.

alter table rebond.exemplaires
  add column if not exists est_reference boolean not null default false;

create unique index if not exists idx_exemplaires_unique_reference_per_ud
  on rebond.exemplaires (unite_documentaire_id)
  where est_reference;
