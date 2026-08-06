-- Triggers pour ce lot. fn_set_unite_titre_norm confirmée schéma-agnostique
-- (ne référence aucune table, juste new.titre -> new.titre_norm) — réutilisée
-- telle quelle. fn_set_updated_at réutilisée sous la même hypothèse que pour
-- ref_role_document/ref_series_documentaires.

create trigger trg_unites_documentaires_titre_norm
  before insert or update of titre on rebond.unites_documentaires
  for each row execute function public.fn_set_unite_titre_norm();

create trigger trg_exemplaires_updated_at
  before update on rebond.exemplaires
  for each row execute function public.fn_set_updated_at();

create trigger trg_citations_updated_at
  before update on rebond.citations
  for each row execute function public.fn_set_updated_at();

create trigger trg_corpus_updated_at
  before update on rebond.corpus
  for each row execute function public.fn_set_updated_at();
