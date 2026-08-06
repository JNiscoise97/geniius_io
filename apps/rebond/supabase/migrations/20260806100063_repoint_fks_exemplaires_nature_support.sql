-- ref_natures et ref_supports existent maintenant dans rebond. Corrige les
-- deux dernières FK cross-schema restantes de toute la migration :
-- exemplaires.nature_ref et exemplaires.support_ref pointaient vers
-- public.ref_natures/public.ref_supports, maintenant vers rebond.*.
-- Comportement ON DELETE inchangé (SET NULL).

alter table rebond.exemplaires
  drop constraint if exists exemplaires_nature_ref_fkey;
alter table rebond.exemplaires
  add constraint exemplaires_nature_ref_fkey
  foreign key (nature_ref) references rebond.ref_natures (id) on delete set null;

alter table rebond.exemplaires
  drop constraint if exists exemplaires_support_ref_fkey;
alter table rebond.exemplaires
  add constraint exemplaires_support_ref_fkey
  foreign key (support_ref) references rebond.ref_supports (id) on delete set null;
