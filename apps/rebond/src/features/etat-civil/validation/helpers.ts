// features/etat-civil/validation/helpers.ts
import type { Acteur } from './types';

export const labelActeur = (a: Acteur) =>
  [a?.prenom, a?.nom].filter(Boolean).join(' ') || 'Acteur sans nom';

export const heureValide = (val: unknown) =>
  typeof val === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(val);

export const isNullish = (v: any) => v === null || v === undefined;
