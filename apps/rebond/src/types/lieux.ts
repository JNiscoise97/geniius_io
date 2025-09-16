// types/lieux.ts
export type LieuPreview = {
  acteur_id: string;
  individu_id?: string | null;
  fonction: 'naissance' | 'deces' | 'domicile'  | 'residence' | 'origine';
  acte_label?: string | null;
  texte_brut?: string | null;
  commune: string | null;
  section?: string | null;
  propriete?: string | null;
  maison?: string | null;
  precisions?: string | null;
  numero?: string | null;
};
