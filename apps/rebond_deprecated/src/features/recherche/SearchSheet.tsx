// SearchSheet.tsx

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  searchIndividus as apiSearchIndividus,
  searchNotaires as apiSearchNotaires,
  searchActeurs as apiSearchActeurs,
  searchDocuments as apiSearchDocuments,
  searchLieux as apiSearchLieux,
} from './api';
import {
  mapIndividu,
  mapNotaire,
  mapActeur,
  mapDocument,
  mapLieu,
} from './mappers';
import {
  IndividuItem,
  NotaireItem,
  MentionItem,
  DocumentItem,
  LieuItem,
} from './SearchItems';
import { Button } from '@/components/ui/button';

export default function SearchSheet() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 600);

  const [results, setResults] = useState<{
    individus: any[];
    notaires: any[];
    acteurs: any[];
    lieux: any[];
    documents: any[];
  }>({ individus: [], notaires: [], acteurs: [], lieux: [], documents: [] });

  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [openGroups, setOpenGroups] = useState<string[]>([
    'Individus',
    'Notaires',
    'Mentions',
    'Documents',
    'Lieux',
  ]);

  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({
    Individus: 3,
    Notaires: 3,
    Mentions: 3,
    Lieux: 3,
    Documents: 3,
  });

  useEffect(() => {
    if (!debounced.trim()) {
      setResults({ individus: [], notaires: [], acteurs: [], lieux: [], documents: [] });
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    (async () => {
      setIsSearching(true);
      const [ind, nots, acts, docs, lxs] = await Promise.all([
        apiSearchIndividus(debounced, { from: null as any, to: null as any, count: null }).then(r => r.rows.map(mapIndividu)),
        apiSearchNotaires(debounced, { from: null as any, to: null as any, count: null }).then(r => r.rows.map(mapNotaire)),
        apiSearchActeurs(debounced,  { from: null as any, to: null as any, count: null }).then(r => r.rows.map(mapActeur)),
        apiSearchDocuments(debounced).then(r => r.rows.map(mapDocument)),
        apiSearchLieux(debounced,    { from: null as any, to: null as any, count: null }).then(r => r.rows.map(mapLieu)),
      ]);
      setResults({
        individus: ind,
        notaires: nots,
        acteurs: acts,
        documents: docs,
        lieux: lxs,
      });
      setIsSearching(false);
      setHasSearched(true);
    })();
  }, [debounced]);

  const handleClear = () => {
    setQuery('');
    setResults({ individus: [], notaires: [], acteurs: [], lieux: [], documents: [] });
    setHasSearched(false);
    setVisibleCounts({
      Individus: 3,
      Notaires: 3,
      Mentions: 3,
      Lieux: 3,
      Documents: 3,
    });
  };

  const renderGroup = (title: string, items: any[]) => {
    const visibleCount = visibleCounts[title] || 3;
    const visibleItems = items.slice(0, visibleCount);
    const totalCount = items.length;

    const handleShowMore = () => {
      setVisibleCounts((prev) => ({
        ...prev,
        [title]: prev[title] + 3,
      }));
    };

    const handleVoirTout = () => {
      window.location.href = `/recherche?type=${title.toLowerCase()}&query=${encodeURIComponent(query)}`;
    };

    return (
      <AccordionItem value={title} key={title} className="mb-4">
        <AccordionTrigger className="text-[16px] font-semibold leading-6 mb-3 border-0 p-0 text-neutral-900">
          {title}
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              if (title === 'Individus') {
                return <IndividuItem key={item.id} item={item} query={query} />;
              }
              if (title === 'Notaires') {
                return <NotaireItem key={item.id} item={item} query={query} />;
              }
              if (title === 'Mentions') {
                return (
                  <MentionItem
                    key={item.id}
                    item={item}
                    query={query}
                  />
                );
              }
              if (title === 'Documents') {
                return (
                  <DocumentItem
                    key={`${item.source_table}-${item.acte_id}`}
                    item={item}
                    query={query}
                  />
                );
              }
              if (title === 'Lieux') {
                return <LieuItem key={item.id} item={item} query={query} />;
              }
              // Fallback
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl p-3 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="text-gray-900 dark:text-gray-300">
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
                </li>
              );
            })}
          </ul>

          {totalCount > visibleCount && visibleCount < 9 && (
            <Button
              onClick={handleShowMore}
              size="sm"
              variant="ghost"
              className="mt-2 p-3 text-blue-800 hover:text-blue-900 flex items-center gap-1 transition"
            >
              <ChevronDown className="w-4 h-4" />
              Voir plus
            </Button>
          )}

          {visibleCount >= 9 && totalCount > visibleCount && (
            <Button
              onClick={handleVoirTout}
              size="sm"
              variant="ghost"
              className="mt-2 p-3 text-blue-800 hover:text-blue-900 flex items-center gap-1 transition"
            >
              <ChevronRight className="w-4 h-4" />
              Voir tous les résultats
            </Button>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <button className="p-2 rounded-full hover:bg-gray-200">
                  <Search className="w-5 h-5" />
                </button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Ouvrir la recherche</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-[800px]">
        <div className="mt-10 pr-10 pl-10">
          <p className="text-sm text-muted-foreground mt-6 mb-2">
            Recherchez un acteur, un individu, un document ou un lieu. Les résultats sont regroupés par catégorie.
          </p>
          <div className="flex items-center border rounded px-2 py-1">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <Input
              className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="cursor-pointer ml-2" onClick={handleClear}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-gray-500 hover:text-gray-800"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Effacer la recherche</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {isSearching && (
            <div className="flex justify-center items-center mt-4">
              <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}

          <div className="overflow-y-auto max-h-[calc(100vh-150px)] pr-1 mt-4">
            {((results.acteurs && results.acteurs.length > 0) ||
              (results.individus && results.individus.length > 0) ||
              (results.notaires && results.notaires.length > 0) ||
              (results.documents && results.documents.length > 0) ||
              (results.lieux && results.lieux.length > 0)) && (
              <Accordion
                type="multiple"
                value={openGroups}
                onValueChange={setOpenGroups}
                className="mt-4"
              >
                {results.individus?.length > 0 && renderGroup('Individus', results.individus)}
                {results.notaires?.length > 0 && renderGroup('Notaires', results.notaires)}
                {results.acteurs?.length > 0 && renderGroup('Mentions', results.acteurs)}
                {results.documents?.length > 0 && renderGroup('Documents', results.documents)}
                {results.lieux?.length > 0 && renderGroup('Lieux', results.lieux)}
              </Accordion>
            )}

            {hasSearched &&
              !isSearching &&
              results.acteurs.length === 0 &&
              results.individus.length === 0 &&
              results.notaires.length === 0 &&
              results.documents.length === 0 &&
              results.lieux.length === 0 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Aucun résultat trouvé.
                </p>
              )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function useDebouncedValue<T>(value: T, delay = 500) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}