// features/etat-civil/validation/types.ts
export type Level = 'info' | 'warning' | 'error';

export type Incoherence = {
  acteurId: string;
  acteurLabel: string;
  message: string;
  level: Level;
};

export type RelationPreview = {
  acteur_source_id: string;
  statut: string;
  source_mention: string;
};

export type Acte = { id: string; type_acte: string };
export type Acteur = Record<string, any>;