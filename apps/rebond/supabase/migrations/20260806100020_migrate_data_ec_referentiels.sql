-- Copie les données existantes de public.* vers rebond.* pour les 7
-- référentiels d'enrichissement d'exemplaire (état physique, qualité de
-- reproduction, dommages, langues, écritures, lisibilité manuscrite,
-- caractéristiques de lisibilité). Additive, réversible : public.* inchangé.
-- Idempotent (ON CONFLICT (id) DO NOTHING). Aucune dépendance entre elles,
-- ordre indifférent.

insert into rebond.ref_physical_condition
  (id, code, label, description, note, position, created_at, updated_at)
select
  id, code, label, description, note, position, created_at, updated_at
from public.ref_physical_condition
on conflict (id) do nothing;

insert into rebond.ref_repro_quality
  (id, code, label, description, note, position, created_at, updated_at)
select
  id, code, label, description, note, position, created_at, updated_at
from public.ref_repro_quality
on conflict (id) do nothing;

insert into rebond.ref_document_damage_kinds
  (id, code, label, categorie, position, note, description, created_at, updated_at)
select
  id, code, label, categorie, position, note, description, created_at, updated_at
from public.ref_document_damage_kinds
on conflict (id) do nothing;

insert into rebond.ref_langues
  (id, code, label, note, description, created_at, updated_at)
select
  id, code, label, note, description, created_at, updated_at
from public.ref_langues
on conflict (id) do nothing;

insert into rebond.ref_ecritures
  (id, code, label, note, description, created_at, updated_at)
select
  id, code, label, note, description, created_at, updated_at
from public.ref_ecritures
on conflict (id) do nothing;

insert into rebond.ref_handwriting_legibility
  (id, code, label, position, note, description, created_at, updated_at)
select
  id, code, label, position, note, description, created_at, updated_at
from public.ref_handwriting_legibility
on conflict (id) do nothing;

insert into rebond.ref_document_readability_features
  (id, code, label, categorie, note, description, applicable_to, created_at, updated_at)
select
  id, code, label, categorie, note, description, applicable_to, created_at, updated_at
from public.ref_document_readability_features
on conflict (id) do nothing;

-- Vérification manuelle après exécution :
-- select 'ref_physical_condition', (select count(*) from public.ref_physical_condition), (select count(*) from rebond.ref_physical_condition)
-- union all select 'ref_repro_quality', (select count(*) from public.ref_repro_quality), (select count(*) from rebond.ref_repro_quality)
-- union all select 'ref_document_damage_kinds', (select count(*) from public.ref_document_damage_kinds), (select count(*) from rebond.ref_document_damage_kinds)
-- union all select 'ref_langues', (select count(*) from public.ref_langues), (select count(*) from rebond.ref_langues)
-- union all select 'ref_ecritures', (select count(*) from public.ref_ecritures), (select count(*) from rebond.ref_ecritures)
-- union all select 'ref_handwriting_legibility', (select count(*) from public.ref_handwriting_legibility), (select count(*) from rebond.ref_handwriting_legibility)
-- union all select 'ref_document_readability_features', (select count(*) from public.ref_document_readability_features), (select count(*) from rebond.ref_document_readability_features);
