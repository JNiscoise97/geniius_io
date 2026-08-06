-- Trigger updated_at, réutilisation de public.set_updated_at() (schéma-agnostique).

create trigger trg_notariat_notaire_annees_updated_at
  before update on rebond.notariat_notaire_annees
  for each row execute function public.set_updated_at();
