create or replace function get_lieu_mariage_from_acte_id(p_acte_id uuid)
returns text
as $$
declare
  v_bureau_nom text;
  v_comparution boolean;
  v_observations text;
begin
  select
    b.nom,
    a.comparution_mairie,
    a.comparution_observations
  into
    v_bureau_nom,
    v_comparution,
    v_observations
  from etat_civil_actes a
  left join etat_civil_bureaux b on a.bureau_id = b.id
  where a.id = p_acte_id;

  if v_comparution = false then
    return concat(
      coalesce(v_observations, 'Comparution délocalisée'),
      ' (acte enregistré à la ', v_bureau_nom, ')'
    );
  else
    return v_bureau_nom;
  end if;
end;
$$ language plpgsql stable;
