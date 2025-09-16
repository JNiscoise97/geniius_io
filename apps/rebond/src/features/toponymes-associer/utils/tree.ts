// features/toponymes-associer/utils/tree.ts
export type ToponymeNode = {
  lieu_id: string;
  label: string;
  toponyme_id: string;
  is_principal: boolean;
  children?: ToponymeNode[];
  variantes?: ToponymeNode[];
  path: ToponymeNode[];
};

export function buildTreeFromToponymes(
  toponymes: {
    toponyme_id: string;
    label: string;
    lieu_id: string;
    parent_id: string | null;
    is_principal: boolean;
  }[],
): ToponymeNode[] {
  const map = new Map<string, ToponymeNode>();
  const roots: ToponymeNode[] = [];

  toponymes.filter(t => t.is_principal).forEach(t => {
    map.set(t.lieu_id, {
      lieu_id: t.lieu_id,
      label: t.label,
      toponyme_id: t.toponyme_id,
      is_principal: true,
      children: [],
      variantes: [],
      path: [],
    });
  });

  toponymes.filter(t => !t.is_principal).forEach((t) => {
    const principal = map.get(t.lieu_id);
    if (principal) {
        const varianteNode: ToponymeNode = {
            lieu_id: t.lieu_id,
            label: t.label,
            toponyme_id: t.toponyme_id,
            is_principal: false,
            variantes: [],
            children: principal.children,
            path: [],
        };
        principal.variantes = principal.variantes || [];
        principal.variantes.push(varianteNode);
    }
});

  map.forEach((node, lieu_id) => {
    const parent_id = toponymes.find(t => t.lieu_id === lieu_id)?.parent_id;
    if (parent_id) {
      const parent = map.get(parent_id);
      if (parent) parent.children?.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (nodes: ToponymeNode[]) => {
    nodes.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
    nodes.forEach(node => {
      if (node.children) sortChildren(node.children);
      if (node.variantes) {
        node.variantes.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
      }
    });
  };

  sortChildren(roots);
  return roots;
}

export function enrichPaths(node: ToponymeNode, parentPath: ToponymeNode[] = []) {
  node.path = [...parentPath, node];
  node.children?.forEach(child => enrichPaths(child, node.path));
  node.variantes?.forEach(variant => {
    variant.path = [...parentPath, variant];
    variant.children?.forEach(child => enrichPaths(child, variant.path));
  });
}

export function isPathValid(path: ToponymeNode[]): boolean {
  if (!path || path.length === 0) return false;

  for (let i = 1; i < path.length; i++) {
    const parent = path[i - 1];
    const child = path[i];

    // Le parent canonique du child est à path[-2]
    const canonicalParent = child.path?.[child.path.length - 2];

    // Chemin mal enrichi
    if (!canonicalParent) return false;

    // ✅ Règle principale : on compare les LIEUX, pas les toponymes
    const sameParentLieu = parent.lieu_id === canonicalParent.lieu_id;

    // (Optionnel) filet de sécurité : accepte aussi si la variante choisie
    // est exactement la variante canonique mémorisée dans `path`.
    const sameCanonicalTopo = parent.toponyme_id === canonicalParent.toponyme_id;

    if (!sameParentLieu && !sameCanonicalTopo) return false;
  }

  return true;
}


export function filterTreeByFilter(node: ToponymeNode, term: string): ToponymeNode | null {
  const labelMatches = (label: string, t: string) => label.toLowerCase().includes(t.toLowerCase());
  const nodeOrVarianteMatches = (n: ToponymeNode, t: string) =>
    labelMatches(n.label, t) || (n.variantes?.some(v => labelMatches(v.label, t)) ?? false);

  const children = (node.children ?? [])
    .map(c => filterTreeByFilter(c, term))
    .filter((c): c is ToponymeNode => !!c);

  const variantes = (node.variantes ?? []).filter(v => labelMatches(v.label, term));

  const keep = nodeOrVarianteMatches(node, term) || children.length > 0 || variantes.length > 0;
  if (!keep) return null;

  return { ...node, children, variantes };
}

export function countMatches(node: ToponymeNode | null | undefined, term: string): number {
  if (!node || !term.trim()) return 0;
  const match = (s: string) => s?.toLowerCase().includes(term.toLowerCase());
  let total = 0;

  const walk = (n: ToponymeNode) => {
    if (match(n.label)) total++;
    (n.variantes ?? []).forEach(v => {
      if (match(v.label)) total++;
    });
    (n.children ?? []).forEach(walk);
  };

  if (node.lieu_id === 'root' && node.children) node.children.forEach(walk);
  else walk(node);

  return total;
}

export function addVarianteIntoTree(
  tree: ToponymeNode,
  parentLieuId: string,
  variante: ToponymeNode,
): ToponymeNode {
  const clone: ToponymeNode = {
    ...tree,
    children: tree.children?.map(c => addVarianteIntoTree(c, parentLieuId, variante)) ?? [],
    variantes: tree.variantes ? [...tree.variantes] : [],
    path: tree.path,
  };
  if (tree.lieu_id === parentLieuId && tree.is_principal) {
    clone.variantes = [...(clone.variantes ?? []), variante];
  }
  return clone;
}

export function addChildLieuIntoTree(
  tree: ToponymeNode,
  parentLieuId: string,
  child: ToponymeNode
): ToponymeNode {
  const clone: ToponymeNode = {
    ...tree,
    children: tree.children?.map(c => addChildLieuIntoTree(c, parentLieuId, child)) ?? [],
    variantes: tree.variantes ? [...tree.variantes] : [],
    path: tree.path,
  };
  if (tree.lieu_id === parentLieuId && tree.is_principal) {
    clone.children = [...(clone.children ?? []), child];
    clone.children.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  }
  return clone;
}
