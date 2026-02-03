// ExemplairePickerDialog.tsx

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

import {
  ExternalLink,
  Check,
  Search,
  Filter,
  X,
  Plus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { SourceDialog, type SourceDialogMode } from '@/features/sources/SourceDialog';

type PickerMode = 'acte' | 'registre';
type NatureCode = 'numerisation' | 'microfilm' | 'original';

function badgeType(code: string | null | undefined) {
  if (code === 'numerisation') return 'Numérisation';
  if (code === 'microfilm') return 'Microfilm';
  return 'Original';
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  mode: PickerMode;
  registreId?: string | null;

  /**
   * Liste des exemplaire_id déjà liés à l’acte.
   * ⚠️ Doivent apparaître grisés + label “déjà lié”, consultables, mais non sélectionnables.
   */
  excludeExemplaireIds?: string[];

  onlyOnline: boolean;
  setOnlyOnline: (v: boolean) => void;

  q: string;
  setQ: (v: string) => void;

  onPick: (row: ExemplairePick) => void;
};

// mêmes champs que dans tes queries supabase (v_exemplaires_pick)
const PICK_SELECT =
  'exemplaire_id,nature_ref,nature_code,nature_label,support_ref,support_code,support_label,unite_id,unite_titre,cote_locale,' +
  'pagination_type_ref,nb_pages,identifiant_interne,localisation_interne,' +
  'depot_nom,depot_is_online,depot_is_physical,institution_nom,institution_sigle,' +
  'url_base,plateforme_code,source_exemplaire_id';

function isOnline(r: ExemplairePick) {
  return r.depot_is_online || Boolean((r.url_base ?? '').trim());
}

function normalizeRows(rows: any[]): ExemplairePick[] {
  return (rows ?? []).map((r) => ({
    exemplaire_id: r.exemplaire_id,
    nature_ref: r.nature_ref,
    nature_code: r.nature_code,
    nature_label: r.nature_label,
    support_ref: r.support_ref,
    support_code: r.support_code,
    support_label: r.support_label,
    unite_id: r.unite_id,
    unite_titre: r.unite_titre,
    cote_locale: r.cote_locale,

    pagination_type_ref: r.pagination_type_ref,
    nb_pages: r.nb_pages,
    identifiant_interne: r.identifiant_interne,
    localisation_interne: r.localisation_interne,

    depot_nom: r.depot_nom,
    depot_is_online: r.depot_is_online,
    depot_is_physical: r.depot_is_physical,
    institution_nom: r.institution_nom,
    institution_sigle: r.institution_sigle,
    url_base: r.url_base,
    plateforme_code: r.plateforme_code,
    source_exemplaire_id: r.source_exemplaire_id,
  }));
}

type TreeInstitutionNode = {
  kind: 'institution';
  key: string;
  label: string;
  count: number;
  children: TreeDepotNode[];
};

type TreeDepotNode = {
  kind: 'depot';
  key: string;
  label: string;
  online: boolean;
  count: number;
  children: TreeUniteNode[];
};

type TreeUniteNode = {
  kind: 'unite';
  key: string;
  uniteId: string;
  label: string;
  count: number;
  children: TreeLeafNode[];
};

type TreeLeafNode = {
  kind: 'leaf';
  key: string;
  row: ExemplairePick;
};

function safeLabel(x: string | null | undefined, fallback = '—') {
  const s = (x ?? '').trim();
  return s.length ? s : fallback;
}

function buildTree(rows: ExemplairePick[]): TreeInstitutionNode[] {
  // Institution -> Depot -> Unite -> Exemplaires
  const instMap = new Map<
    string,
    {
      label: string;
      depots: Map<
        string,
        {
          label: string;
          online: boolean;
          unites: Map<
            string,
            {
              uniteId: string;
              label: string;
              rows: ExemplairePick[];
            }
          >;
        }
      >;
    }
  >();

  for (const r of rows) {
    const instLabel = safeLabel(r.institution_sigle || r.institution_nom);
    const instKey = `inst:${instLabel}`;

    const depotLabel = safeLabel(r.depot_nom);
    const depotKey = `depot:${instLabel}||${depotLabel}`;
    const depotOnline = Boolean(r.depot_is_online) || Boolean((r.url_base ?? '').trim());

    const uniteId = r.unite_id;
    const uniteLabel = safeLabel(r.unite_titre);
    const uniteKey = `unite:${uniteId}`;

    if (!instMap.has(instKey)) {
      instMap.set(instKey, { label: instLabel, depots: new Map() });
    }
    const inst = instMap.get(instKey)!;

    if (!inst.depots.has(depotKey)) {
      inst.depots.set(depotKey, { label: depotLabel, online: depotOnline, unites: new Map() });
    }
    const depot = inst.depots.get(depotKey)!;
    depot.online = depot.online || depotOnline;

    if (!depot.unites.has(uniteKey)) {
      depot.unites.set(uniteKey, { uniteId, label: uniteLabel, rows: [] });
    }
    depot.unites.get(uniteKey)!.rows.push(r);
  }

  const institutions: TreeInstitutionNode[] = Array.from(instMap.entries())
    .map(([instKey, inst]) => {
      const depots: TreeDepotNode[] = Array.from(inst.depots.entries())
        .map(([depotKey, d]) => {
          const unites: TreeUniteNode[] = Array.from(d.unites.entries())
            .map(([uniteKey, u]) => {
              const sortedLeaves = u.rows.slice().sort((a, b) => {
                const ao = isOnline(a) ? 0 : 1;
                const bo = isOnline(b) ? 0 : 1;
                if (ao !== bo) return ao - bo;

                const na = badgeType(a.nature_code).localeCompare(badgeType(b.nature_code));
                if (na !== 0) return na;

                const ca = (a.cote_locale ?? '').localeCompare(b.cote_locale ?? '');
                if (ca !== 0) return ca;

                return (a.exemplaire_id ?? '').localeCompare(b.exemplaire_id ?? '');
              });

              const leaves: TreeLeafNode[] = sortedLeaves.map((row) => ({
                kind: 'leaf' as const,
                key: `leaf:${row.exemplaire_id}`,
                row,
              }));

              return {
                kind: 'unite' as const,
                key: uniteKey,
                uniteId: u.uniteId,
                label: u.label,
                count: leaves.length,
                children: leaves,
              };
            })
            .sort((a, b) => a.label.localeCompare(b.label));

          const count = unites.reduce((acc, u) => acc + u.count, 0);

          return {
            kind: 'depot' as const,
            key: depotKey,
            label: d.label,
            online: d.online,
            count,
            children: unites,
          };
        })
        .sort((a, b) => {
          if (a.online !== b.online) return a.online ? -1 : 1;
          return a.label.localeCompare(b.label);
        });

      const count = depots.reduce((acc, d) => acc + d.count, 0);

      return {
        kind: 'institution' as const,
        key: instKey,
        label: inst.label,
        count,
        children: depots,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return institutions;
}

function Chip({
  children,
  variant = 'outline',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'outline' | 'secondary';
  className?: string;
}) {
  return (
    <Badge
      variant={variant}
      className={['text-[11px] px-2 py-0.5 rounded-full', className].join(' ')}
    >
      {children}
    </Badge>
  );
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
  const [typeFilter, setTypeFilter] = useState<NatureCode | 'all'>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [onlyAlreadyLinked, setOnlyAlreadyLinked] = useState(false);
  const [sort, setSort] = useState<'relevance' | 'institution' | 'title'>('relevance');

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Tree expand/collapse state
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});
  const toggleNode = (key: string) =>
    setOpenNodes((m) => ({
      ...m,
      [key]: !m[key],
    }));
  const isNodeOpen = (key: string) => Boolean(openNodes[key]);

  // DATA
  const [loadingRegistre, setLoadingRegistre] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errRegistre, setErrRegistre] = useState<string | null>(null);
  const [errSearch, setErrSearch] = useState<string | null>(null);

  const [registreRows, setRegistreRows] = useState<ExemplairePick[]>([]);
  const [searchRows, setSearchRows] = useState<ExemplairePick[]>([]);

  // Local rows created in UI (no DB yet)
  const [localRows] = useState<ExemplairePick[]>([]);

  const [modeCreate, setModeCreate] = useState<SourceDialogMode | null>(null);

  // Create dialog
  const [openCreate, setOpenCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
    for (const r of allLoadedRows) set.add(safeLabel(r.institution_sigle || r.institution_nom));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allLoadedRows]);

  // ---------------------------------------------------------------------------
  // Reset léger à l’ouverture
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    setErrRegistre(null);
    setErrSearch(null);
    setSelectedId(null);
    setOpenNodes({});
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
        // ✅ on NE filtre plus les ids déjà liés => on les affiche grisés
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
        query = query.or('depot_is_online.eq.true,url_base.not.is.null,url_base.neq.""');
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

      // conserve l'ordre donné par registre_citations
      const order = new Map(uniqOrderedIds.map((id, i) => [id, i]));
      rows.sort(
        (a, b) => (order.get(a.exemplaire_id) ?? 9999) - (order.get(b.exemplaire_id) ?? 9999),
      );

      let filtered = rows;
      if (typeFilter !== 'all') filtered = filtered.filter((r) => r.nature_code === typeFilter);
      if (institutionFilter !== 'all') {
        filtered = filtered.filter(
          (r) => (r.institution_sigle || r.institution_nom) === institutionFilter,
        );
      }

      filtered = applyAlreadyLinkedFilter(filtered);

      setRegistreRows(filtered);
      setLoadingRegistre(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    mode,
    registreId,
    onlyOnline,
    typeFilter,
    institutionFilter,
    onlyAlreadyLinked,
    refreshKey,
  ]);

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
        query = query.or('depot_is_online.eq.true,url_base.not.is.null,url_base.neq.""');
      }

      if (typeFilter !== 'all') {
        query = query.eq('nature_code', typeFilter);
      }

      // ✅ on NE filtre plus les ids déjà liés => on les affiche grisés
      // (on garde excludedSet côté UI pour désactiver le “Choisir”)

      if (sort === 'institution') {
        query = query
          .order('institution_sigle', { ascending: true })
          .order('depot_nom', { ascending: true })
          .order('unite_titre', { ascending: true });
      } else if (sort === 'title') {
        query = query.order('unite_titre', { ascending: true });
      } else {
        query = query
          .order('institution_sigle', { ascending: true })
          .order('depot_nom', { ascending: true })
          .order('unite_titre', { ascending: true });
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        setErrSearch(error.message);
        setSearchRows([]);
      } else {
        let rows = normalizeRows(data as any[]);

        // (optionnel mais cohérent : appliquer institutionFilter aussi ici si tu veux)
        if (institutionFilter !== 'all') {
          rows = rows.filter(
            (r) => (r.institution_sigle || r.institution_nom) === institutionFilter,
          );
        }

        rows = applyAlreadyLinkedFilter(rows);

        setSearchRows(rows);
      }

      setLoadingSearch(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, q, onlyOnline, typeFilter, institutionFilter, onlyAlreadyLinked, sort, refreshKey]);

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

  const selectedIsAlreadyLinked = Boolean(selected && excludedSet.has(selected.exemplaire_id));

  function resetFilters() {
    setOnlyOnline(false);
    setTypeFilter('all');
    setInstitutionFilter('all');
    setSort('relevance');
    setOnlyAlreadyLinked(false);
  }

  // ---------------------------------------------------------------------------
  // TreeView rendering
  // ---------------------------------------------------------------------------
  function TreeLeafRow({ row }: { row: ExemplairePick }) {
    const active = selected?.exemplaire_id === row.exemplaire_id;
    const alreadyLinked = excludedSet.has(row.exemplaire_id);

    const showUrl = active && Boolean((row.url_base ?? '').trim());
    const cote = (row.cote_locale ?? '').trim();

    return (
      <button
        type='button'
        onClick={() => setSelectedId(row.exemplaire_id)}
        className={[
          'w-full rounded-xl border p-3 text-left transition',
          active ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50',
          alreadyLinked ? 'opacity-60' : '',
        ].join(' ')}
      >
        {/* LIGNE 1 */}
        <div className='flex flex-wrap items-center gap-2'>
          {alreadyLinked ? (
            <Chip className='border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-100'>
              <span className='inline-flex items-center gap-1'>
                <Check className='h-3.5 w-3.5' />
                Déjà lié
              </span>
            </Chip>
          ) : null}

          <Chip variant='outline'>{badgeType(row.nature_code)}</Chip>

          {row.support_label ? <Chip variant='secondary'>Support: {row.support_label}</Chip> : null}

          {cote ? (
            <Chip variant='secondary'>Cote: {cote}</Chip>
          ) : (
            <Chip variant='secondary'>Cote: —</Chip>
          )}

          {row.nb_pages && row.pagination_type_ref ? (
            <Chip variant='outline'>
              Pagination: {row.nb_pages} {row.pagination_type_ref}
            </Chip>
          ) : null}
        </div>

        {/* LIGNE 2 */}
        {row.identifiant_interne ||
        row.localisation_interne ? (
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            {row.identifiant_interne ? (
              <Chip variant='outline'>Identifiant interne: {row.identifiant_interne}</Chip>
            ) : null}

            {row.localisation_interne ? (
              <Chip variant='outline'>Localisation interne: {row.localisation_interne}</Chip>
            ) : null}
          </div>
        ) : null}

        <div className='mt-2 text-xs text-slate-600'>
          {safeLabel(row.institution_nom)} · {safeLabel(row.depot_nom)} ·{' '}
          <span className='font-medium text-slate-800'>{safeLabel(row.unite_titre)}</span>
        </div>

        {showUrl ? (
          <div className='mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2'>
            <div className='text-[11px] text-slate-500 mb-1'>URL</div>
            <div className='text-xs text-slate-700 break-all font-mono'>{row.url_base}</div>
          </div>
        ) : null}
      </button>
    );
  }

  function applyAlreadyLinkedFilter(rows: ExemplairePick[]) {
    if (!onlyAlreadyLinked) return rows;
    return rows.filter((r) => excludedSet.has(r.exemplaire_id));
  }

  function TreeView({ rows, empty }: { rows: ExemplairePick[]; empty: React.ReactNode }) {
    if (!rows.length) return <>{empty}</>;

    const tree = buildTree(rows);

    return (
      <div className='space-y-2 pb-28'>
        {tree.map((inst) => (
          <div key={inst.key} className='rounded-2xl border border-slate-200 bg-white'>
            <button
              type='button'
              onClick={() => toggleNode(inst.key)}
              className='w-full px-3 py-2 flex items-center justify-between text-left'
            >
              <div className='flex items-center gap-2'>
                {isNodeOpen(inst.key) ? (
                  <ChevronDown className='h-4 w-4 text-slate-600' />
                ) : (
                  <ChevronRight className='h-4 w-4 text-slate-600' />
                )}
                <div className='text-sm font-semibold text-slate-900'>{inst.label}</div>
                <Badge variant='secondary' className='text-[11px]'>
                  {inst.count}
                </Badge>
              </div>
            </button>

            {isNodeOpen(inst.key) ? (
              <div className='px-3 pb-3 space-y-2'>
                {inst.children.map((depot) => (
                  <div key={depot.key} className='rounded-xl border border-slate-200 bg-slate-50'>
                    <button
                      type='button'
                      onClick={() => toggleNode(depot.key)}
                      className='w-full px-3 py-2 flex items-center justify-between text-left'
                    >
                      <div className='flex items-center gap-2'>
                        {isNodeOpen(depot.key) ? (
                          <ChevronDown className='h-4 w-4 text-slate-600' />
                        ) : (
                          <ChevronRight className='h-4 w-4 text-slate-600' />
                        )}
                        <div className='text-sm font-medium text-slate-900'>{depot.label}</div>

                        {depot.online ? (
                          <Chip className='border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50'>
                            En ligne
                          </Chip>
                        ) : (
                          <Chip className='border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50'>
                            Sur place
                          </Chip>
                        )}

                        <Badge variant='secondary' className='text-[11px]'>
                          {depot.count}
                        </Badge>
                      </div>
                    </button>

                    {isNodeOpen(depot.key) ? (
                      <div className='px-3 pb-3 space-y-2'>
                        {depot.children.map((unite) => (
                          <div
                            key={unite.key}
                            className='rounded-xl border border-slate-200 bg-white'
                          >
                            <button
                              type='button'
                              onClick={() => toggleNode(unite.key)}
                              className='w-full px-3 py-2 flex items-center justify-between text-left'
                            >
                              <div className='flex items-start gap-2'>
                                {isNodeOpen(unite.key) ? (
                                  <ChevronDown className='h-4 w-4 text-slate-600 mt-0.5' />
                                ) : (
                                  <ChevronRight className='h-4 w-4 text-slate-600 mt-0.5' />
                                )}

                                <div>
                                  <div className='text-sm font-semibold text-slate-900'>
                                    {unite.label}
                                  </div>
                                  <div className='mt-1 flex flex-wrap items-center gap-2'>
                                    <Chip variant='secondary'>Exemplaires: {unite.count}</Chip>
                                  </div>
                                </div>
                              </div>
                            </button>

                            {isNodeOpen(unite.key) ? (
                              <div className='px-3 pb-3 space-y-2'>
                                {unite.children.map((leaf) => (
                                  <TreeLeafRow key={leaf.key} row={leaf.row} />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  const registreTitle = registreId
    ? 'Sources du registre associé'
    : 'Sources du registre associé (aucun registre)';

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

                  <button
                    type='button'
                    onClick={() => setOnlyAlreadyLinked((v) => !v)}
                    className={[
                      'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs',
                      onlyAlreadyLinked
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
                    ].join(' ')}
                    title='Afficher uniquement les exemplaires déjà liés'
                  >
                    <Check className='h-3.5 w-3.5' />
                    Déjà liés
                  </button>

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
                        {registreTitle} — les lignes “déjà lié” sont consultables mais non
                        sélectionnables.
                      </div>

                      <ScrollArea className='h-full pr-3'>
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
                            Aucune suggestion (rien ne correspond aux filtres).
                          </div>
                        ) : (
                          <TreeView
                            rows={registreRows}
                            empty={<div className='text-sm text-slate-600'>Aucune suggestion.</div>}
                          />
                        )}
                      </ScrollArea>
                    </TabsContent>
                  ) : null}

                  <TabsContent value='recherche' className='mt-3 flex-1 min-h-0'>
                    <div className='text-xs text-slate-600 mb-2'>
                      Tape une recherche. Exemple : “Deshaies 1859”, “ANOM”, “CAOM EC”, une cote,
                      etc.
                    </div>

                    <ScrollArea className='h-full pr-3'>
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
                        <TreeView
                          rows={searchRows}
                          empty={<div className='text-sm text-slate-600'>Aucun résultat.</div>}
                        />
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {localRows.length ? (
                    <TabsContent value='local' className='mt-3 flex-1 min-h-0'>
                      <div className='text-xs text-slate-600 mb-2'>
                        Sources créées localement (IHM) — à brancher DB ensuite.
                      </div>
                      <ScrollArea className='h-full pr-3'>
                        <TreeView
                          rows={localRows}
                          empty={
                            <div className='text-sm text-slate-600'>Aucune source locale.</div>
                          }
                        />
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
                  <Button
                    variant='outline'
                    onClick={() => {
                      setModeCreate('create'); // ou 'edit-unite' / 'edit-exemplaire' selon ton besoin
                      setOpenCreate(true);
                    }}
                  >
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
                    disabled={!selected || selectedIsAlreadyLinked}
                    onClick={() => {
                      if (!selected) return;
                      if (excludedSet.has(selected.exemplaire_id)) return;
                      onPick(selected);
                      onOpenChange(false);
                    }}
                    title={
                      !selected
                        ? undefined
                        : selectedIsAlreadyLinked
                          ? 'Cet exemplaire est déjà lié à l’acte.'
                          : undefined
                    }
                  >
                    <Check className='h-4 w-4 mr-2' />
                    Choisir
                  </Button>
                </div>

                {selectedIsAlreadyLinked ? (
                  <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700'>
                    <span className='inline-flex items-center gap-2'>
                      <Check className='h-4 w-4 text-slate-700' />
                      Déjà lié à l’acte — consultable, non sélectionnable.
                    </span>
                  </div>
                ) : null}

                <Separator className='my-4' />

                {!selected ? (
                  <div className='text-sm text-slate-600'>Aucune sélection.</div>
                ) : (
                  <div className='space-y-4'>
                    {/* Header compact */}
                    <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        {selectedIsAlreadyLinked ? (
                          <Badge className='border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-100'>
                            <span className='inline-flex items-center gap-1'>
                              <Check className='h-4 w-4' />
                              Déjà lié
                            </span>
                          </Badge>
                        ) : null}

                        <Badge variant='secondary'>
                          {selected.institution_sigle || selected.institution_nom}
                        </Badge>

                        <Badge variant='outline'>{badgeType(selected.nature_code)}</Badge>

                        {selected.support_label ? (
                          <Badge variant='outline'>Support : {selected.support_label}</Badge>
                        ) : null}

                        {isOnline(selected) ? (
                          <Badge className='border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50'>
                            En ligne
                          </Badge>
                        ) : (
                          <Badge className='border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50'>
                            Sur place
                          </Badge>
                        )}
                      </div>

                      <div className='mt-2'>
                        <div className='text-xs text-slate-500'>Unité</div>
                        <div className='text-sm font-semibold text-slate-900'>
                          {selected.unite_titre}
                        </div>
                      </div>

                      <div className='mt-1 text-xs text-slate-600'>
                        {selected.depot_nom} ·{' '}
                        {selected.cote_locale ? `Cote : ${selected.cote_locale}` : 'Cote : —'}
                      </div>
                    </div>

                    {/* Bloc: Exemplaire */}
                    <div className='rounded-xl border border-slate-200 p-3'>
                      <div className='text-xs font-semibold text-slate-900'>Exemplaire</div>
                      <div className='mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <div>
                          <div className='text-[11px] text-slate-500'>ID exemplaire</div>
                          <div className='text-xs font-mono break-all text-slate-800'>
                            {selected.exemplaire_id}
                          </div>
                        </div>

                        <div>
                          <div className='text-[11px] text-slate-500'>
                            Source exemplaire (copie de)
                          </div>
                          <div className='text-xs font-mono break-all text-slate-800'>
                            {selected.source_exemplaire_id || '—'}
                          </div>
                        </div>

                        <div>
                          <div className='text-[11px] text-slate-500'>Nature</div>
                          <div className='text-xs text-slate-800'>
                            {selected.nature_label || badgeType(selected.nature_code)}
                          </div>
                        </div>

                        <div>
                          <div className='text-[11px] text-slate-500'>Support</div>
                          <div className='text-xs text-slate-800'>
                            {selected.support_label ? selected.support_label : '—'}
                          </div>
                        </div>

                        <div>
                          <div className='text-[11px] text-slate-500'>Pagination</div>
                          <div className='text-xs text-slate-800'>
                            {selected.nb_pages && selected.pagination_type_ref
                              ? `${selected.nb_pages} ${selected.pagination_type_ref}`
                              : selected.pagination_type_ref
                                ? selected.pagination_type_ref
                                : '—'}
                          </div>
                        </div>

                        <div>
                          <div className='text-[11px] text-slate-500'>Identifiant interne</div>
                          <div className='text-xs text-slate-800 break-all'>
                            {selected.identifiant_interne || '—'}
                          </div>
                        </div>

                        <div>
                          <div className='text-[11px] text-slate-500'>Localisation interne</div>
                          <div className='text-xs text-slate-800 break-all'>
                            {selected.localisation_interne || '—'}
                          </div>
                        </div>

                        <div className='sm:col-span-2'>
                          <div className='text-[11px] text-slate-500'>Cote locale</div>
                          <div className='text-xs text-slate-800'>
                            {selected.cote_locale || '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloc: Unité + Dépôt + Institution */}
                    <div className='rounded-xl border border-slate-200 p-3'>
                      <div className='text-xs font-semibold text-slate-900'>Localisation</div>

                      <div className='mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <div>
                          <div className='text-[11px] text-slate-500'>ID unité</div>
                          <div className='text-xs font-mono break-all text-slate-800'>
                            {selected.unite_id}
                          </div>
                        </div>

                        <div>
                          <div className='text-[11px] text-slate-500'>Dépôt</div>
                          <div className='text-xs text-slate-800'>{selected.depot_nom}</div>
                          <div className='text-[11px] text-slate-500 mt-1'>
                            {selected.depot_is_online ? 'Dépôt en ligne' : null}
                            {selected.depot_is_physical
                              ? (selected.depot_is_online ? ' · ' : '') + 'Dépôt physique'
                              : null}
                            {!selected.depot_is_online && !selected.depot_is_physical ? '—' : null}
                          </div>
                        </div>

                        <div className='sm:col-span-2'>
                          <div className='text-[11px] text-slate-500'>Institution</div>
                          <div className='text-xs text-slate-800'>
                            {selected.institution_nom || '—'}
                            {selected.institution_sigle ? (
                              <span className='text-slate-500'>
                                {' '}
                                · {selected.institution_sigle}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloc: Accès */}
                    <div className='rounded-xl border border-slate-200 p-3'>
                      <div className='text-xs font-semibold text-slate-900'>Accès</div>

                      <div className='mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <div>
                          <div className='text-[11px] text-slate-500'>Plateforme</div>
                          <div className='text-xs text-slate-800'>
                            {selected.plateforme_code || '—'}
                          </div>
                        </div>

                        <div className='sm:col-span-2'>
                          <div className='text-[11px] text-slate-500'>URL</div>
                          {selected.url_base ? (
                            <div className='flex items-start justify-between gap-2'>
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
                            <div className='text-xs text-slate-600'>
                              Pas de lien (consultation sur place).
                            </div>
                          )}
                        </div>
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

      {/* ✅ Création = Dialog stepper */}
      <SourceDialog
        open={openCreate}
        mode={modeCreate}
        onClose={() => {
          setOpenCreate(false);
          setModeCreate(null);
        }}
        onCreated={async () => {
          setOpenCreate(false);
          setModeCreate(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    </>
  );
}
