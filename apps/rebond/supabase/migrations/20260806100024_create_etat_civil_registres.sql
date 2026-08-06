-- Registres d'état civil (ex. "registre des mariages 1850-1860" d'un bureau).
--
-- Écarts volontaires vs public.etat_civil_registres (voir
-- schema-docs/etat_civil_registres.md) :
--   - created_at/updated_at passés en not null (déjà défaut now(), sans impact réel)
--   - Contrainte unique renommée etat_civil_registres_unique_combo : l'originale
--     (etat_civil_registres_bureau_annee_type_acte_mode_statut_regime_) était
--     tronquée à la limite des 63 caractères de Postgres, illisible.
--
-- IMPORTANT : 8 des 9 FK pointent vers des tables ref_registre_* et
-- ref_unites_documentaires PAS ENCORE migrées vers rebond — elles restent
-- volontairement cross-schema vers public.* pour l'instant (parfaitement
-- valide en Postgres). Seule registre_langue_ref pointe déjà vers
-- rebond.ref_langues, migrée au lot précédent. À corriger au fur et à mesure
-- que ces tables seront migrées à leur tour.

create table if not exists rebond.etat_civil_registres (
  id uuid not null default gen_random_uuid(),
  bureau_id uuid not null,
  annee integer not null,
  type_acte text null,
  nombre_actes_estime integer null,
  numero_acte_min integer null,
  numero_acte_max integer null,
  transcription_terminee boolean null,
  registre_mode_ref uuid null,
  registre_ordre_numerotation_ref uuid null,
  registre_statut_juridique_ref uuid null,
  registre_support_ref uuid null,
  registre_pagination_ref uuid null,
  registre_fonction_ref uuid null,
  registre_norme_ref uuid null,
  registre_langue_ref uuid null,
  label text not null,
  registre_regime_fiscal_support_ref uuid null,
  unite_documentaire_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint etat_civil_registres_pkey primary key (id),
  constraint etat_civil_registres_unique_combo unique (
    bureau_id, annee, type_acte, registre_mode_ref,
    registre_statut_juridique_ref, registre_regime_fiscal_support_ref
  ),
  constraint etat_civil_registres_bureau_id_fkey
    foreign key (bureau_id) references rebond.etat_civil_bureaux (id) on delete cascade,
  constraint etat_civil_registres_registre_langue_fk
    foreign key (registre_langue_ref) references rebond.ref_langues (id)
    on update cascade on delete set null,
  -- Cross-schema, tables pas encore migrées (voir note ci-dessus) :
  constraint etat_civil_registres_registre_fonction_fk
    foreign key (registre_fonction_ref) references public.ref_registre_fonction (id)
    on update cascade on delete set null,
  constraint etat_civil_registres_registre_mode_fk
    foreign key (registre_mode_ref) references public.ref_registre_mode (id)
    on update cascade on delete set null,
  constraint etat_civil_registres_registre_norme_fk
    foreign key (registre_norme_ref) references public.ref_registre_norme (id)
    on update cascade on delete set null,
  constraint etat_civil_registres_registre_ordre_numerotation_fk
    foreign key (registre_ordre_numerotation_ref) references public.ref_registre_ordre_numerotation (id)
    on update cascade on delete set null,
  constraint etat_civil_registres_registre_pagination_fk
    foreign key (registre_pagination_ref) references public.ref_registre_pagination (id)
    on update cascade on delete set null,
  constraint etat_civil_registres_registre_regime_fiscal_support_fk
    foreign key (registre_regime_fiscal_support_ref) references public.ref_registre_regime_fiscal_support (id)
    on update cascade on delete set null,
  constraint etat_civil_registres_registre_statut_juridique_fk
    foreign key (registre_statut_juridique_ref) references public.ref_registre_statut_juridique (id)
    on update cascade on delete set null,
  constraint etat_civil_registres_registre_support_fk
    foreign key (registre_support_ref) references public.ref_registre_support (id)
    on update cascade on delete set null,
  constraint etat_civil_registres_unite_documentaire_id_fkey
    foreign key (unite_documentaire_id) references public.ref_unites_documentaires (id)
    on delete set null
);

create index if not exists idx_etat_civil_registres_label
  on rebond.etat_civil_registres using btree (label);

create index if not exists idx_etat_civil_registres_bureau_annee
  on rebond.etat_civil_registres using btree (bureau_id, annee);

create index if not exists idx_etat_civil_registres_ud_id
  on rebond.etat_civil_registres using btree (unite_documentaire_id);

create index if not exists etat_civil_registres_registre_regime_fiscal_support_ref_idx
  on rebond.etat_civil_registres using btree (registre_regime_fiscal_support_ref);

create index if not exists etat_civil_registres_registre_mode_ref_idx
  on rebond.etat_civil_registres using btree (registre_mode_ref);

create index if not exists etat_civil_registres_registre_ordre_numerotation_ref_idx
  on rebond.etat_civil_registres using btree (registre_ordre_numerotation_ref);

create index if not exists etat_civil_registres_registre_statut_juridique_ref_idx
  on rebond.etat_civil_registres using btree (registre_statut_juridique_ref);

create index if not exists etat_civil_registres_registre_support_ref_idx
  on rebond.etat_civil_registres using btree (registre_support_ref);

create index if not exists etat_civil_registres_registre_pagination_ref_idx
  on rebond.etat_civil_registres using btree (registre_pagination_ref);

create index if not exists etat_civil_registres_registre_fonction_ref_idx
  on rebond.etat_civil_registres using btree (registre_fonction_ref);

create index if not exists etat_civil_registres_registre_norme_ref_idx
  on rebond.etat_civil_registres using btree (registre_norme_ref);

comment on table rebond.etat_civil_registres is
  'Registres d''état civil. Voir apps/rebond/supabase/schema-docs/etat_civil_registres.md';
