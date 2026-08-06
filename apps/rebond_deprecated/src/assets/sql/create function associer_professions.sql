create or replace function public.associer_professions(
  p_profession_brut text,
  p_profession_ids uuid[]
) returns void
language plpgsql security definer as $$
declare
  r record;
  i int;
begin
  if p_profession_ids is null or array_length(p_profession_ids,1) is null then
    raise exception 'aucune profession sélectionnée';
  end if;

  for r in
    select id as acteur_id
    from public.transcription_entites_acteurs
    where trim(profession_brut) = trim(p_profession_brut)
  loop
    -- insère chaque élément sélectionné avec sa position (idempotent via on conflict)
    for i in 1..array_length(p_profession_ids,1) loop
      insert into public.transcription_acteur_profession (acteur_id, profession_id, position)
      values (r.acteur_id, p_profession_ids[i], i)
      on conflict on constraint uq_acteur_prf do update
        set position = excluded.position;  -- met à jour l’ordre si déjà présent
    end loop;
  end loop;
end $$;