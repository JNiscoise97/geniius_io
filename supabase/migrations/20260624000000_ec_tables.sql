-- Migration: table de domaine métier ec_tables
-- Représente une table / index des actes d'état civil ou paroissiaux
-- Analogue à etat_civil_registres pour les registres

CREATE TABLE public.ec_tables (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid(),
  unite_documentaire_id uuid        NULL REFERENCES public.ref_unites_documentaires(id) ON DELETE SET NULL,
  bureau_id             uuid        NULL REFERENCES public.etat_civil_bureaux(id)        ON DELETE SET NULL,
  periodicite           text        NOT NULL, -- annuelle | decennale | generale
  classement            text        NULL,     -- alphabetique | chronologique | NULL
  annee_debut           integer     NOT NULL,
  annee_fin             integer     NULL,
  type_acte_ids         uuid[]      NOT NULL DEFAULT '{}', -- vide = tous types d'actes couverts
  label                 text        NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ec_tables_pkey PRIMARY KEY (id),
  CONSTRAINT ec_tables_periodicite_chk CHECK (periodicite IN ('annuelle', 'decennale', 'generale')),
  CONSTRAINT ec_tables_classement_chk  CHECK (classement IS NULL OR classement IN ('alphabetique', 'chronologique')),
  CONSTRAINT ec_tables_annees_chk      CHECK (annee_fin IS NULL OR annee_fin >= annee_debut)
);

CREATE INDEX ON public.ec_tables (unite_documentaire_id);
CREATE INDEX ON public.ec_tables (bureau_id);
CREATE INDEX ON public.ec_tables (annee_debut, annee_fin);

ALTER TABLE public.ec_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ec_tables_select_public"
  ON public.ec_tables FOR SELECT USING (true);

CREATE POLICY "ec_tables_insert_auth"
  ON public.ec_tables FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ec_tables_update_auth"
  ON public.ec_tables FOR UPDATE
  USING (auth.role() = 'authenticated');
