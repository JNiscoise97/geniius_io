create or replace function get_bureau_stats()
returns table (
  bureau_id uuid,
  estimes integer,
  nb_registres integer,
  releves integer,
  transcrits integer
)
language sql
as $$
  select
    b.id as bureau_id,
    coalesce(r.estime, 0) as estimes,
    coalesce(r.nb_registres, 0) as nb_registres,
    coalesce(a.releve, 0) as releves,
    coalesce(a.transcrits, 0) as transcrits
  from etat_civil_bureaux b
  left join (
    select
      bureau_id,
      sum(nombre_actes_estime) as estime,
      count(*) as nb_registres
    from etat_civil_registres
    group by bureau_id
  ) r on b.id = r.bureau_id
  left join (
    select
      bureau_id,
      count(*) as releve,
      count(*) filter (where statut = 'transcrit') as transcrits
    from etat_civil_actes
    group by bureau_id
  ) a on b.id = a.bureau_id;
$$;
