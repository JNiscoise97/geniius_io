// ReferenceSourcesCard.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type {
  ActeCitationDraft,
  RegistreCitationDraft,
  ExemplairePick,
  Mode,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import {
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Circle,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';
import { TriStateButton } from '@/components/shared/TriStateButton';

import {
  safeLabel,
  normKey,
  normalizeUrl,
  formatRangeLabel,
  toIntOrNull,
  splitCsvToList,
  joinListToCsv,
} from './ReferenceSourcesCard/helpers/utils';

import { getDraftKey as getDraftKeyHelper } from './ReferenceSourcesCard/helpers/keys';

import { getLocSystem0 } from './ReferenceSourcesCard/json/locating';
import { getMarginalia0, setMarginalia0 } from './ReferenceSourcesCard/json/marginalia';
import { getWriting } from './ReferenceSourcesCard/json/writing';

import { UnitsPanel } from './ReferenceSourcesCard/components/UnitsPanel';
import { ExemplairesPanel } from './ReferenceSourcesCard/components/ExemplairesPanel';
import { EditorPanel } from './ReferenceSourcesCard/components/EditorPanel';

import { SegmentsEditor } from './ReferenceSourcesCard/editors/registre/SegmentsEditor';

type AnyDraft = ActeCitationDraft | RegistreCitationDraft;
type DraftKey = string;

type EditCallbacks =
  | {
      mode: 'edit';
      onAdd: () => void;
      onRemove: (idx: number) => void;
      onChange: (idx: number, patch: Partial<ActeCitationDraft>) => void;
    }
  | {
      mode: 'edit';
      onAdd: () => void;
      onRemove: (idx: number) => void;
      onChange: (idx: number, patch: Partial<RegistreCitationDraft>) => void;
    };

type ViewCallbacks =
  | { mode: 'view'; onAdd?: never; onRemove?: never; onChange?: never }
  | { mode: 'view'; onAdd?: never; onRemove?: never; onChange?: never };

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

type SectionSourcesProps =
  | ({
      type: 'acte';
      registreId?: string | null;
      sources: ActeCitationDraft[];
      loading: boolean;
    } & (EditCallbacks | ViewCallbacks))
  | ({
      type: 'registre';
      registreId?: string | null;
      sources: RegistreCitationDraft[];
      loading: boolean;
    } & (EditCallbacks | ViewCallbacks));

type SectionSourcesEditProps = Extract<SectionSourcesProps, { mode: 'edit' }>;

function assertEditMode(p: SectionSourcesProps): asserts p is SectionSourcesEditProps {
  if (p.mode !== 'edit') {
    throw new Error('SectionSources: action appelée en mode view');
  }
}

function ToggleLeftPanelsButton(props: {
  leftCollapsed: boolean;
  onToggleLeftPanels: () => void;
  expandLabel?: string;
  collapseLabel?: string;
}) {
  const {
    leftCollapsed,
    onToggleLeftPanels,
    expandLabel = 'Développer',
    collapseLabel = 'Réduire',
  } = props;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant='secondary'
          size='sm'
          className='gap-2'
          onClick={onToggleLeftPanels}
        >
          {leftCollapsed ? (
            <>
              <ChevronsRight className='h-4 w-4' />
              {expandLabel}
            </>
          ) : (
            <>
              <ChevronsLeft className='h-4 w-4' />
              {collapseLabel}
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {leftCollapsed ? 'Afficher Unités + Exemplaires' : 'Masquer Unités + Exemplaires'}
      </TooltipContent>
    </Tooltip>
  );
}

export function SectionSources(props: SectionSourcesProps) {
  const { type, registreId, loading } = props;
  const isEdit = props.mode === 'edit';
  const mode = props.mode;
  const isRO = !isEdit;

  const sources = props.sources as AnyDraft[];
  const count = sources ? sources.length : 0;

  const onChange = (idx: number, patch: Partial<AnyDraft>) => {
    if (!isEdit) return;
    assertEditMode(props);
    (props.onChange as any)(idx, patch);
  };

  // ---------------------------------------------------------------------------
  // Draft keys (no module-global Map)
  // ---------------------------------------------------------------------------
  const tmpKeyByIndexRef = useRef(new Map<number, DraftKey>());
  const getKey = (c: AnyDraft, idx?: number) =>
    getDraftKeyHelper(c as any, idx, tmpKeyByIndexRef.current);

  // ---------------------------------------------------------------------------
  // Selection states
  // ---------------------------------------------------------------------------
  const [activeUniteKey, setActiveUniteKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<DraftKey | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function isOnlineEx(c: AnyDraft) {
    const ex: any = c.exemplaire ?? {};
    const hasUrl = Boolean((ex.url_base ?? '').trim());
    return Boolean(ex.depot_is_online) || hasUrl;
  }

  // ---------------------------------------------------------------------------
  // Global numbering of exemplaires (stable across units)
  // ---------------------------------------------------------------------------
  const globalExemplaireNumber = useMemo(() => {
    const picked = sources.map((c, i) => ({ c, i })).filter(({ c }) => Boolean(c.exemplaire_id));

    picked.sort((a, b) => {
      const ao = (a.c as any).sort_order;
      const bo = (b.c as any).sort_order;
      const as = Number.isFinite(ao) ? ao : a.i;
      const bs = Number.isFinite(bo) ? bo : b.i;
      return as - bs;
    });

    const map = new Map<string, number>();
    picked.forEach(({ c }, idx) => {
      const exId = c.exemplaire_id as string;
      map.set(exId, idx + 1);
    });

    return map;
  }, [sources]);

  // ---------------------------------------------------------------------------
  // Picker
  // ---------------------------------------------------------------------------
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [onlyOnline, setOnlyOnline] = useState(false);

  const closePicker = () => {
    setPickerOpen(false);
    setPickerTargetIdx(null);
  };

  const openPickerForIdx = (idx: number) => {
    setPickerTargetIdx(idx);
    setPickerOpen(true);
  };

  const openPickerForNew = () => {
    if (!isEdit) return;
    assertEditMode(props);

    const nextIdx = sources.length;
    props.onAdd();
    setPickerTargetIdx(nextIdx);
    setPickerOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Dictionnaire (Drawer)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Pick action
  // ---------------------------------------------------------------------------
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
        nature_ref: row.nature_ref,
        nature_code: row.nature_code,
        nature_label: row.nature_label,
        support_ref: row.support_ref,
        support_code: row.support_code,
        support_label: row.support_label,
        physical_condition_ref: row.physical_condition_ref,
        physical_condition_code: row.physical_condition_code,
        physical_condition_label: row.physical_condition_label,
        unite_titre: row.unite_titre,
        cote_locale: row.cote_locale,
        pagination_type_ref: row.pagination_type_ref,
        pagination_type_code: row.pagination_type_code,
        pagination_type_label: row.pagination_type_label,
        nb_pages: row.nb_pages,
        depot_is_online: row.depot_is_online,
        depot_is_physical: row.depot_is_physical,
        depot_nom: row.depot_nom,
        institution_sigle: row.institution_sigle,
        institution_nom: row.institution_nom,
        identifiant_interne: row.identifiant_interne,
        localisation_interne: row.localisation_interne,
        url_base: row.url_base,
        plateforme_code: row.plateforme_code,
        source_exemplaire_id: (row as any).source_exemplaire_id ?? null,
      },
    };

    if (type === 'acte') {
      patchActe(pickerTargetIdx, {
        ...(base as any),
        loc_start: null,
        loc_end: null,
        loc_raw: '',
        is_missing: null,
      });
    } else {
      patchRegistre(pickerTargetIdx, {
        ...(base as any),
        is_missing: null,
      } as any);
    }

    // force selection on picked exemplaire
    setSelectedKey(`ex:${row.exemplaire_id}`);

    const ex: any = base.exemplaire ?? {};
    const instLabel = safeLabel(ex.institution_sigle || ex.institution_nom);
    const uniteLabel = safeLabel(ex.unite_titre);
    const uniteId = (ex.unite_id ?? null) as string | null;

    const uniteKey = uniteId
      ? `unite:${uniteId}`
      : `unite_fallback:${normKey(instLabel)}||${normKey(uniteLabel)}`;

    setActiveUniteKey(uniteKey);

    closePicker();
  };

  const hasAnySelected = sources.some((s) => Boolean(s.exemplaire_id));

  // ---------------------------------------------------------------------------
  // Units model
  // ---------------------------------------------------------------------------
  type LeafNode = { kind: 'leaf'; key: string; draftKey: DraftKey; c: AnyDraft };

  type UnitNode = {
    kind: 'unite';
    key: string;
    uniteId: string | null;
    label: string;
    instLabel: string;
    depotLabel: string;
    online: boolean;
    count: number;
    children: LeafNode[];
  };

  function buildUnitsFromDrafts(drafts: AnyDraft[]) {
    const canonicalUniteKeyByInstAndLabel = new Map<string, string>();

    const picked = drafts
      .map((c, i) => ({ c, i, draftKey: getKey(c, i) }))
      .filter(({ c }) => Boolean(c.exemplaire_id));

    // pass 1: if some have unite_id, set canonical key
    for (const { c } of picked) {
      const ex: any = c.exemplaire ?? {};
      const instLabel = safeLabel(ex.institution_sigle || ex.institution_nom);
      const uniteLabel = safeLabel(ex.unite_titre);
      const uniteId = (ex.unite_id ?? null) as string | null;

      const mapKey = `inst:${normKey(instLabel)}||unite:${normKey(uniteLabel)}`;
      if (uniteId) canonicalUniteKeyByInstAndLabel.set(mapKey, `unite:${uniteId}`);
    }

    const uniteMap = new Map<
      string,
      {
        uniteId: string | null;
        label: string;
        instLabel: string;
        depotLabel: string;
        online: boolean;
        leaves: Array<{ draftKey: DraftKey; c: AnyDraft; i: number }>;
      }
    >();

    for (const { c, draftKey, i } of picked) {
      const ex: any = c.exemplaire ?? {};
      const instLabel = safeLabel(ex.institution_sigle || ex.institution_nom);
      const depotLabel = safeLabel(ex.depot_nom, 'Dépôt ?');
      const uniteLabel = safeLabel(ex.unite_titre);
      const uniteIdRaw = (ex.unite_id ?? null) as string | null;

      const mapKey = `inst:${normKey(instLabel)}||unite:${normKey(uniteLabel)}`;
      const canonical = canonicalUniteKeyByInstAndLabel.get(mapKey) ?? null;

      const uniteKey = uniteIdRaw
        ? `unite:${uniteIdRaw}`
        : canonical
          ? canonical
          : `unite_fallback:${normKey(instLabel)}||${normKey(uniteLabel)}`;

      const uniteId = uniteIdRaw ?? (canonical ? canonical.replace('unite:', '') : null);

      if (!uniteMap.has(uniteKey)) {
        uniteMap.set(uniteKey, {
          uniteId,
          label: uniteLabel,
          instLabel,
          depotLabel,
          online: false,
          leaves: [],
        });
      }

      const u = uniteMap.get(uniteKey)!;
      u.leaves.push({ draftKey, c, i });
      u.online = u.online || isOnlineEx(c);

      if (u.depotLabel === 'Dépôt ?' && depotLabel !== 'Dépôt ?') u.depotLabel = depotLabel;
    }

    const units: UnitNode[] = Array.from(uniteMap.entries())
      .map(([uniteKey, u]) => {
        const leaves: LeafNode[] = u.leaves
          .slice()
          .sort((a, b) => {
            // online first
            const ao = isOnlineEx(a.c) ? 0 : 1;
            const bo = isOnlineEx(b.c) ? 0 : 1;
            if (ao !== bo) return ao - bo;

            const ax: any = a.c.exemplaire ?? {};
            const bx: any = b.c.exemplaire ?? {};

            const dd = safeLabel(ax.depot_nom, '').localeCompare(safeLabel(bx.depot_nom, ''));
            if (dd !== 0) return dd;

            const na = safeLabel(ax.nature_label, '').localeCompare(safeLabel(bx.nature_label, ''));
            if (na !== 0) return na;

            const ca = (ax.cote_locale ?? '').localeCompare(bx.cote_locale ?? '');
            if (ca !== 0) return ca;

            return (a.c.exemplaire_id ?? '').localeCompare(b.c.exemplaire_id ?? '');
          })
          .map((it) => ({
            kind: 'leaf' as const,
            key: `leaf:${it.draftKey}`,
            draftKey: it.draftKey,
            c: it.c,
          }));

        return {
          kind: 'unite' as const,
          key: uniteKey,
          uniteId: u.uniteId,
          label: u.label,
          instLabel: u.instLabel,
          depotLabel: u.depotLabel,
          online: u.online,
          count: leaves.length,
          children: leaves,
        };
      })
      .sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        const la = a.label.localeCompare(b.label);
        if (la !== 0) return la;
        return a.instLabel.localeCompare(b.instLabel);
      });

    return { units };
  }

  const { units } = useMemo(() => buildUnitsFromDrafts(sources), [sources]);

  // ---------------------------------------------------------------------------
  // Keep selection coherent when sources change
  // ---------------------------------------------------------------------------
  const pickedKeys = useMemo(() => {
    return sources
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => Boolean(c.exemplaire_id))
      .map(({ c, i }) => getKey(c, i));
  }, [sources]);

  useEffect(() => {
    if (!activeUniteKey) {
      const firstUnit = units[0] ?? null;
      if (firstUnit) setActiveUniteKey(firstUnit.key);
    }

    if (selectedKey == null) {
      const first = pickedKeys[0] ?? null;
      if (first) setSelectedKey(first);
    } else {
      const still = sources.find((c, i) => getKey(c, i) === selectedKey) ?? null;
      if (!still || !still.exemplaire_id) setSelectedKey(pickedKeys[0] ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, pickedKeys.join('|'), sources]);

  // ---------------------------------------------------------------------------
  // Middle panel: exemplaires for active unite
  // ---------------------------------------------------------------------------
  const exemplairesForActiveUnite = useMemo(() => {
    const unit = units.find((u) => u.key === activeUniteKey) ?? null;
    if (!unit) return [];

    return unit.children.map((leaf) => {
      const exId = leaf.c.exemplaire_id ?? null;
      const globalNo = exId ? (globalExemplaireNumber.get(exId) ?? null) : null;

      return {
        draftKey: leaf.draftKey,
        c: leaf.c,
        globalNo,
      };
    });
  }, [units, activeUniteKey, globalExemplaireNumber]);

  const flatActiveUniteKeys = useMemo(
    () => exemplairesForActiveUnite.map((x) => x.draftKey),
    [exemplairesForActiveUnite],
  );

  // ---------------------------------------------------------------------------
  // UI labels & completeness
  // ---------------------------------------------------------------------------
  const getExemplaireTitle = (c: AnyDraft, globalNo: number | null) => {
    const ex: any = c.exemplaire ?? {};
    const nature = ex.nature_label;

    const src = (ex.source_exemplaire_id ?? '').trim();
    if (src) {
      const n = globalExemplaireNumber.get(src);
      return n ? `${nature} (copie de #${n})` : `${nature} (copie)`;
    }

    return globalNo ? `${nature} #${globalNo}` : `${nature}`;
  };

  const getExemplaireStatus = (c: AnyDraft) => {
    if (type === 'acte') {
      const missing = (c as ActeCitationDraft).is_missing;
      if (missing) return 'missing';

      const a = c as ActeCitationDraft;
      const hasLoc = Boolean((a.loc_raw ?? '').trim()) || a.loc_start != null || a.loc_end != null;

      return hasLoc ? 'ok' : 'todo';
    }

    const missing = (c as any).is_missing;
    if (missing) return 'missing';

    const loc0 = getLocSystem0((c as any).locating);
    const hasLoc =
      Boolean((loc0.raw ?? '').toString().trim()) || loc0.start != null || loc0.end != null;

    const hasNote = Boolean(((c as any).note ?? '').toString().trim());
    const hasMarks = Boolean(((c as any).marks ?? '').toString().trim());

    return hasLoc || hasNote || hasMarks ? 'ok' : 'todo';
  };

  const StatusIcon = ({ status }: { status: 'ok' | 'todo' | 'missing' }) => {
    if (status === 'ok') return <CheckCircle2 className='h-4 w-4 text-emerald-600' />;
    if (status === 'missing') return <AlertTriangle className='h-4 w-4 text-red-600' />;
    return <Circle className='h-4 w-4 text-amber-600' />;
  };

  const selectUnit = (unitKey: string) => {
    setActiveUniteKey(unitKey);

    const unit = units.find((u) => u.key === unitKey) ?? null;
    const firstDraftKey = unit?.children?.[0]?.draftKey ?? null;

    setSelectedKey(firstDraftKey);
  };

  // ---------------------------------------------------------------------------
  // Editor helpers
  // ---------------------------------------------------------------------------
  const handleRemove = (draftKey: DraftKey) => {
    if (!isEdit) return;
    assertEditMode(props);

    const currentList = flatActiveUniteKeys;
    const pos = currentList.indexOf(draftKey);

    const nextKey =
      pos >= 0 ? (currentList[pos + 1] ?? currentList[pos - 1] ?? null) : (pickedKeys[0] ?? null);

    const idx = sources.findIndex((c, i) => getKey(c, i) === draftKey);
    if (idx >= 0) props.onRemove(idx);

    setSelectedKey(nextKey);
  };

  // ---------------------------------------------------------------------------
  // ACTE Right panel (header + form)
  // ---------------------------------------------------------------------------
  function renderActeHeader(args: {
    c: AnyDraft;
    globalNo: number | null;
    idx: number;
    draftKey: DraftKey;
    readonly: boolean;
  }) {
    const { c, globalNo, idx, draftKey, readonly } = args;

    const ex: any = c.exemplaire ?? {};
    const online = isOnlineEx(c);
    const url = (ex.url_base ?? '').trim();
    const cote = (ex.cote_locale ?? '').trim();

    const missing = !!(c as ActeCitationDraft).is_missing;

    const copyOf = (() => {
      const src = (ex.source_exemplaire_id ?? '').trim();
      if (!src) return '';
      const n = globalExemplaireNumber.get(src);
      return n ? `copie de #${n}` : 'copie';
    })();

    const natureLabel = (ex.nature_label ?? '').trim();
    const supportLabel = (ex.support_label ?? '').trim();
    const hasSource = !!(ex.source_exemplaire_id ?? '').trim();

    const showNatureOrCopy = natureLabel && hasSource ? copyOf : natureLabel ? natureLabel : '';

    const vuesLabel =
      ((c as ActeCitationDraft).loc_raw ?? '').trim() ||
      formatRangeLabel(
        (c as ActeCitationDraft).loc_start ?? null,
        (c as ActeCitationDraft).loc_end ?? null,
        'vue',
      );

    return (
      <div className='shrink-0 border-b border-slate-200 bg-slate-50 p-4'>
        <div className='flex items-start gap-3'>
          <div className='min-w-0 basis-3/4'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white'>
                Exemplaire #{globalNo ?? '—'}
              </span>

              {missing ? (
                <Chip className='border-red-200 bg-red-50 text-red-800 hover:bg-red-50'>
                  Acte manquant
                </Chip>
              ) : null}

              {showNatureOrCopy ? (
                <Chip variant='outline'>
                  {natureLabel && hasSource
                    ? `Nature: ${natureLabel.toLowerCase()} · ${copyOf}`
                    : `Nature: ${natureLabel.toLowerCase()}`}
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

              <Chip variant='outline'>Cote: {cote || '—'}</Chip>
            </div>

            <div className='mt-2 flex flex-wrap items-center gap-2'>
              {vuesLabel ? <Chip variant='outline'>{vuesLabel}</Chip> : null}

              {supportLabel ? (
                <Chip variant='outline'>Support: {supportLabel.toLowerCase()}</Chip>
              ) : null}
            </div>
          </div>

          <div className='flex basis-1/4 flex-wrap items-center justify-end gap-2'>
            {!readonly && (
              <>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => openPickerForIdx(idx)}
                >
                  Changer
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      onClick={() => handleRemove(draftKey)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Dissocier cet exemplaire de cet acte</TooltipContent>
                </Tooltip>
              </>
            )}

            {url ? (
              <a
                href={normalizeUrl(url)}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50'
              >
                <ExternalLink className='h-4 w-4' />
                Ouvrir
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderActeForm(args: { c: AnyDraft; idx: number; mode: Mode }) {
    const { c, idx, mode } = args;

    const ex: any = c.exemplaire ?? {};
    const online = isOnlineEx(c);
    const url = (ex.url_base ?? '').trim();
    const cote = (ex.cote_locale ?? '').trim();

    const isMissing = (c as ActeCitationDraft).is_missing;
    const isLacune = (c as any).lacune === true;

    // ✅ plus de marginalia jsonb : on utilise les colonnes atomiques
    const mmPresent = (c as any).marginal_mentions_present ?? null;
    const mmCount = (c as any).marginal_mentions_count ?? null;

    const sigPresent = (c as any).signatures_present ?? null;
    const sigCount = (c as any).signatures_count ?? null;

    const mcPresent = (c as any).marginal_crossouts_present ?? null;
    const mcCount = (c as any).marginal_crossouts_count ?? null;

    // ✅ missing_ranges: jsonb Array<{ kind?: 'vue'|'page'; start?: number|null; end?: number|null; note?: string|null }>
    const missingRanges: any[] = Array.isArray((c as any).missing_ranges)
      ? (c as any).missing_ranges
      : [];

    const patchMissingRanges = (next: any[]) => onChange(idx, { missing_ranges: next } as any);

    const addMissingRange = () => {
      patchMissingRanges([...missingRanges, { kind: 'vue', start: null, end: null, note: '' }]);
    };

    const updateMissingRange = (i: number, patch: Partial<any>) => {
      const next = missingRanges.map((r, k) => (k === i ? { ...r, ...patch } : r));
      patchMissingRanges(next);
    };

    const removeMissingRange = (i: number) => {
      const next = missingRanges.filter((_, k) => k !== i);
      patchMissingRanges(next);
    };

    const hasMissingRanges = missingRanges.length > 0;

    return (
      <div className='flex-1 min-h-0 overflow-y-auto p-4'>
        <div className='space-y-6'>
          {/* Bloc 1 — Référence & localisation */}
          <div className='rounded-xl border border-slate-200 bg-white'>
            <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
              <div className='text-sm font-semibold text-slate-900'>Référence & localisation</div>
              <div className='mt-1 text-xs text-slate-600'>
                {safeLabel(ex.institution_nom)} · {safeLabel(ex.depot_nom)} ·{' '}
                <span className='font-medium text-slate-800'>{safeLabel(ex.unite_titre)}</span>
              </div>
            </div>

            <div className='p-4 space-y-4'>
              {url ? (
                <div className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
                  <div className='text-[11px] font-medium text-slate-700'>URL</div>
                  <div className='mt-1 break-all font-mono text-xs text-slate-700'>{url}</div>
                </div>
              ) : null}

              <Separator />

              {/* Statut */}
              <div>
                <div className='text-sm font-semibold text-slate-900'>Statut</div>

                <div className='mt-2 flex flex-wrap items-center gap-4'>
                  <TriStateButton
                    label='Acte manquant *'
                    yesLabel='Oui'
                    noLabel='Non'
                    value={isMissing}
                    mode={mode}
                    onChange={(v) => patchActe(idx, { is_missing: v } as any)}
                  />

                  <TriStateButton
                    label='Lacune *'
                    value={(c as any).lacune}
                    yesLabel='Oui'
                    noLabel='Non'
                    mode={mode}
                    onChange={(v) => onChange(idx, { lacune: v } as any)}
                  />
                </div>

                {isMissing === true ? (
                  <div className='mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
                    Acte déclaré manquant : la localisation (vues/pages) peut rester vide. Tu peux
                    aussi renseigner une lacune si l’absence est partielle.
                  </div>
                ) : null}

                {isLacune ? (
                  <div className='mt-3'>
                    <TextAreaField
                      label='Détail lacune'
                      readonly={isRO}
                      value={String((c as any).lacune_note ?? '')}
                      onChange={(next) => onChange(idx, { lacune_note: next } as any)}
                      placeholder='Ex. vues 120–140 absentes, pages déchirées, etc.'
                      minHeightClassName='min-h-[70px]'
                    />
                  </div>
                ) : null}

                {/* missing_ranges */}
                {isLacune ? (
                  <div className='mt-4'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <div className='text-sm font-semibold text-slate-900'>
                          Plages manquantes
                        </div>
                        <div className='mt-1 text-xs text-slate-600'>
                          Détaille précisément les vues/pages absentes (utile si « lacune »).
                        </div>
                      </div>

                      {!isRO && (
                        <Button
                          type='button'
                          variant='outline'
                          onClick={addMissingRange}
                          disabled={!isLacune}
                          title={
                            !isLacune
                              ? 'Active “Lacune” pour ajouter des plages manquantes.'
                              : undefined
                          }
                        >
                          Ajouter…
                        </Button>
                      )}
                    </div>

                    {!isLacune ? (
                      <div className='mt-2 text-xs text-slate-500'>
                        Active <span className='font-medium'>Lacune</span> pour renseigner des
                        plages manquantes.
                      </div>
                    ) : null}

                    {isLacune && !hasMissingRanges ? (
                      <div className='mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
                        Aucune plage renseignée.
                      </div>
                    ) : null}

                    {isLacune && hasMissingRanges ? (
                      <div className='mt-3 space-y-2'>
                        {missingRanges.map((r, i) => (
                          <div key={i} className='rounded-xl border border-slate-200 bg-white p-3'>
                            <div className='grid grid-cols-1 gap-3 md:grid-cols-12'>
                              <div className='md:col-span-3'>
                                <label className='block text-xs font-medium text-slate-700'>
                                  Type
                                </label>
                                <select
                                  className='mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm'
                                  value={String(r.kind ?? 'vue')}
                                  onChange={(e) => updateMissingRange(i, { kind: e.target.value })}
                                >
                                  <option value='vue'>Vues</option>
                                  <option value='page'>Pages</option>
                                </select>
                              </div>

                              <div className='md:col-span-3'>
                                <label className='block text-xs font-medium text-slate-700'>
                                  Début
                                </label>
                                <Input
                                  inputMode='numeric'
                                  className='mt-1'
                                  value={r.start ?? ''}
                                  onChange={(e) =>
                                    updateMissingRange(i, { start: toIntOrNull(e.target.value) })
                                  }
                                  placeholder='ex. 120'
                                />
                              </div>

                              <div className='md:col-span-3'>
                                <label className='block text-xs font-medium text-slate-700'>
                                  Fin
                                </label>
                                <Input
                                  inputMode='numeric'
                                  className='mt-1'
                                  value={r.end ?? ''}
                                  onChange={(e) =>
                                    updateMissingRange(i, { end: toIntOrNull(e.target.value) })
                                  }
                                  placeholder='ex. 140'
                                />
                              </div>

                              <div className='md:col-span-3 flex items-end justify-end'>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  onClick={() => removeMissingRange(i)}
                                >
                                  Supprimer
                                </Button>
                              </div>

                              <div className='md:col-span-12'>
                                <label className='block text-xs font-medium text-slate-700'>
                                  Note
                                </label>
                                <Input
                                  className='mt-1'
                                  value={String(r.note ?? '')}
                                  onChange={(e) => updateMissingRange(i, { note: e.target.value })}
                                  placeholder='ex. pages arrachées, reliure masquée, scan manquant…'
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <Separator />

              {/* Chantier */}
              <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
                  <div className='min-w-0'>
                    <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
                    <div className='mt-0.5 text-xs text-amber-800'>
                      <ol className='list-decimal pl-4'>
                        <li>Repères dans l’exemplaire issus du registre</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Localisation acte */}
              <div>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <div className='text-sm font-semibold text-slate-900'>
                      Statut & localisation
                    </div>
                    <div className='mt-1 text-xs text-slate-600'>
                      Renseigne la position dans l’exemplaire selon sa pagination (vues / pages /
                      folios…).
                    </div>
                  </div>

                  <Chip variant='secondary' className='shrink-0'>
                    Pagination : {safeLabel(ex.pagination_type_label ?? ex.pagination_type ?? '—')}
                  </Chip>
                </div>

                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
                  <div className='md:col-span-6'>
                    <Field
                      label={`Position (${safeLabel(ex.pagination_type_label ?? ex.pagination_type ?? 'pagination')})`}
                      readonly={isRO}
                      value={String((c as any).loc_raw ?? '').trim() || null}
                    >
                      <Input
                        value={String((c as any).loc_raw ?? (c as any).loc_raw ?? '')}
                        onChange={(e) => {
                          const pt = String(ex.pagination_type ?? '').toLowerCase();
                          const v = e.target.value;
                          if (pt.includes('page')) onChange(idx, { loc_raw: v } as any);
                          else onChange(idx, { loc_raw: v } as any);
                        }}
                        placeholder='Ex. 23–24 ; 120 ; f°12r–f°13v'
                      />
                    </Field>

                    <div className='mt-1 text-[11px] text-slate-500'>
                      Si ton exemplaire est en pages, on remplit{' '}
                      <span className='font-medium'>loc_raw</span>; sinon{' '}
                      <span className='font-medium'>loc_raw</span>.
                    </div>
                  </div>

                  <div className='md:col-span-3'>
                    <Field
                      label='Début'
                      readonly={isRO}
                      value={String((c as any).loc_start ?? (c as any).loc_start ?? '')}
                    >
                      <Input
                        inputMode='numeric'
                        value={String((c as any).loc_start ?? (c as any).loc_start ?? '')}
                        onChange={(e) => {
                          const pt = String(ex.pagination_type ?? '').toLowerCase();
                          const n = toIntOrNull(e.target.value);
                          if (pt.includes('page')) onChange(idx, { loc_start: n } as any);
                          else onChange(idx, { loc_start: n } as any);
                        }}
                        placeholder='ex. 23'
                      />
                    </Field>
                  </div>

                  <div className='md:col-span-3'>
                    <Field
                      label='Fin'
                      readonly={isRO}
                      value={String((c as any).loc_end ?? (c as any).loc_end ?? '')}
                    >
                      <Input
                        inputMode='numeric'
                        value={String((c as any).loc_end ?? (c as any).loc_end ?? '')}
                        onChange={(e) => {
                          const pt = String(ex.pagination_type ?? '').toLowerCase();
                          const n = toIntOrNull(e.target.value);
                          if (pt.includes('page')) onChange(idx, { loc_end: n } as any);
                          else onChange(idx, { loc_end: n } as any);
                        }}
                        placeholder='ex. 24'
                      />
                    </Field>
                  </div>

                  {/* Repère / acte_no / acte_date (colonnes dédiées) */}
                  <div className='md:col-span-6'>
                    <TextAreaField
                      label='Repère rapide'
                      readonly={isRO}
                      value={String((c as any).anchor_hint ?? '')}
                      onChange={(next) => onChange(idx, { anchor_hint: next } as any)}
                      placeholder='Ex. “à gauche, sous le titre”, “2e acte du jour”, “après l’acte n°10”, “en haut à droite”…'
                      minHeightClassName='min-h-[70px]'
                    />
                  </div>

                  <div className='md:col-span-3'>
                    <Field
                      label='N° d’acte'
                      readonly={isRO}
                      value={String((c as any).acte_no ?? '').trim() || null}
                    >
                      <Input
                        inputMode='numeric'
                        value={String((c as any).acte_no ?? '')}
                        onChange={(e) =>
                          onChange(idx, { acte_no: toIntOrNull(e.target.value) } as any)
                        }
                        placeholder='ex. 11'
                      />
                    </Field>
                  </div>
                </div>

                <div className='mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
                  {(() => {
                    const pt = String(ex.pagination_type ?? '').toLowerCase();
                    if (pt.includes('folio') || pt.includes('f°')) {
                      return (
                        <>
                          Conseil : pour des <span className='font-medium'>folios</span>, utilise la
                          notation <span className='font-medium'>r/v</span> (ex. f°12r–f°13v) dans
                          “Position”, et mets des nombres dans Début/Fin si tu veux un tri
                          numérique.
                        </>
                      );
                    }
                    if (pt.includes('page')) {
                      return (
                        <>
                          Conseil : pour des <span className='font-medium'>pages</span>, indique un
                          intervalle si l’acte déborde (ex. 12–13).
                        </>
                      );
                    }
                    if (pt.includes('vue') || pt.includes('image')) {
                      return (
                        <>
                          Conseil : pour des <span className='font-medium'>vues</span>, la position
                          correspond souvent à la numérotation du viewer (ex. 23–24).
                        </>
                      );
                    }
                    return (
                      <>
                        Astuce : si tu hésites, commence par “Position” en texte libre, puis
                        complète Début/Fin.
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Bloc 2 — Observations sur l’exemplaire */}
          <div className='rounded-xl border border-slate-200 bg-white'>
            <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
              <div className='text-sm font-semibold text-slate-900'>
                Observations sur l’exemplaire
              </div>
              <div className='mt-1 text-xs text-slate-600'>
                État, repro, dommages, écriture & lisibilité.
              </div>
            </div>

            <div className='p-4 space-y-5'>
              <div>
                <div className='text-sm font-semibold text-slate-900'>
                  État, reproduction & dommages
                </div>
                <div className='mt-1 text-xs text-slate-600'>
                  Décris l’état du support et les dommages observés.
                </div>

                <div className='p-4 space-y-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                    <div className='md:col-span-6'>
                      <div className='text-xs font-medium text-slate-700'>Condition physique</div>
                      <RefSinglePickerSmart
                        table='ref_physical_condition'
                        mode={mode}
                        actionsInvisible={false}
                        value={((c as any).physical_condition_ref ?? null) as any}
                        onChange={(next) => onChange(idx, { physical_condition_ref: next } as any)}
                        titleOverride='État physique'
                      />
                    </div>

                    <div className='md:col-span-12'>
                      <div className='text-xs font-medium text-slate-700'>
                        Qualité de reproduction
                      </div>
                      <RefSinglePickerSmart
                        table='ref_repro_quality'
                        mode={mode}
                        actionsInvisible={false}
                        value={((c as any).repro_quality_ref ?? null) as any}
                        onChange={(next) => onChange(idx, { repro_quality_ref: next } as any)}
                      />
                    </div>

                    <div className='md:col-span-12'>
                      <TextAreaField
                        label='Notes sur la qualité de reproduction'
                        readonly={isRO}
                        value={String((c as any).repro_notes ?? '')}
                        onChange={(next) => onChange(idx, { repro_notes: next } as any)}
                        placeholder='Ex. scan flou, contraste insuffisant, bord coupé, page inclinée, zones surexposées, microfilm sombre…'
                        minHeightClassName='min-h-[90px]'
                      />
                    </div>

                    <div className='md:col-span-12'>
                      <div className='text-xs font-medium text-slate-700'>Dommages</div>
                      <RefSinglePickerSmart
                        table='ref_document_damage_kinds'
                        mode={mode}
                        actionsInvisible={false}
                        multi={true}
                        value={((c as any).document_damage_kinds_ids ?? null) as any}
                        onChange={(next) =>
                          onChange(idx, { document_damage_kinds_ids: next } as any)
                        }
                      />
                    </div>

                    <div className='md:col-span-12'>
                      <TextAreaField
                        label='Notes sur les dommages'
                        readonly={isRO}
                        value={String((c as any).damage_notes ?? '')}
                        onChange={(next) => onChange(idx, { damage_notes: next } as any)}
                        placeholder='Ex. coin inférieur droit déchiré, encre passée, taches d’humidité…'
                        minHeightClassName='min-h-[90px]'
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className='text-sm font-semibold text-slate-900'>
                  Écriture, langue & lisibilité
                </div>
                <div className='mt-1 text-xs text-slate-600'>
                  Aide à estimer l’effort de transcription et les difficultés récurrentes.
                </div>

                <div className='p-4 space-y-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                    <div className='md:col-span-4'>
                      <div className='text-xs font-medium text-slate-700'>Langue</div>
                      <RefSinglePickerSmart
                        table='ref_langues'
                        mode={mode}
                        actionsInvisible={false}
                        value={((c as any).langue_ref ?? null) as any}
                        onChange={(next) => onChange(idx, { langue_ref: next } as any)}
                      />
                    </div>

                    <div className='md:col-span-4'>
                      <div className='text-xs font-medium text-slate-700'>Écriture</div>
                      <RefSinglePickerSmart
                        table='ref_ecritures'
                        mode={mode}
                        actionsInvisible={false}
                        value={((c as any).ecriture_ref ?? null) as any}
                        onChange={(next) => onChange(idx, { ecriture_ref: next } as any)}
                      />
                    </div>

                    <div className='md:col-span-4'>
                      <div className='text-xs font-medium text-slate-700'>Lisibilité</div>
                      <RefSinglePickerSmart
                        table='ref_handwriting_legibility'
                        mode={mode}
                        actionsInvisible={false}
                        value={((c as any).handwriting_legibility_ref ?? null) as any}
                        onChange={(next) =>
                          onChange(idx, { handwriting_legibility_ref: next } as any)
                        }
                      />
                    </div>

                    <div className='md:col-span-12'>
                      <div className='text-xs font-medium text-slate-700'>
                        Caractéristiques de lisibilité du document
                      </div>
                      <RefSinglePickerSmart
                        table='ref_document_readability_features'
                        mode={mode}
                        multi={true}
                        actionsInvisible={false}
                        value={((c as any).document_readability_features_ids ?? null) as any}
                        onChange={(next) =>
                          onChange(idx, { document_readability_features_ids: next } as any)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ✅ plus de marginalia jsonb : colonnes atomiques */}
              <div>
                <div className='text-sm font-semibold text-slate-900'>Marques & signes</div>

                <div className='p-4 space-y-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                    <div className='md:col-span-6'>
                      <TriStateButton
                        label='Mentions marginales'
                        mode={mode}
                        value={mmPresent}
                        onChange={(v) =>
                          onChange(idx, {
                            marginal_mentions_present: v,
                            marginal_mentions_count: v === true ? (mmCount ?? null) : null,
                          } as any)
                        }
                        helpText='Présent / absent / non observé.'
                      />
                    </div>

                    <div className='md:col-span-6'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Nombre de mentions marginales
                      </label>
                      <Input
                        inputMode='numeric'
                        value={mmCount ?? ''}
                        onChange={(e) =>
                          onChange(idx, {
                            marginal_mentions_count: toIntOrNull(e.target.value),
                          } as any)
                        }
                        disabled={mmPresent !== true}
                        placeholder='ex. 3'
                        className='mt-1'
                      />
                    </div>

                    <div className='md:col-span-6'>
                      <TriStateButton
                        label='Signatures'
                        mode={mode}
                        value={sigPresent}
                        onChange={(v) =>
                          onChange(idx, {
                            signatures_present: v,
                            signatures_count: v === true ? (sigCount ?? null) : null,
                          } as any)
                        }
                        helpText='Présent / absent / non observé.'
                      />
                    </div>

                    <div className='md:col-span-6'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Nombre de signatures
                      </label>
                      <Input
                        inputMode='numeric'
                        value={sigCount ?? ''}
                        onChange={(e) =>
                          onChange(idx, { signatures_count: toIntOrNull(e.target.value) } as any)
                        }
                        disabled={sigPresent !== true}
                        placeholder='ex. 2'
                        className='mt-1'
                      />
                    </div>

                    <div className='md:col-span-6'>
                      <TriStateButton
                        label='Ratures indiquées en marge'
                        mode={mode}
                        value={mcPresent}
                        onChange={(v) =>
                          onChange(idx, {
                            marginal_crossouts_present: v,
                            marginal_crossouts_count: v === true ? (mcCount ?? null) : null,
                          } as any)
                        }
                        helpText='À distinguer des ratures dans le corps du texte.'
                      />
                    </div>

                    <div className='md:col-span-6'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Nombre de ratures (en marge)
                      </label>
                      <Input
                        inputMode='numeric'
                        value={mcCount ?? ''}
                        onChange={(e) =>
                          onChange(idx, {
                            marginal_crossouts_count: toIntOrNull(e.target.value),
                          } as any)
                        }
                        disabled={mcPresent !== true}
                        placeholder='ex. 1'
                        className='mt-1'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                    <div className='md:col-span-6'>
                      <div className='text-xs font-medium text-slate-700'>Marques / signes</div>
                      <TextAreaField
                        label=''
                        readonly={isRO}
                        value={String((c as any).marks ?? '')}
                        onChange={(next) => onChange(idx, { marks: next } as any)}
                        placeholder='Ex. graphie difficile, index absent, remarque…'
                        minHeightClassName='min-h-[90px]'
                      />
                    </div>

                    <div className='md:col-span-6'>
                      <div className='text-xs font-medium text-slate-700'>Note courte</div>
                      <TextAreaField
                        label=''
                        readonly={isRO}
                        value={String((c as any).note ?? '')}
                        onChange={(next) => onChange(idx, { note: next } as any)}
                        placeholder='Ex. graphie difficile, coin déchiré, index absent…'
                        minHeightClassName='min-h-[90px]'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bloc 3 — Notes de travail */}
          <div className='rounded-xl border border-slate-200 bg-white'>
            <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
              <div className='text-sm font-semibold text-slate-900'>Notes de travail</div>
              <div className='mt-1 text-xs text-slate-600'>Commentaires longs / pistes / TODO.</div>
            </div>

            <div className='p-4'>
              <TextAreaField
                label=''
                readonly={isRO}
                value={String((c as any).work_note ?? '')}
                onChange={(next) => onChange(idx, { work_note: next } as any)}
                placeholder='Ex. vérifier la pagination, comparer avec microfilm, anomalie sur les vues…'
                minHeightClassName='min-h-[140px]'
              />
              <div className='mt-2 text-xs text-slate-500'>
                Champ facultatif (si tu n’as pas encore <code>work_note</code> en DB, garde-le en
                draft ou remplace par <code>note</code>).
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // REGISTRE Right panel (header + form)
  // ---------------------------------------------------------------------------
  function renderRegistreHeader(args: {
    c: AnyDraft;
    globalNo: number | null;
    idx: number;
    draftKey: DraftKey;
    readonly: boolean;
  }) {
    const { c, globalNo, idx, draftKey, readonly } = args;

    const ex: any = c.exemplaire ?? {};
    const online = isOnlineEx(c);
    const url = (ex.url_base ?? '').trim();
    const cote = (ex.cote_locale ?? '').trim();

    const loc0 = getLocSystem0((c as any).locating);
    const locatingLabel =
      (loc0.raw ?? '').toString().trim() ||
      formatRangeLabel(loc0.start ?? null, loc0.end ?? null, 'vue');

    const copyOf = (() => {
      const src = (ex.source_exemplaire_id ?? '').trim();
      if (!src) return '';
      const n = globalExemplaireNumber.get(src);
      return n ? `copie de #${n}` : 'copie';
    })();

    const natureLabel = (ex.nature_label ?? '').trim();
    const supportLabel = (ex.support_label ?? '').trim();
    const hasSource = !!(ex.source_exemplaire_id ?? '').trim();

    const showNatureOrCopy = natureLabel && hasSource ? copyOf : natureLabel ? natureLabel : '';

    return (
      <div className='shrink-0 border-b border-slate-200 bg-slate-50 p-4'>
        <div className='flex items-start gap-3'>
          <div className='min-w-0 basis-3/4'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white'>
                Exemplaire #{globalNo ?? '—'}
              </span>

              {showNatureOrCopy ? (
                <Chip variant='outline'>
                  {natureLabel && hasSource
                    ? `Nature: ${natureLabel?.toLowerCase()} · ${copyOf}`
                    : `Nature: ${natureLabel?.toLowerCase()}`}
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

              <Chip variant='outline'>Cote: {cote || '—'}</Chip>
              {locatingLabel ? <Chip variant='secondary'>{locatingLabel}</Chip> : null}
            </div>

            <div className='mt-2 flex flex-wrap items-center gap-2'>
              {ex.nb_pages && ex.pagination_type_label ? (
                <Chip variant='outline'>
                  {ex.nb_pages} {ex.pagination_type_label?.toLowerCase()}
                </Chip>
              ) : null}

              {supportLabel ? (
                <Chip variant='outline'>Support: {supportLabel?.toLowerCase()}</Chip>
              ) : null}
            </div>
          </div>

          <div className='flex basis-1/4 flex-wrap items-center justify-end gap-2'>
            {!readonly && (
              <>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => openPickerForIdx(idx)}
                >
                  Changer
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      onClick={() => handleRemove(draftKey)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Dissocier cet exemplaire de ce registre</TooltipContent>
                </Tooltip>
              </>
            )}

            {url ? (
              <a
                href={normalizeUrl(url)}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50'
              >
                <ExternalLink className='h-4 w-4' />
                Ouvrir
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderRegistreForm(args: { c: AnyDraft; idx: number; mode: Mode }) {
    const { c, idx, mode } = args;
    const ex: any = c.exemplaire ?? {};

    const isMissing = (c as any).is_missing;
    const lacune = (c as any).lacune;

    const loc0 = getLocSystem0((c as any).locating);
    const writing = getWriting((c as any).writing);

    return (
      <div className='flex-1 min-h-0 overflow-y-auto p-4'>
        <div className='space-y-6'>
          {/* Bloc 1 — Statut & locating */}
          <div className='rounded-xl border border-slate-200 bg-white'>
            <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
              <div className='text-sm font-semibold text-slate-900'>Statut & localisation</div>
              <div className='mt-1 text-xs text-slate-600'>
                {safeLabel(ex.institution_nom)} · {safeLabel(ex.depot_nom)} ·{' '}
                <span className='font-medium text-slate-800'>{safeLabel(ex.unite_titre)}</span>
              </div>
            </div>

            <div className='p-4 space-y-5'>
              <div>
                <div className='text-sm font-semibold text-slate-900'>Statut</div>

                <div className='mt-2 flex flex-wrap items-center gap-4'>
                  <TriStateButton
                    label='Registre manquant *'
                    mode={mode}
                    value={isMissing}
                    yesLabel='Oui'
                    noLabel='Non'
                    onChange={(v) => onChange(idx, { is_missing: v } as any)}
                  />

                  <TriStateButton
                    label='Lacune *'
                    mode={mode}
                    value={lacune}
                    yesLabel='Oui'
                    noLabel='Non'
                    onChange={(v) => onChange(idx, { lacune: v } as any)}
                  />
                </div>

                {lacune ? (
                  <div className='mt-3'>
                    <TextAreaField
                      label='Détail lacune'
                      readonly={isRO}
                      value={String((c as any).lacune_note ?? '')}
                      onChange={(next) => onChange(idx, { lacune_note: next } as any)}
                      placeholder='Ex. vues 120–140 absentes, feuillets manquants…'
                      minHeightClassName='min-h-[70px]'
                    />
                  </div>
                ) : null}
              </div>

              <Separator />

              {/* SegmentsEditor (extrait) */}
              <SegmentsEditor
                ex={ex}
                segments={Array.isArray((c as any).segments) ? (c as any).segments : []}
                onChange={!isEdit ? undefined : (next) => onChange(idx, { segments: next } as any)}
                readonly={!isEdit}
              />
            </div>
          </div>

          {/* Bloc 2 — Observations */}
          <div className='rounded-xl border border-slate-200 bg-white'>
            <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
              <div className='text-sm font-semibold text-slate-900'>Observations</div>
              <div className='mt-1 text-xs text-slate-600'>
                État, repro, dommages, lisibilité, marques.
              </div>
            </div>

            <div className='p-4 space-y-5'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                <div className='md:col-span-6'>
                  <div className='text-xs font-medium text-slate-700'>Condition physique</div>
                  <RefSinglePickerSmart
                    table='ref_physical_condition'
                    mode={mode}
                    actionsInvisible={false}
                    value={((c as any).physical_condition_ref ?? null) as any}
                    onChange={(next) => onChange(idx, { physical_condition_ref: next } as any)}
                    titleOverride='État physique'
                  />
                </div>

                <div className='md:col-span-6'>
                  <div className='text-xs font-medium text-slate-700'>Qualité de reproduction</div>
                  <RefSinglePickerSmart
                    table='ref_repro_quality'
                    mode={mode}
                    actionsInvisible={false}
                    value={((c as any).repro_quality_ref ?? null) as any}
                    onChange={(next) => onChange(idx, { repro_quality_ref: next } as any)}
                  />
                </div>
              </div>

              <Separator />

              <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                <div className='md:col-span-12'>
                  <div className='text-xs font-medium text-slate-700'>Dommages</div>
                  <RefSinglePickerSmart
                    table='ref_document_damage_kinds'
                    mode={mode}
                    actionsInvisible={false}
                    multi={true}
                    value={((c as any).document_damage_kinds_ids ?? null) as any}
                    onChange={(next) => onChange(idx, { document_damage_kinds_ids: next } as any)}
                  />
                </div>
              </div>

              <Separator />

              <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                <div className='md:col-span-6'>
                  <TextAreaField
                    label='Marques / signes'
                    readonly={isRO}
                    value={String((c as any).marks ?? '')}
                    onChange={(next) => onChange(idx, { marks: next } as any)}
                    placeholder='Ex. graphie difficile, index absent, remarque…'
                    minHeightClassName='min-h-[90px]'
                  />
                </div>

                <div className='md:col-span-6'>
                  <TextAreaField
                    label='Note'
                    readonly={isRO}
                    value={String((c as any).note ?? '')}
                    onChange={(next) => onChange(idx, { note: next } as any)}
                    placeholder='Ex. graphie difficile, index absent, remarque…'
                    minHeightClassName='min-h-[90px]'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloc 3 — Note de travail */}
          <div className='rounded-xl border border-slate-200 bg-white'>
            <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
              <div className='text-sm font-semibold text-slate-900'>Note de travail</div>
              <div className='mt-1 text-xs text-slate-600'>Commentaires longs / pistes / TODO.</div>
            </div>

            <div className='p-4'>
              <TextAreaField
                label=''
                readonly={isRO}
                value={String((c as any).work_note ?? '')}
                onChange={(next) => onChange(idx, { work_note: next } as any)}
                placeholder='Ex. vérifier cohérence locating, comparer avec une copie, etc.'
                minHeightClassName='min-h-[140px]'
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Selected meta
  // ---------------------------------------------------------------------------
  const selectedMeta = useMemo(() => {
    if (!exemplairesForActiveUnite.length) return null;
    return (
      exemplairesForActiveUnite.find((x) => x.draftKey === selectedKey) ??
      exemplairesForActiveUnite[0]
    );
  }, [exemplairesForActiveUnite, selectedKey]);

  const selectedIdx = useMemo(() => {
    if (!selectedMeta) return -1;
    return sources.findIndex((x, i) => getKey(x, i) === selectedMeta.draftKey);
  }, [sources, selectedMeta]);

  function Field(props: {
    label: string;
    value?: ReactNode;
    children?: ReactNode;
    readonly?: boolean;
    empty?: ReactNode;
  }) {
    const {
      label,
      value,
      children,
      readonly,
      empty = <span className='text-xs text-muted-foreground italic'>Non renseigné</span>,
    } = props;

    return (
      <div>
        <div className='text-xs font-medium text-slate-700'>{label}</div>
        <div className='mt-1'>
          {readonly ? (
            <div className='min-h-[36px] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800'>
              {value ?? empty}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    );
  }

  function ReadonlyBlock(props: { value?: ReactNode; empty?: ReactNode; className?: string }) {
    const {
      value,
      empty = <span className='text-xs text-muted-foreground italic'>Non renseigné</span>,
      className,
    } = props;
    const v = value == null || value === '' ? null : value;

    return (
      <div
        className={[
          'min-h-[36px] rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800',
          'whitespace-pre-wrap break-words',
          className ?? '',
        ].join(' ')}
      >
        {v ?? empty}
      </div>
    );
  }

  function TextAreaField(props: {
    label: string;
    readonly?: boolean;
    value: string;
    onChange?: (next: string) => void;
    placeholder?: string;
    minHeightClassName?: string; // ex. "min-h-[90px]"
    empty?: ReactNode;
  }) {
    const {
      label,
      readonly,
      value,
      onChange,
      placeholder,
      minHeightClassName = 'min-h-[90px]',
      empty,
    } = props;

    return (
      <div>
        <div className='text-xs font-medium text-slate-700'>{label}</div>
        <div className='mt-1'>
          {readonly ? (
            <ReadonlyBlock
              value={value}
              empty={empty}
              className={['py-2', minHeightClassName].join(' ')}
            />
          ) : (
            <Textarea
              className={minHeightClassName}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
            />
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='mb-4'>
        <div className='flex items-start gap-3'>
          <h3 className='min-w-0 flex-1 text-sm font-semibold text-slate-900'>
            Occurrences dans les archives{count > 0 ? ` (${count})` : ''}
          </h3>

          <div className='shrink-0'>
            <ToggleLeftPanelsButton
              leftCollapsed={leftCollapsed}
              onToggleLeftPanels={() => setLeftCollapsed((v) => !v)}
            />
          </div>
        </div>
        {isEdit && type === 'acte' ? (
          <>
            <p className='mt-1 text-sm text-slate-600'>
              Choisis un <span className='font-medium'>registre / unité documentaire</span> (via un
              exemplaire) puis renseigne ce qui est spécifique à l’acte :{' '}
              <span className='font-medium'>vues/pages</span>, lacunes, notes.
            </p>

            <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
                <div className='min-w-0'>
                  <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
                  <div className='mt-0.5 text-xs text-amber-800'>
                    <ol>
                      <li>Vérifier les champs requis</li>
                      <li>Vérifier les champs requis pour changement de badge sur exemplaire</li>
                      <li>afficher un toast quand enregistrement</li>
                      <li>En-tête de l'exemplaire: choisir les champs pertinents à afficher</li>
                      <li>En-tête de l'exemplaire: tester le bouton changer</li>
                      <li>Repères dans l’exemplaire issus du registre</li>
                      <li>Champ work_note</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : isEdit ? (
          <>
            <p className='mt-1 text-sm text-slate-600'>
              Choisis un <span className='font-medium'>registre / unité documentaire</span> (via un
              exemplaire) puis renseigne ce qui est spécifique au registre :{' '}
              <span className='font-medium'>is_missing</span>,{' '}
              <span className='font-medium'>locating</span>, lacunes, observations (état, repro,
              marginalia, écriture…).
            </p>

            <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
                <div className='min-w-0'>
                  <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
                  <div className='mt-0.5 text-xs text-amber-800'>
                    <ol>
                      <li>En-tête de l'exemplaire: tester le bouton changer</li>
                      <li>Vérifier les champs requis</li>
                      <li>Vérifier les champs requis pour changement de badge sur exemplaire</li>
                      <li>(repérées de ? à ?)</li>
                      <li>Champ work_note</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div
        className={[
          'grid gap-4 h-[72vh] min-h-0',
          leftCollapsed ? 'md:grid-cols-[1fr]' : 'md:grid-cols-[340px_340px_1fr]',
        ].join(' ')}
      >
        {!leftCollapsed ? (
          <UnitsPanel
            units={units as any}
            activeUniteKey={activeUniteKey}
            onSelectUnit={selectUnit}
          />
        ) : null}

        {!leftCollapsed ? (
          <ExemplairesPanel
            loading={loading}
            hasAnySelected={hasAnySelected}
            activeUniteKey={activeUniteKey}
            items={exemplairesForActiveUnite as any}
            selectedKey={selectedKey}
            getTitle={getExemplaireTitle}
            getStatus={(c) => getExemplaireStatus(c as any) as any}
            getInstDepotOnline={(c) => {
              const ex: any = (c as any).exemplaire ?? {};
              const inst = safeLabel(ex.institution_sigle || ex.institution_nom, 'Institution ?');
              const depot = safeLabel(ex.depot_nom, 'Dépôt ?');
              const online = isOnlineEx(c as any);
              return { inst, depot, online };
            }}
            renderChipOnline={(online) =>
              online ? (
                <Chip className='border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50'>
                  En ligne
                </Chip>
              ) : (
                <Chip className='border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50'>
                  Sur place
                </Chip>
              )
            }
            renderStatusIcon={(status) => <StatusIcon status={status} />}
            onSelect={setSelectedKey}
            onAdd={isEdit ? openPickerForNew : undefined}
            readonly={isRO}
          />
        ) : null}

        <EditorPanel
          type={type}
          selectedMeta={selectedMeta as any}
          idx={selectedIdx}
          hasExemplaireId={(c) => Boolean((c as any)?.exemplaire_id)}
          onOpenPickerForIdx={isEdit ? openPickerForIdx : () => {}} // 👈 pas d’action en view
          renderActe={({ c, idx, draftKey, globalNo }) => (
            <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0'>
              {renderActeHeader({ c: c as any, globalNo, idx, draftKey, readonly: isRO })}
              {renderActeForm({ c: c as any, idx, mode: mode })}
            </div>
          )}
          renderRegistre={({ c, idx, draftKey, globalNo }) => (
            <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0 overflow-hidden'>
              {renderRegistreHeader({ c: c as any, globalNo, idx, draftKey, readonly: isRO })}
              {renderRegistreForm({ c: c as any, idx, mode: mode })}
            </div>
          )}
        />
      </div>

      <ExemplairePickerDialog
        open={pickerOpen}
        onOpenChange={(v) => {
          if (!v) {
            setPickerOpen(false);
            setPickerTargetIdx(null);
            return;
          }
          setPickerOpen(true);
        }}
        type={type}
        registreId={type === 'acte' ? (registreId ?? null) : null}
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
