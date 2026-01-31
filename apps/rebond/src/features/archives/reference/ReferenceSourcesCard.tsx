// ReferenceSourcesCard.tsx

import { useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  ActeCitationDraft,
  RegistreCitationDraft,
  ExemplairePick,
} from '@/features/archives/reference/types';

import { ExemplairePickerDialog } from './ExemplairePickerDialog';

import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from '@/components/shared/DictionnaireEditorPanel';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

import { Badge } from '@/components/ui/badge';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type SectionMode = 'acte' | 'registre';
type AnyDraft = ActeCitationDraft | RegistreCitationDraft;

function badgeType(code: string | null | undefined) {
  if (code === 'numerisation') return 'Numérisation';
  if (code === 'microfilm') return 'Microfilm';
  return 'Original';
}

function safeLabel(x: string | null | undefined, fallback = '—') {
  const s = (x ?? '').trim();
  return s.length ? s : fallback;
}

function Chip({
  children,
  variant = 'outline',
  className = '',
}: {
  children: ReactNode;
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

type SectionSourcesProps = {
  mode: SectionMode;
  registreId?: string | null;

  sources: AnyDraft[];
  loading: boolean;

  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, patch: Partial<AnyDraft>) => void;
};

export function SectionSources({
  mode,
  registreId,
  sources,
  loading,
  onAdd,
  onRemove,
  onChange,
}: SectionSourcesProps) {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  // ------------------------------------------
  // Tree open state (Institution/Depot/Unite)
  // ------------------------------------------
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});
  const toggleNode = (key: string) =>
    setOpenNodes((m) => ({
      ...m,
      [key]: !m[key],
    }));
  const isNodeOpen = (key: string) => Boolean(openNodes[key]);
  const openNode = (key: string) =>
    setOpenNodes((m) => ({
      ...m,
      [key]: true,
    }));

  // ------------------------------------------
  // Helpers
  // ------------------------------------------
  const normalizeUrl = (url: string) => {
    const u = (url ?? '').trim();
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return `https://${u}`;
  };

  const formatRangeLabel = (a?: number | null, b?: number | null, kind = 'vue') => {
    if (a == null && b == null) return '';
    if (a != null && b == null) return `${kind} ${a}`;
    if (a == null && b != null) return `${kind} ${b}`;
    if (a === b) return `${kind} ${a}`;
    return `${kind}s ${a}–${b}`;
  };

  function isOnlineEx(c: AnyDraft) {
    const ex: any = c.exemplaire ?? {};
    const hasUrl = Boolean((ex.url_base ?? '').trim());
    return Boolean(ex.depot_is_online) || hasUrl;
  }

  // ------------------------------------------
  // Picker
  // ------------------------------------------
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [onlyOnline, setOnlyOnline] = useState(false);

  const closePicker = () => {
    setPickerOpen(false);
    setPickerTargetIdx(null);
  };

  const openPickerForIdx = (idx: number) => {
    scrollToIdx(idx);
    setPickerTargetIdx(idx);
    setPickerOpen(true);
  };

  const openPickerForNew = () => {
    const nextIdx = sources.length;
    onAdd();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToIdx(nextIdx);
        setPickerTargetIdx(nextIdx);
        setPickerOpen(true);
      });
    });
  };

  // ------------------------------------------
  // Dictionnaire (Drawer)
  // ------------------------------------------
  const [dictOpen, setDictOpen] = useState(false);
  const [dictArgs, setDictArgs] = useState<{
    kind: DictionnaireKind;
    title: string;
    multi: boolean;
    defaultSelectedIds: string[];
    onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void;
  } | null>(null);

  const openDict = (args: {
    kind: DictionnaireKind;
    title: string;
    multi?: boolean;
    defaultSelectedIds?: string[];
    onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void;
  }) => {
    setDictArgs({
      kind: args.kind,
      title: args.title,
      multi: args.multi ?? false,
      defaultSelectedIds: args.defaultSelectedIds ?? [],
      onValidate: args.onValidate,
    });
    setDictOpen(true);
  };

  // ------------------------------------------
  // Pick action
  // ------------------------------------------
  const patchActe = (idx: number, patch: Partial<ActeCitationDraft>) => onChange(idx, patch);
  const patchRegistre = (idx: number, patch: Partial<RegistreCitationDraft>) =>
    onChange(idx, patch);

  const alreadyPickedExemplaireIds = useMemo(() => {
    return sources.map((s) => s.exemplaire_id).filter(Boolean) as string[];
  }, [sources]);

  const pick = (row: ExemplairePick) => {
    if (pickerTargetIdx == null) return;

    const base = {
      exemplaire_id: row.exemplaire_id,
      exemplaire: {
        exemplaire_id: row.exemplaire_id,
        unite_id: row.unite_id,
        nature_id: row.nature_id,
        nature_code: row.nature_code,
        nature_label: row.nature_label,
        support_id: row.support_id,
        support_code: row.support_code,
        support_label: row.support_label,
        unite_titre: row.unite_titre,
        cote_locale: row.cote_locale,
        pagination_type: row.pagination_type,
        nb_pages: row.nb_pages,
        depot_is_online: row.depot_is_online,
        depot_is_physical: row.depot_is_physical,
        depot_nom: row.depot_nom,
        institution_sigle: row.institution_sigle,
        institution_nom: row.institution_nom,
        identifiant_interne: row.identifiant_interne,
        localisation_interne: row.localisation_interne,
        etat_conservation: row.etat_conservation,
        qualite: row.qualite,
        url_base: row.url_base,
        plateforme_code: row.plateforme_code,
        source_exemplaire_id: (row as any).source_exemplaire_id ?? null,
      },
    };

    if (mode === 'acte') {
      patchActe(pickerTargetIdx, {
        ...base,
        vues_start: null,
        vues_end: null,
        vues_raw: '',
        page_start: null,
        page_end: null,
        page_raw: '',
        acte_manquant: false,
      });
    } else {
      patchRegistre(pickerTargetIdx, {
        ...base,
        registre_manquant: false,
      });
    }

    closePicker();
  };

  const hasAnySelected = sources.some((s) => Boolean(s.exemplaire_id));

  // ------------------------------------------
  // Tree model
  // ------------------------------------------
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
    uniteId: string | null;
    label: string;
    count: number;
    children: TreeLeafNode[];
  };

  type TreeLeafNode = {
    kind: 'leaf';
    key: string;
    idx: number;
    c: AnyDraft;
  };

  function buildTreeFromDrafts(drafts: AnyDraft[]): {
    tree: TreeInstitutionNode[];
    idxToPath: Map<number, string[]>;
    allKeys: string[];
  } {
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
                uniteId: string | null;
                label: string;
                leaves: Array<{ idx: number; c: AnyDraft }>;
              }
            >;
          }
        >;
      }
    >();

    const idxToPath = new Map<number, string[]>();

    const picked = drafts.map((c, idx) => ({ c, idx })).filter(({ c }) => Boolean(c.exemplaire_id));

    for (const { c, idx } of picked) {
      const ex: any = c.exemplaire ?? {};

      const instLabel = safeLabel(ex.institution_sigle || ex.institution_nom);
      const instKey = `inst:${instLabel}`;

      const depotLabel = safeLabel(ex.depot_nom);
      const depotKey = `depot:${instLabel}||${depotLabel}`;
      const depotOnline = Boolean(ex.depot_is_online) || Boolean((ex.url_base ?? '').trim());

      const uniteId = (ex.unite_id ?? null) as string | null;
      const uniteLabel = safeLabel(ex.unite_titre);

      const uniteKey = uniteId
        ? `unite:${uniteId}`
        : `unite_fallback:${instLabel.toLowerCase()}||${depotLabel.toLowerCase()}||${uniteLabel.toLowerCase()}`;

      if (!instMap.has(instKey)) instMap.set(instKey, { label: instLabel, depots: new Map() });
      const inst = instMap.get(instKey)!;

      if (!inst.depots.has(depotKey)) {
        inst.depots.set(depotKey, { label: depotLabel, online: depotOnline, unites: new Map() });
      }
      const depot = inst.depots.get(depotKey)!;
      depot.online = depot.online || depotOnline;

      if (!depot.unites.has(uniteKey)) {
        depot.unites.set(uniteKey, { uniteId, label: uniteLabel, leaves: [] });
      }
      depot.unites.get(uniteKey)!.leaves.push({ idx, c });

      idxToPath.set(idx, [instKey, depotKey, uniteKey]);
    }

    const tree: TreeInstitutionNode[] = Array.from(instMap.entries())
      .map(([instKey, inst]) => {
        const depots: TreeDepotNode[] = Array.from(inst.depots.entries())
          .map(([depotKey, d]) => {
            const unites: TreeUniteNode[] = Array.from(d.unites.entries())
              .map(([uniteKey, u]) => {
                const sortedLeaves = u.leaves.slice().sort((a, b) => {
                  const ao = isOnlineEx(a.c) ? 0 : 1;
                  const bo = isOnlineEx(b.c) ? 0 : 1;
                  if (ao !== bo) return ao - bo;

                  const ax: any = a.c.exemplaire ?? {};
                  const bx: any = b.c.exemplaire ?? {};

                  const na = badgeType(ax.nature_code).localeCompare(badgeType(bx.nature_code));
                  if (na !== 0) return na;

                  const ca = (ax.cote_locale ?? '').localeCompare(bx.cote_locale ?? '');
                  if (ca !== 0) return ca;

                  return (a.c.exemplaire_id ?? '').localeCompare(b.c.exemplaire_id ?? '');
                });

                const leaves: TreeLeafNode[] = sortedLeaves.map((it) => ({
                  kind: 'leaf' as const,
                  key: `leaf:${it.c.exemplaire_id}:${it.idx}`,
                  idx: it.idx,
                  c: it.c,
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

    const allKeys: string[] = [];
    for (const inst of tree) {
      allKeys.push(inst.key);
      for (const depot of inst.children) {
        allKeys.push(depot.key);
        for (const unite of depot.children) {
          allKeys.push(unite.key);
        }
      }
    }

    return { tree, idxToPath, allKeys };
  }

  const { tree, idxToPath, allKeys } = useMemo(() => buildTreeFromDrafts(sources), [sources]);

  // ------------------------------------------
  // Scroll helper (opens path)
  // ------------------------------------------
  const scrollToIdx = (idx: number) => {
    const path = idxToPath.get(idx);
    if (path) for (const k of path) openNode(k);

    const el = itemRefs.current[idx];
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlightIdx(idx);
    window.setTimeout(() => setHighlightIdx((cur) => (cur === idx ? null : cur)), 900);
  };

  const toIntOrNull = (v: string) => {
    const t = (v ?? '').trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  };

  const splitCsvToList = (v: string) => {
    return (v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const joinListToCsv = (arr: unknown) => {
    if (!Array.isArray(arr)) return '';
    return arr.filter(Boolean).join(', ');
  };

  const safeParseJsonArray = (text: string) => {
    const t = (text ?? '').trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed : null; // null = invalid json
    } catch {
      return null;
    }
  };

  // ------------------------------------------
  // Card render (header aligned with picker)
  // ------------------------------------------
  function renderCitationCard(args: {
    c: AnyDraft;
    idx: number;
    pos: number;
    exemplaireIdToNumber: Map<string, number>;
  }) {
    const { c, idx, pos, exemplaireIdToNumber } = args;

    const ex: any = c.exemplaire ?? {};
    const online = isOnlineEx(c);
    const url = (ex.url_base ?? '').trim();

    const missing =
      mode === 'acte'
        ? Boolean((c as ActeCitationDraft).acte_manquant)
        : Boolean((c as RegistreCitationDraft).registre_manquant);

    const copyOf = (() => {
      const src = (ex.source_exemplaire_id ?? '').trim();
      if (!src) return '';
      const n = exemplaireIdToNumber.get(src);
      return n ? `copie de l’exemplaire #${n}` : 'copie d’un exemplaire';
    })();

    const vuesLabel =
      mode === 'acte'
        ? ((c as ActeCitationDraft).vues_raw ?? '').trim() ||
          formatRangeLabel(
            (c as ActeCitationDraft).vues_start ?? null,
            (c as ActeCitationDraft).vues_end ?? null,
            'vue',
          )
        : '';

    const pagesLabel =
      mode === 'acte'
        ? ((c as ActeCitationDraft).page_raw ?? '').trim() ||
          formatRangeLabel(
            (c as ActeCitationDraft).page_start ?? null,
            (c as ActeCitationDraft).page_end ?? null,
            'page',
          )
        : '';

    const cote = (ex.cote_locale ?? '').trim();

    return (
      <>
        <div className='border-b border-slate-200 bg-slate-50 p-4'>
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white'>
                  Exemplaire #{pos + 1}
                </span>

                {missing ? (
                  <Chip className='border-red-200 bg-red-50 text-red-800 hover:bg-red-50'>
                    {mode === 'acte' ? 'Acte manquant' : 'Registre manquant'}
                  </Chip>
                ) : null}

                <Chip variant='outline'>{badgeType(ex.nature_code)}</Chip>

                {ex.support_label ? (
                  <Chip variant='secondary'>Support: {ex.support_label}</Chip>
                ) : null}

                <Chip variant='secondary'>Cote: {cote || '—'}</Chip>

                {ex.nb_pages && ex.pagination_type ? (
                  <Chip variant='outline'>
                    Pagination: {ex.nb_pages} {ex.pagination_type}
                  </Chip>
                ) : null}

                {online ? (
                  <Chip className='border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50'>
                    En ligne
                  </Chip>
                ) : (
                  <Chip className='border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50'>
                    Sur place
                  </Chip>
                )}

                {copyOf ? <Chip variant='outline'>{copyOf}</Chip> : null}
                {vuesLabel ? <Chip variant='secondary'>{vuesLabel}</Chip> : null}
                {pagesLabel ? <Chip variant='secondary'>{pagesLabel}</Chip> : null}
              </div>

              <div className='mt-1 text-xs text-slate-600'>
                {safeLabel(ex.institution_nom)} · {safeLabel(ex.depot_nom)} ·{' '}
                <span className='font-medium text-slate-800'>{safeLabel(ex.unite_titre)}</span>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                onClick={() => openPickerForIdx(idx)}
                className='rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50'
              >
                Changer
              </button>

              <button
                type='button'
                onClick={() => onRemove(idx)}
                className='rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50'
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <div className='p-4'>
          <div className='space-y-6'>
            {/* Registre (flat, pas une card) */}
            <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
              <div className='min-w-0'>
                <div className='text-xs font-medium text-slate-700'>Registre</div>

                <div className='mt-1 flex flex-wrap items-center gap-2'>
                  <div className='text-sm font-semibold text-slate-900'>
                    {ex.unite_titre || '—'}
                  </div>

                  {ex.institution_sigle ? (
                    <Chip variant='outline'>{ex.institution_sigle}</Chip>
                  ) : null}
                  {ex.depot_nom ? <Chip variant='secondary'>{ex.depot_nom}</Chip> : null}
                  {ex.nature_code ? (
                    <Chip variant='outline'>{badgeType(ex.nature_code)}</Chip>
                  ) : null}
                </div>

                <div className='mt-1 text-xs text-slate-600'>
                  {cote ? (
                    <span>
                      Cote : <span className='font-medium'>{cote}</span>
                    </span>
                  ) : (
                    <span className='text-slate-500'>—</span>
                  )}
                  {ex.pagination_type ? (
                    <span className='text-slate-500'> · Pagination : {ex.pagination_type}</span>
                  ) : null}
                </div>

                {/* Option: garde Details si tu veux, mais sans "mini-card" */}
                <details className='mt-2'>
                  <summary className='cursor-pointer select-none text-xs font-medium text-slate-700 hover:text-slate-900'>
                    Détails
                  </summary>

                  <div className='mt-2 space-y-1 text-xs text-slate-700'>
                    <div>
                      <span className='text-slate-500'>Institution :</span>{' '}
                      <span className='font-medium'>{ex.institution_nom ?? '—'}</span>
                    </div>
                    <div>
                      <span className='text-slate-500'>Dépôt :</span>{' '}
                      <span className='font-medium'>{ex.depot_nom ?? '—'}</span>
                    </div>
                    <div>
                      <span className='text-slate-500'>Accès :</span>{' '}
                      <span className='font-medium'>{online ? 'En ligne' : 'Sur place'}</span>
                    </div>

                    {url ? (
                      <div className='mt-2'>
                        <div className='text-[11px] text-slate-500'>URL</div>
                        <div className='break-all font-mono text-xs text-slate-700'>{url}</div>
                      </div>
                    ) : null}
                  </div>
                </details>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                {url ? (
                  <a
                    href={normalizeUrl(url)}
                    target='_blank'
                    rel='noreferrer'
                    className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50'
                  >
                    Ouvrir visionneuse ↗
                  </a>
                ) : (
                  <span className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700'>
                    Pas d’URL
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* ===== Métier (flat) ===== */}
            <div className='space-y-6'>
              {/* Statut */}
              <div>
                <div className='text-sm font-semibold text-slate-900'>Statut</div>
                <div className='mt-2 flex flex-wrap items-center gap-4'>
                  {mode === 'acte' ? (
                    <label className='flex items-center gap-2 text-sm'>
                      <Checkbox
                        checked={Boolean((c as ActeCitationDraft).acte_manquant)}
                        onCheckedChange={(v) =>
                          patchActe(idx, {
                            acte_manquant: Boolean(v),
                          } as Partial<ActeCitationDraft>)
                        }
                      />
                      <span>Acte manquant</span>
                    </label>
                  ) : (
                    <label className='flex items-center gap-2 text-sm'>
                      <Checkbox
                        checked={Boolean((c as RegistreCitationDraft).registre_manquant)}
                        onCheckedChange={(v) =>
                          patchRegistre(idx, {
                            registre_manquant: Boolean(v),
                          } as Partial<RegistreCitationDraft>)
                        }
                      />
                      <span>Registre manquant</span>
                    </label>
                  )}

                  <label className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      checked={Boolean((c as any).lacune)}
                      onCheckedChange={(v) => onChange(idx, { lacune: Boolean(v) } as any)}
                    />
                    <span>Lacune</span>
                  </label>
                </div>

                {Boolean((c as any).lacune) ? (
                  <div className='mt-3'>
                    <div className='text-xs font-medium text-slate-700'>Détail lacune</div>
                    <Textarea
                      value={String((c as any).lacune_note ?? '')}
                      onChange={(e) => onChange(idx, { lacune_note: e.target.value } as any)}
                      placeholder='Ex. vues 120–140 absentes, pages déchirées, etc.'
                      className='mt-1 min-h-[70px]'
                    />
                  </div>
                ) : null}
              </div>

              {/* Localisation (acte) */}
              {mode === 'acte' ? (
                <>
                  <Separator />
                  <div>
                    <div className='text-sm font-semibold text-slate-900'>
                      Localisation de l’acte
                    </div>
                    <div className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-12'>
                      <div className='md:col-span-6'>
                        <div className='text-xs font-medium text-slate-700'>Vues (texte libre)</div>
                        <Input
                          value={String((c as ActeCitationDraft).vues_raw ?? '')}
                          onChange={(e) => patchActe(idx, { vues_raw: e.target.value })}
                          placeholder='Ex. vues 23–24'
                          className='mt-1'
                        />
                      </div>

                      <div className='md:col-span-6'>
                        <div className='text-xs font-medium text-slate-700'>
                          Pages (texte libre)
                        </div>
                        <Input
                          value={String((c as ActeCitationDraft).page_raw ?? '')}
                          onChange={(e) => patchActe(idx, { page_raw: e.target.value })}
                          placeholder='Ex. pages 12–13'
                          className='mt-1'
                        />
                      </div>

                      <div className='md:col-span-3'>
                        <div className='text-xs font-medium text-slate-700'>Vue début</div>
                        <Input
                          value={(c as ActeCitationDraft).vues_start ?? ''}
                          onChange={(e) =>
                            patchActe(idx, { vues_start: toIntOrNull(e.target.value) })
                          }
                          className='mt-1'
                        />
                      </div>
                      <div className='md:col-span-3'>
                        <div className='text-xs font-medium text-slate-700'>Vue fin</div>
                        <Input
                          value={(c as ActeCitationDraft).vues_end ?? ''}
                          onChange={(e) =>
                            patchActe(idx, { vues_end: toIntOrNull(e.target.value) })
                          }
                          className='mt-1'
                        />
                      </div>

                      <div className='md:col-span-3'>
                        <div className='text-xs font-medium text-slate-700'>Page début</div>
                        <Input
                          value={(c as ActeCitationDraft).page_start ?? ''}
                          onChange={(e) =>
                            patchActe(idx, { page_start: toIntOrNull(e.target.value) })
                          }
                          className='mt-1'
                        />
                      </div>
                      <div className='md:col-span-3'>
                        <div className='text-xs font-medium text-slate-700'>Page fin</div>
                        <Input
                          value={(c as ActeCitationDraft).page_end ?? ''}
                          onChange={(e) =>
                            patchActe(idx, { page_end: toIntOrNull(e.target.value) })
                          }
                          className='mt-1'
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              <Separator />

              {/* Caractéristiques */}
              <div>
                <div className='text-sm font-semibold text-slate-900'>
                  Caractéristiques du document
                </div>
                <div className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-12'>
                  <div className='md:col-span-4'>
                    <div className='text-xs font-medium text-slate-700'>Forme</div>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {((c as any).document_form_labels ?? []).length ? (
                        (c as any).document_form_labels.map((x: string) => (
                          <Chip key={x} variant='secondary'>
                            {x}
                          </Chip>
                        ))
                      ) : (
                        <span className='text-xs text-slate-500'>—</span>
                      )}
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      className='mt-2'
                      onClick={() =>
                        openDict({
                          kind: 'document_form_ref' as any,
                          title: 'Forme du document',
                          multi: true,
                          defaultSelectedIds: (c as any).document_form_ids ?? [],
                          onValidate: (items) => {
                            onChange(idx, {
                              document_form_ids: items.map((it) => it.id),
                              document_form_labels: items.map((it) => it.label),
                            } as any);
                          },
                        })
                      }
                    >
                      Choisir…
                    </Button>
                  </div>

                  <div className='md:col-span-4'>
                    <div className='text-xs font-medium text-slate-700'>État physique</div>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {((c as any).physical_condition_labels ?? []).length ? (
                        (c as any).physical_condition_labels.map((x: string) => (
                          <Chip key={x} variant='secondary'>
                            {x}
                          </Chip>
                        ))
                      ) : (
                        <span className='text-xs text-slate-500'>—</span>
                      )}
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      className='mt-2'
                      onClick={() =>
                        openDict({
                          kind: 'physical_condition_ref' as any,
                          title: 'État physique',
                          multi: true,
                          defaultSelectedIds: (c as any).physical_condition_ids ?? [],
                          onValidate: (items) => {
                            onChange(idx, {
                              physical_condition_ids: items.map((it) => it.id),
                              physical_condition_labels: items.map((it) => it.label),
                            } as any);
                          },
                        })
                      }
                    >
                      Choisir…
                    </Button>
                  </div>

                  <div className='md:col-span-4'>
                    <div className='text-xs font-medium text-slate-700'>
                      Qualité de reproduction
                    </div>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {((c as any).repro_quality_labels ?? []).length ? (
                        (c as any).repro_quality_labels.map((x: string) => (
                          <Chip key={x} variant='secondary'>
                            {x}
                          </Chip>
                        ))
                      ) : (
                        <span className='text-xs text-slate-500'>—</span>
                      )}
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      className='mt-2'
                      onClick={() =>
                        openDict({
                          kind: 'repro_quality_ref' as any,
                          title: 'Qualité de reproduction',
                          multi: true,
                          defaultSelectedIds: (c as any).repro_quality_ids ?? [],
                          onValidate: (items) => {
                            onChange(idx, {
                              repro_quality_ids: items.map((it) => it.id),
                              repro_quality_labels: items.map((it) => it.label),
                            } as any);
                          },
                        })
                      }
                    >
                      Choisir…
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Marques + Note sur 2 colonnes */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                <div className='md:col-span-6'>
                  <div className='text-sm font-semibold text-slate-900'>Marques / signes</div>
                  <Input
                    value={joinListToCsv((c as any).marks)}
                    onChange={(e) =>
                      onChange(idx, { marks: splitCsvToList(e.target.value) } as any)
                    }
                    placeholder='tampon, signature, cachet'
                    className='mt-2'
                  />
                </div>

                <div className='md:col-span-6'>
                  <div className='text-sm font-semibold text-slate-900'>Note</div>
                  <Textarea
                    value={String((c as any).note ?? '')}
                    onChange={(e) => onChange(idx, { note: e.target.value } as any)}
                    placeholder='Ex. graphie difficile, coin déchiré, index absent, etc.'
                    className='mt-2 min-h-[90px]'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ------------------------------------------
  // UI
  // ------------------------------------------
  return (
    <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div>
          <h3 className='text-sm font-semibold text-slate-900'>Sources & références</h3>
          <p className='mt-1 text-sm text-slate-600'>
            Tu choisis un <span className='font-medium'>registre / unité documentaire</span> (via un
            exemplaire : original, microfilm, numérisation) puis tu saisis ce qui est spécifique à
            l’acte : <span className='font-medium'>vues/pages</span>,{' '}
            <span className='font-medium'>lacune</span>, note.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <button
            type='button'
            onClick={() => setOpenNodes(Object.fromEntries(allKeys.map((k) => [k, true])))}
            className='rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50'
          >
            Tout déplier
          </button>

          <button
            type='button'
            onClick={() => setOpenNodes(Object.fromEntries(allKeys.map((k) => [k, false])))}
            className='rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50'
          >
            Tout réduire
          </button>

          <button
            type='button'
            onClick={openPickerForNew}
            className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50'
          >
            <Plus className='h-4 w-4' />
            Ajouter une référence
          </button>
        </div>
      </div>

      <div className='mt-4 space-y-3'>
        {loading && <div className='text-sm text-slate-600'>Chargement…</div>}

        {!loading && !hasAnySelected && (
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
            Aucune référence sélectionnée pour l’instant.
            <div className='mt-2 text-xs text-slate-600'>
              Clique sur <span className='font-medium'>“Ajouter une référence”</span> pour choisir
              le registre / l’unité documentaire.
            </div>
          </div>
        )}

        {!loading &&
          tree.map((inst) => (
            <div
              key={inst.key}
              className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'
            >
              <button
                type='button'
                onClick={() => toggleNode(inst.key)}
                className='w-full border-b border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100/60'
              >
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex min-w-0 items-center gap-2'>
                    {isNodeOpen(inst.key) ? (
                      <ChevronDown className='h-4 w-4 text-slate-600' />
                    ) : (
                      <ChevronRight className='h-4 w-4 text-slate-600' />
                    )}
                    <div className='truncate text-sm font-semibold text-slate-900'>
                      {inst.label}
                    </div>
                    <Badge variant='secondary' className='text-[11px]'>
                      {inst.count}
                    </Badge>
                  </div>
                  <div className='text-xs font-medium text-slate-700'>
                    {isNodeOpen(inst.key) ? 'Réduire' : 'Déplier'}
                  </div>
                </div>
              </button>

              {isNodeOpen(inst.key) ? (
                <div className='space-y-3 p-4'>
                  {inst.children.map((depot) => (
                    <div
                      key={depot.key}
                      className='overflow-hidden rounded-2xl border border-slate-200 bg-white'
                    >
                      <button
                        type='button'
                        onClick={() => toggleNode(depot.key)}
                        className='w-full border-b border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100/60'
                      >
                        <div className='flex items-center justify-between gap-3'>
                          <div className='flex min-w-0 items-center gap-2'>
                            {isNodeOpen(depot.key) ? (
                              <ChevronDown className='h-4 w-4 text-slate-600' />
                            ) : (
                              <ChevronRight className='h-4 w-4 text-slate-600' />
                            )}

                            <div className='truncate text-sm font-semibold text-slate-900'>
                              {depot.label}
                            </div>

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

                          <div className='text-xs font-medium text-slate-700'>
                            {isNodeOpen(depot.key) ? 'Réduire' : 'Déplier'}
                          </div>
                        </div>
                      </button>

                      {isNodeOpen(depot.key) ? (
                        <div className='space-y-3 p-4'>
                          {depot.children.map((unite, unitePos) => (
                            <div
                              key={unite.key}
                              className='overflow-hidden rounded-2xl border border-slate-200 bg-white'
                            >
                              <button
                                type='button'
                                onClick={() => toggleNode(unite.key)}
                                className='w-full border-b border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100/60'
                              >
                                <div className='flex items-center justify-between gap-3'>
                                  <div className='min-w-0'>
                                    <div className='flex items-center gap-2'>
                                      {isNodeOpen(unite.key) ? (
                                        <ChevronDown className='h-4 w-4 text-slate-600' />
                                      ) : (
                                        <ChevronRight className='h-4 w-4 text-slate-600' />
                                      )}
                                      <div className='truncate text-sm font-semibold text-slate-900'>
                                        {unite.label}
                                      </div>
                                      <Chip variant='secondary'>Exemplaires: {unite.count}</Chip>
                                    </div>
                                  </div>

                                  <div className='text-xs font-medium text-slate-700'>
                                    {isNodeOpen(unite.key) ? 'Réduire' : 'Déplier'}
                                  </div>
                                </div>
                              </button>

                              {isNodeOpen(unite.key) ? (
                                <div className='space-y-3 p-4'>
                                  {(() => {
                                    const exemplaireIdToNumber = new Map<string, number>();
                                    unite.children.forEach((leaf, i) => {
                                      if (leaf.c.exemplaire_id) {
                                        exemplaireIdToNumber.set(leaf.c.exemplaire_id, i + 1);
                                      }
                                    });

                                    return unite.children.map((leaf, pos) => (
                                      <div
                                        key={leaf.key}
                                        ref={(el) => {
                                          itemRefs.current[leaf.idx] = el;
                                        }}
                                        className={[
                                          'overflow-hidden rounded-xl border border-slate-200 bg-white transition',
                                          'scroll-mt-30',
                                          highlightIdx === leaf.idx
                                            ? 'ring-2 ring-slate-900/30 shadow-md animate-[pulse_0.8s_ease-out]'
                                            : '',
                                        ].join(' ')}
                                      >
                                        {renderCitationCard({
                                          c: leaf.c,
                                          idx: leaf.idx,
                                          pos,
                                          exemplaireIdToNumber,
                                        })}
                                      </div>
                                    ));
                                  })()}
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

      <ExemplairePickerDialog
        open={pickerOpen}
        onOpenChange={(v) => {
          setPickerOpen(v);
          if (!v) closePicker();
        }}
        mode={mode}
        registreId={mode === 'acte' ? (registreId ?? null) : null}
        excludeExemplaireIds={alreadyPickedExemplaireIds}
        onlyOnline={onlyOnline}
        setOnlyOnline={setOnlyOnline}
        q={q}
        setQ={setQ}
        onPick={(row) => pick(row)}
      />

      <Sheet open={dictOpen} onOpenChange={setDictOpen}>
        <SheetContent side='right' className='w-[520px] sm:w-[640px] p-0'>
          <SheetHeader className='sr-only'>
            <SheetTitle>{dictArgs?.title ?? 'Dictionnaire'}</SheetTitle>
            <SheetDescription>Sélection d’une valeur de dictionnaire</SheetDescription>
          </SheetHeader>

          {dictArgs && (
            <DictionnaireEditorPanel
              kind={dictArgs.kind}
              title={dictArgs.title}
              multi={dictArgs.multi}
              defaultSelectedIds={dictArgs.defaultSelectedIds}
              onValidate={dictArgs.onValidate}
              onCancel={() => setDictOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
