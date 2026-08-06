CREATE OR REPLACE FUNCTION count_mentions_lieu_brut(p_texte_brut TEXT)
RETURNS INTEGER AS $$
  SELECT
    COUNT(*) -- chaque mention vaut 1
  FROM (
    SELECT naissance_lieux FROM transcription_entites_acteurs WHERE naissance_lieux = p_texte_brut
    UNION ALL
    SELECT deces_lieux FROM transcription_entites_acteurs WHERE deces_lieux = p_texte_brut
    UNION ALL
    SELECT domicile FROM transcription_entites_acteurs WHERE domicile = p_texte_brut
    UNION ALL
    SELECT origine FROM transcription_entites_acteurs WHERE origine = p_texte_brut
  ) AS all_mentions;
$$ LANGUAGE sql STABLE;
