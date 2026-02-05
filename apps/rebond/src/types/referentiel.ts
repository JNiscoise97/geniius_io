// src/types/referentiel.ts
export type ReferentielBase = {
  id: string;          // uuid
  code: string;
  label: string;
  note?: string | null;
  description?: string | null;
};

export type ReferentielRef = {
  ids: string[];
  labels: string[];
};

export type Ecriture = ReferentielBase;
export type Nature = ReferentielBase;
export type Support = ReferentielBase;
export type Langue = ReferentielBase;


// Column keys we support in the UI
export const ALL_COLUMNS = ['code', 'label', 'description', 'note', 'position', 'color', 'categorie'] as const;
export type RefColumnKey = (typeof ALL_COLUMNS)[number];

export const REF_TABLES: {
  value: string;
  label: string;
  columns?: Partial<Record<RefColumnKey, boolean>>;
}[] = [
  { value: 'ref_categorie_couleur', label: 'Catégories de couleur' },
  { value: 'ref_auteur_institutionnel', label: 'Auteur institutionnel', columns: { categorie: true, position: true } },
  { value: 'ref_ec_document_form', label: 'Formes du document' },
  { value: 'ref_physical_condition', label: 'État physique du support', columns: { position: true } },
  { value: 'ref_repro_quality', label: 'Qualité de reproduction', columns: { position: true } },
  { value: 'ref_document_damage_kinds', label: 'Dommages', columns: { categorie: true } },
  {
    value: 'ref_document_readability_features',
    label: 'Caractéristiques de lisibilité du document',
    columns: { categorie: true }
  },
  { value: 'ref_ec_type_acte', label: "Type d'acte", columns: { categorie: true, position: true, color: true } },
  { value: 'ref_ecritures', label: 'Ecritures' },
  { value: 'ref_filiation', label: 'Filiations' },
  { value: 'ref_langues', label: 'Langues' },
  { value: 'ref_natures', label: 'Natures' },
  { value: 'ref_handwriting_legibility', label: 'Niveau de lisibilité (manuscrit)' },
  { value: 'ref_profession', label: 'Professions' },
  { value: 'ref_qualite', label: 'Qualités (appellations)' },
  { value: 'ref_series_documentaires', label: 'Séries documentaires' },
  { value: 'ref_signature', label: 'Signature' },
  { value: 'ref_situation_fiscale', label: 'Situations fiscales' },
  { value: 'ref_situation_matrimoniale', label: 'Situations matrimoniales' },
  { value: 'ref_statut_juridique', label: 'Statuts juridiques' },
  { value: 'ref_statut_proprietaire', label: 'Statuts de propriété' },
  { value: 'ref_supports', label: 'Supports' },
  { value: 'ref_handwriting_style', label: 'Style d’écriture manuscrite' },
  { value: 'ref_transcription_status', label: 'Statuts de transcription' },
  { value: 'ref_type_acces', label: "Type d'accès" },
  { value: 'ref_institutions_types', label: 'Types d’institutions' },
  { value: 'ref_pagination_type', label: 'Types de pagination' },
  { value: 'ref_plateforme_type', label: 'Types de plateforme' },
  { value: 'ref_ec_registre_segment_kinds', label: 'Types de segments de registre (état-civil)', columns: { position: true } },
  { value: 'ref_type_unite', label: 'Types d’unité documentaire' },
];

export type RefRow = {
  id: string;
  code?: string | null;
  label?: string | null;
  description?: string | null;
  note?: string | null;
  position?: number | null;
  color?: string | null;
  categorie?: string | null;
};