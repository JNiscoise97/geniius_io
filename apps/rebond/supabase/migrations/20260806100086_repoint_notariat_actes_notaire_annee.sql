-- rebond.notariat_notaire_annees existe maintenant. Renomme la colonne
-- notaire_registre_id → notaire_annee_id sur rebond.notariat_actes (suit le
-- nouveau nom de la table cible) et repointe la FK en interne à rebond.

alter table rebond.notariat_actes
  rename column notaire_registre_id to notaire_annee_id;

alter table rebond.notariat_actes
  drop constraint if exists notariat_actes_notaire_registre_id_fkey;

alter table rebond.notariat_actes
  add constraint notariat_actes_notaire_annee_id_fkey
  foreign key (notaire_annee_id) references rebond.notariat_notaire_annees (id) on delete set null;
