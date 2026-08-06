create or replace function get_nombre_actes_estime_par_bureau()
returns table (
  bureau_id uuid,
  estime integer,
  nb_registres integer
)
language sql
as $$
  select
    bureau_id,
    sum(nombre_actes_estime) as estime,
    count(*) as nb_registres
  from etat_civil_registres
  group by bureau_id;
$$;
