create or replace function public.fn_join_avec_et(items text[])
returns text
language plpgsql
immutable
as $$
declare
  n int;
begin
  n := coalesce(array_length(items, 1), 0);
  if n = 0 then return ''; end if;
  if n = 1 then return items[1]; end if;
  if n = 2 then return items[1] || ' et ' || items[2]; end if;

  return array_to_string(items[1:n-1], ', ') || ' et ' || items[n];
end;
$$;