-- Crée le schéma dédié au nouveau modèle de données de rebond.
-- Les tables legacy restent dans `public` le temps de la migration progressive.

create schema if not exists rebond;

comment on schema rebond is
  'Nouveau schéma de données de rebond (reconstruction propre, table par table, en remplacement progressif de public.*)';
