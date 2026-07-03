-- Assouplir les policies INSERT/UPDATE d'ec_tables pour autoriser les accès non-authentifiés
-- (cohérent avec ref_unites_documentaires, ref_exemplaires, citations qui n'exigent pas auth)

DROP POLICY IF EXISTS "ec_tables_insert_auth" ON public.ec_tables;
DROP POLICY IF EXISTS "ec_tables_update_auth" ON public.ec_tables;

CREATE POLICY "ec_tables_insert_public"
  ON public.ec_tables FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ec_tables_update_public"
  ON public.ec_tables FOR UPDATE
  USING (true);
