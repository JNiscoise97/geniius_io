-- Supprime 4 fiches "Naissance de Némorin Blaise Gustave" orphelines,
-- créées entre 16h49 et 17h46 le 2026-08-06 lors de tentatives abandonnées
-- dans l'assistant de référencement (session interrompue avant "Leave
-- wizard", donc cleanupUnfinished() jamais déclenché). Aucune n'est reliée
-- (parent_ud_id/role_document_ref null, statut_document toujours
-- 'en_attente') — la bonne fiche, complète et reliée au registre
-- (f994909c-cda0-4e7b-96da-85820a1c4320), n'est pas concernée.
-- Ordre de suppression identique à cleanupUnfinished() côté client :
-- ref_acces_numeriques → citations → exemplaires → unites_documentaires.

do $$
declare
  dup_ids uuid[] := array[
    'f19f3f0d-ca43-40dc-ae55-18027aa9b37e',
    '0201af6d-47c4-4a82-b277-69b71323d2ca',
    '51b3e44f-b4a6-48b2-b1eb-9c3d63e36e99',
    '45dbb71e-a49b-4c5d-b894-c322de410d80'
  ]::uuid[];
begin
  delete from rebond.ref_acces_numeriques
    where exemplaire_id in (select id from rebond.exemplaires where unite_documentaire_id = any(dup_ids));

  delete from rebond.citations
    where exemplaire_id in (select id from rebond.exemplaires where unite_documentaire_id = any(dup_ids));

  delete from rebond.exemplaires where unite_documentaire_id = any(dup_ids);

  delete from rebond.unites_documentaires where id = any(dup_ids);
end $$;
