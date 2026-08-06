-- Triggers d'audit (réutilisation directe de public.fn_audit_trigger, qui est
-- schéma-agnostique : elle écrit dans public.app_audit_log — le journal
-- d'audit reste volontairement centralisé, non dupliqué par schéma — et
-- catégorise via tg_table_name sans référence de table en dur).
--
-- Seules etat_civil_bureaux, etat_civil_registres et etat_civil_actes avaient
-- un trigger d'audit dans public — reproduit à l'identique.

create trigger trg_audit_etat_civil_bureaux
  after insert or delete or update on rebond.etat_civil_bureaux
  for each row execute function public.fn_audit_trigger();

create trigger trg_audit_etat_civil_registres
  after insert or delete or update on rebond.etat_civil_registres
  for each row execute function public.fn_audit_trigger();

create trigger trg_audit_etat_civil_actes
  after insert or delete or update on rebond.etat_civil_actes
  for each row execute function public.fn_audit_trigger();

-- Génération automatique du label (voir 20260806100029 pour le pourquoi de
-- la duplication rebond.set_registre_label / rebond.create_registre_label).
create trigger trg_set_registre_label
  before insert or update on rebond.etat_civil_registres
  for each row execute function rebond.set_registre_label();
