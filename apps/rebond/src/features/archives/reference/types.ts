// src/features/archives/reference/types.ts

export type ReferenceOwnerKind = 'acte' | 'registre';

/**
 * Le "propriétaire" de la référence archive (un acte ou un registre).
 * On évite les types du domaine (EtatCivilActe / EtatCivilRegistre) pour rendre les cards
 * réutilisables sans importer tout le projet.
 */
export type ReferenceOwner = {
  kind: ReferenceOwnerKind;
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
  owner_kind: ReferenceOwnerKind; // acte|registre (virtuel côté front)
  owner_id: string;              // acte_id ou registre_id

  depot_type: string | null;     // ANOM / AD / Mairie / etc.
  nom_depot: string | null;
  chemin_classement: string | null;
  cote: string | null;
  registre: string | null;       // titre registre / registre_titre
  acces_mode: string | null;     // en_ligne / sur_place / copie
  url_site: string | null;

  vues_pages: string | null;     // ex "p. 123-126" ou "vues 55-60"
  note: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

export type ManifestationPick = {
  manifestation_id: string;
  type_manifestation: 'original' | 'microfilm' | 'numerisation';

  unite_id: string;
  unite_titre: string;
  unite_cote: string | null;
  pagination_type: 'vues' | 'pages' | 'folios' | 'images' | null;

  depot_nom: string;
  depot_type: 'physique' | 'en_ligne';

  institution_nom: string;
  institution_sigle: string | null;

  url_base: string | null;
  plateforme_code: string | null;
};

export type ActeCitationDraft = CitationDraftBase & {
  // Vues
  vues_start?: number | null;
  vues_end?: number | null;
  vues_raw?: string;

  // Pages
  page_start?: number | null;
  page_end?: number | null;
  page_raw?: string;

  acte_manquant?: boolean;
};

export type RegistreCitationDraft = CitationDraftBase & {
  registre_manquant?: boolean;
};


export type CitationDraftBase = {
  id?: string;

  // FK
  manifestation_id?: string;

  // Dénormalisation UI (depuis v_manifestations_pick)
  manifestation?: Manifestation;

  note?: string;
  sort_order?: number;
};


export type Manifestation = {
  type_manifestation?: string;
  unite_titre?: string;
  unite_cote?: string | null;
  pagination_type?: string | null;

  depot_nom?: string;
  depot_type?: 'physique' | 'en_ligne';

  institution_nom?: string;
  institution_sigle?: string | null;

  url_base?: string | null;
  plateforme_code?: string | null;
};
