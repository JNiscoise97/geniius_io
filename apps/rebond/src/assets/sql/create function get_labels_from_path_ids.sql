create or replace function public.get_labels_from_path_ids(p_path_ids uuid[])
returns text[] language sql stable as $$
select coalesce(array_agg(tp.libelle order by x.ord), '{}') as labels
from unnest(p_path_ids) with ordinality as x(id, ord)
left join lateral (
  select t.libelle
  from public.toponymes t
  where t.lieu_id = x.id
    and t.is_principal is true
  order by t.date_debut nulls last, t.libelle
  limit 1
) tp on true;
$$;
