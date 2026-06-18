// source.types.ts

// ===============================
// Patrimoine documentaire — types UI (SourcesCorpusPage)
// ===============================

export type SourceType = 'etat-civil' | 'foncier' | 'annuaire' | 'notarial' | 'paroissial'
export type SourceStatut = 'actif' | 'archivé' | 'incomplet' | 'a_qualifier'
export type Acces = 'physique' | 'numerique' | 'en_ligne'
export type DocStatut = 'transcrit' | 'en_cours' | 'a_transcrire' | 'annote' | 'en_attente'
export type DocRole = 'acte_primaire' | 'instrument_de_recherche' | 'registre_compile'
export type NiveauConservation = 'bon' | 'moyen' | 'degrade' | 'fragmentaire'
export type CorpusType = 'genealogique' | 'patrimonial' | 'territorial' | 'communaute'

export type PatrimoineSource = {
  id: string              // unite_documentaire_id
  nom: string
  type: SourceType
  producteur: string | null
  institution_conservation: string
  localisation: string
  territoire: string | null
  periode: string
  niveau_fiabilite: 'haute' | 'moyenne' | 'basse' | null
  acces: Acces
  url?: string
  total_documents: number
  transcris: number
  en_cours: number
  a_traiter: number
  statut: SourceStatut
  derniere_activite: string
  copies_connues: number
}

export type PatrimoineDocument = {
  id: string
  source_id: string | null    // parent_ud_id
  type_document: SourceType | null
  role: DocRole | null
  cote: string
  titre: string
  date_document: string | null
  statut: DocStatut
  niveau_conservation: NiveauConservation | null
  url?: string
  mentions_detectees?: number
  exemplaire_groupe_id?: string
  decouverte_via_id?: string
  note?: string
}

export type PatrimoineCorpus = {
  id: string
  nom: string
  description: string
  type: CorpusType
  source_ids: string[]        // unite_documentaire_id values
  total_documents: number
  transcris: number
  cree_par: string
  cree_le: string
}

// ===============================
// Unité documentaire (Work) - DB
// ===============================
export type UniteDocumentaireDB = {
  id: string;
  type_unite_ref: string;
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
  nature_ref: string | null;
  support_ref: string | null;

  cote_locale: string;
  identifiant_interne: string;
  localisation_interne: string;
  conditionnement: string;

  pagination_type_ref: string | null;
  nb_pages: string;

  physical_condition_ref: string | null;

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

export type TypeActeOption = {
  id: string;
  label: string;
  label_pluriel: string;
  ordre: number | null;
};
