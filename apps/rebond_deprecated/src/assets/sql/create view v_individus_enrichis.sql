create or replace view v_individus_enrichis as
select
  i.id,
  i.nom,
  i.prenom,
  n.date as naissance_date,
  n.lieu as naissance_lieu,
  d.date as deces_date,
  d.lieu as deces_lieu
from rebond_individus i
left join lateral get_naissance(i.id) as n on true
left join lateral get_deces(i.id) as d on true;
