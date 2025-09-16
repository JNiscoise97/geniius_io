create or replace function public.clear_profession_brut(p_profession_brut text)
returns integer
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  update public.transcription_entites_acteurs
     set profession_brut = null
   where trim(profession_brut) = trim(p_profession_brut);

  get diagnostics v_count = ROW_COUNT;
  return v_count;
end
$$;
