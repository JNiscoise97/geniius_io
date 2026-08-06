-- Triggers updated_at pour ref_role_document et ref_series_documentaires.
-- Réutilisation directe de public.fn_set_updated_at() : hypothèse (non
-- vérifiée sur son code source, que je n'ai pas) qu'elle est générique comme
-- public.fn_audit_trigger — se contente de new.updated_at := now() sans
-- référence de table. Si ce n'est pas le cas, à dupliquer côté rebond comme
-- create_registre_label.

create trigger trg_ref_role_document_updated_at
  before update on rebond.ref_role_document
  for each row execute function public.fn_set_updated_at();

create trigger trg_ref_series_documentaires_updated_at
  before update on rebond.ref_series_documentaires
  for each row execute function public.fn_set_updated_at();
