// src/features/archives/reference/types.ts

export type TypeDocument = 'acte' | 'registre';

export type Mode = 'view' | 'edit';

/**
 * Le "propriétaire" de la référence archive (un acte ou un registre).
 * On évite les types du domaine (EtatCivilActe / EtatCivilRegistre) pour rendre les cards
 * réutilisables sans importer tout le projet.
 */
export type ReferenceOwner = {
  kind: TypeDocument;
  id: string;

  // Contexte (optionnel) - utile pour autocompléter / afficher
  bureauLabel?: string | null;
  bureauId?: string | null;

  // Pour l'acte : utile dans certains cas
  registreId?: string | null;
};

/**
 * Une ligne “source / référence archive”
 * (adapte aux colonnes réelles de etat_civil_actes_sources / etat_civil_registres_sources)
 */
export type ArchiveSourceRow = {
  id: string;
  owner_kind: TypeDocument; // acte|registre (virtuel côté front)
  owner_id: string; // acte_id ou registre_id

  depot_is_online: boolean | null;
  depot_is_physical: boolean | null;
  nom_depot: string | null;
  chemin_classement: string | null;
  cote: string | null;
  registre: string | null; // titre registre / registre_titre
  acces_mode: string | null; // en_ligne / sur_place / copie
  url_site: string | null;

  vues_pages: string | null; // ex "p. 123-126" ou "vues 55-60"
  note: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

export type ExemplairePick = {
  exemplaire_id: string;

  nature_ref: string;
  nature_code?: string;
  nature_label?: string;

  support_ref?: string;
  support_code?: string;
  support_label?: string;

  physical_condition_ref?: string;
  physical_condition_code?: string;
  physical_condition_label?: string;

  unite_id: string;
  unite_titre: string;
  cote_locale: string | null;
  
  pagination_type_ref: string | null;
  pagination_type_code: string | null;
  pagination_type_label: string | null;
  nb_pages: number | null;

  depot_nom: string;
  depot_is_physical: boolean | null;
  depot_is_online: boolean | null;

  institution_nom: string;
  institution_sigle: string | null;

  identifiant_interne: string | null;
  localisation_interne: string | null;

  url_base: string | null;
  plateforme_code: string | null;

  serie_code?: string | null;
  serie_label?: string | null;

  couverture_label?: string | null;
  couverture_sort_start?: string | null;
  couverture_sort_end?: string | null;

  bureau_labels?: string[] | null;
  type_acte_labels?: string[] | null;
  source_exemplaire_id?: string;
};

export type ActeCitationDraft = CitationDraftBase & {
  // Vues
  loc_start?: number | null;
  loc_end?: number | null;
  loc_raw?: string;

  is_missing?: boolean;

  physical_condition_ref?: { ids: string[]; labels: string[] } | null;
  damage_notes?: string | null;

  repro_quality_ref?: { ids: string[]; labels: string[] } | null;
  repro_notes?: string | null;

  missing_ranges?: any[]; // jsonb array in DB (structured ranges)

  marginal_mentions_present?: boolean | null;
  marginal_mentions_count?: number | null;

  signatures_present?: boolean | null;
  signatures_count?: number | null;

  // Mots rayés indiqués en marge (à distinguer des rayures dans le texte)
  marginal_crossouts_present?: boolean | null;
  marginal_crossouts_count?: number | null;
};

export type RegistreSegmentDraft = {
  id?: string;
  kind_ref: string | null;        // UI peut être null, BD NOT NULL -> on validera avant save
  label_override: string | null;
  scope: 'full' | 'interest' | 'unknown';
  range_start: number | null;
  range_end: number | null;
  date_from: string | null;       // 'YYYY-MM-DD'
  date_to: string | null;
  year_from: number | null;
  year_to: number | null;
  note: string | null;
  sort_order?: number | null;
};

export type RegistreCitationDraft = CitationDraftBase & {
  is_missing?: boolean | null;
  lacune?: boolean | null;
  lacune_note?: string | null;
  locating?: any; // jsonb
  physical_condition_ref?: string | null;
  repro_quality_ref?: string | null;
  marks?: string | null;
  document_damage_kinds_ids?: string[] | null; // uuid[]
  segments?: RegistreSegmentDraft[];
  missing_ranges?: any[]; // jsonb array in DB (structured ranges)
  writing?: any;
};

export type CitationDraftBase = {
  id?: string;
  
  unite_id?: string;
  
  // FK
  exemplaire_id?: string;

  // Dénormalisation UI (depuis v_exemplaires_pick)
  exemplaire?: Exemplaire;

  note?: string;
  sort_order?: number;
};

export type Exemplaire = {
  exemplaire_id?: string;
  nature_ref?: string;
  nature_code?: string;
  nature_label?: string;

  support_ref?: string;
  support_code?: string;
  support_label?: string;

  physical_condition_ref?: string;
  physical_condition_code?: string;
  physical_condition_label?: string;

  unite_id?: string;
  unite_titre?: string;
  cote_locale?: string | null;
  pagination_type_ref?: string | null;
  pagination_type_code?: string | null;
  pagination_type_label?: string | null;
  nb_pages: number | null;

  depot_nom?: string;
  depot_is_physical: boolean | null;
  depot_is_online: boolean | null;

  institution_nom?: string;
  institution_sigle?: string | null;

  identifiant_interne: string | null;
  localisation_interne: string | null;

  url_base?: string | null;
  plateforme_code?: string | null;
  source_exemplaire_id?: string;
};