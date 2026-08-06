
create table public.ref_exemplaires (
  id uuid not null default gen_random_uuid(),
  -- Commentaire: Identifiant technique (UUID) de l’exemplaire (instance consultable).

  unite_documentaire_id uuid not null
    references public.ref_unites_documentaires(id) on delete cascade,
  -- Commentaire: Référence vers l’unité documentaire (l’objet intellectuel / “work”) dont cet exemplaire est une occurrence.

  depot_id uuid not null
    references public.ref_depots(id) on delete restrict,
  -- Commentaire: Dépôt (lieu/plateforme) où cet exemplaire est consultable (ex: Mairie annexe, AD Réunion, ANOM en ligne).

  nature_id uuid null
    references public.ref_natures(id) on delete set null,
  -- Commentaire: Type de “forme/occurrence” de l’exemplaire dans la chaîne (original, copie, double, microfilm, numérisation...).

  support_id uuid null
    references public.ref_supports(id) on delete set null,
  -- Commentaire: Support matériel ou technique principal de cet exemplaire (papier, microfilm, numérique, etc.). Optionnel si redondant avec nature.

  cote_locale text null,
  -- Commentaire: Cote/identifiant de classement spécifique à ce dépôt pour cet exemplaire (peut différer d’un dépôt à l’autre).

  identifiant_interne text null,
  -- Commentaire: Identifiant interne au dépôt/plateforme (ex: id technique d’une base, code d’inventaire local, identifiant image/lot).

  localisation_interne text null,
  -- Commentaire: Indication “humaine” de localisation/repérage dans le dépôt (armoire/rayon/salle/série locale). Peut être remplacé/complété par un nœud de classement.

  conditionnement text null,
  -- Commentaire: Mode de conditionnement (armoire, carton, boîte, reliure, etc.), utile pour le repérage physique.

  description text null,
  -- Commentaire: Description libre de l’exemplaire (ex: “registre relié”, “copie certifiée”, “microfilm bobine X”, etc.).

  note text null,
  -- Commentaire: Notes libres (contexte, anomalies, précisions de consultation, restrictions non formalisées, etc.).

  qualite text null,
  -- Commentaire: Qualité perçue de l’exemplaire (ex: netteté numérisation, contraste microfilm, lisibilité). Peut devenir une ref plus tard.

  etat_conservation text null,
  -- Commentaire: État de conservation (ex: bon, fragile, lacunaire). Peut devenir une ref plus tard.

  pagination_type text null,
  -- Commentaire: Type de pagination/compte interne (vues/pages/folios/images) si l’exemplaire est paginé ou numérisé.

  nb_pages integer null,
  -- Commentaire: Nombre de pages/vues/folios/images selon pagination_type (si connu).

  source_exemplaire_id uuid null
    references public.ref_exemplaires(id) on delete set null,
  -- Commentaire: Référence vers l’exemplaire “source” dont celui-ci dérive (copie de / microfilm de / numérisation de). Sert à modéliser une chaîne de transmission.

  couverture_label text null,
  -- Commentaire: Libellé de couverture “tel qu’indiqué” sur l’exemplaire (peut différer du titre/couverture de l’unité documentaire).

  couverture_sort_start integer null,
  -- Commentaire: Début de couverture pour tri (ex: année 1885) quand l’exemplaire couvre une plage, utile pour ordonner des exemplaires.

  couverture_sort_end integer null,
  -- Commentaire: Fin de couverture pour tri (ex: année 1890). Doit être >= couverture_sort_start.

  created_at timestamp with time zone not null default now(),
  -- Commentaire: Date de création de la ligne (audit).

  updated_at timestamp with time zone not null default now(),
  -- Commentaire: Date de dernière mise à jour (audit).

  constraint ref_exemplaires_pkey primary key (id),

  constraint ref_exemplaires_pagination_chk check (
    (pagination_type is null) or (
      pagination_type = any (array['vues'::text,'pages'::text,'folios'::text,'images'::text])
    )
  ),

  constraint ref_exemplaires_couverture_sort_chk check (
    (
      (couverture_sort_start is null and couverture_sort_end is null)
      or (couverture_sort_start is not null and couverture_sort_end is not null and couverture_sort_start <= couverture_sort_end)
    )
  )
);

create index if not exists idx_ref_exemplaires_unite on public.ref_exemplaires using btree (unite_documentaire_id);
create index if not exists idx_ref_exemplaires_depot on public.ref_exemplaires using btree (depot_id);
create index if not exists idx_ref_exemplaires_source on public.ref_exemplaires using btree (source_exemplaire_id);

create trigger trg_ref_exemplaires_updated_at
before update on public.ref_exemplaires
for each row execute function fn_set_updated_at();


-- COMMENTAIRES POSTGRES (recommandé)
comment on table public.ref_exemplaires is
'Instance consultable d’une unité documentaire dans un dépôt donné (original/copie/microfilm/numérisation...), éventuellement reliée à une chaîne de dérivation.';

comment on column public.ref_exemplaires.id is 'Identifiant technique (UUID) de l’exemplaire.';
comment on column public.ref_exemplaires.unite_documentaire_id is 'FK vers ref_unites_documentaires: objet intellectuel dont cet exemplaire est une occurrence.';
comment on column public.ref_exemplaires.depot_id is 'FK vers ref_depots: dépôt où cet exemplaire est consultable.';
comment on column public.ref_exemplaires.nature_id is 'Nature de l’exemplaire dans la chaîne (original/double/copie/microfilm/numérisation...).';
comment on column public.ref_exemplaires.support_id is 'Support principal (papier/microfilm/numérique...), optionnel.';
comment on column public.ref_exemplaires.cote_locale is 'Cote ou identifiant de classement spécifique à ce dépôt.';
comment on column public.ref_exemplaires.identifiant_interne is 'Identifiant interne/technique du dépôt ou de la plateforme.';
comment on column public.ref_exemplaires.localisation_interne is 'Localisation/repérage dans le dépôt (armoire, rayon, salle, chemin interne...).';
comment on column public.ref_exemplaires.conditionnement is 'Conditionnement physique (armoire, carton, boîte, reliure...).';
comment on column public.ref_exemplaires.description is 'Description libre de l’exemplaire.';
comment on column public.ref_exemplaires.note is 'Notes libres.';
comment on column public.ref_exemplaires.qualite is 'Qualité perçue (lisibilité, netteté, contraste...), optionnel.';
comment on column public.ref_exemplaires.etat_conservation is 'État de conservation, optionnel.';
comment on column public.ref_exemplaires.pagination_type is 'Type de pagination si applicable (vues/pages/folios/images).';
comment on column public.ref_exemplaires.nb_pages is 'Nombre selon pagination_type (si connu).';
comment on column public.ref_exemplaires.source_exemplaire_id is 'FK auto-référente: exemplaire source dont celui-ci dérive (copie de / microfilm de / numérisation de).';
comment on column public.ref_exemplaires.couverture_label is 'Libellé de couverture tel qu’indiqué sur l’exemplaire (peut différer de l’unité documentaire).';
comment on column public.ref_exemplaires.couverture_sort_start is 'Début de plage pour tri (ex: année).';
comment on column public.ref_exemplaires.couverture_sort_end is 'Fin de plage pour tri (ex: année).';
comment on column public.ref_exemplaires.created_at is 'Horodatage de création.';
comment on column public.ref_exemplaires.updated_at is 'Horodatage de dernière mise à jour.';
