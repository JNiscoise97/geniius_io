// ReferenceSourcesCard.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';

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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import {
  Plus,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Circle,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type SectionMode = 'acte' | 'registre';
type AnyDraft = ActeCitationDraft | RegistreCitationDraft;

function safeLabel(x: string | null | undefined, fallback = '—') {
  const s = (x ?? '').trim();
  return s.length ? s : fallback;
}

function normKey(x: string | null | undefined) {
  return safeLabel(x, '').trim().toLowerCase();
}

function badgeType(code: string | null | undefined) {
  if (code === 'numerisation') return 'Numérisation';
  if (code === 'microfilm') return 'Microfilm';
  if (code === 'double') return 'Double';
  return 'Original';
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
  // ---------------------------------------------------------------------------
  // Tree open state (Institution/Unite)
  // ---------------------------------------------------------------------------
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});
  const toggleNode = (key: string) => setOpenNodes((m) => ({ ...m, [key]: !m[key] }));
  const isNodeOpen = (key: string) => Boolean(openNodes[key]);
  const openNode = (key: string) => setOpenNodes((m) => ({ ...m, [key]: true }));

  // ---------------------------------------------------------------------------
  // Selection states
  // ---------------------------------------------------------------------------
  const [activeUniteKey, setActiveUniteKey] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const normalizeUrl = (url: string) => {
    const u = (url ?? '').trim();
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return `https://${u}`;
  };

  function isOnlineEx(c: AnyDraft) {
    const ex: any = c.exemplaire ?? {};
    const hasUrl = Boolean((ex.url_base ?? '').trim());
    return Boolean(ex.depot_is_online) || hasUrl;
  }

  const formatRangeLabel = (a?: number | null, b?: number | null, kind = 'vue') => {
    if (a == null && b == null) return '';
    if (a != null && b == null) return `${kind} ${a}`;
    if (a == null && b != null) return `${kind} ${b}`;
    if (a === b) return `${kind} ${a}`;
    return `${kind}s ${a}–${b}`;
  };

  const toIntOrNull = (v: string) => {
    const t = (v ?? '').trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  };

  const splitCsvToList = (v: string) =>
    (v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const joinListToCsv = (arr: unknown) => {
    if (!Array.isArray(arr)) return '';
    return arr.filter(Boolean).join(', ');
  };

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
    const nextIdx = sources.length;
    onAdd();
    // L’item peut être ajouté async côté parent → on sélectionne “au mieux”
    setSelectedIdx(nextIdx);
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
        unite_titre: row.unite_titre,
        cote_locale: row.cote_locale,
        pagination_type_ref: row.pagination_type_ref,
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

    setSelectedIdx(pickerTargetIdx);

    // Activer l’unité correspondante dans le sommaire
    const instLabel = safeLabel((row as any).institution_sigle || (row as any).institution_nom);
    const uniteLabel = safeLabel((row as any).unite_titre);
    const uniteId = (row.unite_id ?? null) as string | null;

    const uniteKey = uniteId
      ? `unite:${uniteId}`
      : `unite_fallback:${instLabel.toLowerCase()}||${uniteLabel.toLowerCase()}`;

    setActiveUniteKey(uniteKey);

    closePicker();
  };

  const hasAnySelected = sources.some((s) => Boolean(s.exemplaire_id));

  // ---------------------------------------------------------------------------
  // Tree model (Institution -> Unite) + canonical unite key merge
  // Goal: if one exemplaire has unite_id and another has same title but null unite_id,
  // they must end up in the SAME unite node (no duplicates).
  // ---------------------------------------------------------------------------
  type TreeInstitutionNode = {
    kind: 'institution';
    key: string;
    label: string;
    count: number;
    children: TreeUniteNode[];
  };

  type TreeUniteNode = {
    kind: 'unite';
    key: string; // canonical
    uniteId: string | null;
    label: string;
    online: boolean;
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
    canonicalUniteKeyByInstAndLabel: Map<string, string>;
  } {
    const instMap = new Map<
      string,
      {
        label: string;
        unites: Map<
          string,
          {
            uniteId: string | null;
            label: string;
            leaves: Array<{ idx: number; c: AnyDraft }>;
            online: boolean;
          }
        >;
      }
    >();

    const idxToPath = new Map<number, string[]>();

    // First pass: build canonical mapping inst+uniteLabel -> "unite:<id>" if ANY row has an id
    const canonicalUniteKeyByInstAndLabel = new Map<string, string>();
    const picked = drafts.map((c, idx) => ({ c, idx })).filter(({ c }) => Boolean(c.exemplaire_id));

    for (const { c } of picked) {
      const ex: any = c.exemplaire ?? {};
      const instLabel = safeLabel(ex.institution_sigle || ex.institution_nom);
      const uniteLabel = safeLabel(ex.unite_titre);
      const uniteId = (ex.unite_id ?? null) as string | null;

      const mapKey = `instLabel:${normKey(instLabel)}||uniteLabel:${normKey(uniteLabel)}`;
      if (uniteId) canonicalUniteKeyByInstAndLabel.set(mapKey, `unite:${uniteId}`);
    }

    // Second pass: actually group
    for (const { c, idx } of picked) {
      const ex: any = c.exemplaire ?? {};

      const instLabel = safeLabel(ex.institution_sigle || ex.institution_nom);
      const instKey = `inst:${instLabel}`;

      const uniteIdRaw = (ex.unite_id ?? null) as string | null;
      const uniteLabel = safeLabel(ex.unite_titre);

      const mapKey = `instLabel:${normKey(instLabel)}||uniteLabel:${normKey(uniteLabel)}`;
      const canonical = canonicalUniteKeyByInstAndLabel.get(mapKey) ?? null;

      // If this row has no unite_id but we know a canonical "unite:<id>" for same inst+label, use it.
      const uniteKey = uniteIdRaw
        ? `unite:${uniteIdRaw}`
        : canonical
          ? canonical
          : `unite_fallback:${instLabel.toLowerCase()}||${uniteLabel.toLowerCase()}`;

      const uniteId = uniteIdRaw ?? (canonical ? canonical.replace('unite:', '') : null);

      const online = isOnlineEx(c);

      if (!instMap.has(instKey)) {
        instMap.set(instKey, { label: instLabel, unites: new Map() });
      }
      const inst = instMap.get(instKey)!;

      if (!inst.unites.has(uniteKey)) {
        inst.unites.set(uniteKey, {
          uniteId,
          label: uniteLabel,
          leaves: [],
          online: false,
        });
      }

      const u = inst.unites.get(uniteKey)!;
      u.leaves.push({ idx, c });
      u.online = u.online || online;

      idxToPath.set(idx, [instKey, uniteKey]);
    }

    const tree: TreeInstitutionNode[] = Array.from(instMap.entries())
      .map(([instKey, inst]) => {
        const unites: TreeUniteNode[] = Array.from(inst.unites.entries())
          .map(([uniteKey, u]) => {
            const leaves: TreeLeafNode[] = u.leaves
              .slice()
              .sort((a, b) => {
                // online first
                const ao = isOnlineEx(a.c) ? 0 : 1;
                const bo = isOnlineEx(b.c) ? 0 : 1;
                if (ao !== bo) return ao - bo;

                // depot sort
                const ax: any = a.c.exemplaire ?? {};
                const bx: any = b.c.exemplaire ?? {};
                const dd = safeLabel(ax.depot_nom, '').localeCompare(safeLabel(bx.depot_nom, ''));
                if (dd !== 0) return dd;

                // type / cote
                const na = badgeType(ax.nature_code).localeCompare(badgeType(bx.nature_code));
                if (na !== 0) return na;

                const ca = (ax.cote_locale ?? '').localeCompare(bx.cote_locale ?? '');
                if (ca !== 0) return ca;

                return (a.c.exemplaire_id ?? '').localeCompare(b.c.exemplaire_id ?? '');
              })
              .map((it) => ({
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
              online: u.online,
              count: leaves.length,
              children: leaves,
            };
          })
          .sort((a, b) => {
            if (a.online !== b.online) return a.online ? -1 : 1;
            return a.label.localeCompare(b.label);
          });

        const count = unites.reduce((acc, u) => acc + u.count, 0);

        return {
          kind: 'institution' as const,
          key: instKey,
          label: inst.label,
          count,
          children: unites,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    const allKeys: string[] = [];
    for (const inst of tree) {
      allKeys.push(inst.key);
      for (const unite of inst.children) allKeys.push(unite.key);
    }

    return { tree, idxToPath, allKeys, canonicalUniteKeyByInstAndLabel };
  }

  const { tree, idxToPath } = useMemo(() => buildTreeFromDrafts(sources), [sources]);

  // ---------------------------------------------------------------------------
  // Keep selection coherent when sources change
  // ---------------------------------------------------------------------------
  const pickedIdxs = useMemo(
    () =>
      sources.map((c, idx) => (c.exemplaire_id ? idx : null)).filter((x) => x != null) as number[],
    [sources],
  );

  useEffect(() => {
    // init activeUniteKey
    if (!activeUniteKey) {
      for (const inst of tree) {
        for (const unite of inst.children) {
          setActiveUniteKey(unite.key);
          openNode(inst.key);
          openNode(unite.key);
          return;
        }
      }
    }

    // init selectedIdx
    if (selectedIdx == null) {
      const first = pickedIdxs[0] ?? null;
      if (first != null) setSelectedIdx(first);
    } else {
      const still = sources[selectedIdx];
      if (!still || !still.exemplaire_id) {
        const fallback = pickedIdxs[0] ?? null;
        setSelectedIdx(fallback);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, pickedIdxs.join('|'), sources.length]);

  // ---------------------------------------------------------------------------
  // Middle panel: exemplaires for active unite, grouped by depot
  // ---------------------------------------------------------------------------
  type DepotGroup = {
    depotKey: string;
    depotLabel: string;
    online: boolean; // if any exemplaire online
    items: Array<{
      idx: number;
      c: AnyDraft;
      pos: number; // position in unite (global)
      exemplaireIdToNumber: Map<string, number>;
    }>;
  };

  const depotsForActiveUnite = useMemo((): DepotGroup[] => {
    // gather leaves for the active unite
    let leaves: TreeLeafNode[] = [];
    for (const inst of tree) {
      for (const unite of inst.children) {
        if (unite.key === activeUniteKey) leaves = unite.children;
      }
    }

    const exemplaireIdToNumber = new Map<string, number>();
    leaves.forEach((leaf, i) => {
      if (leaf.c.exemplaire_id) exemplaireIdToNumber.set(leaf.c.exemplaire_id, i + 1);
    });

    const groups = new Map<
      string,
      {
        depotLabel: string;
        online: boolean;
        items: DepotGroup['items'];
      }
    >();

    leaves.forEach((leaf, pos) => {
      const ex: any = leaf.c.exemplaire ?? {};
      const depotLabel = safeLabel(ex.depot_nom, 'Dépôt ?');
      const depotKey = `depot:${normKey(depotLabel)}`;

      if (!groups.has(depotKey)) {
        groups.set(depotKey, { depotLabel, online: false, items: [] });
      }

      const g = groups.get(depotKey)!;
      const online = isOnlineEx(leaf.c);
      g.online = g.online || online;
      g.items.push({
        idx: leaf.idx,
        c: leaf.c,
        pos,
        exemplaireIdToNumber,
      });
    });

    return Array.from(groups.entries())
      .map(([depotKey, g]) => ({
        depotKey,
        depotLabel: g.depotLabel,
        online: g.online,
        items: g.items.sort((a, b) => {
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
        }),
      }))
      .sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        return a.depotLabel.localeCompare(b.depotLabel);
      });
  }, [tree, activeUniteKey]);

  const flatActiveUniteIdxs = useMemo(() => {
    const res: number[] = [];
    depotsForActiveUnite.forEach((g) => g.items.forEach((it) => res.push(it.idx)));
    return res;
  }, [depotsForActiveUnite]);

  // ---------------------------------------------------------------------------
  // UI: summary labels & completeness
  // ---------------------------------------------------------------------------
  const getExemplaireTitle = (
    c: AnyDraft,
    pos: number,
    exemplaireIdToNumber: Map<string, number>,
  ) => {
    const ex: any = c.exemplaire ?? {};
    const cote = (ex.cote_locale ?? '').trim();
    const nature = badgeType(ex.nature_code);
    const src = (ex.source_exemplaire_id ?? '').trim();

    let complement = '';
    if (src) {
      const n = exemplaireIdToNumber.get(src);
      complement = n ? `${nature} de #${n}` : `${nature} (copie)`;
    } else {
      complement = nature;
    }

    if (cote && complement) return `${cote} (${complement})`;
    if (cote) return cote;
    if (complement) return complement;
    return `Exemplaire ${pos + 1}`;
  };

  const getExemplaireSubtitle = (c: AnyDraft) => {
    const ex: any = c.exemplaire ?? {};
    const inst = safeLabel(ex.institution_sigle || ex.institution_nom, 'Institution ?');
    const online = isOnlineEx(c);
    return ex.cote_locale;
  };

  const getExemplaireStatus = (c: AnyDraft) => {
    const ex: any = c.exemplaire ?? {};
    const missing =
      mode === 'acte'
        ? Boolean((c as ActeCitationDraft).acte_manquant)
        : Boolean((c as RegistreCitationDraft).registre_manquant);

    if (missing) return 'missing';

    if (mode === 'acte') {
      const a = c as ActeCitationDraft;
      const hasLoc =
        Boolean((a.vues_raw ?? '').trim()) ||
        Boolean((a.page_raw ?? '').trim()) ||
        a.vues_start != null ||
        a.vues_end != null ||
        a.page_start != null ||
        a.page_end != null;

      if (!hasLoc) return 'todo';
      return 'ok';
    }

    // registre
    const hasNote = Boolean(((c as any).note ?? '').trim());
    const hasMarks = Array.isArray((c as any).marks) && (c as any).marks.length > 0;
    const hasSome = hasNote || hasMarks || Boolean(ex.pagination_type_ref) || Boolean(ex.nb_pages);
    if (!hasSome) return 'todo';
    return 'ok';
  };

  const StatusIcon = ({ status }: { status: 'ok' | 'todo' | 'missing' }) => {
    if (status === 'ok') return <CheckCircle2 className='h-4 w-4 text-emerald-600' />;
    if (status === 'missing') return <AlertTriangle className='h-4 w-4 text-red-600' />;
    return <Circle className='h-4 w-4 text-amber-600' />;
  };

  // ---------------------------------------------------------------------------
  // Selected citation + guards
  // ---------------------------------------------------------------------------
  const selected = selectedIdx != null ? (sources[selectedIdx] ?? null) : null;
  const selectedPicked = Boolean(selected?.exemplaire_id);

  const selectedPath = selectedIdx != null ? (idxToPath.get(selectedIdx) ?? null) : null;

  useEffect(() => {
    // keep activeUniteKey consistent with selected
    if (!selectedPath) return;

    const uniteKey = selectedPath[1];
    if (uniteKey && uniteKey !== activeUniteKey) setActiveUniteKey(uniteKey);

    // open nodes so user sees where they are
    selectedPath.forEach((k) => openNode(k));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx]);

  // ---------------------------------------------------------------------------
  // Editor helpers
  // ---------------------------------------------------------------------------
  const handleRemove = (idx: number) => {
    const currentList = flatActiveUniteIdxs;
    const pos = currentList.indexOf(idx);
    const nextIdx =
      pos >= 0 ? (currentList[pos + 1] ?? currentList[pos - 1] ?? null) : (pickedIdxs[0] ?? null);

    onRemove(idx);
    setSelectedIdx(nextIdx);
  };

  // ---------------------------------------------------------------------------
  // Right panel blocks (unchanged)
  // ---------------------------------------------------------------------------
  function renderRightPanelHeader(args: {
    c: AnyDraft;
    pos: number;
    exemplaireIdToNumber: Map<string, number>;
    idx: number;
  }) {
    const { c, pos, exemplaireIdToNumber, idx } = args;
    const ex: any = c.exemplaire ?? {};
    const online = isOnlineEx(c);
    const url = (ex.url_base ?? '').trim();
    const cote = (ex.cote_locale ?? '').trim();

    const missing =
      mode === 'acte'
        ? Boolean((c as ActeCitationDraft).acte_manquant)
        : Boolean((c as RegistreCitationDraft).registre_manquant);

    const copyOf = (() => {
      const src = (ex.source_exemplaire_id ?? '').trim();
      if (!src) return '';
      const n = exemplaireIdToNumber.get(src);
      return n ? `copie de #${n}` : 'copie';
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

    return (
      <div className='shrink-0 border-b border-slate-200 bg-slate-50 p-4'>
        <div className='flex items-start justify-between gap-3'>
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
            <Button type='button' variant='outline' size='sm' onClick={() => openPickerForIdx(idx)}>
              Changer
            </Button>
            <Button
              type='button'
              variant='destructive'
              size='sm'
              className='gap-2'
              onClick={() => handleRemove(idx)}
            >
              <Trash2 className='h-4 w-4' />
              Supprimer
            </Button>
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

  function renderRightPanelForm(args: { c: AnyDraft; idx: number }) {
    const { c, idx } = args;
    const ex: any = c.exemplaire ?? {};
    const online = isOnlineEx(c);
    const url = (ex.url_base ?? '').trim();
    const cote = (ex.cote_locale ?? '').trim();

    const missing =
      mode === 'acte'
        ? Boolean((c as ActeCitationDraft).acte_manquant)
        : Boolean((c as RegistreCitationDraft).registre_manquant);

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
              <div className='flex flex-wrap items-center gap-2'>
                <Chip variant='outline'>{badgeType(ex.nature_code)}</Chip>
                {ex.support_label ? (
                  <Chip variant='secondary'>Support: {ex.support_label}</Chip>
                ) : null}
                <Chip variant='secondary'>Cote: {cote || '—'}</Chip>
                {ex.nb_pages && ex.pagination_type_ref ? (
                  <Chip variant='outline'>
                    Pagination: {ex.nb_pages} {ex.pagination_type_ref}
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
              </div>

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

                  {missing ? (
                    <span className='text-xs text-slate-500'>
                      (on peut garder une note, mais inutile de saisir la localisation)
                    </span>
                  ) : null}
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

              {/* Localisation acte */}
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
            </div>
          </div>

          {/* Bloc 2 — Observations sur l’exemplaire */}
          <div className='rounded-xl border border-slate-200 bg-white'>
            <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
              <div className='text-sm font-semibold text-slate-900'>
                Observations sur l’exemplaire
              </div>
              <div className='mt-1 text-xs text-slate-600'>
                Champs transverses (forme, état, repro, marques).
              </div>
            </div>

            <div className='p-4 space-y-5'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                {/* Forme */}
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

                {/* État physique */}
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

                {/* Qualité repro */}
                <div className='md:col-span-4'>
                  <div className='text-xs font-medium text-slate-700'>Qualité de reproduction</div>
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

              <Separator />

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
                  <div className='text-sm font-semibold text-slate-900'>Note courte</div>
                  <Textarea
                    value={String((c as any).note ?? '')}
                    onChange={(e) => onChange(idx, { note: e.target.value } as any)}
                    placeholder='Ex. graphie difficile, coin déchiré, index absent…'
                    className='mt-2 min-h-[90px]'
                  />
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
              <Textarea
                value={String((c as any).work_note ?? '')}
                onChange={(e) => onChange(idx, { work_note: e.target.value } as any)}
                placeholder='Ex. vérifier la pagination, comparer avec microfilm, anomalie sur les vues…'
                className='min-h-[140px]'
              />
              <div className='mt-2 text-xs text-slate-500'>
                Champ facultatif (si tu n’as pas encore `work_note` en DB, garde-le en draft ou
                remplace par `note`).
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Left panel: tree (Institution -> Unite) (unchanged UI, fixed grouping by canonical key)
  // ---------------------------------------------------------------------------
  function renderTreePanel() {
    return (
      <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0'>
        <div className='shrink-0 border-b border-slate-200 bg-slate-50 p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <div className='text-sm font-semibold text-slate-900'>Archives</div>
              <div className='mt-1 text-xs text-slate-600'>Institution → unité documentaire</div>
            </div>
          </div>
        </div>

        <div className='flex-1 min-h-0 overflow-y-auto p-3 space-y-2'>
          {tree.map((inst) => (
            <div key={inst.key} className='overflow-hidden rounded-xl border border-slate-200'>
              <button
                type='button'
                onClick={() => toggleNode(inst.key)}
                className='w-full border-b border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100/60'
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
                </div>
              </button>

              {isNodeOpen(inst.key) ? (
                <div className='p-2 space-y-2'>
                  {inst.children.map((unite) => {
                    const active = unite.key === activeUniteKey;

                    return (
                      <div key={unite.key} className='rounded-lg border border-slate-200'>
                        <button
                          type='button'
                          onClick={() => {
                            setActiveUniteKey(unite.key);
                            openNode(inst.key);
                            openNode(unite.key);
                          }}
                          className={[
                            'w-full px-3 py-2 text-left hover:bg-slate-50',
                            active ? 'bg-slate-900 text-white hover:bg-slate-900' : 'bg-white',
                          ].join(' ')}
                        >
                          <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0'>
                              <div className='text-sm font-semibold'>{unite.label}</div>
                              <div
                                className={[
                                  'mt-0.5 text-xs',
                                  active ? 'text-white/80' : 'text-slate-500',
                                ].join(' ')}
                              >
                                {unite.count} exemplaire{unite.count > 1 ? 's' : ''}
                              </div>
                            </div>

                            <div className='shrink-0 flex items-center gap-2'>
                              <Badge variant='secondary' className='text-[11px]'>
                                {unite.count}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Middle panel: exemplaires grouped by depot (renamed from Citations)
  // ---------------------------------------------------------------------------
  function renderExemplairesPanel() {
    return (
      <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0'>
        <div className='shrink-0 border-b border-slate-200 bg-slate-50 p-4'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <div className='text-sm font-semibold text-slate-900'>Exemplaires</div>
              <div className='mt-1 text-xs text-slate-600'>
                {activeUniteKey ? 'Regroupés par dépôt' : 'Sélectionne une unité'}
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button type='button' variant='ghost' size='icon' onClick={openPickerForNew}>
                  <Plus className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Associer un exemplaire</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className='flex-1 min-h-0 overflow-y-auto p-3'>
          {loading ? (
            <div className='text-sm text-slate-600'>Chargement…</div>
          ) : !hasAnySelected ? (
            <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
              Aucune référence sélectionnée.
              <div className='mt-2 text-xs text-slate-600'>
                Clique sur <span className='font-medium'>Associer un exemplaire</span> pour choisir
                un exemplaire.
              </div>
            </div>
          ) : depotsForActiveUnite.length === 0 ? (
            <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
              Aucun exemplaire dans cette unité.
              <div className='mt-2 text-xs text-slate-600'>
                Clique sur <span className='font-medium'>Associer un exemplaire</span> pour
                sélectionner un exemplaire.
              </div>
            </div>
          ) : (
            <div className='space-y-3'>
              {depotsForActiveUnite.map((g) => (
                <div
                  key={g.depotKey}
                  className='rounded-xl border border-slate-200 overflow-hidden'
                >
                  <div className='border-b border-slate-200 bg-slate-50 px-3 py-2'>
                    <div className='flex items-center justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='text-xs font-semibold text-slate-900 truncate'>
                          {g.depotLabel}
                        </div>
                        <div className='mt-0.5 text-[11px] text-slate-600'>
                          {g.items.length} exemplaire{g.items.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className='shrink-0 flex items-center gap-2'>
                        {g.online ? (
                          <Chip className='border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50'>
                            En ligne
                          </Chip>
                        ) : (
                          <Chip className='border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50'>
                            Sur place
                          </Chip>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='p-2 space-y-2'>
                    {g.items.map(({ idx, c, pos, exemplaireIdToNumber }) => {
                      const active = idx === selectedIdx;
                      const title = getExemplaireTitle(c, pos, exemplaireIdToNumber);
                      const subtitle = getExemplaireSubtitle(c);
                      const status = getExemplaireStatus(c) as 'ok' | 'todo' | 'missing';

                      return (
                        <button
                          key={`ex-${idx}`}
                          type='button'
                          onClick={() => setSelectedIdx(idx)}
                          className={[
                            'w-full text-left rounded-lg border px-3 py-2 transition',
                            active
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white hover:bg-slate-50 border-slate-200',
                          ].join(' ')}
                        >
                          <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0'>
                              <div className='text-sm font-semibold truncate'>{title}</div>
                              <div
                                className={[
                                  'text-xs truncate',
                                  active ? 'text-white/80' : 'text-slate-500',
                                ].join(' ')}
                              >
                                {subtitle}
                              </div>
                            </div>
                            <div className='shrink-0 pt-0.5'>
                              <StatusIcon status={status} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Right panel: editor (unchanged behavior, now finds meta via depot groups)
  // ---------------------------------------------------------------------------
  function renderEditorPanel() {
    const flat = depotsForActiveUnite.flatMap((g) => g.items);
    const meta = flat.find((x) => x.idx === selectedIdx) ?? flat[0] ?? null;

    if (!meta || !selected || !selectedPicked) {
      return (
        <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0'>
          <div className='shrink-0 border-b border-slate-200 bg-slate-50 p-4'>
            <div className='text-sm font-semibold text-slate-900'>Édition</div>
            <div className='mt-1 text-xs text-slate-600'>Sélectionne un exemplaire.</div>
          </div>
          <div className='flex-1 min-h-0 overflow-y-auto p-4 text-sm text-slate-600'>
            Aucun exemplaire sélectionné.
          </div>
        </div>
      );
    }

    return (
      <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0'>
        {renderRightPanelHeader({
          c: meta.c,
          pos: meta.pos,
          exemplaireIdToNumber: meta.exemplaireIdToNumber,
          idx: meta.idx,
        })}
        {renderRightPanelForm({ c: meta.c, idx: meta.idx })}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='mb-4'>
        <h3 className='text-sm font-semibold text-slate-900'>Occurrences dans les archives</h3>
        {mode === 'acte' ? (
          <p className='mt-1 text-sm text-slate-600'>
            Choisis un <span className='font-medium'>registre / unité documentaire</span> (via un
            exemplaire) puis renseigne ce qui est spécifique à l’acte :{' '}
            <span className='font-medium'>vues/pages</span>, lacunes, notes.
          </p>
        ) : (
          <p className='mt-1 text-sm text-slate-600'>
            Choisis un <span className='font-medium'>registre / unité documentaire</span> (via un
            exemplaire) puis renseigne ce qui est spécifique au registre : lacunes, pagination,
            notes.
          </p>
        )}
      </div>

      <div className='grid gap-4 md:grid-cols-[340px_340px_1fr] h-[72vh] min-h-0'>
        {renderTreePanel()}
        {renderExemplairesPanel()}
        {renderEditorPanel()}
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
