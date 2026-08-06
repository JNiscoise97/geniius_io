-- Duplication schéma-consciente de public.get_bureau_stats pour rebond.
-- Contrairement à create_registre_label, aucune dépendance cross-schema ici :
-- etat_civil_bureaux, etat_civil_registres et etat_civil_actes sont toutes
-- les trois déjà dans rebond. Débloque store/etatcivil.ts (useEtatCivilStore),
-- laissé sur le client public jusqu'ici faute de cette fonction.

create or replace function rebond.get_bureau_stats()
returns table (
  bureau_id uuid,
  estimes bigint,
  nb_registres bigint,
  releves bigint,
  transcrits bigint
)
language sql
stable
as $$
  select
    b.id as bureau_id,
    coalesce(r.estime, 0) as estimes,
    coalesce(r.nb_registres, 0) as nb_registres,
    coalesce(a.releve, 0) as releves,
    coalesce(a.transcrits, 0) as transcrits
  from rebond.etat_civil_bureaux b
  left join (
    select
      bureau_id,
      sum(nombre_actes_estime) as estime,
      count(*) as nb_registres
    from rebond.etat_civil_registres
    group by bureau_id
  ) r on b.id = r.bureau_id
  left join (
    select
      bureau_id,
      count(*) as releve,
      count(*) filter (where status = 'TRANSCRIBED') as transcrits
    from rebond.etat_civil_actes
    group by bureau_id
  ) a on b.id = a.bureau_id;
$$;
