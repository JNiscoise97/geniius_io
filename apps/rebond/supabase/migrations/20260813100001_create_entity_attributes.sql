-- Informations d'identité validées manuellement sur une entité canonique
-- (personne) — nouvel onglet "Informations à valider" de la fiche individu
-- rapatriée (apps/rebond/src/features/individu/IndividuFiche.tsx).
--
-- Contexte : les faits (rebond.transcription_assertions validées) d'une
-- même entité canonique peuvent porter, pour un même attribut (date de
-- naissance, lieu de décès, profession...), des valeurs concurrentes selon
-- les actes (mentions différentes, parfois contradictoires). Cette table
-- stocke le choix tranché manuellement par l'utilisateur pour un attribut
-- donné, avec traçabilité vers les faits qui l'appuient. C'est une première
-- brique du futur module "Qualité & validation" (pas construit), scopée ici
-- au contexte d'une seule fiche individu plutôt qu'un écran dédié.
--
-- Une seule valeur validée par (entité, attribut) : une nouvelle validation
-- remplace la précédente (correction), pas d'historique conservé dans cette
-- première version — voir upsertEntityAttribute (entites.service.ts).

create table if not exists rebond.entity_attributes (
  id uuid not null default gen_random_uuid(),
  entity_id uuid not null,
  attribute_code text not null,
  value text not null,
  source_fact_ids uuid[] not null default '{}',
  validated_at timestamp with time zone not null default now(),
  constraint entity_attributes_pkey primary key (id),
  constraint fk_entity_attributes_entity
    foreign key (entity_id) references rebond.entities (id) on delete cascade,
  constraint uq_entity_attributes_entity_code unique (entity_id, attribute_code)
);

create index if not exists idx_entity_attributes_entity
  on rebond.entity_attributes using btree (entity_id);

comment on table rebond.entity_attributes is
  'Informations d''identité validées manuellement sur une entité canonique (personne), synthétisées à partir des faits concurrents (transcription_assertions) — ex. la date de naissance retenue parmi plusieurs mentions. source_fact_ids trace les assertions qui appuient la valeur retenue.';

do $$
declare
  t text;
begin
  foreach t in array array[
    'entity_attributes'
  ]
  loop
    execute format('alter table rebond.%I enable row level security', t);

    execute format('drop policy if exists "%s_public_select" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_select" on rebond.%I for select to anon, authenticated using (true)',
      t, t
    );

    execute format('drop policy if exists "%s_public_insert" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_insert" on rebond.%I for insert to anon, authenticated with check (true)',
      t, t
    );

    execute format('drop policy if exists "%s_public_update" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_update" on rebond.%I for update to anon, authenticated using (true) with check (true)',
      t, t
    );

    execute format('drop policy if exists "%s_public_delete" on rebond.%I', t, t);
    execute format(
      'create policy "%s_public_delete" on rebond.%I for delete to anon, authenticated using (true)',
      t, t
    );

    execute format('grant all on rebond.%I to anon, authenticated, service_role', t);
  end loop;
end $$;
