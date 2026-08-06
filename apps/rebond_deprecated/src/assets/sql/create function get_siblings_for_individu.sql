create or replace function get_siblings_for_individu(
  p_individu_id uuid
)
returns table (
  sibling_individu_id uuid,
  nom text,
  prenom text,
  sexe text,
  type_lien text, -- 'germain', 'utérin', 'consanguin'
  via_pere boolean,
  via_mere boolean
)
as $$
begin
  return query
  with parents as (
    select parent_role, parent_individu_id
    from get_parents_for_individu(p_individu_id)
    where parent_individu_id is not null
  ),
  enfants_du_parent as (
    select distinct
      e.enfant_individu_id,
      p.parent_role
    from parents p
    join get_enfants_for_individu(p.parent_individu_id) e
      on e.enfant_individu_id is not null
    where e.enfant_individu_id != p_individu_id
  ),
  aggrege as (
    select
      enfant_individu_id as sibling_individu_id,
      bool_or(parent_role = 'père') as via_pere,
      bool_or(parent_role = 'mère') as via_mere
    from enfants_du_parent
    group by enfant_individu_id
  )
  select
    a.sibling_individu_id,
    i.nom,
    i.prenom,
    i.sexe,
    case
      when a.via_pere and a.via_mere then 'germain'
      when not a.via_pere and a.via_mere then 'utérin'
      when a.via_pere and not a.via_mere then 'consanguin'
      else 'indéterminé'
    end as type_lien,
    a.via_pere,
    a.via_mere
  from aggrege a
  join rebond_individus i on i.id = a.sibling_individu_id;
end;
$$ language plpgsql stable;
