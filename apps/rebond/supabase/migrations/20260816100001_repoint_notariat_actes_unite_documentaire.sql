-- rebond.notariat_actes.unite_documentaire_id pointait encore vers
-- public.ref_unites_documentaires (ancien modèle) — jamais repointé quand
-- rebond.unites_documentaires a été créé, contrairement à notaire_annee_id
-- (voir migration 20260806100086). Les 231 lignes existantes ont toutes
-- cette colonne à NULL (jamais utilisée en pratique) : repoint sûr, aucune
-- donnée à migrer.
--
-- Déclenché par le branchement de notariat_actes au wizard de référencement
-- (ReferenceWizardPage.tsx, saveActeStep) : jusqu'ici un acte notarié créé
-- via le wizard n'avait aucune ligne notariat_actes ni citations, donc
-- jamais de statut/qualité/zones "spécifiques" qualifiables (contrairement à
-- l'état civil et aux hypothèques, qui ont chacun leur table domaine dédiée
-- déjà branchée).

alter table rebond.notariat_actes
  drop constraint if exists notariat_actes_unite_documentaire_id_fkey;

alter table rebond.notariat_actes
  add constraint notariat_actes_unite_documentaire_id_fkey
  foreign key (unite_documentaire_id) references rebond.unites_documentaires (id) on delete set null;
