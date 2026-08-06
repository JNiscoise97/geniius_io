// SearchResultsPage.tsx

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, Loader2, Search } from 'lucide-react';

import {
  PAGE_SIZE,
  searchIndividus as apiSearchIndividus,
  searchNotaires as apiSearchNotaires,
  searchActeurs as apiSearchActeurs,
  searchDocuments as apiSearchDocuments,
  searchLieux as apiSearchLieux,
  type SortMentions,
  type SortLieux,
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

type TabKey = 'individus' | 'notaires' | 'mentions' | 'documents' | 'lieux';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'individus', label: 'Individus' },
  { key: 'notaires', label: 'Notaires' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'documents', label: 'Documents' },
  { key: 'lieux', label: 'Lieux' },
];

export default function SearchResultsPage() {
  const [params, setParams] = useSearchParams();
  const initialType = (params.get('type')?.toLowerCase() as TabKey) || 'mentions';
  const initialQuery = params.get('query') || '';

  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<TabKey>(TABS.find((t) => t.key === initialType)?.key ?? 'mentions');

  // Sorts
  const [mentionsSort, setMentionsSort] = useState<SortMentions>('date_asc');
  const [lieuxSort, setLieuxSort] = useState<SortLieux>('alpha');

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data + cursors
  const [individus, setIndividus] = useState<any[]>([]);
  const [individusFrom, setIndividusFrom] = useState(0);
  const [individusDone, setIndividusDone] = useState(false);
  const [totalIndividus, setTotalIndividus] = useState<number>(0);

  const [notaires, setNotaires] = useState<any[]>([]);
  const [notairesFrom, setNotairesFrom] = useState(0);
  const [notairesDone, setNotairesDone] = useState(false);
  const [totalNotaires, setTotalNotaires] = useState<number>(0);

  const [mentions, setMentions] = useState<any[]>([]);
  const [mentionsFrom, setMentionsFrom] = useState(0);
  const [mentionsDone, setMentionsDone] = useState(false);
  const [totalMentions, setTotalMentions] = useState<number>(0);

  const [docsAll, setDocsAll] = useState<any[]>([]);
  const [docsVisible, setDocsVisible] = useState(PAGE_SIZE);
  const [totalDocuments, setTotalDocuments] = useState<number>(0); // RPC: total = docsAll.length

  const [lieux, setLieux] = useState<any[]>([]);
  const [lieuxFrom, setLieuxFrom] = useState(0);
  const [lieuxDone, setLieuxDone] = useState(false);
  const [totalLieux, setTotalLieux] = useState<number>(0);

  // Sync URL when query/tab changes
  useEffect(() => {
    setParams({ type: tab, query });
  }, [tab, query, setParams]);

  // Trigger search when query or sorts change
  useEffect(() => {
    runFullSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mentionsSort, lieuxSort]);

  const runFullSearch = async (reset = false) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      if (reset) {
        setIndividus([]); setIndividusFrom(0); setIndividusDone(false); setTotalIndividus(0);
        setNotaires([]); setNotairesFrom(0); setNotairesDone(false); setTotalNotaires(0);
        setMentions([]); setMentionsFrom(0); setMentionsDone(false); setTotalMentions(0);
        setDocsAll([]); setDocsVisible(PAGE_SIZE); setTotalDocuments(0);
        setLieux([]); setLieuxFrom(0); setLieuxDone(false); setTotalLieux(0);
      }

      // Premier batch + totals (count exact) en parallèle
      const [ind, nots, acts, docs, lxs] = await Promise.all([
        apiSearchIndividus(query, { from: 0, to: PAGE_SIZE - 1, count: 'exact' }),
        apiSearchNotaires(query, { from: 0, to: PAGE_SIZE - 1, count: 'exact' }),
        apiSearchActeurs(query, { from: 0, to: PAGE_SIZE - 1, sort: mentionsSort, count: 'exact' }),
        apiSearchDocuments(query), // RPC non paginé
        apiSearchLieux(query, { from: 0, to: PAGE_SIZE - 1, sort: lieuxSort, count: 'exact' }),
      ]);

      // Individus
      const indRows = ind.rows.map(mapIndividu);
      setIndividus(indRows);
      setIndividusFrom(indRows.length);
      setIndividusDone(indRows.length < PAGE_SIZE);
      setTotalIndividus(ind.total);

      // Notaires
      const notRows = nots.rows.map(mapNotaire);
      setNotaires(notRows);
      setNotairesFrom(notRows.length);
      setNotairesDone(notRows.length < PAGE_SIZE);
      setTotalNotaires(nots.total);

      // Mentions
      const actRows = acts.rows.map(mapActeur);
      setMentions(actRows);
      setMentionsFrom(actRows.length);
      setMentionsDone(actRows.length < PAGE_SIZE);
      setTotalMentions(acts.total);

      // Documents (client-side paginate)
      const docsRows = docs.rows.map(mapDocument);
      setDocsAll(docsRows);
      setDocsVisible(Math.min(PAGE_SIZE, docsRows.length));
      setTotalDocuments(docsRows.length); // faute de RPC paginé + count

      // Lieux
      const lxsRows = lxs.rows.map(mapLieu);
      setLieux(lxsRows);
      setLieuxFrom(lxsRows.length);
      setLieuxDone(lxsRows.length < PAGE_SIZE);
      setTotalLieux(lxs.total);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async (which: TabKey) => {
    if (which === 'documents') {
      setDocsVisible((v) => Math.min(v + PAGE_SIZE, docsAll.length));
      return;
    }
    if (which === 'individus' && !individusDone) {
      const { rows } = await apiSearchIndividus(query, { from: individusFrom, to: individusFrom + PAGE_SIZE - 1, count: null });
      const mapped = rows.map(mapIndividu);
      setIndividus((p) => [...p, ...mapped]);
      setIndividusFrom((p) => p + mapped.length);
      setIndividusDone(mapped.length < PAGE_SIZE);
    }
    if (which === 'notaires' && !notairesDone) {
      const { rows } = await apiSearchNotaires(query, { from: notairesFrom, to: notairesFrom + PAGE_SIZE - 1, count: null });
      const mapped = rows.map(mapNotaire);
      setNotaires((p) => [...p, ...mapped]);
      setNotairesFrom((p) => p + mapped.length);
      setNotairesDone(mapped.length < PAGE_SIZE);
    }
    if (which === 'mentions' && !mentionsDone) {
      const { rows } = await apiSearchActeurs(query, { from: mentionsFrom, to: mentionsFrom + PAGE_SIZE - 1, sort: mentionsSort, count: null });
      const mapped = rows.map(mapActeur);
      setMentions((p) => [...p, ...mapped]);
      setMentionsFrom((p) => p + mapped.length);
      setMentionsDone(mapped.length < PAGE_SIZE);
    }
    if (which === 'lieux' && !lieuxDone) {
      const { rows } = await apiSearchLieux(query, { from: lieuxFrom, to: lieuxFrom + PAGE_SIZE - 1, sort: lieuxSort, count: null });
      const mapped = rows.map(mapLieu);
      setLieux((p) => [...p, ...mapped]);
      setLieuxFrom((p) => p + mapped.length);
      setLieuxDone(mapped.length < PAGE_SIZE);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">Accueil</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm">Recherche</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center border rounded px-2 py-1 flex-1">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <Input
            className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Rechercher..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runFullSearch(true); }}
          />
          {query && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="cursor-pointer ml-2" onClick={() => setQuery('')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 hover:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Effacer</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Button onClick={() => runFullSearch(true)} disabled={!query.trim() || loading}>
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Recherche...</>) : 'Rechercher'}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mt-6">
        <TabsList className="flex flex-wrap gap-2">
          {TABS.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} className="px-3 py-1">
              {label}
              <span className="ml-2 text-xs text-muted-foreground">
                {key === 'individus' && `${totalIndividus || 0}`}
                {key === 'notaires' && `${totalNotaires || 0}`}
                {key === 'mentions' && `${totalMentions || 0}`}
                {key === 'documents' && `${totalDocuments || 0}`}
                {key === 'lieux' && `${totalLieux || 0}`}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Mentions */}
        <TabsContent value="mentions" className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              {mentions.length} résultats affichés sur <strong>{totalMentions}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trier par</span>
              <Select value={mentionsSort} onValueChange={(v: any) => setMentionsSort(v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tri"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Date décroissante</SelectItem>
                  <SelectItem value="date_asc">Date croissante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ul className="space-y-1">
            {mentions.map((m) => (<MentionItem key={m.id} item={m} query={query} />))}
          </ul>

          {!mentionsDone && (
            <div className="flex justify-center mt-3">
              <Button variant="ghost" onClick={() => loadMore('mentions')}>
                <ChevronDown className="w-4 h-4 mr-1"/> Charger plus
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Individus */}
        <TabsContent value="individus" className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">
            {individus.length} résultats affichés sur <strong>{totalIndividus}</strong>
          </div>
          <ul className="space-y-1">
            {individus.map((it) => (<IndividuItem key={it.id} item={it} query={query} />))}
          </ul>
          {!individusDone && (
            <div className="flex justify-center mt-3">
              <Button variant="ghost" onClick={() => loadMore('individus')}>
                <ChevronDown className="w-4 h-4 mr-1"/> Charger plus
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Notaires */}
        <TabsContent value="notaires" className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">
            {notaires.length} résultats affichés sur <strong>{totalNotaires}</strong>
          </div>
          <ul className="space-y-1">
            {notaires.map((it) => (<NotaireItem key={it.id} item={it} query={query} />))}
          </ul>
          {!notairesDone && (
            <div className="flex justify-center mt-3">
              <Button variant="ghost" onClick={() => () => loadMore('notaires')}>
                <ChevronDown className="w-4 h-4 mr-1"/> Charger plus
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">
            {docsVisible} résultats affichés sur <strong>{totalDocuments}</strong>
          </div>
          <ul className="space-y-1">
            {docsAll.slice(0, docsVisible).map((d) => (<DocumentItem key={`${d.source_table}-${d.acte_id}`} item={d} query={query} />))}
          </ul>
          {docsVisible < docsAll.length && (
            <div className="flex justify-center mt-3">
              <Button variant="ghost" onClick={() => loadMore('documents')}>
                <ChevronDown className="w-4 h-4 mr-1"/> Charger plus
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Lieux */}
        <TabsContent value="lieux" className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              {lieux.length} résultats affichés sur <strong>{totalLieux}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trier par</span>
              <Select value={lieuxSort} onValueChange={(v: any) => setLieuxSort(v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tri"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha">Libellé (A→Z)</SelectItem>
                  <SelectItem value="mentions">Nombre de mentions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ul className="space-y-1">
            {lieux.map((lx) => (<LieuItem key={lx.id} item={lx} query={query} />))}
          </ul>
          {!lieuxDone && (
            <div className="flex justify-center mt-3">
              <Button variant="ghost" onClick={() => loadMore('lieux')}>
                <ChevronDown className="w-4 h-4 mr-1"/> Charger plus
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

      {!loading && !error && query && [individus, notaires, mentions, docsAll, lieux].every((arr) => arr.length === 0) && (
        <p className="text-center text-sm text-muted-foreground mt-8">Aucun résultat trouvé.</p>
      )}
    </div>
  );
}
