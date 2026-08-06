-- Exemple d'appel de la fonction :
-- SELECT ajouter_officier_si_absent_par_actes(
--   ARRAY[
--     '11111111-1111-1111-1111-111111111111'::UUID,
--     '22222222-2222-2222-2222-222222222222'::UUID
--   ],
--   'DURAND',
--   'Jean',
--   'M',
--   'maire',
--   'Jean DURAND',
--   TRUE,
--   'Officier de l’état civil',
--   TRUE,
--   TRUE,
--   'Ajout automatisé'
-- );

CREATE OR REPLACE FUNCTION ajouter_officier_si_absent_par_actes(
  acte_ids UUID[],
  nom_officier TEXT,
  prenom_officier TEXT,
  sexe_officier TEXT DEFAULT 'M',
  fonction_officier TEXT DEFAULT NULL,
  signature_officier TEXT DEFAULT NULL,
  a_signe_officier BOOLEAN DEFAULT TRUE,
  qualite_officier TEXT DEFAULT NULL,
  est_vivant_officier BOOLEAN DEFAULT NULL,
  est_present_officier BOOLEAN DEFAULT NULL,
  note_officier TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  acte_uuid UUID;
  new_acteur_id UUID;
  new_entite_id UUID;
  actor_label TEXT;
  source_table TEXT := 'transcription_entites_acteurs';
BEGIN
  FOREACH acte_uuid IN ARRAY acte_ids
  LOOP
    -- Vérifie s’il y a déjà un acteur de rôle 'officier' pour cet acte
    IF NOT EXISTS (
      SELECT 1
      FROM transcription_entites te
      JOIN transcription_entites_mapping tem ON tem.entite_id = te.id
      JOIN transcription_entites_acteurs tea ON tea.id = tem.cible_id
      WHERE te.acte_id = acte_uuid
        AND tea.role = 'officier'
    ) THEN
      new_acteur_id := gen_random_uuid();
      new_entite_id := gen_random_uuid();
      actor_label := CONCAT_WS(' ', prenom_officier, nom_officier);

      -- Insertion dans transcription_entites_acteurs
      INSERT INTO transcription_entites_acteurs (
        id, nom, prenom, role, sexe, fonction, a_signe, signature,
        qualite, est_vivant, est_present, note
      ) VALUES (
        new_acteur_id, nom_officier, prenom_officier, 'officier', sexe_officier,
        fonction_officier, a_signe_officier, signature_officier,
        qualite_officier, est_vivant_officier, est_present_officier, note_officier
      );

      -- Mise à jour de l'identité
      PERFORM update_individus_identite();

      -- Insertion dans transcription_entites
      INSERT INTO transcription_entites (
        id, acte_id, label, type, source_table
      ) VALUES (
        new_entite_id, acte_uuid, actor_label, 'acteur', source_table
      );

      -- Mapping vers l’acteur
      INSERT INTO transcription_entites_mapping (
        entite_id, cible_type, cible_id
      ) VALUES (
        new_entite_id, source_table, new_acteur_id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
