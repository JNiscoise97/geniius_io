create or replace view public.v_acteurs_enrichis as
select
  a.id,
  a.nom,
  a.prenom,
  trim(coalesce(a.prenom, '') || ' ' || coalesce(a.nom, '')) as nom_complet,
  a.role,
  a.lien,
  a.qualite,
  a.profession_brut,
  a.statut_brut,
  a.fonction,
  a.domicile,
  a.filiation,
  a.age,
  a.sexe,
  a.naissance_date,
  a.naissance_lieux,
  a.deces_date,
  a.deces_lieux,
  a.origine,
  a.est_vivant,
  a.est_present,
  a.est_declarant,
  a.pere_est_cite,
  a.mere_est_citee,
  a.a_signe,
  a.note,
  a.signature,
  a.signature_libelle,

  -- source entité
  e.acte_id,
  e.source_table,

  -- mapping avec individu
  im.id as individu_id,

  -- libellé d’acte
  coalesce(ac.label, ac2.label) as acte_label,

  -- statut de l’acte
  coalesce(ac.statut, ac2.statut) as acte_statut,

  -- type de l’acte
  coalesce(ac.type_acte, array_to_string(ac2.type_operation, '|')) AS acte_type,

  -- date d’acte
  coalesce(
    ac.date,
    (
      select (s.date->>'exact')::date
      from seances s
      where s.acte_id = ac2.id
        and s.date ? 'exact'
      order by (s.date->>'exact') asc
      limit 1
    )
  ) as acte_date,

  -- numéro d’acte
  coalesce(ac.numero_acte, ac2.numero_acte) as numero_acte,

  -- bureau d'état civil
  b.nom as bureau_nom,

  -- notaire principal (acte notarié uniquement)
  n.id as notaire_id,
  n.nom as notaire_nom,
  n.prenom as notaire_prenom,
  n.titre as notaire_titre,
  n.lieu_exercice as notaire_lieu_exercice

from transcription_entites_acteurs a
left join transcription_entites_mapping m on m.cible_id = a.id
left join transcription_entites e on e.id = m.entite_id

-- actes d’état civil
left join etat_civil_actes ac on ac.id = e.acte_id
left join etat_civil_bureaux b on b.id = ac.bureau_id

-- actes notariés
left join actes ac2 on ac2.id = e.acte_id

-- notaire principal lié à l’acte
left join actes_notaires an on an.acte_id = ac2.id and an.role = 'principal'
left join notaires n on n.id = an.notaire_id

-- mapping avec individu
left join rebond_individus_mapping im on im.acteur_id = a.id;