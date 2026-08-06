-- unites_documentaires et exemplaires existent maintenant dans rebond. Les
-- tables migrées dans les lots précédents qui pointaient en cross-schema
-- vers public.ref_unites_documentaires / public.ref_exemplaires sont
-- corrigées pour pointer vers rebond.*. Comportement ON DELETE inchangé.

alter table rebond.etat_civil_registres
  drop constraint if exists etat_civil_registres_unite_documentaire_id_fkey;
alter table rebond.etat_civil_registres
  add constraint etat_civil_registres_unite_documentaire_id_fkey
  foreign key (unite_documentaire_id) references rebond.unites_documentaires (id) on delete set null;

alter table rebond.etat_civil_repertoires
  drop constraint if exists etat_civil_repertoires_unite_documentaire_id_fkey;
alter table rebond.etat_civil_repertoires
  add constraint etat_civil_repertoires_unite_documentaire_id_fkey
  foreign key (unite_documentaire_id) references rebond.unites_documentaires (id) on delete set null;

alter table rebond.notariat_actes
  drop constraint if exists notariat_actes_unite_documentaire_id_fkey;
alter table rebond.notariat_actes
  add constraint notariat_actes_unite_documentaire_id_fkey
  foreign key (unite_documentaire_id) references rebond.unites_documentaires (id) on delete set null;

alter table rebond.ref_acces_numeriques
  drop constraint if exists ref_acces_numeriques_exemplaire_id_fkey;
alter table rebond.ref_acces_numeriques
  add constraint ref_acces_numeriques_exemplaire_id_fkey
  foreign key (exemplaire_id) references rebond.exemplaires (id) on delete restrict;
