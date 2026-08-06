-- Correction ponctuelle de données : le wizard de référencement a créé le
-- 2026-08-06 un second etat_civil_registres "naissance" pour Deshaies/1875
-- (id 51c23955-1a6c-4047-8617-78fa108eeea3) en doublon de l'original du
-- 2025-06-25 (id f11a4433-f655-4862-afd9-61b45af315a0). La contrainte unique
-- etat_civil_registres_unique_combo ne l'a pas bloqué car le wizard ne
-- renseignait pas registre_statut_juridique_ref (NULL <> NULL en SQL) — champ
-- ajouté au formulaire (ReferenceWizardPage.tsx, RWStepDescribeRegistreEC)
-- pour empêcher que ça se reproduise ; ni la colonne ni la table de
-- référence ref_etat_civil_registre_statut_juridique ne changent, déjà en
-- place, donc pas de script SQL supplémentaire nécessaire pour ce point.
--
-- Ne touche pas à la fiche document (unites_documentaires
-- 73232930-6274-4325-98b2-c9d81863caf7, "Registre des actes de naissances de
-- la commune de Deshaies de 1875") ni à sa table déjà rattachée dessus —
-- seul le lien vers le bon enregistrement etat_civil_registres est corrigé.

-- 1) Repointer l'acte déjà créé aujourd'hui vers le registre d'origine.
update rebond.etat_civil_actes
set registre_id = 'f11a4433-f655-4862-afd9-61b45af315a0'
where id = '0c5d364e-f67f-4f0e-9034-ecf19ddd3dc9';

-- 2) Lier la fiche document (créée aujourd'hui) au registre d'origine
--    (jamais lié à aucune fiche avant ce lot de correctifs).
update rebond.etat_civil_registres
set unite_documentaire_id = '73232930-6274-4325-98b2-c9d81863caf7'
where id = 'f11a4433-f655-4862-afd9-61b45af315a0';

-- 3) Nettoyer puis supprimer le registre en doublon (le pivot type_acte
--    identique existe déjà sur l'original, rien à migrer).
delete from rebond.etat_civil_registres_type_acte
where registre_id = '51c23955-1a6c-4047-8617-78fa108eeea3';

delete from rebond.etat_civil_registres
where id = '51c23955-1a6c-4047-8617-78fa108eeea3';
