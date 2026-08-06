create or replace function get_enfants_for_individu(
  p_individu_id uuid
)
returns table (
  enfant_acteur_id uuid,
  enfant_individu_id uuid,
  prenom text,
  nom text,
  sexe text,
  autre_parent_acteur_id uuid,
  autre_parent_individu_id uuid
)
as $$
begin
  return query

  with enfants_raw as (
    -- Étape 1
    select
      e.id as enfant_acteur_id,
      e.individu_id as enfant_individu_id,
      coalesce(ri.prenom, ta.prenom) as prenom,
      coalesce(ri.nom, ta.nom) as nom,
      coalesce(ri.sexe, ta.sexe) as sexe,
      a2.id as autre_parent_acteur_id,
      a2.individu_id as autre_parent_individu_id
    from v_acteurs_enrichis a
    join v_acteurs_enrichis e on a.acte_id = e.acte_id
    left join v_acteurs_enrichis a2 on a2.acte_id = a.acte_id
      and a2.id != a.id
      and lower(a2.role) in ('père', 'mère')
    left join rebond_individus ri on ri.id = e.individu_id
    left join transcription_entites_acteurs ta on ta.id = e.id
    where a.individu_id = p_individu_id
      and lower(a.role) in ('père', 'mère')
      and lower(e.role) in ('enfant', 'défunt', 'sujet')
      and (e.individu_id is not null or e.id is not null)

    union

    -- Étape 2
    select
      e.id,
      e.individu_id,
      coalesce(ri.prenom, ta.prenom),
      coalesce(ri.nom, ta.nom),
      coalesce(ri.sexe, ta.sexe),
      a2.id,
      a2.individu_id
    from v_acteurs_enrichis a
    join v_acteurs_enrichis e on a.acte_id = e.acte_id
    left join v_acteurs_enrichis a2 on a2.acte_id = a.acte_id
      and a2.id != a.id
      and lower(a2.role) in ('époux', 'épouse')
    left join rebond_individus ri on ri.id = e.individu_id
    left join transcription_entites_acteurs ta on ta.id = e.id
    where a.individu_id = p_individu_id
      and lower(a.role) in ('époux', 'épouse')
      and lower(e.role) = 'enfant légitimé'
      and (e.individu_id is not null or e.id is not null)

    union

    -- Étape 3
    select
      e.id,
      e.individu_id,
      coalesce(ri.prenom, ta.prenom),
      coalesce(ri.nom, ta.nom),
      coalesce(ri.sexe, ta.sexe),
      a2.id,
      a2.individu_id
    from v_acteurs_enrichis a
    join v_acteurs_enrichis e on a.acte_id = e.acte_id
    left join v_acteurs_enrichis a2 on a2.acte_id = a.acte_id
      and a2.id != a.id
      and (
        (lower(a.role) = 'époux-père' and lower(a2.role) = 'époux-mère') or
        (lower(a.role) = 'époux-mère' and lower(a2.role) = 'époux-père')
      )
    left join rebond_individus ri on ri.id = e.individu_id
    left join transcription_entites_acteurs ta on ta.id = e.id
    where a.individu_id = p_individu_id
      and lower(a.role) in ('époux-père', 'époux-mère')
      and lower(e.role) = 'époux'
      and (e.individu_id is not null or e.id is not null)

    union

    -- Étape 4
    select
      e.id,
      e.individu_id,
      coalesce(ri.prenom, ta.prenom),
      coalesce(ri.nom, ta.nom),
      coalesce(ri.sexe, ta.sexe),
      a2.id,
      a2.individu_id
    from v_acteurs_enrichis a
    join v_acteurs_enrichis e on a.acte_id = e.acte_id
    left join v_acteurs_enrichis a2 on a2.acte_id = a.acte_id
      and a2.id != a.id
      and (
        (lower(a.role) = 'épouse-père' and lower(a2.role) = 'épouse-mère') or
        (lower(a.role) = 'épouse-mère' and lower(a2.role) = 'épouse-père')
      )
    left join rebond_individus ri on ri.id = e.individu_id
    left join transcription_entites_acteurs ta on ta.id = e.id
    where a.individu_id = p_individu_id
      and lower(a.role) in ('épouse-père', 'épouse-mère')
      and lower(e.role) = 'épouse'
      and (e.individu_id is not null or e.id is not null)

    union

-- Étape 5 : relations explicites de type 'fils' ou 'fille'
select
  e.id as enfant_acteur_id,
  e.individu_id as enfant_individu_id,
  coalesce(ri.prenom, ta.prenom) as prenom,
  coalesce(ri.nom, ta.nom) as nom,
  coalesce(ri.sexe, ta.sexe) as sexe,
  a2.id as autre_parent_acteur_id,
  a2.individu_id as autre_parent_individu_id
from v_acteurs_enrichis a
join staging_transcription_acteurs_relations r on r.acteur_cible_id = a.id
join v_acteurs_enrichis e on e.id = r.acteur_source_id
left join v_acteurs_enrichis a2 on a2.acte_id = a.acte_id
  and a2.id not in (a.id, e.id)
  and lower(a2.role) in ('père', 'mère', 'époux', 'épouse')
left join rebond_individus ri on ri.id = e.individu_id
left join transcription_entites_acteurs ta on ta.id = e.id
where a.individu_id = p_individu_id
  and lower(r.relation_type) in ('fils', 'fille')
  and r.relation_mode = 'explicite'
  and r.statut = 'unique'
  )

  select
    null as enfant_acteur_id,
    er.enfant_individu_id,
    max(er.prenom),
    max(er.nom),
    max(er.sexe),
    max(er.autre_parent_acteur_id::text)::uuid,
    max(er.autre_parent_individu_id::text)::uuid
  from enfants_raw er
  where er.enfant_individu_id is not null
  group by er.enfant_individu_id

  union

  select
    er.enfant_acteur_id,
    null,
    max(er.prenom),
    max(er.nom),
    max(er.sexe),
    max(er.autre_parent_acteur_id::text)::uuid,
    max(er.autre_parent_individu_id::text)::uuid
  from enfants_raw er
  where er.enfant_individu_id is null
  group by er.enfant_acteur_id;

end;
$$ language plpgsql stable;
