create or replace function get_lieux_bruts_uniques()
returns table(texte_brut text)
language sql
as $$
  select distinct unnest(array[
    naissance_lieux, 
    deces_lieux, 
    domicile, 
    origine_lieux
  ]) as texte_brut
  from transcription_entites_acteurs
  where naissance_lieux is not null
     or deces_lieux is not null
     or domicile is not null
     or origine_lieux is not null;
$$;
