create or replace function get_responsables_par_bureau(bureau_id_input uuid)
returns table (
  officier_acteur_id uuid,
  officier_individu_id uuid,
  nom text,
  prenom text,
  fonction text,
  debut_annee integer,
  fin_annee integer,
  nb_actes integer
)
language sql
as $$
with acteurs_filtrés as (
  select
    case when im.id is null then a.id else null end as officier_acteur_id,
    im.id as officier_individu_id,
    coalesce(i.nom, a.nom) as nom,
    coalesce(i.prenom, a.prenom) as prenom,
    a.fonction,
    coalesce(ac.date, (
      select (s.date->>'exact')::date
      from seances s
      where s.acte_id = ac2.id
        and s.date ? 'exact'
      order by (s.date->>'exact') asc
      limit 1
    )) as acte_date
  from transcription_entites_acteurs a
  left join transcription_entites_mapping m on m.cible_id = a.id
  left join transcription_entites e on e.id = m.entite_id

  -- actes d’état civil
  left join etat_civil_actes ac on ac.id = e.acte_id
  left join etat_civil_bureaux b on b.id = ac.bureau_id

  -- actes notariés
  left join actes ac2 on ac2.id = e.acte_id

  -- mapping avec individu
  left join rebond_individus_mapping im on im.acteur_id = a.id
  left join rebond_individus i on i.id = im.id

  where a.role = 'officier'
    and ac.bureau_id = bureau_id_input
),
 agrégat as (
  select
    officier_acteur_id,
    officier_individu_id,
    nom,
    prenom,
    fonction,
    min(extract(year from acte_date))::int as debut_annee,
    max(extract(year from acte_date))::int as fin_annee,
    count(*) as nb_actes
  from acteurs_filtrés
  group by officier_acteur_id, officier_individu_id, nom, prenom, fonction
)
select * from agrégat
order by debut_annee, fonction;
$$;
