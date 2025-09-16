create or replace function get_parents_for_individu(
  p_individu_id uuid
)
returns table (
  parent_role text,
  parent_acteur_id uuid,
  parent_individu_id uuid
)
as $$
begin
  return query

  -- Étape 1 : enfant → père/mère
  select
    lower(a.role) as parent_role,
    a.id as parent_acteur_id,
    a.individu_id as parent_individu_id
  from v_acteurs_enrichis e
  join v_acteurs_enrichis a on a.acte_id = e.acte_id
  where e.individu_id = p_individu_id
    and lower(e.role) = 'enfant'
    and lower(a.role) in ('père', 'mère')

  union

  -- Étape 2 : enfant légitimé → époux/épouse
  select
    case when lower(a.role) = 'époux' then 'père' else 'mère' end as parent_role,
    a.id as parent_acteur_id,
    a.individu_id as parent_individu_id
  from v_acteurs_enrichis e
  join v_acteurs_enrichis a on a.acte_id = e.acte_id
  where e.individu_id = p_individu_id
    and lower(e.role) = 'enfant légitimé'
    and lower(a.role) in ('époux', 'épouse')

  union

  -- Étape 3 : époux → époux-père/époux-mère
  select
    case when lower(a.role) = 'époux-père' then 'père' else 'mère' end as parent_role,
    a.id as parent_acteur_id,
    a.individu_id as parent_individu_id
  from v_acteurs_enrichis e
  join v_acteurs_enrichis a on a.acte_id = e.acte_id
  where e.individu_id = p_individu_id
    and lower(e.role) = 'époux'
    and lower(a.role) in ('époux-père', 'époux-mère')

  union

  -- Étape 4 : épouse → épouse-père/épouse-mère
  select
    case when lower(a.role) = 'épouse-père' then 'père' else 'mère' end as parent_role,
    a.id as parent_acteur_id,
    a.individu_id as parent_individu_id
  from v_acteurs_enrichis e
  join v_acteurs_enrichis a on a.acte_id = e.acte_id
  where e.individu_id = p_individu_id
    and lower(e.role) = 'épouse'
    and lower(a.role) in ('épouse-père', 'épouse-mère')

  union

  -- Étape 5 : défunt → père/mère
  select
    lower(a.role) as parent_role,
    a.id as parent_acteur_id,
    a.individu_id as parent_individu_id
  from v_acteurs_enrichis e
  join v_acteurs_enrichis a on a.acte_id = e.acte_id
  where e.individu_id = p_individu_id
    and lower(e.role) = 'défunt'
    and lower(a.role) in ('père', 'mère')
    
union

  -- Étape 6 : sujet → père/mère
  select
    lower(a.role) as parent_role,
    a.id as parent_acteur_id,
    a.individu_id as parent_individu_id
  from v_acteurs_enrichis e
  join v_acteurs_enrichis a on a.acte_id = e.acte_id
  where e.individu_id = p_individu_id
    and lower(e.role) = 'sujet'
    and lower(a.role) in ('père', 'mère')

union

-- Étape 7a : enfant → parent (relation_type = 'père' ou 'mère')
select
  lower(r.relation_type) as parent_role,
  r.acteur_cible_id as parent_acteur_id,
  ac.individu_id as parent_individu_id
from v_acteurs_enrichis e
join staging_transcription_acteurs_relations r on r.acteur_cible_id = e.id
join v_acteurs_enrichis ac on ac.id = r.acteur_source_id
where e.individu_id = p_individu_id
  and lower(r.relation_type) in ('père', 'mère')
  and r.relation_mode = 'explicite'
  and r.statut = 'unique'

union

-- Étape 7b : parent → enfant (relation_type = 'fils' ou 'fille')
select
  case
    when lower(ap.sexe) in ('m') then 'père'
    when lower(ap.sexe) in ('f') then 'mère'
    else 'parent'
  end as parent_role,
  r.acteur_source_id as parent_acteur_id,
  ap.individu_id as parent_individu_id
from v_acteurs_enrichis e
join staging_transcription_acteurs_relations r on r.acteur_source_id = e.id
join v_acteurs_enrichis ap on ap.id = r.acteur_cible_id
where e.individu_id = p_individu_id
  and lower(r.relation_type) in ('fils', 'fille')
  and r.relation_mode = 'explicite'
  and r.statut = 'unique';

end;
$$ language plpgsql stable;
