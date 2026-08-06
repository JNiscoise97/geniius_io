create or replace function public.fn_audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := null;
  v_row_id uuid := null;
  v_pk_text text := null;
  v_diff jsonb := null;
  v_entity_type public.entity_kind;
begin
  -- qui
  begin v_user := auth.uid(); exception when others then v_user := null; end;

  -- type d'entité
  v_entity_type := public.fn_map_table_to_entity_kind(tg_table_name);

  if (tg_op = 'INSERT') then
    begin v_row_id := (to_jsonb(NEW)->>'id')::uuid; exception when others then v_row_id := null; end;
    v_pk_text := (to_jsonb(NEW)->>'id');

    insert into public.app_audit_log(
      action, table_name, entity_type, entity_id,
      row_id, pk_text, user_id, old_data, new_data, diff
    ) values (
      'INSERT', tg_table_name, v_entity_type, v_row_id,
      v_row_id, v_pk_text, v_user, null, to_jsonb(NEW), null
    );
    return NEW;

  elsif (tg_op = 'UPDATE') then
    begin v_row_id := (to_jsonb(NEW)->>'id')::uuid; exception when others then v_row_id := null; end;
    v_pk_text := coalesce((to_jsonb(NEW)->>'id'), (to_jsonb(OLD)->>'id'));
    v_diff := public.jsonb_diff_pairs(to_jsonb(OLD), to_jsonb(NEW));

    insert into public.app_audit_log(
      action, table_name, entity_type, entity_id,
      row_id, pk_text, user_id, old_data, new_data, diff
    ) values (
      'UPDATE', tg_table_name, v_entity_type, v_row_id,
      v_row_id, v_pk_text, v_user, to_jsonb(OLD), to_jsonb(NEW), v_diff
    );
    return NEW;

  elsif (tg_op = 'DELETE') then
    begin v_row_id := (to_jsonb(OLD)->>'id')::uuid; exception when others then v_row_id := null; end;
    v_pk_text := (to_jsonb(OLD)->>'id');

    insert into public.app_audit_log(
      action, table_name, entity_type, entity_id,
      row_id, pk_text, user_id, old_data, new_data, diff
    ) values (
      'DELETE', tg_table_name, v_entity_type, v_row_id,
      v_row_id, v_pk_text, v_user, to_jsonb(OLD), null, null
    );
    return OLD;
  end if;

  return null;
end;
$$;
