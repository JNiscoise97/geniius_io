//useToponymeFilter.ts

import { useMemo, useRef, useState } from 'react';
import { filterTreeByFilter, type ToponymeNode } from '@/features/toponymes-associer/utils/tree';

export function useToponymeFilter(rootNode: ToponymeNode | null) {
  const [filter, setFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredRoot = useMemo<ToponymeNode | null>(() => {
    if (!rootNode) return null;
    const term = filter.trim();
    if (!term) return rootNode;
    return filterTreeByFilter(rootNode, term);
  }, [rootNode, filter]);

  const clearFilter = () => setFilter('');

  return {
    // state
    filter, setFilter,
    showFilter, setShowFilter,
    // refs
    inputRef,
    // dérivés
    filteredRoot,
    clearFilter,
  };
}
