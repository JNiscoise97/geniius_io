// features/etat-civil/validation/validators/index.ts
import type { Acte, Acteur, Incoherence, RelationPreview } from '../types';
import { ACTEUR_VALIDATORS } from './acteur';
import { vActeGlobaux } from './acte';

export function runAllValidators(
  acte: Acte,
  entites: Acteur[],
  relations: RelationPreview[],
): Incoherence[] {
  const out: Incoherence[] = [];
  out.push(...vActeGlobaux(acte, entites));
  const ctx = { acte, entites, relations };
  for (const a of entites) {
    for (const v of ACTEUR_VALIDATORS) {
      out.push(...v(a, ctx));
    }
  }
  return out;
}
