//useToponymeSearch.ts

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type ToponymeNode, countMatches } from '@/features/toponymes-associer/utils/tree';

// Tu peux injecter ici ta fonction de highlight visuel du match courant
type UseToponymeSearchOpts = {
  highlightCurrent?: (el: HTMLElement) => void;
};

export function useToponymeSearch(
  rootNode: ToponymeNode | null,
  filteredRoot: ToponymeNode | null,
  opts: UseToponymeSearchOpts = {}
) {
  const { highlightCurrent } = opts;

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const inputSearchRef = useRef<HTMLInputElement>(null);

  // stockage des éléments DOM qui matchent
  const matchRefSet = useRef<Set<HTMLElement>>(new Set());
  const matchesArrayRef = useRef<HTMLElement[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // focus auto quand la barre s’ouvre
  useEffect(() => {
    if (showSearch) {
      const t = setTimeout(() => inputSearchRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [showSearch]);

  // reset quand la recherche / l’arbre filtré change
  useEffect(() => {
    matchRefSet.current.clear();
    setCurrentMatchIndex(0);
  }, [search, filteredRoot]);

  // callback à passer aux items pour enregistrer un élément matché
  const registerMatchRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    matchRefSet.current.add(el);
  }, []);

  // snapshot DOM des matches + auto‑scroll sur le 1er
  const scrollToMatch = useCallback((index: number) => {
    const arr = matchesArrayRef.current;
    const count = arr.length;
    if (!count) return;

    const i = ((index % count) + count) % count;
    const el = arr[i];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (highlightCurrent) highlightCurrent(el);
    }
  }, [highlightCurrent]);

  useLayoutEffect(() => {
    matchesArrayRef.current = Array.from(matchRefSet.current);
    if (search.trim() && matchesArrayRef.current.length > 0) {
      setCurrentMatchIndex(0);
      scrollToMatch(0);
    }
  }, [filteredRoot, rootNode, search, showSearch, scrollToMatch]);

  const goToNextMatch = useCallback(() => {
    const count = matchesArrayRef.current.length;
    if (!count) return;
    const nextIndex = (currentMatchIndex + 1) % count;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  }, [currentMatchIndex, scrollToMatch]);

  const goToPrevMatch = useCallback(() => {
    const count = matchesArrayRef.current.length;
    if (!count) return;
    const prevIndex = (currentMatchIndex - 1 + count) % count;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(prevIndex);
  }, [currentMatchIndex, scrollToMatch]);

  // total de hits pour l’UI
  const totalMatches = useMemo(
    () => countMatches(filteredRoot ?? rootNode, search ?? ''),
    [filteredRoot, rootNode, search]
  );

  // calcule les lieux à ouvrir automatiquement pour afficher les hits
  const autoOpenSet = useMemo(() => {
    const term = (search ?? '').trim();
    const root = filteredRoot ?? rootNode;
    const set = new Set<string>();
    if (!term || !root) return set;

    const matches = (label: string) => label?.toLowerCase().includes(term.toLowerCase());

    const walk = (n: ToponymeNode): boolean => {
      const selfHit = matches(n.label);
      const variantHit = (n.variantes ?? []).some((v) => matches(v.label));
      let childHit = false;
      (n.children ?? []).forEach((c) => {
        if (walk(c)) childHit = true;
      });

      const hasHit = selfHit || variantHit || childHit;
      if (hasHit) {
        (n.path ?? []).forEach((p) => set.add(p.lieu_id));
        set.add(n.lieu_id);
      }
      return hasHit;
    };

    if (root.children?.length) root.children.forEach(walk);
    else walk(root);

    if (set.size > 0 && root?.lieu_id === 'root') set.add('root');
    return set;
  }, [search, filteredRoot, rootNode]);

  const clearSearch = () => setSearch('');

  return {
    // state
    search, setSearch,
    showSearch, setShowSearch,
    currentMatchIndex, totalMatches,

    // refs
    inputSearchRef,

    // actions
    registerMatchRef,
    goToNextMatch, goToPrevMatch,
    clearSearch,

    // dérivés
    autoOpenSet,
  };
}
