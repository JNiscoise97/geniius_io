create or replace view public.v_acteurs_relations as

-- Partie 1 : relations explicites
select
  r.acteur_source_id,
  src.individu_id as individu_source_id,
  r.source_mention,
  r.acteur_cible_id,
  tgt.individu_id as individu_cible_id,
  r.source_table,
  r.acte_id,
  r.relation_type,
  r.relation_mode,
  r.relation_precision,
  r.statut,
  'lien' as source_relation
from staging_transcription_acteurs_relations r
left join v_acteurs_enrichis src on src.id = r.acteur_source_id
left join v_acteurs_enrichis tgt on tgt.id = r.acteur_cible_id

union all

-- Partie 2 : relations déduites par rôle
select
  source.id as acteur_source_id,
  source.individu_id as individu_source_id,
  mapping.source_mention,
  cible.id as acteur_cible_id,
  cible.individu_id as individu_cible_id,
  source.source_table,
  source.acte_id,
  mapping.relation_type,
  'explicite' as relation_mode,
  null as relation_precision,
  'unique' as statut,
  'role' as source_relation
from v_acteurs_enrichis source
join v_acteurs_enrichis cible on source.acte_id = cible.acte_id
join (
  values
    ('enfant', 'père', 'enfant', 'enfant'),
    ('enfant', 'mère', 'enfant', 'enfant'),
    ('père', 'enfant', 'père', 'père'),
    ('mère', 'enfant', 'mère', 'mère'),
    ('défunt', 'père', 'enfant', 'enfant'),
    ('défunt', 'mère', 'enfant', 'enfant'),
    ('père', 'défunt', 'père', 'père'),
    ('mère', 'défunt', 'mère', 'mère'),
    ('enfant légitimé', 'époux', 'enfant', 'enfant'),
    ('enfant légitimé', 'épouse', 'enfant', 'enfant'),
    ('époux', 'enfant légitimé', 'père', 'père'),
    ('épouse', 'enfant légitimé', 'mère', 'mère'),
    ('sujet', 'père', 'enfant', 'enfant'),
    ('sujet', 'mère', 'enfant', 'enfant'),
    ('père', 'sujet', 'père', 'père'),
    ('mère', 'sujet', 'mère', 'mère'),
    ('époux', 'époux-père', 'enfant', 'enfant'),
    ('époux', 'époux-mère', 'enfant', 'enfant'),
    ('époux-père', 'époux', 'père', 'père'),
    ('époux-mère', 'époux', 'mère', 'mère'),
    ('épouse', 'épouse-père', 'enfant', 'enfant'),
    ('épouse', 'épouse-mère', 'enfant', 'enfant'),
    ('épouse-père', 'épouse', 'père', 'père'),
    ('épouse-mère', 'épouse', 'mère', 'mère')
) as mapping(role_source, role_cible, source_mention, relation_type)
  on source.role = mapping.role_source and cible.role = mapping.role_cible
where source.individu_id is not null
  and cible.individu_id is not null;
