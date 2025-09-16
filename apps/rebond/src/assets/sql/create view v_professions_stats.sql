create or replace view public.v_professions_stats as
select
  trim(profession_brut) as profession_brut,
  count(*)::int         as occurence_transcription,
  count(distinct tap.acteur_id)::int as occurence_assoc
from public.transcription_entites_acteurs tea
left join public.transcription_acteur_profession tap
  on tap.acteur_id = tea.id
where coalesce(nullif(trim(profession_brut), ''), '') <> ''
group by 1;
