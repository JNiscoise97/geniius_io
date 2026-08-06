create or replace function public.get_professions_preview(p_profession_brut text)
returns table(
  acteur_id uuid,
  acteur_nom_complet text,
  acte_label text,
  acte_date date
) language sql stable as $$
  select
    a.id,
    coalesce(a.prenom,'') || ' ' || coalesce(a.nom,'') as acteur_nom_complet,
    ac.acte_label as acte_label,
    ac.acte_date as acte_date
  from public.transcription_entites_acteurs a
  left join public.v_acteurs_enrichis ac on ac.id = a.id
  where trim(a.profession_brut) = trim(p_profession_brut)
$$;