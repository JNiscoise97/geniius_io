// Strict DB shape
export type SourceDB = {
  id: string;
  titre: string;
  type_unite: string;
  cote: string | null;
  depot_id: string;
  date_couverture_start: string | null;
  date_couverture_end: string | null;
  pagination_type: string | null;
};

// UI / table shape
export type SourceRow = SourceDB & {
  depot_nom?: string;
  institution_nom?: string;
};


export type Manifestation = {
  id: string;
  type_manifestation: 'original' | 'microfilm' | 'numerisation';
  support_id?: string | null;
  qualite?: string | null;
  note?: string | null;
  acces_numeriques?: AccesNumerique[];
};

export type AccesNumerique = {
  id: string;
  plateforme_id?: string | null;
  url_base: string;
  restrictions?: string | null;
  note?: string | null;
};
