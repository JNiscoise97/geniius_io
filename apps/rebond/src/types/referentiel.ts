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