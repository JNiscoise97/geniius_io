

type DictObj = {
  id?: string;
  label?: string; // neutre / canonique
  label_m?: string;
  label_f?: string;
  invariable?: boolean;
  position?: number;
};

function orderByPositions(labels: string[], positions?: number[]) {
  if (!labels?.length || !positions || positions.length !== labels.length) return labels ?? [];
  return labels
    .map((label, i) => ({ label, pos: positions[i] ?? i }))
    .sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0))
    .map((x) => x.label);
}

function chooseGendered(o: DictObj, sexe: 'M' | 'F' | null) {
  if (!o) return '';
  if (o.invariable) return o.label ?? o.label_m ?? o.label_f ?? '';
  if (sexe === 'F') return o.label_f ?? o.label ?? o.label_m ?? '';
  if (sexe === 'M') return o.label_m ?? o.label ?? o.label_f ?? '';
  return o.label ?? o.label_m ?? o.label_f ?? '';
}


export function toIds(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v?.ids)) return v.ids;
  if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
    return (v as DictObj[]).map((o) => o.id!).filter(Boolean);
  }
  return [];
}



/**
 * Retourne les labels d’affichage.
 * - Si field === 'profession_ref', choisit label_m / label_f selon `sexe` (sinon fallback label).
 * - Gère aussi les cas invariables.
 * - Si positions sont présentes, on ordonne (utile pour profession).
 * Backward-compatible : si on n’a pas label_m/label_f, on retombe sur label(s) existants.
 */
export function toLabels(v: any, opts?: { field?: string; sexe?: 'M' | 'F' | null }): string[] {
  const field = opts?.field;
  const sexe = opts?.sexe ?? null;

  if (!v) return [];

  // 1) Tableau de chaînes simple
  if (Array.isArray(v) && (v.length === 0 || typeof v[0] === 'string')) {
    return v as string[];
  }

  // 2) Forme canonique { ids, labels, positions, items? }
  if (typeof v === 'object' && Array.isArray(v.labels)) {
    // Si on a des "items" complets -> préférer la logique genre ici
    if (field === 'profession_ref' && Array.isArray((v as any).items)) {
      const items = (v as any).items as DictObj[];
      let labels = items.map((o) => chooseGendered(o, sexe)).filter(Boolean) as string[];
      const positions = items.map((o) => o.position).filter((n) => Number.isFinite(n)) as number[];
      if (positions.length) labels = orderByPositions(labels, positions);
      return labels;
    }
    // Fallback : labels neutres
    return v.labels as string[];
  }

  // 3) Tableau d’objets
  if (Array.isArray(v) && typeof v[0] === 'object') {
    const arr = v as DictObj[];
    if (field === 'profession_ref') {
      let labels = arr.map((o) => chooseGendered(o, sexe)).filter(Boolean) as string[];
      const positions = arr.map((o) => o.position).filter((n) => Number.isFinite(n)) as number[];
      if (positions.length) labels = orderByPositions(labels, positions);
      return labels;
    }
    // Autres dictionnaires : utiliser label simple
    return arr.map((o) => o.label!).filter(Boolean);
  }

  return [];
}