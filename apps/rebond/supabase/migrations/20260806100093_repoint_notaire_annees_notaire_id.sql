-- rebond.notariat_notaires existe maintenant. Repointe la FK cross-schema
-- restante depuis le lot précédent.

alter table rebond.notariat_notaire_annees
  drop constraint if exists notariat_notaire_annees_notaire_id_fkey;

alter table rebond.notariat_notaire_annees
  add constraint notariat_notaire_annees_notaire_id_fkey
  foreign key (notaire_id) references rebond.notariat_notaires (id) on delete cascade;
