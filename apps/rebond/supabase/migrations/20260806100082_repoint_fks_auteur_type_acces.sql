-- ref_auteur_institutionnel et ref_type_acces existent maintenant dans
-- rebond. Corrige les 3 FK cross-schema restantes. Comportement ON DELETE
-- inchangé.

alter table rebond.unites_documentaires
  drop constraint if exists unites_documentaires_producteur_ref_fkey;
alter table rebond.unites_documentaires
  add constraint unites_documentaires_producteur_ref_fkey
  foreign key (producteur_ref) references rebond.ref_auteur_institutionnel (id) on delete set null;

alter table rebond.etat_civil_actes
  drop constraint if exists etat_civil_actes_auteur_institutionnel_ref_fkey;
alter table rebond.etat_civil_actes
  add constraint etat_civil_actes_auteur_institutionnel_ref_fkey
  foreign key (auteur_institutionnel_ref) references rebond.ref_auteur_institutionnel (id) on delete restrict;

alter table rebond.ref_acces_numeriques
  drop constraint if exists ref_acces_numeriques_type_acces_id_fkey;
alter table rebond.ref_acces_numeriques
  add constraint ref_acces_numeriques_type_acces_id_fkey
  foreign key (type_acces_id) references rebond.ref_type_acces (id) on delete restrict;
