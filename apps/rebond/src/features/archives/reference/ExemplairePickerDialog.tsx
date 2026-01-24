//ExemplairePickerDialog.tsx

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

import type { ExemplairePick } from '@/features/archives/reference/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ExternalLink, Check, Search, Filter, X, Plus, AlertTriangle } from 'lucide-react';

type PickerMode = 'acte' | 'registre';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  mode: PickerMode;
  registreId?: string | null;
  excludeExemplaireIds?: string[];

  onlyOnline: boolean;
  setOnlyOnline: (v: boolean) => void;

  q: string;
  setQ: (v: string) => void;

  onPick: (row: ExemplairePick) => void;
};

// mêmes champs que dans tes queries supabase (v_exemplaires_pick)
const PICK_SELECT =
  'exemplaire_id,nature_id,unite_id,unite_titre,cote_locale,pagination_type,depot_nom,depot_is_online, depot_is_physical,institution_nom,institution_sigle,url_base,plateforme_code';

function badgeType(t: ExemplairePick['nature_id']) {
  if (t === 'numerisation') return 'Numérisation';
  if (t === 'microfilm') return 'Microfilm';
  return 'Original';
}

function isOnline(r: ExemplairePick) {
  return r.depot_is_online || Boolean((r.url_base ?? '').trim());
}

function normalizeRows(rows: any[]): ExemplairePick[] {
  return (rows ?? []).map((r) => ({
    exemplaire_id: r.exemplaire_id,
    nature_id: r.nature_id,
    unite_id: r.unite_id,
    unite_titre: r.unite_titre,
    cote_locale: r.cote_locale,
    pagination_type: r.pagination_type,
    depot_nom: r.depot_nom,
    depot_is_online: r.depot_is_online,
    depot_is_physical: r.depot_is_physical,
    institution_nom: r.institution_nom,
    institution_sigle: r.institution_sigle,
    url_base: r.url_base,
    plateforme_code: r.plateforme_code,
  }));
}

// -----------------------------------------------------------------------------
// Création (UI only) : Unité + Exemplaire + Accès
// -----------------------------------------------------------------------------
type CreateDraft = {
  unite_titre: string;
  cote_locale: string;
  pagination_type: '' | NonNullable<ExemplairePick['pagination_type']>;
  depot_nom: string;
  depot_is_online: ExemplairePick['depot_is_online'];
  depot_is_physical: ExemplairePick['depot_is_physical'];
  institution_nom: string;
  institution_sigle: string;
  nature_id: ExemplairePick['nature_id'];
  url_base: string;
  plateforme_code: string;
};

type UniteCreateDraft = {
  depot_id: string | null; // REQUIRED
  type_unite: '' | NonNullable<ExemplairePick['pagination_type']>; // REQUIRED
  titre: string; // REQUIRED

  cote: string;

  pagination_type: '' | 'vues' | 'pages' | 'folios' | 'images';
  nb_pages: string; // input text -> parse int

  couverture_label: string;
  couverture_sort_start: string; // parse int
  couverture_sort_end: string; // parse int

  description: string;
};

function toUniteInsert(d: UniteCreateDraft) {
  const trimOrNull = (s: string) => (s.trim() ? s.trim() : null);
  const intOrNull = (s: string) => {
    const t = s.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };
  const dateOrNull = (s: string) => (s.trim() ? s.trim() : null);

  return {
    depot_id: d.depot_id!,
    type_unite: d.type_unite,
    titre: d.titre.trim(),

    cote: trimOrNull(d.cote),

    pagination_type: d.pagination_type ? d.pagination_type : null,
    nb_pages: intOrNull(d.nb_pages),

    couverture_label: trimOrNull(d.couverture_label),
    couverture_sort_start: intOrNull(d.couverture_sort_start),
    couverture_sort_end: intOrNull(d.couverture_sort_end),

    description: trimOrNull(d.description),
  };
}

function makeDefaultDraftFromQuery(q: string): CreateDraft {
  const guessTitle = q.trim() ? q.trim() : '';
  return {
    unite_titre: guessTitle,
    cote_locale: '',
    pagination_type: '',
    depot_nom: '',
    depot_is_online: false,
    depot_is_physical: true,
    institution_nom: '',
    institution_sigle: '',
    nature_id: 'numerisation',
    url_base: '',
    plateforme_code: '',
  };
}

function norm(s: string) {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function seemsDuplicate(d: CreateDraft, existing: ExemplairePick[]) {
  const titre = norm(d.unite_titre);
  const cote = norm(d.cote_locale);
  const inst = norm(d.institution_sigle || d.institution_nom);

  if (!titre && !cote) return [];

  const scored = existing
    .map((r) => {
      const rTitre = norm(r.unite_titre);
      const rCote = norm(r.cote_locale || '');
      const rInst = norm(r.institution_sigle || r.institution_nom);

      // score très simple
      let score = 0;
      if (titre && rTitre.includes(titre)) score += 2;
      if (titre && titre.includes(rTitre)) score += 2;
      if (cote && rCote === cote) score += 4;
      if (inst && rInst === inst) score += 1;

      return { r, score };
    })
    .filter((x) => x.score >= 3) // seuil
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.r);

  return scored;
}

function makeLocalPickFromDraft(d: CreateDraft): ExemplairePick {
  // ⚠️ IDs locaux (non UUID). OK pour UI; tu les remplaceras après insert DB.
  const now = Date.now();
  const exemplaire_id = `local-man-${now}`;
  const unite_id = `local-uni-${now}`;

  const depot_is_online = d.depot_is_online;
  const depot_is_physical = d.depot_is_physical;
  const url_base = d.url_base?.trim() ? d.url_base.trim() : null;

  return {
    exemplaire_id,
    nature_id: d.nature_id,

    unite_id,
    unite_titre: d.unite_titre.trim() || '(Sans titre)',
    cote_locale: d.cote_locale.trim() ? d.cote_locale.trim() : null,
    pagination_type: (d.pagination_type || null) as any,

    depot_nom:
      d.depot_nom.trim() || (depot_is_online ? 'Dépôt en ligne' : 'Dépôt physique'),
    
    depot_is_online,
    depot_is_physical,

    institution_nom: d.institution_nom.trim() || 'Institution',
    institution_sigle: d.institution_sigle.trim() ? d.institution_sigle.trim() : null,

    url_base,
    plateforme_code: d.plateforme_code.trim() ? d.plateforme_code.trim() : null,
  };
}

export function ExemplairePickerDialog({
  open,
  onOpenChange,
  mode,
  registreId,
  excludeExemplaireIds = [],
  onlyOnline,
  setOnlyOnline,
  q,
  setQ,
  onPick,
}: Props) {
  // UI
  const [typeFilter, setTypeFilter] = useState<ExemplairePick['nature_id'] | 'all'>(
    'all',
  );
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [sort, setSort] = useState<'relevance' | 'institution' | 'title'>('relevance');

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // DATA
  const [loadingRegistre, setLoadingRegistre] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errRegistre, setErrRegistre] = useState<string | null>(null);
  const [errSearch, setErrSearch] = useState<string | null>(null);

  const [registreRows, setRegistreRows] = useState<ExemplairePick[]>([]);
  const [searchRows, setSearchRows] = useState<ExemplairePick[]>([]);

  // Local rows created in UI (no DB yet)
  const [localRows, setLocalRows] = useState<ExemplairePick[]>([]);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<'unite' | 'exemplaire' | 'acces'>('unite');
  const [draft, setDraft] = useState<CreateDraft>(() => makeDefaultDraftFromQuery(''));
  const [forceCreate, setForceCreate] = useState(false); // ignore duplicates warning

  const excludedKey = useMemo(
    () => excludeExemplaireIds.slice().sort().join(','),
    [excludeExemplaireIds],
  );
  const excludedSet = useMemo(() => new Set(excludeExemplaireIds), [excludedKey]);

  const allLoadedRows = useMemo(
    () => [...localRows, ...registreRows, ...searchRows],
    [localRows, registreRows, searchRows],
  );

  const institutions = useMemo(() => {
    const set = new Set<string>();
    for (const r of allLoadedRows) {
      set.add(r.institution_sigle || r.institution_nom);
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allLoadedRows]);

  const [depots, setDepots] = useState<{ id: string; nom: string }[]>([]);
  useEffect(() => {
    if (!createOpen) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('ref_depots')
        .select('id, nom')
        .order('nom', { ascending: true })
        .limit(500);
      if (cancelled) return;
      if (!error) setDepots((data ?? []) as any);
    })();
    return () => {
      cancelled = true;
    };
  }, [createOpen]);

  // ---------------------------------------------------------------------------
  // Reset léger à l’ouverture
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    setErrRegistre(null);
    setErrSearch(null);
    setSelectedId(null);
    // garde q/onlyOnline contrôlés par le parent
  }, [open]);

  // ---------------------------------------------------------------------------
  // Section "Du registre associé" (uniquement en mode acte)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    if (mode !== 'acte') {
      setRegistreRows([]);
      setErrRegistre(null);
      setLoadingRegistre(false);
      return;
    }

    if (!registreId) {
      setRegistreRows([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingRegistre(true);
      setErrRegistre(null);

      const { data: regCit, error: regErr } = await supabase
        .from('etat_civil_registre_citations')
        .select('exemplaire_id, sort_order')
        .eq('registre_id', registreId)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (regErr) {
        setErrRegistre(regErr.message);
        setRegistreRows([]);
        setLoadingRegistre(false);
        return;
      }

      const orderedIds = (regCit ?? [])
        .map((r: any) => r.exemplaire_id)
        .filter(Boolean) as string[];

      const uniqOrderedIds: string[] = [];
      const seen = new Set<string>();
      for (const id of orderedIds) {
        if (seen.has(id)) continue;
        seen.add(id);
        if (excludedSet.has(id)) continue;
        uniqOrderedIds.push(id);
      }

      if (!uniqOrderedIds.length) {
        setRegistreRows([]);
        setLoadingRegistre(false);
        return;
      }

      let query = supabase
        .from('v_exemplaires_pick')
        .select(PICK_SELECT)
        .in('exemplaire_id', uniqOrderedIds);

      if (onlyOnline) {
        query = query.or('depot_is_online.eq.true,url_base.not.is.null');
      }

      const { data: pickData, error: pickErr } = await query.limit(200);

      if (cancelled) return;

      if (pickErr) {
        setErrRegistre(pickErr.message);
        setRegistreRows([]);
        setLoadingRegistre(false);
        return;
      }

      const rows = normalizeRows(pickData as any[]);

      const order = new Map(uniqOrderedIds.map((id, i) => [id, i]));
      rows.sort(
        (a, b) => (order.get(a.exemplaire_id) ?? 9999) - (order.get(b.exemplaire_id) ?? 9999),
      );

      let filtered = rows;
      if (typeFilter !== 'all')
        filtered = filtered.filter((r) => r.nature_id === typeFilter);
      if (institutionFilter !== 'all')
        filtered = filtered.filter(
          (r) => (r.institution_sigle || r.institution_nom) === institutionFilter,
        );

      setRegistreRows(filtered);
      setLoadingRegistre(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, mode, registreId, excludedKey, onlyOnline, typeFilter, institutionFilter]);

  // ---------------------------------------------------------------------------
  // Section "Recherche globale" (v_exemplaires_pick)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    const needle = q.trim();

    if (!needle) {
      setSearchRows([]);
      setErrSearch(null);
      setLoadingSearch(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingSearch(true);
      setErrSearch(null);

      let query = supabase.from('v_exemplaires_pick').select(PICK_SELECT).limit(80);

      query = query.or(
        [
          `unite_titre.ilike.%${needle}%`,
          `cote_locale.ilike.%${needle}%`,
          `institution_nom.ilike.%${needle}%`,
          `institution_sigle.ilike.%${needle}%`,
          `depot_nom.ilike.%${needle}%`,
        ].join(','),
      );

      if (onlyOnline) {
        query = query.or('depot_is_online.eq.true,url_base.not.is.null');
      }

      if (typeFilter !== 'all') {
        query = query.eq('nature_id', typeFilter);
      }

      if (institutionFilter !== 'all') {
        query = query.or(
          `institution_sigle.eq.${institutionFilter},institution_nom.eq.${institutionFilter}`,
        );
      }

      if (excludeExemplaireIds.length) {
        const quoted = excludeExemplaireIds.map((id) => `"${id}"`).join(',');
        query = query.not('exemplaire_id', 'in', `(${quoted})`);
      }

      if (sort === 'institution') {
        query = query
          .order('institution_sigle', { ascending: true })
          .order('unite_titre', { ascending: true });
      } else if (sort === 'title') {
        query = query.order('unite_titre', { ascending: true });
      } else {
        query = query
          .order('institution_sigle', { ascending: true })
          .order('unite_titre', { ascending: true });
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        setErrSearch(error.message);
        setSearchRows([]);
      } else {
        setSearchRows(normalizeRows(data as any[]));
      }

      setLoadingSearch(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, q, onlyOnline, typeFilter, institutionFilter, sort, excludedKey]);

  // ---------------------------------------------------------------------------
  // Sélection & preview
  // ---------------------------------------------------------------------------
  const selected = useMemo(() => {
    const all = allLoadedRows;
    const fallbackId = all[0]?.exemplaire_id ?? null;
    const id = selectedId ?? fallbackId;
    if (!id) return null;
    return all.find((r) => r.exemplaire_id === id) ?? null;
  }, [selectedId, allLoadedRows]);

  function resetFilters() {
    setOnlyOnline(false);
    setTypeFilter('all');
    setInstitutionFilter('all');
    setSort('relevance');
  }

  function ResultRow({ r }: { r: ExemplairePick }) {
    const active = selected?.exemplaire_id === r.exemplaire_id;
    const online = isOnline(r);
    const sig = r.institution_sigle || r.institution_nom;

    return (
      <button
        type='button'
        onClick={() => setSelectedId(r.exemplaire_id)}
        className={[
          'w-full rounded-xl border p-3 text-left transition',
          active ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50',
        ].join(' ')}
      >
        <div className='flex flex-wrap items-center gap-2'>
          <div className='text-sm font-semibold text-slate-900'>{r.unite_titre}</div>

          <Badge variant='secondary'>{sig}</Badge>
          <Badge variant='outline'>{badgeType(r.nature_id)}</Badge>

          {online ? (
            <Badge className='border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50'>
              En ligne
            </Badge>
          ) : (
            <Badge className='border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50'>
              Sur place
            </Badge>
          )}

          {r.pagination_type ? (
            <Badge variant='outline'>pagination: {r.pagination_type}</Badge>
          ) : null}
        </div>

        <div className='mt-1 text-xs text-slate-600'>
          {r.institution_nom} · {r.depot_nom}
          {r.cote_locale ? ` · ${r.cote_locale}` : ''}
        </div>

        {r.url_base ? (
          <div className='mt-2 text-[11px] text-slate-500 break-all'>
            URL: <span className='font-mono'>{r.url_base}</span>
          </div>
        ) : null}
      </button>
    );
  }

  const registreTitle = registreId
    ? 'Sources du registre associé'
    : 'Sources du registre associé (aucun registre)';

  // ---------------------------------------------------------------------------
  // CTA "Créer"
  // ---------------------------------------------------------------------------
  const openCreate = () => {
    setDraft(makeDefaultDraftFromQuery(q));
    setCreateStep('unite');
    setForceCreate(false);
    setCreateOpen(true);
  };

  const duplicates = useMemo(() => seemsDuplicate(draft, allLoadedRows), [draft, allLoadedRows]);

  const canCreate =
    Boolean(draft.unite_titre.trim()) &&
    Boolean(draft.depot_nom.trim()) &&
    Boolean(draft.institution_nom.trim()) &&
    (draft.depot_is_physical || Boolean(draft.url_base.trim()));

  const shouldWarnDuplicates = duplicates.length > 0 && !forceCreate;

  const createAndSelect = async () => {
    // 1) garde-fou
    if (!canCreate) return;
    if (shouldWarnDuplicates) return;

    // 2) Création locale
    const row = makeLocalPickFromDraft(draft);

    // 3) TODO DB (facultatif)
    // Ici tu brancheras:
    // - ref_unites_documentaires insert (en retrouvant depot_id etc.)
    // - ref_exemplaires insert
    // - ref_acces_numeriques insert si url_base
    //
    // Ensuite tu remplaces les ids "local-*" par les UUID DB et tu continues.

    setLocalRows((prev) => [row, ...prev]);
    setSelectedId(row.exemplaire_id);

    // sélection immédiate dans le parent (UX attendue)
    onPick(row);

    setCreateOpen(false);
    // Option : fermer le picker directement comme quand on clique "Choisir"
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className='flex flex-col p-0'
          style={{ width: '90vw', height: '90vh', maxWidth: 'none', maxHeight: 'none' }}
        >
          <DialogHeader className='border-b bg-slate-50 px-4 py-3'>
            <DialogTitle className='text-sm font-semibold text-slate-900'>
              Choisir une source / exemplaire
            </DialogTitle>

            <div className='mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='text-xs text-slate-600'>
                {mode === 'acte'
                  ? 'Mode acte : suggestions depuis le registre associé + recherche globale'
                  : 'Mode registre : recherche globale'}
              </div>

              <div className='flex flex-wrap items-center gap-3'>
                <div className='flex items-center gap-2'>
                  <Checkbox
                    checked={onlyOnline}
                    onCheckedChange={(v) => setOnlyOnline(Boolean(v))}
                    id='onlyOnline'
                  />
                  <label htmlFor='onlyOnline' className='text-sm text-slate-700'>
                    En ligne uniquement
                  </label>
                </div>

                <Button variant='ghost' size='sm' onClick={resetFilters}>
                  <X className='h-4 w-4 mr-2' />
                  Réinitialiser filtres
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-0'>
            {/* LEFT: results */}
            <div className='lg:col-span-7 border-r border-slate-200 min-h-0 flex flex-col'>
              {/* toolbar */}
              <div className='px-4 py-3 space-y-3'>
                <div className='flex items-center gap-2'>
                  <Search className='h-4 w-4 text-slate-500' />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder='Rechercher : Deshaies 1859 / ANOM / cote / dépôt…'
                  />
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  <div className='inline-flex items-center gap-2 text-xs text-slate-600'>
                    <Filter className='h-4 w-4' />
                    Filtres
                  </div>

                  {/* type filter */}
                  <div className='inline-flex rounded-lg border border-slate-200 overflow-hidden'>
                    {(['all', 'numerisation', 'microfilm', 'original'] as const).map((t) => (
                      <button
                        key={t}
                        type='button'
                        onClick={() => setTypeFilter(t)}
                        className={[
                          'px-3 py-1.5 text-xs',
                          typeFilter === t
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-50',
                        ].join(' ')}
                      >
                        {t === 'all' ? 'Tous' : badgeType(t)}
                      </button>
                    ))}
                  </div>

                  {/* institution filter */}
                  <div className='inline-flex rounded-lg border border-slate-200 overflow-hidden'>
                    <select
                      className='px-3 py-1.5 text-xs bg-white'
                      value={institutionFilter}
                      onChange={(e) => setInstitutionFilter(e.target.value)}
                    >
                      {institutions.map((v) => (
                        <option key={v} value={v}>
                          {v === 'all' ? 'Toutes institutions' : v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* sort */}
                  <div className='inline-flex rounded-lg border border-slate-200 overflow-hidden'>
                    <select
                      className='px-3 py-1.5 text-xs bg-white'
                      value={sort}
                      onChange={(e) => setSort(e.target.value as any)}
                    >
                      <option value='relevance'>Tri : pertinence</option>
                      <option value='institution'>Tri : institution</option>
                      <option value='title'>Tri : titre</option>
                    </select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className='px-4 py-3 flex-1 min-h-0'>
                <Tabs
                  defaultValue={mode === 'acte' ? 'registre' : 'recherche'}
                  className='h-full flex flex-col'
                >
                  <TabsList>
                    {mode === 'acte' ? (
                      <TabsTrigger value='registre'>Du registre associé</TabsTrigger>
                    ) : null}
                    <TabsTrigger value='recherche'>Recherche globale</TabsTrigger>
                    {localRows.length ? (
                      <TabsTrigger value='local'>Ajoutées (local)</TabsTrigger>
                    ) : null}
                  </TabsList>

                  {mode === 'acte' ? (
                    <TabsContent value='registre' className='mt-3 flex-1 min-h-0'>
                      <div className='text-xs text-slate-600 mb-2'>
                        {registreTitle} — exclut ce qui est déjà lié à l’acte.
                      </div>

                      <ScrollArea className='h-full pr-3'>
                        <div className='space-y-2 pb-28'>
                          {loadingRegistre ? (
                            <div className='text-sm text-slate-600'>Chargement…</div>
                          ) : errRegistre ? (
                            <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
                              {errRegistre}
                            </div>
                          ) : !registreId ? (
                            <div className='text-sm text-slate-600'>
                              Aucun registre associé (registreId absent).
                            </div>
                          ) : registreRows.length === 0 ? (
                            <div className='text-sm text-slate-600'>
                              Aucune suggestion (tout est exclu ou ne correspond pas aux filtres).
                            </div>
                          ) : (
                            registreRows.map((r) => <ResultRow key={r.exemplaire_id} r={r} />)
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  ) : null}

                  <TabsContent value='recherche' className='mt-3 flex-1 min-h-0'>
                    <div className='text-xs text-slate-600 mb-2'>
                      Tape une recherche. Exemple : “Deshaies 1859”, “ANOM”, “CAOM EC”, une cote,
                      etc.
                    </div>

                    <ScrollArea className='h-full pr-3'>
                      <div className='space-y-2 pb-28'>
                        {!q.trim() ? (
                          <div className='text-sm text-slate-600'>
                            Saisis un terme pour lancer la recherche.
                          </div>
                        ) : loadingSearch ? (
                          <div className='text-sm text-slate-600'>Recherche…</div>
                        ) : errSearch ? (
                          <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
                            {errSearch}
                            <div className='mt-1 text-xs text-red-700'>
                              Astuce : vérifie la vue{' '}
                              <span className='font-mono'>v_exemplaires_pick</span>.
                            </div>
                          </div>
                        ) : searchRows.length === 0 ? (
                          <div className='text-sm text-slate-600'>Aucun résultat.</div>
                        ) : (
                          searchRows.map((r) => <ResultRow key={r.exemplaire_id} r={r} />)
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {localRows.length ? (
                    <TabsContent value='local' className='mt-3 flex-1 min-h-0'>
                      <div className='text-xs text-slate-600 mb-2'>
                        Sources créées localement (IHM) — à brancher DB ensuite.
                      </div>
                      <ScrollArea className='h-full pr-3'>
                        <div className='space-y-2 pb-28'>
                          {localRows.map((r) => (
                            <ResultRow key={r.exemplaire_id} r={r} />
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  ) : null}
                </Tabs>
              </div>

              {/* Footer “Créer” — toujours visible */}
              <div className='border-t border-slate-200 bg-white px-4 py-3'>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='text-xs text-slate-600'>
                    Rien ne correspond ? Crée une nouvelle unité / exemplaire.
                  </div>
                  <Button variant='outline' onClick={openCreate}>
                    <Plus className='h-4 w-4 mr-2' />
                    Créer une nouvelle source
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT: preview */}
            <div className='lg:col-span-5 p-4 min-h-0 overflow-auto'>
              <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <div className='text-sm font-semibold text-slate-900'>Aperçu</div>
                    <div className='text-xs text-slate-600'>
                      Clique une ligne à gauche pour voir le détail.
                    </div>
                  </div>

                  <Button
                    disabled={!selected}
                    onClick={() => {
                      if (!selected) return;
                      onPick(selected);
                      onOpenChange(false);
                    }}
                  >
                    <Check className='h-4 w-4 mr-2' />
                    Choisir
                  </Button>
                </div>

                <Separator className='my-4' />

                {!selected ? (
                  <div className='text-sm text-slate-600'>Aucune sélection.</div>
                ) : (
                  <div className='space-y-3'>
                    <div>
                      <div className='text-xs text-slate-500'>Unité</div>
                      <div className='text-sm font-semibold text-slate-900'>
                        {selected.unite_titre}
                      </div>
                      <div className='text-xs text-slate-600'>
                        {selected.cote_locale ? `Cote : ${selected.cote_locale}` : 'Cote : —'}
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-2'>
                      <Badge variant='secondary'>
                        {selected.institution_sigle || selected.institution_nom}
                      </Badge>
                      <Badge variant='outline'>{badgeType(selected.nature_id)}</Badge>

                      {isOnline(selected) ? (
                        <Badge className='border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50'>
                          En ligne
                        </Badge>
                      ) : (
                        <Badge className='border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50'>
                          Sur place
                        </Badge>
                      )}

                      {selected.pagination_type ? (
                        <Badge variant='outline'>pagination: {selected.pagination_type}</Badge>
                      ) : null}
                      {selected.plateforme_code ? (
                        <Badge variant='outline'>plateforme: {selected.plateforme_code}</Badge>
                      ) : null}
                    </div>

                    <div>
                      <div className='text-xs text-slate-500'>Dépôt</div>
                      <div className='text-sm text-slate-900'>{selected.depot_nom}</div>
                      <div className='text-xs text-slate-600'>
                        Type : {selected.depot_is_online ? 'en ligne' : 'physique'}
                      </div>
                    </div>

                    <div>
                      <div className='text-xs text-slate-500'>Accès</div>
                      {selected.url_base ? (
                        <div className='flex items-center justify-between gap-2'>
                          <div className='text-xs text-slate-700 break-all font-mono'>
                            {selected.url_base}
                          </div>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => window.open(selected.url_base!, '_blank')}
                          >
                            <ExternalLink className='h-4 w-4 mr-2' />
                            Ouvrir
                          </Button>
                        </div>
                      ) : (
                        <div className='text-sm text-slate-600'>
                          Pas de lien (consultation sur place).
                        </div>
                      )}
                    </div>

                    <div className='rounded-xl bg-slate-50 border border-slate-200 p-3'>
                      <div className='text-xs text-slate-600'>
                        <span className='font-semibold'>ID exemplaire :</span>{' '}
                        <span className='font-mono'>{selected.exemplaire_id}</span>
                      </div>
                      <div className='text-xs text-slate-600'>
                        <span className='font-semibold'>ID unité :</span>{' '}
                        <span className='font-mono'>{selected.unite_id}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className='mt-3 text-xs text-slate-500'>
                Note : la liste “Institutions” est basée sur les résultats déjà chargés (local +
                registre + recherche).
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------------------------------- */}
      {/* CREATE DIALOG                                                        */}
      {/* --------------------------------------------------------------------- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          className='flex flex-col p-0'
          style={{ width: '70vw', height: '70vh', maxWidth: 'none', maxHeight: 'none' }}
        >
          <DialogHeader className='border-b bg-slate-50 px-4 py-3'>
            <DialogTitle className='text-sm font-semibold text-slate-900'>
              Créer une nouvelle unité / exemplaire
            </DialogTitle>
            <div className='mt-2 text-xs text-slate-600'>
              Étape {createStep === 'unite' ? '1' : createStep === 'exemplaire' ? '2' : '3'} / 3
            </div>
          </DialogHeader>

          <div className='p-4 space-y-4'>
            {/* steps */}
            <div className='flex flex-wrap items-center gap-2'>
              <Badge
                className={createStep === 'unite' ? 'bg-slate-900 text-white' : ''}
                variant={createStep === 'unite' ? 'default' : 'outline'}
              >
                1. Unité
              </Badge>
              <Badge
                className={createStep === 'exemplaire' ? 'bg-slate-900 text-white' : ''}
                variant={createStep === 'exemplaire' ? 'default' : 'outline'}
              >
                2. Exemplaire
              </Badge>
              <Badge
                className={createStep === 'acces' ? 'bg-slate-900 text-white' : ''}
                variant={createStep === 'acces' ? 'default' : 'outline'}
              >
                3. Accès
              </Badge>
            </div>

            {/* duplicate warning */}
            {duplicates.length > 0 && (
              <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3'>
                <div className='flex items-start gap-2'>
                  <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
                  <div className='space-y-2'>
                    <div className='text-sm font-semibold text-amber-900'>
                      Une source similaire existe peut-être
                    </div>
                    <div className='text-xs text-amber-800'>
                      Vérifie avant de créer (anti-doublon). Tu peux forcer si tu es sûr.
                    </div>
                    <div className='space-y-2'>
                      {duplicates.map((r) => (
                        <button
                          key={r.exemplaire_id}
                          type='button'
                          className='w-full text-left rounded-lg border border-amber-200 bg-white px-3 py-2 hover:bg-amber-50'
                          onClick={() => {
                            setCreateOpen(false);
                            setSelectedId(r.exemplaire_id);
                          }}
                        >
                          <div className='text-sm font-semibold text-slate-900'>
                            {r.unite_titre}
                          </div>
                          <div className='text-xs text-slate-600'>
                            {r.institution_sigle || r.institution_nom} · {r.depot_nom}
                            {r.cote_locale ? ` · ${r.cote_locale}` : ''}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className='flex items-center gap-2'>
                      <Checkbox
                        checked={forceCreate}
                        onCheckedChange={(v) => setForceCreate(Boolean(v))}
                        id='forceCreate'
                      />
                      <label htmlFor='forceCreate' className='text-xs text-amber-900'>
                        Je confirme : je veux créer quand même
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* step contents */}
            {createStep === 'unite' && (
              <div className='space-y-3'>
                <div>
                  <div className='text-xs text-slate-500'>Titre de l’unité (obligatoire)</div>
                  <Input
                    value={draft.unite_titre}
                    onChange={(e) => setDraft((p) => ({ ...p, unite_titre: e.target.value }))}
                    placeholder='ex : Deshaies – État civil – 1859 – Mariages'
                  />

                  <div className='mt-1 text-[11px] text-slate-500'>
                    Format : [commune]-([période couverte avec comme séparateur , ou -])
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <div className='text-xs text-slate-500'>Dépôt (obligatoire)</div>
                    <select
                      className='w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm'
                      value={draft.depot_id ?? ''}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, depot_id: e.target.value || null }))
                      }
                    >
                      <option value=''>— Choisir un dépôt —</option>
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <div className='text-xs text-slate-500'>Cote (optionnelle)</div>
                    <Input
                      value={draft.cote_locale}
                      onChange={(e) => setDraft((p) => ({ ...p, cote_locale: e.target.value }))}
                      placeholder='ex : 2E 123 / 1E 45…'
                    />
                  </div>

                  <div>
                    <div className='text-xs text-slate-500'>Pagination (optionnelle)</div>
                    <select
                      className='w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm'
                      value={draft.pagination_type ?? ''}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          pagination_type: (e.target.value as CreateDraft['pagination_type']) ?? '',
                        }))
                      }
                    >
                      <option value=''>(aucune)</option>
                      <option value='vues'>vues</option>
                      <option value='pages'>pages</option>
                      <option value='folios'>folios</option>
                      <option value='images'>images</option>
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <div className='text-xs text-slate-500'>Institution (obligatoire)</div>
                    <Input
                      value={draft.institution_nom}
                      onChange={(e) => setDraft((p) => ({ ...p, institution_nom: e.target.value }))}
                      placeholder='ex : Archives nationales d’outre-mer'
                    />
                    <div className='mt-1 text-[11px] text-slate-500'>
                      Astuce : mets le nom complet. Le sigle est optionnel.
                    </div>
                  </div>

                  <div>
                    <div className='text-xs text-slate-500'>Sigle (optionnel)</div>
                    <Input
                      value={draft.institution_sigle}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, institution_sigle: e.target.value }))
                      }
                      placeholder='ex : ANOM / ADG / ADR…'
                    />
                  </div>
                </div>

                <div>
                  <div className='text-xs text-slate-500'>Dépôt (obligatoire)</div>
                  <Input
                    value={draft.depot_nom}
                    onChange={(e) => setDraft((p) => ({ ...p, depot_nom: e.target.value }))}
                    placeholder='ex : Archives nationales d’outre-mer (en ligne) / Salle de lecture…'
                  />
                </div>
              </div>
            )}

            {createStep === 'exemplaire' && (
              <div className='space-y-3'>
                <div>
                  <div className='text-xs text-slate-500'>Type d'exemplaire</div>
                  <div className='flex flex-wrap gap-2'>
                    {(['numerisation', 'microfilm', 'original'] as const).map((t) => (
                      <Button
                        key={t}
                        type='button'
                        variant={draft.nature_id === t ? 'default' : 'outline'}
                        onClick={() => setDraft((p) => ({ ...p, nature_id: t }))}
                      >
                        {badgeType(t)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className='text-xs text-slate-500'>Consultation</div>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      type='button'
                      variant={draft.depot_is_online ? 'default' : 'outline'}
                      onClick={() => setDraft((p) => ({ ...p, depot_is_online: true, depot_is_physical: false, }))}
                    >
                      En ligne
                    </Button>
                    <Button
                      type='button'
                      variant={draft.depot_is_physical ? 'default' : 'outline'}
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          depot_is_physical: true,
                          depot_is_online: false,
                          url_base: '',
                          plateforme_code: '',
                        }))
                      }
                    >
                      Sur place
                    </Button>
                  </div>

                  <div className='mt-2 text-xs text-slate-600'>
                    Astuce : si “En ligne”, l’accès (URL) est demandé à l’étape suivante.
                  </div>
                </div>
              </div>
            )}

            {createStep === 'acces' && (
              <div className='space-y-3'>
                {draft.depot_is_physical ? (
                  <div className='text-sm text-slate-600'>
                    Pas d’accès en ligne requis (consultation sur place).
                  </div>
                ) : (
                  <>
                    <div>
                      <div className='text-xs text-slate-500'>URL (obligatoire si en ligne)</div>
                      <Input
                        value={draft.url_base}
                        onChange={(e) => setDraft((p) => ({ ...p, url_base: e.target.value }))}
                        placeholder='ex : https://recherche-anom.culture.gouv.fr/...'
                      />
                    </div>
                    <div>
                      <div className='text-xs text-slate-500'>Plateforme (optionnel)</div>
                      <Input
                        value={draft.plateforme_code}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, plateforme_code: e.target.value }))
                        }
                        placeholder='ex : ANOM / Filae / AD... '
                      />
                    </div>
                  </>
                )}

                <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-xs text-slate-600'>
                    <span className='font-semibold'>Récap :</span>{' '}
                    {draft.unite_titre || '(sans titre)'}
                  </div>
                  <div className='text-xs text-slate-600'>
                    {draft.institution_sigle || draft.institution_nom || 'Institution'} ·{' '}
                    {draft.depot_nom || 'Dépôt'}
                    {draft.cote_locale ? ` · ${draft.cote_locale}` : ''}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* footer buttons */}
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <Button type='button' variant='ghost' onClick={() => setCreateOpen(false)}>
                  Annuler
                </Button>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={createStep === 'unite'}
                  onClick={() => {
                    setForceCreate(false);
                    setCreateStep((s) => (s === 'acces' ? 'exemplaire' : 'unite'));
                  }}
                >
                  Retour
                </Button>

                {createStep !== 'acces' ? (
                  <Button
                    type='button'
                    onClick={() => {
                      setForceCreate(false);
                      setCreateStep((s) => (s === 'unite' ? 'exemplaire' : 'acces'));
                    }}
                    disabled={createStep === 'unite' && !draft.unite_titre.trim()}
                  >
                    Continuer
                  </Button>
                ) : (
                  <Button
                    type='button'
                    onClick={createAndSelect}
                    disabled={!canCreate || shouldWarnDuplicates}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Créer et sélectionner
                  </Button>
                )}
              </div>
            </div>

            {!canCreate && (
              <div className='text-xs text-slate-500'>
                Champs requis : Titre unité, Institution, Dépôt, et URL si “En ligne”.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
