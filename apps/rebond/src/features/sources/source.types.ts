// source.types.ts

// ===============================
// Unité documentaire (Work) - DB
// ===============================
export type UniteDocumentaireDB = {
  id: string;
  type_unite: string;
  titre: string;

  identifiant_interne: string | null;
  description: string | null;

  langue_id: string | null;
  ecriture_id: string | null;

  serie_ref: string | null;

  couverture_label: string | null;
  couverture_sort_start: number | null;
  couverture_sort_end: number | null;

  created_at?: string;
  updated_at?: string;
};

// ===============================
// Unité documentaire - UI/table
// ===============================
export type UniteDocumentaireRow = UniteDocumentaireDB & {
  // à enrichir plus tard si tu joins ref_series_documentaires
  serie_code?: string | null;
  serie_label?: string | null;
};

// ===============================
// Store compat (si tu gardes le nom "Source" dans le code)
// ===============================
export type SourceDB = UniteDocumentaireDB;
export type SourceRow = UniteDocumentaireRow;



export type ExemplaireDraft = {
  id: string;
  depot_id: string;
  nature_id: string | null;
  support_id: string | null;

  cote_locale: string;
  identifiant_interne: string;
  localisation_interne: string;
  conditionnement: string;

  qualite: string;
  etat_conservation: string;

  pagination_type: string;
  nb_pages: string;

  source_exemplaire_id: string;

  couverture_label: string;
  couverture_sort_start: string;
  couverture_sort_end: string;

  description: string;
  note: string;

  acces: AccesDraft[];
};

export type AccesDraft = {
  id: string; // client-side
  plateforme_id: string | null;
  type_acces_id: string | null;
  url_base: string;
  schema_deep_link: string;
  restrictions: string;
  note: string;
};


export type SerieOption = { id: string; code?: string | null; label: string };
export type EcritureOption = { id: string; code?: string | null; label: string };
export type LangueOption = { id: string; code?: string | null; label: string };
export type DepotOption = { id: string; labelCourt: string; labelLong: string };
export type NatureOption = { id: string; label: string };
export type SupportOption = { id: string; label: string; code?: string | null };
export type PlateformeOption = { id: string; label: string };
export type TypeAccesOption = { id: string; code: string; label: string };
export type BureauOption = {
  id: string;
  nom: string;
  commune: string | null;
  departement: string | null;
  region: string | null;
  label: string; // affichage
};

export type TypeActeOption = { id: string; label: string; label_pluriel: string; ordre: number | null };