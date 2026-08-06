-- Les 8 référentiels existent maintenant dans rebond. Corrige les 8 FK
-- cross-schema restantes sur etat_civil_registres (pointaient vers
-- public.ref_registre_*). Comportement ON DELETE inchangé (SET NULL partout).

alter table rebond.etat_civil_registres drop constraint if exists etat_civil_registres_registre_fonction_fk;
alter table rebond.etat_civil_registres add constraint etat_civil_registres_registre_fonction_fk
  foreign key (registre_fonction_ref) references rebond.ref_etat_civil_registre_fonction (id)
  on update cascade on delete set null;

alter table rebond.etat_civil_registres drop constraint if exists etat_civil_registres_registre_mode_fk;
alter table rebond.etat_civil_registres add constraint etat_civil_registres_registre_mode_fk
  foreign key (registre_mode_ref) references rebond.ref_etat_civil_registre_mode (id)
  on update cascade on delete set null;

alter table rebond.etat_civil_registres drop constraint if exists etat_civil_registres_registre_norme_fk;
alter table rebond.etat_civil_registres add constraint etat_civil_registres_registre_norme_fk
  foreign key (registre_norme_ref) references rebond.ref_etat_civil_registre_norme (id)
  on update cascade on delete set null;

alter table rebond.etat_civil_registres drop constraint if exists etat_civil_registres_registre_ordre_numerotation_fk;
alter table rebond.etat_civil_registres add constraint etat_civil_registres_registre_ordre_numerotation_fk
  foreign key (registre_ordre_numerotation_ref) references rebond.ref_etat_civil_registre_ordre_numerotation (id)
  on update cascade on delete set null;

alter table rebond.etat_civil_registres drop constraint if exists etat_civil_registres_registre_pagination_fk;
alter table rebond.etat_civil_registres add constraint etat_civil_registres_registre_pagination_fk
  foreign key (registre_pagination_ref) references rebond.ref_etat_civil_registre_pagination (id)
  on update cascade on delete set null;

alter table rebond.etat_civil_registres drop constraint if exists etat_civil_registres_registre_regime_fiscal_support_fk;
alter table rebond.etat_civil_registres add constraint etat_civil_registres_registre_regime_fiscal_support_fk
  foreign key (registre_regime_fiscal_support_ref) references rebond.ref_etat_civil_registre_regime_fiscal_support (id)
  on update cascade on delete set null;

alter table rebond.etat_civil_registres drop constraint if exists etat_civil_registres_registre_statut_juridique_fk;
alter table rebond.etat_civil_registres add constraint etat_civil_registres_registre_statut_juridique_fk
  foreign key (registre_statut_juridique_ref) references rebond.ref_etat_civil_registre_statut_juridique (id)
  on update cascade on delete set null;

alter table rebond.etat_civil_registres drop constraint if exists etat_civil_registres_registre_support_fk;
alter table rebond.etat_civil_registres add constraint etat_civil_registres_registre_support_fk
  foreign key (registre_support_ref) references rebond.ref_etat_civil_registre_support (id)
  on update cascade on delete set null;
