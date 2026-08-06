CREATE OR REPLACE VIEW v_toponymes_mentions_stats AS
WITH all_mentions AS (
  SELECT naissance_lieux AS texte_brut FROM transcription_entites_acteurs WHERE naissance_lieux IS NOT NULL
  UNION ALL
  SELECT deces_lieux FROM transcription_entites_acteurs WHERE deces_lieux IS NOT NULL
  UNION ALL
  SELECT domicile FROM transcription_entites_acteurs WHERE domicile IS NOT NULL
  UNION ALL
  SELECT origine FROM transcription_entites_acteurs WHERE origine IS NOT NULL
),
grouped_transcriptions AS (
  SELECT
    texte_brut,
    COUNT(*) AS occurence_transcription
  FROM all_mentions
  GROUP BY texte_brut
),
grouped_mentions_toponymes AS (
  SELECT
    forme_originale AS texte_brut,
    COUNT(*) AS occurence_mentions
  FROM mentions_toponymes
  GROUP BY forme_originale
)
SELECT
  COALESCE(gt.texte_brut, gm.texte_brut) AS texte_brut,
  COALESCE(gt.occurence_transcription, 0) AS occurence_transcription,
  COALESCE(gm.occurence_mentions, 0) AS occurence_mentions
FROM grouped_transcriptions gt
FULL OUTER JOIN grouped_mentions_toponymes gm ON gt.texte_brut = gm.texte_brut;