// features/etat-civil/validation/validators/acte.ts
import type { Acte, Acteur, Incoherence } from '../types';

export function vActeGlobaux(acte: Acte, entites: Acteur[]): Incoherence[] {
  const out: Incoherence[] = [];

  // Helpers
  const countRole = (role: string) => entites.filter(a => a.role === role).length;
  const hasRole = (role: string) => countRole(role) > 0;
  const push = (msg: string, level: 'error'|'warning'|'info' = 'error') =>
    out.push({ acteurId: acte.id, acteurLabel: '(acte)', message: msg, level });

  const isDeclarantNaissance = (a: Acteur) =>
    a.role === 'déclarant' ||
    ((a.role === 'père' || a.role === 'mère') && a.est_present === true);

  // Règles génériques
  const nbOfficiers = countRole('officier');
  if (nbOfficiers === 0) {
    push(`Un acteur avec le rôle "officier" est requis`, 'error');
  } else if (nbOfficiers > 1) {
    push(`Un seul "officier" attendu (actuellement ${nbOfficiers})`, 'warning');
  }

  // Règles par type d'acte
  switch (acte?.type_acte) {
    case 'naissance': {
      // ❗ au moins un enfant
      if (!hasRole('enfant')) {
        push(`Au moins un acteur avec le rôle "enfant" est requis dans un acte de naissance`, 'error');
      }
      const hasDeclarantNaissance = entites.some(isDeclarantNaissance);
      if (!hasDeclarantNaissance) {
        push(`Au moins un déclarant est attendu dans un acte de naissance (rôle "déclarant" ou parent présent)`, 'warning');
      }
      break;
    }

    case 'décès': {
      // ❗ au moins un défunt
      if (!hasRole('défunt')) {
        push(`Un acteur avec le rôle "défunt" est requis dans un acte de décès`, 'error');
      }
      
      const nbTemoins =
        countRole('témoin 1') +
        countRole('témoin 2') +
        countRole('témoin 3') +
        countRole('témoin 4');
      if (nbTemoins < 1) {
        push(`Au moins un témoin est requis dans un acte de décès`, 'error');
      }
      break;
    }

    case 'mariage': {
      // ✅ cohérence minimale mariage
      const nbEpoux = countRole('époux');
      const nbEpouse = countRole('épouse');
      if (nbEpoux === 0) push(`Un acteur "époux" est requis dans un acte de mariage`, 'error');
      if (nbEpouse === 0) push(`Un acteur "épouse" est requis dans un acte de mariage`, 'error');
      if (nbEpoux > 1) push(`Un seul "époux" attendu (actuellement ${nbEpoux})`, 'warning');
      if (nbEpouse > 1) push(`Une seule "épouse" attendue (actuellement ${nbEpouse})`, 'warning');

      // (recommandé) témoins
      const nbTemoins =
        countRole('témoin 1') + countRole('témoin 2') + countRole('témoin 3') + countRole('témoin 4');
      if (nbTemoins < 2) {
        push(`Au moins deux témoins sont généralement attendus dans un acte de mariage (trouvés: ${nbTemoins})`, 'warning');
      }
      break;
    }

    case 'reconnaissance': {
      // sujet attendu
      if (!hasRole('sujet')) {
        push(`Au moins un acteur "sujet" est requis dans un acte de reconnaissance`, 'error');
      }
      // (recommandé) au moins un déclarant
      if (!hasRole('déclarant')) {
        push(`Au moins un "déclarant" est attendu dans un acte de reconnaissance`, 'warning');
      }
      break;
    }

    default: {
      // Pour les autres types, pas de règle forte supplémentaire ici.
      break;
    }
  }

  return out;
}
