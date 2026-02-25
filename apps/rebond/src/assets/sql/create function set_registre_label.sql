create or replace function public.set_registre_label()
returns trigger
language plpgsql
as $$
begin
  -- Si label null ou vide → on calcule automatiquement
  if new.label is null or trim(new.label) = '' then
    new.label := public.create_registre_label(new.id);
  end if;

  return new;
end;
$$;