
create or replace function update_individus_identite_by_individu_id(
  p_individu_id uuid
)
returns void as $$
begin
  update rebond_individus as ri
  set
    prenom = sub.prenom,
    nom = sub.nom_final,
    sexe = sub.sexe
  from (
    select
      rim.id as individu_id,

      -- Prénom le plus fréquent
      (
        select prenom
        from transcription_entites_acteurs tea
        join rebond_individus_mapping rim2 on tea.id = rim2.acteur_id
        where rim2.id = rim.id and prenom is not null
        group by prenom
        order by count(*) desc, prenom asc
        limit 1
      ) as prenom,

      -- Nom avec logique ? SANS NOM
      case
        when (
          select nom
          from transcription_entites_acteurs tea
          join rebond_individus_mapping rim2 on tea.id = rim2.acteur_id
          where rim2.id = rim.id and nom is not null
          group by nom
          order by count(*) desc, nom asc
          limit 1
        ) = '? SANS NOM'
        then coalesce(
          (
            select '(' || nom || ')'
            from (
              select nom
              from transcription_entites_acteurs tea
              join rebond_individus_mapping rim2 on tea.id = rim2.acteur_id
              where rim2.id = rim.id and nom is not null and nom <> '? SANS NOM'
              group by nom
              order by count(*) desc, nom asc
              limit 1
            ) as alt
          ),
          '? SANS NOM'
        )
        else (
          select nom
          from transcription_entites_acteurs tea
          join rebond_individus_mapping rim2 on tea.id = rim2.acteur_id
          where rim2.id = rim.id and nom is not null
          group by nom
          order by count(*) desc, nom asc
          limit 1
        )
      end as nom_final,

      -- Sexe le plus fréquent (hors null)
      (
        select sexe
        from transcription_entites_acteurs tea
        join rebond_individus_mapping rim2 on tea.id = rim2.acteur_id
        where rim2.id = rim.id and sexe is not null
        group by sexe
        order by count(*) desc, sexe asc
        limit 1
      ) as sexe

    from rebond_individus_mapping rim
    where rim.id = p_individu_id
    group by rim.id
  ) as sub
  where ri.id = sub.individu_id;
end;
$$ language plpgsql;