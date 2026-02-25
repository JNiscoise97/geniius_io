create or replace function public.create_registre_label(p_registre_id uuid)
returns text
language plpgsql
stable
as $$
declare
  v_type_codes text[];
  v_labels_pluriels text[];
  v_has_naissance boolean := false;
  v_uniquement_base boolean := false;
  v_autres text[];
  v_label_autres text := '';
  v_len int;

  v_regime_code text;
  v_regime_prefix text := 'Registre';
begin
  -- récupérer le régime fiscal
  select r.code
  into v_regime_code
  from public.etat_civil_registres ecr
  left join public.ref_registre_regime_fiscal_support r
    on r.id = ecr.registre_regime_fiscal_support_ref
  where ecr.id = p_registre_id;

  if v_regime_code = 'TIMBRE' then
    v_regime_prefix := 'Registre timbré';
  elsif v_regime_code = 'NON_TIMBRE' then
    v_regime_prefix := 'Registre non timbré';
  elsif v_regime_code = 'MIXTE' then
    v_regime_prefix := 'Registre à support mixte';
  end if;

  -- récupérer types d’actes
  select
    array_agg(t.code order by t.position),
    array_agg(coalesce(nullif(t.label_pluriel, ''), t.label) order by t.position)
  into v_type_codes, v_labels_pluriels
  from public.etat_civil_registres_type_acte rta
  join public.ref_ec_type_acte t on t.id = rta.type_acte_id
  where rta.registre_id = p_registre_id;

  v_len := coalesce(array_length(v_type_codes, 1), 0);

  if v_len = 0 then
    return v_regime_prefix;
  end if;

  if v_len = 1 then
    return v_regime_prefix || ' des ' || v_labels_pluriels[1];
  end if;

  v_has_naissance := ('NAISSANCE' = any(v_type_codes));

  v_uniquement_base :=
    (
      select bool_and(code = any(array['NAISSANCE','RECONNAISSANCE','AFFRANCHISSEMENT','JUGEMENT']))
      from unnest(v_type_codes) as code
    );

  if v_uniquement_base and v_has_naissance then
    select array_agg('les ' || coalesce(nullif(t.label_pluriel,''), t.label) order by t.position)
    into v_autres
    from public.etat_civil_registres_type_acte rta
    join public.ref_ec_type_acte t on t.id = rta.type_acte_id
    where rta.registre_id = p_registre_id
      and t.code <> 'NAISSANCE';

    if coalesce(array_length(v_autres, 1), 0) > 0 then
      v_label_autres := ' incluant ' || public.fn_join_avec_et(v_autres);
    end if;

    return v_regime_prefix || ' des naissances' || v_label_autres;
  end if;

  return
    v_regime_prefix || ' incluant ' ||
    public.fn_join_avec_et(
      (select array_agg('les ' || lbl) from unnest(v_labels_pluriels) as lbl)
    );
end;
$$;