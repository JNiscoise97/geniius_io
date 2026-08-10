-- Génération automatique du label de rebond.hypotheques_registres —
-- contrairement à rebond.set_registre_label (etat_civil), pas besoin d'un
-- second appel RPC après coup : type_registre_ref est une FK directe (pas un
-- pivot many-to-many), tout ce qu'il faut est déjà dans la ligne à l'insertion.

create or replace function rebond.set_hypotheques_registre_label()
returns trigger
language plpgsql
as $$
declare
  v_type_label text;
begin
  if new.label is null or trim(new.label) = '' then
    select label into v_type_label
    from rebond.ref_hypotheques_type_registre
    where id = new.type_registre_ref;

    new.label := coalesce(v_type_label, 'Registre') || ' — vol. ' || new.numero_volume::text;

    if new.periode_debut is not null then
      new.label := new.label || ' (' || new.periode_debut::text
        || case when new.periode_fin is not null and new.periode_fin <> new.periode_debut
                then '-' || new.periode_fin::text else '' end
        || ')';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_set_hypotheques_registre_label
  before insert or update on rebond.hypotheques_registres
  for each row execute function rebond.set_hypotheques_registre_label();

-- updated_at — public.fn_set_updated_at() déjà réutilisée pour toutes les
-- tables rebond récentes (batch5, ref_role_document...), schéma-agnostique.

create trigger trg_hypotheques_conservations_updated_at
  before update on rebond.hypotheques_conservations
  for each row execute function public.fn_set_updated_at();

create trigger trg_hypotheques_bureaux_updated_at
  before update on rebond.hypotheques_bureaux
  for each row execute function public.fn_set_updated_at();

create trigger trg_hypotheques_registres_updated_at
  before update on rebond.hypotheques_registres
  for each row execute function public.fn_set_updated_at();

create trigger trg_hypotheques_actes_updated_at
  before update on rebond.hypotheques_actes
  for each row execute function public.fn_set_updated_at();

create trigger trg_hypotheques_repertoire_entrees_updated_at
  before update on rebond.hypotheques_repertoire_entrees
  for each row execute function public.fn_set_updated_at();

create trigger trg_hypotheques_table_entrees_updated_at
  before update on rebond.hypotheques_table_entrees
  for each row execute function public.fn_set_updated_at();

create trigger trg_hypotheques_table_entree_refs_updated_at
  before update on rebond.hypotheques_table_entree_refs
  for each row execute function public.fn_set_updated_at();

create trigger trg_ref_hypotheques_type_registre_updated_at
  before update on rebond.ref_hypotheques_type_registre
  for each row execute function public.fn_set_updated_at();

create trigger trg_ref_hypotheques_type_acte_updated_at
  before update on rebond.ref_hypotheques_type_acte
  for each row execute function public.fn_set_updated_at();
