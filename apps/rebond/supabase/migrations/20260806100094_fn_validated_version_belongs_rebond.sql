-- Duplication de public.fn_ec_transcriptions_validated_version_belongs() :
-- référence en dur public.ec_transcription_versions (table pas encore
-- migrée), donc pas schéma-agnostique. Corps identique, pointe toujours vers
-- public.ec_transcription_versions en attendant sa migration.

create or replace function rebond.fn_ec_transcriptions_validated_version_belongs()
returns trigger
language plpgsql
as $$
declare
  v_ok boolean;
begin
  if new.validated_version_id is null then
    return new;
  end if;

  select exists (
    select 1
    from public.ec_transcription_versions v
    where v.id = new.validated_version_id
      and v.transcription_id = new.id
  ) into v_ok;

  if not v_ok then
    raise exception 'validated_version_id must belong to the same transcription (transcription_id=% validated_version_id=%)',
      new.id, new.validated_version_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;
