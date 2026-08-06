// src/types/liens.ts
export type LienDraft = {
  id?: string; // id pivot si déjà existant
  lien_id: string;
  lien_code?: string | null;      // optionnel pour affichage
  lien_label?: string | null;     // "frère de" / "grand-mère de" (calculé)
  nature?: 'parente' | 'mariage' | 'affinite' | 'spirituel' | 'tutelle' | 'autre' | null;

  cible_type: 'acteur' | 'role' | 'texte';
  cible_acteur_id?: string | null;
  cible_role?: string | null;
  cible_label?: string | null;

  // qualificatifs
  cote?: 'maternel' | 'paternel' | null;
  fratrie_qualif?: 'germain' | 'uterin' | 'consanguin' | null;
  cousin_degre?: number | null;
  cousin_removal?: number | null;
  cousin_double?: boolean | null;
  ascend_n?: number | null;
  descend_n?: number | null;

  position?: number | null; // ordre d'affichage
};
