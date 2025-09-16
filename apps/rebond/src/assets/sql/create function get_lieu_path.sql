create or replace function public.get_lieu_path(p_lieu_id uuid)
returns table(path_ids uuid[], path_labels text[]) language plpgsql stable as $$
declare
  ids uuid[];
begin
  ids := public.get_lieu_path_ids(p_lieu_id);
  path_ids := coalesce(ids, '{}');
  path_labels := public.get_labels_from_path_ids(path_ids);
  return;
end;
$$;
