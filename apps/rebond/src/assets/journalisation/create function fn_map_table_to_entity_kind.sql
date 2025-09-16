create or replace function public.fn_map_table_to_entity_kind(tbl text)
returns public.entity_kind
language sql immutable as $$
  select case tbl
    when 'etat_civil_actes'              then 'acte'::public.entity_kind
    when 'etat_civil_registres'          then 'registre'::public.entity_kind
    when 'etat_civil_bureaux'            then 'bureau'::public.entity_kind
    when 'transcription_entites_acteurs' then 'acteur'::public.entity_kind
    else 'autre'::public.entity_kind
  end
$$;
