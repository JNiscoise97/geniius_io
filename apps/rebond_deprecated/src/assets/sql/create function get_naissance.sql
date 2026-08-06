
create or replace function get_naissance(ind_id uuid)
returns table(date text, lieu text)
language sql
as $$
  select
    coalesce(
      (
        select to_char(nullif(trim(a.naissance_date), '')::date, 'DD/MM/YYYY')
        from v_acteurs_enrichis a
        where a.individu_id = ind_id
          and lower(coalesce(a.role, '')) in ('enfant','époux','épouse','défunt')
          and nullif(trim(a.naissance_date), '') is not null
        order by
          case lower(a.role)
            when 'enfant' then 1
            when 'époux' then 2
            when 'épouse' then 3
            when 'défunt' then 4
            else 99
          end
        limit 1
      ),
      'date indéterminée'
    ) as date,

    coalesce(
      (
        select trim(coalesce(nullif(a.naissance_lieux, ''), nullif(a.origine, '')))
        from v_acteurs_enrichis a
        where a.individu_id = ind_id
          and lower(coalesce(a.role, '')) in ('enfant','époux','épouse','défunt')
          and (
            nullif(a.naissance_lieux, '') is not null
            or nullif(a.origine, '') is not null
          )
        order by
          case lower(a.role)
            when 'enfant' then 1
            when 'époux' then 2
            when 'épouse' then 3
            when 'défunt' then 4
            else 99
          end
        limit 1
      ),
      'lieu indéterminé'
    ) as lieu;
$$;
