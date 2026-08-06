-- Copie les données existantes de public.corpus_unites vers rebond.corpus_unites.
-- Additive, réversible. Idempotent (ON CONFLICT DO NOTHING sur la PK composite).
-- Les vues v_sources/v_exemplaires_pick n'ont pas de données propres à migrer
-- (calculées à la volée depuis les tables déjà migrées).

insert into rebond.corpus_unites (corpus_id, unite_documentaire_id, ajout_at)
select corpus_id, unite_documentaire_id, ajout_at
from public.corpus_unites
on conflict (corpus_id, unite_documentaire_id) do nothing;

-- Vérification manuelle après exécution :
-- select (select count(*) from public.corpus_unites) as public_count,
--        (select count(*) from rebond.corpus_unites) as rebond_count;
