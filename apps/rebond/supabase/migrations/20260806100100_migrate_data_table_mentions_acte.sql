-- Sépare le containment physique (parent_ud_id) de la relation "mentionné
-- dans" pour toutes les tables déjà créées : une table (identifiée de façon
-- fiable via etat_civil_repertoires.unite_documentaire_id — role_document_ref
-- n'est jamais posé par le wizard, donc pas utilisable ici) "mentionne"
-- chacun de ses actes enfants au lieu de les contenir. L'acte remonte d'un
-- niveau : son parent_ud_id devient celui de la table (le registre, ou NULL
-- si la table n'en a pas encore).
--
-- Additive et idempotent : ON CONFLICT DO NOTHING sur l'insertion des
-- mentions, et l'UPDATE ne fait rien pour un acte déjà repointé (la
-- sous-requête ne matche plus après le premier passage).

insert into rebond.unites_documentaires_mentions (mentionnant_id, mentionne_id)
select r.unite_documentaire_id, a.id
from rebond.unites_documentaires a
join rebond.etat_civil_repertoires r on r.unite_documentaire_id = a.parent_ud_id
on conflict (mentionnant_id, mentionne_id) do nothing;

update rebond.unites_documentaires a
set parent_ud_id = t.parent_ud_id
from rebond.unites_documentaires t
join rebond.etat_civil_repertoires r on r.unite_documentaire_id = t.id
where a.parent_ud_id = t.id;

-- Vérification manuelle après exécution :
-- select a.id, a.titre, a.parent_ud_id as nouveau_parent, m.mentionnant_id as table_qui_mentionne
-- from rebond.unites_documentaires_mentions m
-- join rebond.unites_documentaires a on a.id = m.mentionne_id
-- order by a.titre;
