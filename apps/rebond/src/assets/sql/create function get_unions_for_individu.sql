create or replace function get_unions_for_individu(p_individu_id uuid)
returns table (
  conjoint_individu_id uuid,
  conjoint_acteur_id uuid,
  type_union text,
  conjoint_prenom text,
  conjoint_nom text,
  union_acte_id uuid,
  date_mariage text,
  lieu_mariage text
)
as $$
begin
  return query

  with base as (
    select
      a1.acte_id,
      coalesce(a2.individu_id, null) as conjoint_individu_id,
      case when a2.individu_id is null then a2.id else null end as conjoint_acteur_id,
      coalesce(ri.prenom, a2.prenom) as conjoint_prenom,
      coalesce(ri.nom, a2.nom) as conjoint_nom,
      lower(a1.role) as role_x,
      lower(a2.role) as role_conjoint,
      a1.acte_date,
      case
        when lower(a1.role) in ('époux', 'épouse') and lower(a2.role) in ('époux', 'épouse') then 'mariage civil'
        when lower(a1.role) in ('père', 'mère') and lower(a2.role) in ('père', 'mère') then 'union parentale'
        else null
      end as type_union
    from v_acteurs_enrichis a1
    join v_acteurs_enrichis a2
      on a1.acte_id = a2.acte_id
      and a1.id != a2.id
    left join rebond_individus ri on ri.id = a2.individu_id
    where a1.individu_id = p_individu_id
      and lower(a1.role) in ('père', 'mère', 'époux', 'épouse')
      and lower(a2.role) in ('père', 'mère', 'époux', 'épouse')
  ),

  regroupement as (
    select
      base.conjoint_individu_id,
      base.conjoint_acteur_id,
      min(base.acte_date) as date_union,
      max(case
            when base.type_union = 'mariage civil' then 1
            when base.type_union = 'union parentale' then 0
            else -1
          end) as type_score,
      array_agg((base.acte_id, base.acte_date, base.type_union) order by base.acte_date) as actes,
      max(base.conjoint_prenom) as conjoint_prenom,
      max(base.conjoint_nom) as conjoint_nom
    from base
    group by base.conjoint_individu_id, base.conjoint_acteur_id
  )

  select
    r.conjoint_individu_id,
    r.conjoint_acteur_id,
    case
      when r.type_score = 1 then 'mariage civil'
      when r.type_score = 0 then 'union parentale'
      else null
    end as type_union,
    r.conjoint_prenom,
    r.conjoint_nom,
    a.acte_id,
    to_char(a.acte_date, 'YYYY-MM-DD') as date_mariage,
    get_lieu_mariage_from_acte_id(a.acte_id) as lieu_mariage
  from regroupement r
  left join lateral (
    select acte_id, acte_date, union_type
    from unnest(r.actes) as row(acte_id uuid, acte_date date, union_type text)
    where union_type = 'mariage civil'
    limit 1
  ) a on true;

end;
$$ language plpgsql stable;
