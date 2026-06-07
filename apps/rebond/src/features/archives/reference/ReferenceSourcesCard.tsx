// ReferenceSourcesCard.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type {
  ActeCitationDraft,
  RegistreCitationDraft,
  ExemplairePick,
  Mode,
} from '@/features/archives/reference/types';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { ExemplairePickerDialog } from './ExemplairePickerDialog';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useDebouncedCallback } from 'use-debounce';

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
} from './ReferenceSourcesCard/helpers/utils';

import { getDraftKey as getDraftKeyHelper } from './ReferenceSourcesCard/helpers/keys';

import { getLocSystem0 } from './ReferenceSourcesCard/json/locating';

import { UnitsPanel } from './ReferenceSourcesCard/components/UnitsPanel';
import { ExemplairesPanel } from './ReferenceSourcesCard/components/ExemplairesPanel';
import { EditorPanel } from './ReferenceSourcesCard/components/EditorPanel';

import { SegmentsEditor } from './ReferenceSourcesCard/editors/registre/SegmentsEditor';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/lib/supabase';
import { Field, TextAreaField } from '@/components/shared/Fields';

type AnyDraft = ActeCitationDraft | RegistreCitationDraft;
type DraftKey = string;

export type CompletenessStatus = 'ok' | 'todo' | 'missing';

export type CompletenessResult = {
  status: CompletenessStatus;
  missing: string[]; // liste de "champs/attendus" manquants (lisible humain)
};

export const StatusIcon = ({ status }: { status: 'ok' | 'todo' | 'missing' }) => {
  if (status === 'ok') return <CheckCircle2 className='h-4 w-4 text-emerald-600' />;
  if (status === 'missing') return <AlertTriangle className='h-4 w-4 text-red-600' />;
  return <Circle className='h-4 w-4 text-amber-600' />;
};

type LocMode = 'raw' | 'num' | 'range';

type LocUiState = {
  loc_mode: LocMode;
  loc_raw: string; // texte UI
  loc_start: string; // texte UI (input numeric)
  loc_end: string; // texte UI
};

function normalizeDash(s: string) {
  return String(s ?? '')
    .trim()
    .replace(/[–—]/g, '-') // en-dash / em-dash -> hyphen
    .replace(/\s+/g, ' ');
}

function parseRawToRange(raw: string): {
  start: number | null;
  end: number | null;
  isSingle: boolean;
} {
  const s = normalizeDash(raw);

  // exact "x-y" (with optional spaces)
  const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return { start: a, end: b, isSingle: a === b };
  }

  // exact single number
  const n = s.match(/^(\d+)$/);
  if (n) {
    const a = Number(n[1]);
    if (Number.isFinite(a)) return { start: a, end: a, isSingle: true };
  }

  return { start: null, end: null, isSingle: false };
}

function detectModeFromState(c: any): LocMode {
  const raw = String(c?.loc_raw ?? '').trim();
  const start = c?.loc_start ?? null;
  const end = c?.loc_end ?? null;

  // priorité au structuré si présent
  if (typeof start === 'number' || typeof end === 'number') {
    if (start != null && end != null && start !== end) return 'range';
    return 'num';
  }

  // sinon on déduit du raw
  const parsed = parseRawToRange(raw);
  if (parsed.start != null && parsed.end != null) {
    return parsed.isSingle ? 'num' : 'range';
  }

  return 'raw';
}

function hasText(v: any) {
  return String(v ?? '').trim().length > 0;
}

function hasAnyLocActe(c: any) {
  const locRawOk = hasText(c.loc_raw);
  const rangeOk = c.loc_start != null && c.loc_end != null;
  return locRawOk || rangeOk;
}

function hasAnyRangeItems(arr: any) {
  return Array.isArray(arr) && arr.length > 0;
}

function isTriStateSet(v: any) {
  return v === true || v === false || v === null;
}

/**
 * ACTE — complétude minimale "utile"
 * Rappels:
 * - exemplaire_id requis
 * - is_missing requis (tri-state)
 * - si pas manquant -> localisation (loc_raw OU (loc_start & loc_end))
 * - champs tri-state d'observation requis: marginal_mentions_present, signatures_present, marginal_crossouts_present
 * - counts requis si present === true
 * - si lacune === true -> lacune_note OU missing_ranges non vide
 */
export function getActeCompleteness(c: any): CompletenessResult {
  const missing: string[] = [];

  // 1) lien exemplaire
  if (!hasText(c.exemplaire_id)) missing.push('exemplaire_id');

  // 2) statut acte manquant (tri-state attendu)
  if (typeof c.is_missing !== 'boolean') {
    missing.push('is_missing (true/false)');
  }

  // 3) localisation si pas manquant
  const isMissing = c.is_missing === true;
  if (!isMissing) {
    if (!hasAnyLocActe(c)) {
      missing.push('localisation (loc_raw OU loc_start+loc_end)');
    }
  }

  // 4) lacune: note OU plages
  if (typeof c.lacune !== 'boolean') {
    missing.push('lacune (true/false)');
  }
  const lacune = c.lacune === true;
  if (lacune) {
    const hasNote = hasText(c.lacune_note);
    const hasRanges = hasAnyRangeItems(c.missing_ranges);
    if (!hasNote && !hasRanges) missing.push('lacune: lacune_note OU missing_ranges[]');
  }

  // 5) observations tri-state requises
  // (tu peux changer isTriStateSet -> isBoolSet si tu veux interdire null)
  if (!isTriStateSet(c.marginal_mentions_present))
    missing.push('marginal_mentions_present (true/false/null)');
  if (!isTriStateSet(c.signatures_present)) missing.push('signatures_present (true/false/null)');
  if (!isTriStateSet(c.marginal_crossouts_present))
    missing.push('marginal_crossouts_present (true/false/null)');

  // 6) counts conditionnels
  if (c.marginal_mentions_present === true) {
    if (c.marginal_mentions_count == null) missing.push('marginal_mentions_count (si présent)');
  }
  if (c.signatures_present === true) {
    if (c.signatures_count == null) missing.push('signatures_count (si présent)');
  }
  if (c.marginal_crossouts_present === true) {
    if (c.marginal_crossouts_count == null) missing.push('marginal_crossouts_count (si présent)');
  }

  // Status
  if (isMissing) return { status: 'missing', missing: [] }; // "missing" = acte manquant déclaré => on ne le pénalise pas
  return { status: missing.length ? 'todo' : 'ok', missing };
}

/**
 * REGISTRE — complétude minimale "utile"
 * Rappels:
 * - exemplaire_id requis
 * - is_missing requis (tri-state)
 * - si pas manquant -> segments.length > 0
 * - si lacune === true -> lacune_note OU missing_ranges non vide
 */
export function getRegistreCompleteness(c: any): CompletenessResult {
  const missing: string[] = [];

  if (!hasText(c.exemplaire_id)) missing.push('exemplaire_id');


  if (typeof c.is_missing !== 'boolean') {
    missing.push('is_missing (true/false)');
  }

  const isMissing = c.is_missing === true;

  if (typeof c.lacune !== 'boolean') {
    missing.push('lacune (true/false)');
  }
  const lacune = c.lacune === true;
  if (lacune) {
    const hasNote = hasText(c.lacune_note);
    const hasRanges = hasAnyRangeItems(c.missing_ranges);
    if (!hasNote && !hasRanges) missing.push('lacune: lacune_note OU missing_ranges[]');
  }

  if (isMissing) return { status: 'missing', missing: [] };
  return { status: missing.length ? 'todo' : 'ok', missing };
}

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
        {leftCollapsed ? 'Afficher le détail' : 'Masquer le détail'}
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
  const isEmpty = !loading && count === 0;

  const onChange = (idx: number, patch: Partial<AnyDraft>) => {
    if (!isEdit) return;
    assertEditMode(props);
    (props.onChange as any)(idx, patch);
  };

  const [locUi, setLocUi] = useState<LocUiState>({
    loc_mode: 'raw',
    loc_raw: '',
    loc_start: '',
    loc_end: '',
  });

  const commitLocDebounced = useDebouncedCallback((args: { idx: number; patch: any }) => {
    const { idx, patch } = args;
    if (!isEdit) return;
    if (idx < 0) return;
    onChange(idx, patch);
  }, 800);

  // ---------------------------------------------------------------------------
  // Draft keys (no module-global Map)
  // ---------------------------------------------------------------------------
  const tmpKeyByIndexRef = useRef(new Map<number, DraftKey>());

  const getKey = (c: AnyDraft, idx?: number) => {
    const exId = (c as any)?.exemplaire_id ?? null;
    if (exId) return `ex:${exId}`; // ✅ stable et cohérent avec setSelectedKey
    return getDraftKeyHelper(c as any, idx, tmpKeyByIndexRef.current);
  };

  // ---------------------------------------------------------------------------
  // Selection states
  // ---------------------------------------------------------------------------
  const [activeUniteKey, setActiveUniteKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<DraftKey | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [acteFormVariant, setActeFormVariant] = useState<'short' | 'full'>(() =>
    mode === 'view' ? 'full' : 'short',
  );

  const [registreFormVariant, setRegistreFormVariant] = useState<'short' | 'full'>(() =>
    mode === 'view' ? 'full' : 'short',
  );

  // évite de forcer "full" à chaque re-render : une seule fois par sélection
  const autoOpenedFullActeByKeyRef = useRef(new Set<string>());
  const autoOpenedFullRegistreByKeyRef = useRef(new Set<string>());

  const TABLE_REGISTRE_CITATIONS = 'etat_civil_registre_citations';
  const TABLE_REGISTRE_SEGMENTS = 'etat_civil_registre_exemplaire_segments';

  type RegistreCitationRow = {
    id: string;
    exemplaire_id: string;
  };

  type RegistreSegmentRow = {
    id: string;
    registre_citation_id: string;
    kind_ref: string | null;
    label_override: string | null;
    scope: 'full' | 'interest' | 'unknown';
    range_start: number | null;
    range_end: number | null;
    year_from: number | null;
    year_to: number | null;
    date_from: string | null;
    date_to: string | null;
    note: string | null;
    sort_order: number | null;
  };

  const [segmentsByExId, setSegmentsByExId] = useState<Record<string, RegistreSegmentRow[]>>({});
  const [segmentsByCitId, setSegmentsByCitId] = useState<Record<string, RegistreSegmentRow[]>>({});
  const [citationIdByExId, setCitationIdByExId] = useState<Record<string, string>>({});
  const [loadingSegments, setLoadingSegments] = useState(false);

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
  const [pickerIsNew, setPickerIsNew] = useState(false);
  const [q, setQ] = useState('');
  const [onlyOnline, setOnlyOnline] = useState(false);
  const pickedSuccessfullyRef = useRef(false);

  const closePicker = () => {
    setPickerOpen(false);
    setPickerTargetIdx(null);
    setPickerIsNew(false);
    // Ne pas remettre pickedSuccessfullyRef à false ici —
    // onOpenChange le lit juste après et doit voir la vraie valeur
  };

  const openPickerForIdx = (idx: number) => {
    setPickerTargetIdx(idx);
    setPickerIsNew(false);
    setPickerOpen(true);
  };

  const openPickerForNew = () => {
    if (!isEdit) return;
    assertEditMode(props);

    const nextIdx = sources.length;
    props.onAdd();
    setPickerTargetIdx(nextIdx);
    setPickerIsNew(true);
    setPickerOpen(true);
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
        loc_mode: 'raw',
        loc_start: null,
        loc_end: null,
        loc_raw: '',
        is_missing: null,
        lacune: null,
      });
    } else {
      patchRegistre(pickerTargetIdx, {
        ...(base as any),
        is_missing: null,
        lacune: null,
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

    pickedSuccessfullyRef.current = true;
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
    // 1) activeUniteKey doit rester explicite
    if (activeUniteKey) {
      const unitStillExists = units.some((u) => u.key === activeUniteKey);
      if (!unitStillExists) {
        setActiveUniteKey(null);
        setSelectedKey(null);
        return;
      }
    }

    // 2) selectedKey doit rester explicite
    if (selectedKey) {
      const still = sources.find((c, i) => getKey(c, i) === selectedKey) ?? null;
      if (!still || !still.exemplaire_id) {
        setSelectedKey(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, pickedKeys.join('|'), sources, activeUniteKey, selectedKey]);

  useEffect(() => {
    const rid = registreId ?? null;
    if (!rid) {
      setSegmentsByExId({});
      setSegmentsByCitId({});
      setCitationIdByExId({});
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingSegments(true);

      // 1) citations (id + exemplaire_id) pour ce registre
      const { data: citRows, error: citErr } = await supabase
        .from(TABLE_REGISTRE_CITATIONS)
        .select('id, exemplaire_id')
        .eq('registre_id', rid)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (citErr) {
        console.error('load registre citations', citErr);
        setSegmentsByExId({});
        setSegmentsByCitId({});
        setCitationIdByExId({});
        setLoadingSegments(false);
        return;
      }

      const citations = (citRows ?? []) as RegistreCitationRow[];
      const citIds = citations.map((c) => c.id);
      const citByEx: Record<string, string> = {};
      for (const c of citations) citByEx[c.exemplaire_id] = c.id;
      setCitationIdByExId(citByEx);

      // s'il n'y a aucune citation, pas de segments
      if (citIds.length === 0) {
        setSegmentsByExId({});
        setSegmentsByCitId({});
        setLoadingSegments(false);
        return;
      }

      // 2) segments depuis etat_civil_registre_exemplaire_segments par registre_citation_id
      const { data: segRows, error: segErr } = await supabase
        .from(TABLE_REGISTRE_SEGMENTS)
        .select(
          `
        id, registre_citation_id,
        kind_ref, label_override, scope,
        range_start, range_end,
        date_from, date_to, year_from, year_to,
        note, sort_order
      `,
        )
        .in('registre_citation_id', citIds)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (segErr) {
        console.error('load registre segments', segErr);
        setSegmentsByExId({});
        setSegmentsByCitId({});
        setLoadingSegments(false);
        return;
      }

      const segs = (segRows ?? []) as RegistreSegmentRow[];

      // 3) map segments par citationId
      const byCit: Record<string, RegistreSegmentRow[]> = {};
      for (const s of segs) {
        const k = s.registre_citation_id;
        if (!byCit[k]) byCit[k] = [];
        byCit[k].push(s);
      }
      setSegmentsByCitId(byCit);

      // 4) map segments par exemplaire_id (via citation)
      const byEx: Record<string, RegistreSegmentRow[]> = {};
      for (const cit of citations) {
        byEx[cit.exemplaire_id] = byCit[cit.id] ?? [];
      }
      setSegmentsByExId(byEx);

      setLoadingSegments(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [registreId]);

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

  function isIntString(s: string) {
    return /^\d+$/.test(s);
  }

  function formatRangeToRaw(start: number | null, end: number | null): string {
    if (start == null && end == null) return '';
    if (start != null && end == null) return String(start);
    if (start == null && end != null) return String(end);
    // start & end
    if (start === end) return String(start);
    return `${start}-${end}`;
  }

  function toIntOrNull(v: string): number | null {
    const s = (v ?? '').trim();
    if (!s) return null;
    if (!isIntString(s)) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

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
    const r = type === 'acte' ? getActeCompleteness(c) : getRegistreCompleteness(c);
    return r.status; // 'ok' | 'todo' | 'missing'
  };



  const selectUnit = (unitKey: string) => {
    setActiveUniteKey(unitKey);
    setSelectedKey(null); // obligatoire : l’exemplaire doit être choisi explicitement
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
    status: CompletenessStatus;
  }) {
    const { c, globalNo, idx, draftKey, readonly, status } = args;

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

    const paginationLabelBase = (ex.pagination_type_label ?? ex.pagination_type ?? 'vue')
      .toString()
      .toLowerCase();

    function labelForRaw(label: string, raw: string) {
      // raw = nombre unique → singulier
      if (/^\d+$/.test(raw)) {
        return label.endsWith('s') ? label.slice(0, -1) : label;
      }

      // raw = plage explicite "x-y" → pluriel
      if (/^\d+\s*-\s*\d+$/.test(raw)) {
        return label.endsWith('s') ? label : `${label}s`;
      }

      // autre chose (12r–13v, texte libre) → on garde le label tel quel
      return label;
    }

    const vuesLabel = (() => {
      const raw = String((c as ActeCitationDraft).loc_raw ?? '').trim();
      if (raw) {
        const label = labelForRaw(paginationLabelBase, raw);
        return `${label} ${raw}`;
      }

      const start = (c as ActeCitationDraft).loc_start ?? null;
      const end = (c as ActeCitationDraft).loc_end ?? null;
      if (start == null && end == null) return '';

      const label =
        start != null && end != null && start !== end
          ? paginationLabelBase.endsWith('s')
            ? paginationLabelBase
            : `${paginationLabelBase}s`
          : paginationLabelBase.endsWith('s')
            ? paginationLabelBase.slice(0, -1)
            : paginationLabelBase;

      return `${label} ${formatRangeLabel(start, end, '')}`;
    })();

    return (
      <div className='shrink-0 border-b border-slate-200 bg-slate-50 p-4'>
        <div className='flex items-start gap-3'>
          <div className='min-w-0 basis-3/4'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white'>
                Version #{globalNo ?? '—'}
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
                  <TooltipContent>Retirer cette version d'archive</TooltipContent>
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

            {!readonly && (
              <Tabs value={acteFormVariant} onValueChange={(v) => setActeFormVariant(v as any)}>
                <TabsList>
                  <TabsTrigger value='short' className='text-xs'>
                    <StatusIcon status={status} /> Formulaire court
                  </TabsTrigger>
                  <TabsTrigger value='full' className='text-xs'>
                    Formulaire complet
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    );
  }

  function uiToIntOrNull(s: string): number | null {
    const v = (s ?? '').trim();
    if (!v) return null;
    if (!/^\d+$/.test(v)) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function computeLocPatchFromUi(next: LocUiState): any {
    const mode = next.loc_mode;

    if (mode === 'raw') {
      const raw = next.loc_raw;
      const parsed = parseRawToRange(raw);
      return {
        loc_mode: 'raw',
        loc_raw: raw,
        // on sync start/end seulement si parseable strict
        loc_start: parsed.start != null && parsed.end != null ? parsed.start : null,
        loc_end: parsed.start != null && parsed.end != null ? parsed.end : null,
      };
    }

    if (mode === 'num') {
      const n = uiToIntOrNull(next.loc_start);
      return {
        loc_mode: 'num',
        loc_start: n,
        loc_end: n,
        loc_raw: n == null ? '' : String(n),
      };
    }

    // mode === 'range'
    const start = uiToIntOrNull(next.loc_start);
    const end = uiToIntOrNull(next.loc_end);
    return {
      loc_mode: 'range',
      loc_start: start,
      loc_end: end,
      loc_raw: formatRangeToRaw(start, end),
    };
  }

  function scheduleCommitLoc(next: LocUiState) {
    setLocUi(next);
    if (!isEdit) return;
    if (selectedIdx < 0) return;

    const patch = computeLocPatchFromUi(next);
    commitLocDebounced({ idx: selectedIdx, patch });
  }

  function flushCommitLoc() {
    commitLocDebounced.flush();
  }

  function ActeFormShort(props: {
    c: AnyDraft;
    idx: number;
    mode: Mode;
    isRO: boolean;
    ex: any;

    // loc ui helpers
    locUi: LocUiState;
    locMode: LocMode;
    setLocMode: (m: LocMode) => void;
    scheduleCommitLoc: (next: LocUiState) => void;
    flushCommitLoc: () => void;
    computeLocPatchFromUi: (next: LocUiState) => any;

    // patch helpers
    onChange: (idx: number, patch: Partial<AnyDraft>) => void;
    patchActe: (idx: number, patch: Partial<ActeCitationDraft>) => void;
    toIntOrNull: (v: string) => number | null;
  }) {
    const {
      c,
      idx,
      mode,
      isRO,
      ex,
      locUi,
      locMode,
      setLocMode,
      scheduleCommitLoc,
      flushCommitLoc,
      computeLocPatchFromUi,
      onChange,
      patchActe,
      toIntOrNull,
    } = props;

    const isMissing = (c as ActeCitationDraft).is_missing;
    const isLacune = (c as any).lacune;

    const mmPresent = (c as any).marginal_mentions_present ?? null;
    const mmCount = (c as any).marginal_mentions_count ?? null;
    const sigPresent = (c as any).signatures_present ?? null;
    const sigCount = (c as any).signatures_count ?? null;
    const mcPresent = (c as any).marginal_crossouts_present ?? null;
    const mcCount = (c as any).marginal_crossouts_count ?? null;

    const missingRanges: any[] = Array.isArray((c as any).missing_ranges)
      ? (c as any).missing_ranges
      : [];
    const patchMissingRanges = (next: any[]) => onChange(idx, { missing_ranges: next } as any);
    const addMissingRange = () =>
      patchMissingRanges([...missingRanges, { kind: 'vue', start: null, end: null, note: '' }]);
    const updateMissingRange = (i: number, patch: Partial<any>) =>
      patchMissingRanges(missingRanges.map((r, k) => (k === i ? { ...r, ...patch } : r)));
    const removeMissingRange = (i: number) =>
      patchMissingRanges(missingRanges.filter((_, k) => k !== i));

    const hasMissingRanges = missingRanges.length > 0;

    return (
      <div className='space-y-6'>
        {/* 1) Statut (requis) */}
        <div className='rounded-xl border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
            <div className='text-sm font-semibold text-slate-900'>Statut</div>
            <div className='mt-1 text-xs text-slate-600'>
              Champs minimum requis pour valider l’occurrence.
            </div>
          </div>
          <div className='p-4 space-y-4'>
            <div className='flex flex-wrap items-center gap-4'>
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
                value={isLacune}
                yesLabel='Oui'
                noLabel='Non'
                mode={mode}
                onChange={(v) => {
                  // v: true | false | null
                  if (v === true) {
                    onChange(idx, { lacune: true } as any);
                    return;
                  }

                  // v === false || v === null => reset champs associés
                  onChange(idx, {
                    lacune: v,
                    lacune_note: null,
                    missing_ranges: [],
                  } as any);
                }}
              />
            </div>

            {isMissing === true ? (
              <div className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
                Acte déclaré manquant : la localisation peut rester vide.
              </div>
            ) : null}

            {isLacune ? (
              <>
                <TextAreaField
                  label='Détail lacune'
                  readonly={isRO}
                  value={String((c as any).lacune_note ?? '')}
                  onChange={(next) => onChange(idx, { lacune_note: next } as any)}
                  placeholder='Ex. vues 120–140 absentes…'
                  minHeightClassName='min-h-[70px]'
                />

                <div className='mt-2'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <div className='text-sm font-semibold text-slate-900'>Plages manquantes</div>
                      <div className='mt-1 text-xs text-slate-600'>
                        Option alternative au texte : utile si tu veux du structuré.
                      </div>
                    </div>
                    {!isRO ? (
                      <Button type='button' variant='outline' onClick={addMissingRange}>
                        Ajouter…
                      </Button>
                    ) : null}
                  </div>

                  {hasMissingRanges ? (
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
                                disabled={isRO}
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
                                disabled={isRO}
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
                                disabled={isRO}
                                placeholder='ex. 140'
                              />
                            </div>

                            <div className='md:col-span-3 flex items-end justify-end'>
                              {!isRO ? (
                                <Button
                                  type='button'
                                  variant='ghost'
                                  onClick={() => removeMissingRange(i)}
                                >
                                  Supprimer
                                </Button>
                              ) : null}
                            </div>

                            <div className='md:col-span-12'>
                              <label className='block text-xs font-medium text-slate-700'>
                                Note
                              </label>
                              <Input
                                className='mt-1'
                                value={String(r.note ?? '')}
                                onChange={(e) => updateMissingRange(i, { note: e.target.value })}
                                disabled={isRO}
                                placeholder='ex. scan manquant…'
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
                      Aucune plage renseignée.
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* 2) Localisation (requis si pas manquant) */}
        <div className='rounded-xl border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
            <div className='text-sm font-semibold text-slate-900'>Localisation</div>
            <div className='mt-1 text-xs text-slate-600'>
              Requis si l’acte n’est pas déclaré manquant.
            </div>
          </div>

          <div className='p-4 space-y-4'>
            {!isRO ? (
              <Field label='Mode de saisie' readonly={isRO} value={null}>
                <RadioGroup
                  value={locMode}
                  onValueChange={(v) => setLocMode(v as LocMode)}
                  className='flex flex-col gap-2 md:flex-row md:items-center md:gap-6'
                >
                  <div className='flex items-center gap-2'>
                    <RadioGroupItem value='num' id={`loc-mode-num-short-${idx}`} disabled={isRO} />
                    <label htmlFor={`loc-mode-num-short-${idx}`} className='text-sm text-slate-700'>
                      Numéro
                    </label>
                  </div>

                  <div className='flex items-center gap-2'>
                    <RadioGroupItem
                      value='range'
                      id={`loc-mode-range-short-${idx}`}
                      disabled={isRO}
                    />
                    <label
                      htmlFor={`loc-mode-range-short-${idx}`}
                      className='text-sm text-slate-700'
                    >
                      Plage
                    </label>
                  </div>

                  <div className='flex items-center gap-2'>
                    <RadioGroupItem value='raw' id={`loc-mode-raw-short-${idx}`} disabled={isRO} />
                    <label htmlFor={`loc-mode-raw-short-${idx}`} className='text-sm text-slate-700'>
                      Texte libre
                    </label>
                  </div>
                </RadioGroup>
              </Field>
            ) : null}

            {isMissing === true ? (
              <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
                Localisation non requise car “acte manquant”.
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                {locMode === 'raw' ? (
                  <div className='md:col-span-12'>
                    <Field
                      label={`Position (${safeLabel(ex.pagination_type_label ?? ex.pagination_type ?? 'pagination')}) *`}
                      readonly={isRO}
                      value={locUi.loc_raw.trim() || null}
                    >
                      <Input
                        disabled={isRO}
                        value={locUi.loc_raw}
                        onChange={(e) => scheduleCommitLoc({ ...locUi, loc_raw: e.target.value })}
                        onBlur={flushCommitLoc}
                        placeholder='Ex. vue 23 ; f°12r–13v ; page 120'
                      />
                    </Field>
                  </div>
                ) : null}

                {locMode === 'num' ? (
                  <div className='md:col-span-4'>
                    <Field label='Numéro *' readonly={isRO} value={locUi.loc_start.trim() || null}>
                      <Input
                        disabled={isRO}
                        inputMode='numeric'
                        value={locUi.loc_start}
                        onChange={(e) =>
                          scheduleCommitLoc({
                            ...locUi,
                            loc_start: e.target.value,
                            loc_end: e.target.value,
                          })
                        }
                        onBlur={flushCommitLoc}
                        placeholder='ex. 120'
                      />
                    </Field>
                  </div>
                ) : null}

                {locMode === 'range' ? (
                  <>
                    <div className='md:col-span-3'>
                      <Field label='Début *' readonly={isRO} value={locUi.loc_start.trim() || null}>
                        <Input
                          disabled={isRO}
                          inputMode='numeric'
                          value={locUi.loc_start}
                          onChange={(e) =>
                            scheduleCommitLoc({ ...locUi, loc_start: e.target.value })
                          }
                          onBlur={flushCommitLoc}
                          placeholder='ex. 23'
                        />
                      </Field>
                    </div>

                    <div className='md:col-span-3'>
                      <Field label='Fin *' readonly={isRO} value={locUi.loc_end.trim() || null}>
                        <Input
                          disabled={isRO}
                          inputMode='numeric'
                          value={locUi.loc_end}
                          onChange={(e) => scheduleCommitLoc({ ...locUi, loc_end: e.target.value })}
                          onBlur={flushCommitLoc}
                          placeholder='ex. 24'
                        />
                      </Field>
                    </div>

                    <div className='md:col-span-6'>
                      <Field
                        label='Position (auto)'
                        readonly
                        value={(computeLocPatchFromUi(locUi).loc_raw ?? '').trim() || null}
                      >
                        <Input value={computeLocPatchFromUi(locUi).loc_raw ?? ''} readOnly />
                      </Field>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* 3) Marques & signes (requis + counts conditionnels) */}
        <div className='rounded-xl border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
            <div className='text-sm font-semibold text-slate-900'>Marques & signes</div>
            <div className='mt-1 text-xs text-slate-600'>Tri-state requis + nombre si “Oui”.</div>
          </div>

          <div className='p-4 space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
              <div className='md:col-span-6'>
                <TriStateButton
                  label='Mentions marginales *'
                  mode={mode}
                  value={mmPresent}
                  onChange={(v) =>
                    onChange(idx, {
                      marginal_mentions_present: v,
                      marginal_mentions_count: v === true ? (mmCount ?? null) : null,
                    } as any)
                  }
                />
              </div>
              <div className='md:col-span-6'>
                <label className='block text-xs font-medium text-slate-700'>
                  Nombre (si “Oui”) *
                </label>
                <Input
                  inputMode='numeric'
                  value={mmCount ?? ''}
                  onChange={(e) =>
                    onChange(idx, { marginal_mentions_count: toIntOrNull(e.target.value) } as any)
                  }
                  disabled={mmPresent !== true}
                  placeholder='ex. 3'
                  className='mt-1'
                />
              </div>

              <div className='md:col-span-6'>
                <TriStateButton
                  label='Signatures *'
                  mode={mode}
                  value={sigPresent}
                  onChange={(v) =>
                    onChange(idx, {
                      signatures_present: v,
                      signatures_count: v === true ? (sigCount ?? null) : null,
                    } as any)
                  }
                />
              </div>
              <div className='md:col-span-6'>
                <label className='block text-xs font-medium text-slate-700'>
                  Nombre (si “Oui”) *
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
                  label='Ratures en marge *'
                  mode={mode}
                  value={mcPresent}
                  onChange={(v) =>
                    onChange(idx, {
                      marginal_crossouts_present: v,
                      marginal_crossouts_count: v === true ? (mcCount ?? null) : null,
                    } as any)
                  }
                />
              </div>
              <div className='md:col-span-6'>
                <label className='block text-xs font-medium text-slate-700'>
                  Nombre (si “Oui”) *
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
          </div>
        </div>
      </div>
    );
  }

  function renderActeForm(args: { c: AnyDraft; idx: number; mode: Mode }) {
    const { c, idx, mode } = args;

    const ex: any = c.exemplaire ?? {};
    const url = (ex.url_base ?? '').trim();

    const isMissing = (c as ActeCitationDraft).is_missing;
    const isLacune = (c as any).lacune;

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

    const locMode: LocMode = locUi.loc_mode;
    const setLocMode = (mode: LocMode) => {
      scheduleCommitLoc({ ...locUi, loc_mode: mode });
    };

    const exId = String((ex as any)?.exemplaire_id ?? (c as any)?.exemplaire_id ?? '');
    const registreSegments = exId ? (segmentsByExId[exId] ?? []) : [];

    type EcritureCode = 'MANUSCRITE' | 'IMPRIMEE' | 'MIXTE';

    function useEcrituresById() {
      const [byId, setById] = useState<Record<string, EcritureCode>>({} as any);

      useEffect(() => {
        let mounted = true;
        (async () => {
          const { data, error } = await supabase
            .from('ref_ecritures')
            .select('id, code');

          if (!mounted) return;
          if (error) return;

          const map: Record<string, EcritureCode> = {};
          (data ?? []).forEach((r: any) => {
            map[r.id] = r.code as EcritureCode;
          });
          setById(map);
        })();

        return () => {
          mounted = false;
        };
      }, []);

      return byId;
    }

    const ecrituresById = useEcrituresById();

    const ecritureCode = useMemo(() => {
      const id = (c as any).ecriture_ref as string | null;
      return id ? (ecrituresById[id] ?? null) : null;
    }, [(c as any).ecriture_ref, ecrituresById]);

    const hasManuscriptPart = ecritureCode === 'MANUSCRITE' || ecritureCode === 'MIXTE';

    type ApplicableTo = 'BOTH' | 'MANUSCRITE' | 'IMPRIMEE';

    function applicableToAllowed(ecritureCode: EcritureCode | null): ApplicableTo[] | null {
      if (!ecritureCode) return null;

      if (ecritureCode === 'MANUSCRITE') return ['BOTH', 'MANUSCRITE'];
      if (ecritureCode === 'IMPRIMEE') return ['BOTH', 'IMPRIMEE'];
      // MIXTE
      return ['BOTH', 'MANUSCRITE', 'IMPRIMEE'];
    }

    const allowed = applicableToAllowed(ecritureCode);

    return (
      <Tabs
        value={acteFormVariant}
        onValueChange={(v) => {
          if (isRO) return;
          setActeFormVariant(v as any);
        }}
        className='flex-1 min-h-0 overflow-y-auto p-4'
      >
        <TabsContent value='short'>
          <ActeFormShort
            c={c}
            idx={idx}
            mode={mode}
            isRO={isRO}
            ex={ex}
            locUi={locUi}
            locMode={locMode}
            setLocMode={setLocMode}
            scheduleCommitLoc={scheduleCommitLoc}
            flushCommitLoc={flushCommitLoc}
            computeLocPatchFromUi={computeLocPatchFromUi}
            onChange={onChange as any}
            patchActe={patchActe as any}
            toIntOrNull={toIntOrNull}
          />
        </TabsContent>

        <TabsContent value='full'>
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
                      onChange={(v) => {
                        // v: true | false | null
                        if (v === true) {
                          onChange(idx, { lacune: true } as any);
                          return;
                        }

                        // v === false || v === null => reset champs associés
                        onChange(idx, {
                          lacune: v,
                          lacune_note: null,
                          missing_ranges: [],
                        } as any);
                      }}
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
                            <div
                              key={i}
                              className='rounded-xl border border-slate-200 bg-white p-3'
                            >
                              <div className='grid grid-cols-1 gap-3 md:grid-cols-12'>
                                <div className='md:col-span-3'>
                                  <label className='block text-xs font-medium text-slate-700'>
                                    Type
                                  </label>
                                  <select
                                    className='mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm'
                                    value={String(r.kind ?? 'vue')}
                                    onChange={(e) =>
                                      updateMissingRange(i, { kind: e.target.value })
                                    }
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
                                    onChange={(e) =>
                                      updateMissingRange(i, { note: e.target.value })
                                    }
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

                <SegmentsEditor
                  ex={ex}
                  segments={Array.isArray(registreSegments) ? registreSegments : []}
                  readonly={true}
                  type={'acte'}
                />

                <Separator />

                {/* Localisation acte */}
                <div>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <div className='text-sm font-semibold text-slate-900'>
                        Statut & localisation
                      </div>
                      <div className='mt-1 text-xs text-slate-600'>
                        Renseigne la position dans la version selon sa pagination (vues / pages /
                        folios…).
                      </div>
                    </div>

                    <Chip variant='secondary' className='shrink-0'>
                      Pagination :{' '}
                      {safeLabel(ex.pagination_type_label ?? ex.pagination_type ?? '—')}
                    </Chip>
                  </div>
                  <div className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-12'>
                    {!isRO && (
                      <div className='md:col-span-12'>
                        <Field label='Mode de saisie' readonly={isRO} value={null}>
                          <RadioGroup
                            value={locMode}
                            onValueChange={(v) => setLocMode(v as LocMode)}
                            className='flex flex-col gap-2 md:flex-row md:items-center md:gap-6'
                          >
                            <div className='flex items-center gap-2'>
                              <RadioGroupItem
                                value='num'
                                id={`loc-mode-num-${idx}`}
                                disabled={isRO}
                              />
                              <label
                                htmlFor={`loc-mode-num-${idx}`}
                                className='text-sm text-slate-700'
                              >
                                Numéro
                              </label>
                            </div>

                            <div className='flex items-center gap-2'>
                              <RadioGroupItem
                                value='range'
                                id={`loc-mode-range-${idx}`}
                                disabled={isRO}
                              />
                              <label
                                htmlFor={`loc-mode-range-${idx}`}
                                className='text-sm text-slate-700'
                              >
                                Plage (début/fin)
                              </label>
                            </div>

                            <div className='flex items-center gap-2'>
                              <RadioGroupItem
                                value='raw'
                                id={`loc-mode-raw-${idx}`}
                                disabled={isRO}
                              />
                              <label
                                htmlFor={`loc-mode-raw-${idx}`}
                                className='text-sm text-slate-700'
                              >
                                Texte libre
                              </label>
                            </div>
                          </RadioGroup>
                        </Field>
                      </div>
                    )}

                    {/* --- MODE TEXTE LIBRE --- */}
                    {locMode === 'raw' && (
                      <div className='md:col-span-12'>
                        <Field
                          label={`Position (${safeLabel(ex.pagination_type_label ?? ex.pagination_type ?? 'pagination')})`}
                          readonly={isRO}
                          value={locUi.loc_raw.trim() || null}
                        >
                          <Input
                            disabled={isRO}
                            value={locUi.loc_raw}
                            onChange={(e) =>
                              scheduleCommitLoc({ ...locUi, loc_raw: e.target.value })
                            }
                            onBlur={flushCommitLoc}
                            placeholder='Ex. f°12r–f°13v ; vue 23 ; page 120'
                          />
                        </Field>
                      </div>
                    )}

                    {/* --- MODE NUMÉRO --- */}
                    {locMode === 'num' && (
                      <>
                        <div className='md:col-span-4'>
                          <Field
                            label='Numéro'
                            readonly={isRO}
                            value={locUi.loc_start.trim() || null}
                          >
                            <Input
                              disabled={isRO}
                              inputMode='numeric'
                              value={locUi.loc_start}
                              onChange={(e) =>
                                scheduleCommitLoc({
                                  ...locUi,
                                  loc_start: e.target.value,
                                  loc_end: e.target.value,
                                })
                              }
                              onBlur={flushCommitLoc}
                              placeholder='ex. 120'
                            />
                          </Field>
                        </div>
                      </>
                    )}

                    {/* --- MODE PLAGE --- */}
                    {locMode === 'range' && (
                      <>
                        <div className='md:col-span-3'>
                          <Field
                            label='Début'
                            readonly={isRO}
                            value={locUi.loc_start.trim() || null}
                          >
                            <Input
                              disabled={isRO}
                              inputMode='numeric'
                              value={locUi.loc_start}
                              onChange={(e) =>
                                scheduleCommitLoc({ ...locUi, loc_start: e.target.value })
                              }
                              onBlur={flushCommitLoc}
                              placeholder='ex. 23'
                            />
                          </Field>
                        </div>

                        <div className='md:col-span-3'>
                          <Field label='Fin' readonly={isRO} value={locUi.loc_end.trim() || null}>
                            <Input
                              disabled={isRO}
                              inputMode='numeric'
                              value={locUi.loc_end}
                              onChange={(e) =>
                                scheduleCommitLoc({ ...locUi, loc_end: e.target.value })
                              }
                              onBlur={flushCommitLoc}
                              placeholder='ex. 24'
                            />
                          </Field>
                        </div>

                        <div className='md:col-span-6'>
                          <Field
                            label={`Position (${safeLabel(ex.pagination_type_label ?? ex.pagination_type ?? 'pagination')})`}
                            readonly
                            value={(computeLocPatchFromUi(locUi).loc_raw ?? '').trim() || null}
                          >
                            <Input value={computeLocPatchFromUi(locUi).loc_raw ?? ''} readOnly />
                          </Field>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bloc 2 — Observations sur la version */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">
                  Observations sur cette version
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
                          onChange={(next) =>
                            onChange(idx, { physical_condition_ref: next } as any)
                          }
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

                      {hasManuscriptPart && (
                        <div className='md:col-span-4'>
                          <div className='text-xs font-medium text-slate-700'>Lisibilité</div>
                          <RefSinglePickerSmart
                            table='ref_handwriting_legibility'
                            mode={mode}
                            actionsInvisible={false}
                            value={((c as any).handwriting_legibility_ref ?? null) as any}
                            onChange={(next) => onChange(idx, { handwriting_legibility_ref: next } as any)}
                          />
                        </div>
                      )}

                      {(c as any).ecriture_ref && (
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
                          onChange={(next) => onChange(idx, { document_readability_features_ids: next } as any)}
                          queryTransform={(q) => {
                            if (!allowed) return q;
                            return q.in('applicable_to', allowed);
                          }}
                        />

                      </div>
                      )}
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
                          helpText=''
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
                          helpText=''
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
                          helpText=''
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
          </div>
        </TabsContent>
      </Tabs>
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
    status: CompletenessStatus;
  }) {
    const { c, globalNo, idx, draftKey, readonly, status } = args;

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
                Version #{globalNo ?? '—'}
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
                  <TooltipContent>Retirer cette version d'archive</TooltipContent>
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

            {!readonly && (
              <Tabs
                value={registreFormVariant}
                onValueChange={(v) => setRegistreFormVariant(v as any)}
              >
                <TabsList>
                  <TabsTrigger value='short' className='text-xs'>
                    <StatusIcon status={status} /> Formulaire court
                  </TabsTrigger>
                  <TabsTrigger value='full' className='text-xs'>
                    Formulaire complet
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    );
  }

  function RegistreFormShort(props: {
    c: AnyDraft;
    idx: number;
    mode: Mode;
    isRO: boolean;
    onChange: (idx: number, patch: Partial<AnyDraft>) => void;
    toIntOrNull: (v: string) => number | null;
  }) {
    const { c, idx, mode, isRO, onChange, toIntOrNull } = props;

    const isMissing = (c as any).is_missing ?? null;
    const lacune = (c as any).lacune ?? null;

    const missingRanges: any[] = Array.isArray((c as any).missing_ranges)
      ? (c as any).missing_ranges
      : [];
    const patchMissingRanges = (next: any[]) => onChange(idx, { missing_ranges: next } as any);

    const addMissingRange = () =>
      patchMissingRanges([...missingRanges, { kind: 'vue', start: null, end: null, note: '' }]);

    const updateMissingRange = (i: number, patch: Partial<any>) =>
      patchMissingRanges(missingRanges.map((r, k) => (k === i ? { ...r, ...patch } : r)));

    const removeMissingRange = (i: number) =>
      patchMissingRanges(missingRanges.filter((_, k) => k !== i));

    return (
      <div className='space-y-6'>
        {/* 1) Statut (requis) */}
        <div className='rounded-xl border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
            <div className='text-sm font-semibold text-slate-900'>Statut</div>
            <div className='mt-1 text-xs text-slate-600'>
              Champs minimum requis pour valider l’occurrence.
            </div>
          </div>

          <div className='p-4 space-y-4'>
            <div className='flex flex-wrap items-center gap-4'>
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
                onChange={(v) => {
                  // v: true | false | null
                  if (v === true) {
                    onChange(idx, { lacune: true } as any);
                    return;
                  }

                  // v === false || v === null => reset champs associés
                  onChange(idx, {
                    lacune: v,
                    lacune_note: null,
                    missing_ranges: [],
                  } as any);
                }}
              />
            </div>

            {isMissing === true ? (
              <div className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
                Registre déclaré manquant : pas besoin de renseigner des segments.
              </div>
            ) : null}

            {lacune === true ? (
              <>
                <TextAreaField
                  label='Détail lacune'
                  readonly={isRO}
                  value={String((c as any).lacune_note ?? '')}
                  onChange={(next) => onChange(idx, { lacune_note: next } as any)}
                  placeholder='Ex. feuillets manquants, vues 120–140 absentes…'
                  minHeightClassName='min-h-[70px]'
                />

                <div className='mt-2'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <div className='text-sm font-semibold text-slate-900'>Plages manquantes</div>
                      <div className='mt-1 text-xs text-slate-600'>
                        Alternative structurée à la note.
                      </div>
                    </div>
                    {!isRO ? (
                      <Button type='button' variant='outline' onClick={addMissingRange}>
                        Ajouter…
                      </Button>
                    ) : null}
                  </div>

                  {missingRanges.length ? (
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
                                disabled={isRO}
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
                                disabled={isRO}
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
                                disabled={isRO}
                                placeholder='ex. 140'
                              />
                            </div>

                            <div className='md:col-span-3 flex items-end justify-end'>
                              {!isRO ? (
                                <Button
                                  type='button'
                                  variant='ghost'
                                  onClick={() => removeMissingRange(i)}
                                >
                                  Supprimer
                                </Button>
                              ) : null}
                            </div>

                            <div className='md:col-span-12'>
                              <label className='block text-xs font-medium text-slate-700'>
                                Note
                              </label>
                              <Input
                                className='mt-1'
                                value={String(r.note ?? '')}
                                onChange={(e) => updateMissingRange(i, { note: e.target.value })}
                                disabled={isRO}
                                placeholder='ex. scan manquant…'
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
                      Aucune plage renseignée.
                    </div>
                  )}
                </div>
              </>
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

    const missingRanges: any[] = Array.isArray((c as any).missing_ranges)
      ? (c as any).missing_ranges
      : [];

    const patchMissingRanges = (next: any[]) => onChange(idx, { missing_ranges: next } as any);

    const addMissingRange = () =>
      patchMissingRanges([...missingRanges, { kind: 'vue', start: null, end: null, note: '' }]);

    const updateMissingRange = (i: number, patch: Partial<any>) =>
      patchMissingRanges(missingRanges.map((r, k) => (k === i ? { ...r, ...patch } : r)));

    const removeMissingRange = (i: number) =>
      patchMissingRanges(missingRanges.filter((_, k) => k !== i));

    const hasMissingRanges = missingRanges.length > 0;

    return (
      <Tabs
        value={registreFormVariant}
        onValueChange={(v) => {
          if (isRO) return;
          setRegistreFormVariant(v as any);
        }}
        className='flex-1 min-h-0 overflow-y-auto p-4'
      >
        <TabsContent value='short'>
          <RegistreFormShort
            c={c}
            idx={idx}
            mode={mode}
            isRO={isRO}
            onChange={onChange as any}
            toIntOrNull={toIntOrNull}
          />
        </TabsContent>

        <TabsContent value='full'>
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
                      onChange={(v) => {
                        // v: true | false | null
                        if (v === true) {
                          onChange(idx, { lacune: true } as any);
                          return;
                        }

                        // v === false || v === null => reset champs associés
                        onChange(idx, {
                          lacune: v,
                          lacune_note: null,
                          missing_ranges: [],
                        } as any);
                      }}
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

                  {/* missing_ranges */}
                  {lacune ? (
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
                            disabled={!lacune}
                            title={
                              !lacune
                                ? 'Active “Lacune” pour ajouter des plages manquantes.'
                                : undefined
                            }
                          >
                            Ajouter…
                          </Button>
                        )}
                      </div>

                      {!lacune ? (
                        <div className='mt-2 text-xs text-slate-500'>
                          Active <span className='font-medium'>Lacune</span> pour renseigner des
                          plages manquantes.
                        </div>
                      ) : null}

                      {lacune && !hasMissingRanges ? (
                        <div className='mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
                          Aucune plage renseignée.
                        </div>
                      ) : null}

                      {lacune && hasMissingRanges ? (
                        <div className='mt-3 space-y-2'>
                          {missingRanges.map((r, i) => (
                            <div
                              key={i}
                              className='rounded-xl border border-slate-200 bg-white p-3'
                            >
                              <div className='grid grid-cols-1 gap-3 md:grid-cols-12'>
                                <div className='md:col-span-3'>
                                  <label className='block text-xs font-medium text-slate-700'>
                                    Type
                                  </label>
                                  <select
                                    className='mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm'
                                    value={String(r.kind ?? 'vue')}
                                    onChange={(e) =>
                                      updateMissingRange(i, { kind: e.target.value })
                                    }
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
                                    onChange={(e) =>
                                      updateMissingRange(i, { note: e.target.value })
                                    }
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

                {/* SegmentsEditor (extrait) */}
                <SegmentsEditor
                  ex={ex}
                  segments={Array.isArray((c as any).segments) ? (c as any).segments : []}
                  onChange={
                    !isEdit ? undefined : (next) => onChange(idx, { segments: next } as any)
                  }
                  readonly={!isEdit}
                  type={'registre'}
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
          </div>
        </TabsContent>
      </Tabs>
    );
  }

  // ---------------------------------------------------------------------------
  // Selected meta
  // ---------------------------------------------------------------------------
  const selectedMeta = useMemo(() => {
    if (!activeUniteKey) return null;
    if (!selectedKey) return null;
    return exemplairesForActiveUnite.find((x) => x.draftKey === selectedKey) ?? null;
  }, [activeUniteKey, selectedKey, exemplairesForActiveUnite]);

  const selectedIdx = useMemo(() => {
    if (!selectedMeta) return -1;
    return sources.findIndex((x, i) => getKey(x, i) === selectedMeta.draftKey);
  }, [sources, selectedMeta]);

  useEffect(() => {
    commitLocDebounced.cancel();

    const csel: any = selectedMeta?.c ?? null;
    if (!csel) {
      setLocUi({ loc_mode: 'raw', loc_raw: '', loc_start: '', loc_end: '' });
      return;
    }

    const mode: LocMode = (csel.loc_mode ?? detectModeFromState(csel)) as LocMode;
    setLocUi({
      loc_mode: mode,
      loc_raw: String(csel.loc_raw ?? ''),
      loc_start: csel.loc_start == null ? '' : String(csel.loc_start),
      loc_end: csel.loc_end == null ? '' : String(csel.loc_end),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, selectedIdx, selectedMeta]);

  const canShowEditor = Boolean(activeUniteKey && selectedKey && selectedMeta);

  useEffect(() => {
    if (type !== 'acte') return;
    if (!isEdit) return; // en view tu es déjà en full par défaut
    if (!selectedMeta || !selectedKey) return;

    // déjà appliqué pour cet exemplaire ? => ne pas écraser le choix user
    if (autoOpenedFullActeByKeyRef.current.has(selectedKey)) return;

    const status = getActeCompleteness(selectedMeta.c as any).status;
    if (status === 'ok') {
      setActeFormVariant('full');
    }

    autoOpenedFullActeByKeyRef.current.add(selectedKey);
  }, [type, isEdit, selectedMeta, selectedKey]);

  useEffect(() => {
    if (type !== 'registre') return;
    if (!isEdit) return; // en view tu es déjà en full par défaut
    if (!selectedMeta || !selectedKey) return;

    if (autoOpenedFullRegistreByKeyRef.current.has(selectedKey)) return;

    const status = getRegistreCompleteness(selectedMeta.c as any).status;
    if (status === 'ok') {
      setRegistreFormVariant('full');
    }

    autoOpenedFullRegistreByKeyRef.current.add(selectedKey);
  }, [type, isEdit, selectedMeta, selectedKey]);

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <section>
      <div className='mb-4'>
        <div className='flex items-start gap-3'>
          <h3 className='min-w-0 flex-1 text-sm font-semibold text-slate-900'>
            {type === 'acte' ? 'Où consulter cet acte' : 'Où consulter ce registre'}{count > 0 ? ` (${count})` : ''}
          </h3>

          <div className='shrink-0'>
            <ToggleLeftPanelsButton
              leftCollapsed={leftCollapsed}
              onToggleLeftPanels={() => setLeftCollapsed((v) => !v)}
            />
          </div>
        </div>
        {isEdit && type === 'acte' ? (
          <p className="mt-1 text-sm text-slate-600">
            Indiquez dans quelle version d'archive vous avez consulté cet acte : vues, pages, lacunes, notes.
          </p>
        ) : isEdit ? (
          <p className="mt-1 text-sm text-slate-600">
            Indiquez dans quelle version d'archive vous avez consulté ce registre.
          </p>
        ) : null}
      </div>

      {isEmpty ? (
        <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6'>
          <div className="text-sm font-semibold text-slate-900">
            Aucune version d'archive connue pour {type === "acte" ? "cet acte" : "ce registre"}
          </div>

          {isEdit ? (
            <div className='mt-4'>
              <Button type='button' onClick={openPickerForNew}>
                Ajouter une version
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isEmpty ? (
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
              onSelect={(k) => {
                flushCommitLoc();
                setSelectedKey(k);
              }}
              onAdd={isEdit ? openPickerForNew : undefined}
              readonly={isRO}
            />
          ) : null}

          {canShowEditor ? (
            <EditorPanel
              type={type}
              selectedMeta={selectedMeta as any}
              idx={selectedIdx}
              hasExemplaireId={(c) => Boolean((c as any)?.exemplaire_id)}
              onOpenPickerForIdx={isEdit ? openPickerForIdx : () => { }}
              renderActe={({ c, idx, draftKey, globalNo }) => (
                <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0 overflow-hidden'>
                  {renderActeHeader({
                    c: c as any,
                    globalNo,
                    idx,
                    draftKey,
                    readonly: isRO,
                    status: getExemplaireStatus(c as any) as any,
                  })}
                  {renderActeForm({ c: c as any, idx, mode: mode })}
                </div>
              )}
              renderRegistre={({ c, idx, draftKey, globalNo }) => (
                <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0 overflow-hidden'>
                  {renderRegistreHeader({
                    c: c as any,
                    globalNo,
                    idx,
                    draftKey,
                    readonly: isRO,
                    status: getExemplaireStatus(c as any) as any,
                  })}
                  {renderRegistreForm({ c: c as any, idx, mode: mode })}
                </div>
              )}
            />
          ) : (
            <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600'>
              Sélectionne une <span className="font-medium">collection</span> puis une <span className="font-medium">version</span> pour afficher l'éditeur.
            </div>
          )}
        </div>
      ) : null}

      <ExemplairePickerDialog
        open={pickerOpen}
        onOpenChange={(v) => {
          if (!v) {
            // Annulation sans pick : supprimer le draft vide si c'était un nouveau
            if (pickerIsNew && pickerTargetIdx !== null && isEdit && !pickedSuccessfullyRef.current) {
              assertEditMode(props);
              props.onRemove(pickerTargetIdx);
            }
            pickedSuccessfullyRef.current = false;
            setPickerOpen(false);
            setPickerTargetIdx(null);
            setPickerIsNew(false);
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
    </section>
  );
}
