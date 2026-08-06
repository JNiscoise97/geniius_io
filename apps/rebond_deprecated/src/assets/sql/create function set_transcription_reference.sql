create or replace function public.set_transcription_reference(
  p_transcription_id uuid,
  p_preference_reason text
)
returns void
language plpgsql
security definer
as $$
declare
  v_acte_id uuid;
begin
  if p_preference_reason is null or btrim(p_preference_reason) = '' then
    raise exception 'preference_reason is required';
  end if;

  -- Trouver l'acte de la transcription
  select acte_id into v_acte_id
  from public.ec_transcriptions
  where id = p_transcription_id;

  if v_acte_id is null then
    raise exception 'transcription not found';
  end if;

  -- 1) unset toutes les références de l'acte
  update public.ec_transcriptions
  set is_reference = false
  where acte_id = v_acte_id
    and is_reference = true;

  -- 2) set la référence + raison
  update public.ec_transcriptions
  set
    is_reference = true,
    preference_reason = p_preference_reason,
    reference_set_at = now(),
    reference_set_by = auth.uid()
  where id = p_transcription_id;

end;
$$;

-- IMPORTANT: permissions d’exécution (sinon le client ne peut pas appeler la RPC)
grant execute on function public.set_transcription_reference(uuid, text) to authenticated;
