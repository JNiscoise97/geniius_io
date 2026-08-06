create or replace function public.get_lieu_path_ids(p_lieu_id uuid)
returns uuid[] language sql stable as $$
with recursive anc as (
  -- point de départ : le parent du lieu donné
  select l.parent_id as id, 1 as depth
  from public.lieux l
  where l.id = p_lieu_id

  union all

  -- remonter jusqu'à la racine (parent_id null)
  select l.parent_id, a.depth + 1
  from public.lieux l
  join anc a on l.id = a.id
  where a.id is not null
)
select coalesce(array_remove(array_agg(a.id order by a.depth desc), null), '{}')
from anc a;
$$;
