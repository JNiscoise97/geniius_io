-- Triggers de rebond.etat_civil_transcriptions.
-- trg_touch : réutilise public.fn_touch_updated_at() telle quelle (corps
-- vérifié : new.updated_at := now(), schéma-agnostique — même chose que
-- public.fn_set_updated_at()/set_updated_at(), doublon pré-existant côté
-- public, non résolu ici).
-- trg_validated_version_belongs : utilise la copie rebond.fn_ec_transcriptions_
-- validated_version_belongs() (voir migration précédente).

create trigger trg_etat_civil_transcriptions_touch
  before update on rebond.etat_civil_transcriptions
  for each row execute function public.fn_touch_updated_at();

create trigger trg_etat_civil_transcriptions_validated_version_belongs
  before insert or update of validated_version_id on rebond.etat_civil_transcriptions
  for each row execute function rebond.fn_ec_transcriptions_validated_version_belongs();
