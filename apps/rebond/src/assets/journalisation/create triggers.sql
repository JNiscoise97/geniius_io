-- Actes
drop trigger if exists trg_audit_etat_civil_actes on public.etat_civil_actes;
create trigger trg_audit_etat_civil_actes
after insert or update or delete on public.etat_civil_actes
for each row execute function public.fn_audit_trigger();

-- Registres
drop trigger if exists trg_audit_etat_civil_registres on public.etat_civil_registres;
create trigger trg_audit_etat_civil_registres
after insert or update or delete on public.etat_civil_registres
for each row execute function public.fn_audit_trigger();

-- Bureaux
drop trigger if exists trg_audit_etat_civil_bureaux on public.etat_civil_bureaux;
create trigger trg_audit_etat_civil_bureaux
after insert or update or delete on public.etat_civil_bureaux
for each row execute function public.fn_audit_trigger();

-- Acteurs
drop trigger if exists trg_audit_acteurs on public.transcription_entites_acteurs;
create trigger trg_audit_acteurs
after insert or update or delete on public.transcription_entites_acteurs
for each row execute function public.fn_audit_trigger();
