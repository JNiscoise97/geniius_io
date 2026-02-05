// ReferenceSourcesCard/editors/registre/SegmentsEditor.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, ChevronDown, Pen } from 'lucide-react';

import { supabase } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { DataTable, type ColumnDef } from '@/components/shared/DataTable';

import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';
import { toIntOrNull } from '../../helpers/utils';

type SegmentScope = 'full' | 'interest' | 'unknown';

export type RegistreSegmentDraft = {
  id?: string;
  kind_ref: string | null;

  // UI-only (peut rester null, on hydrate côté affichage)
  kind_label?: string | null;

  label_override: string | null;
  scope: SegmentScope;

  range_start: number | null;
  range_end: number | null;

  year_from: number | null;
  year_to: number | null;

  date_from: string | null; // 'YYYY-MM-DD'
  date_to: string | null; // 'YYYY-MM-DD'

  note: string | null;
  sort_order?: number | null;
};

type Props = {
  ex: any; // exemplaire hydraté
  segments: RegistreSegmentDraft[];
  onChange?: (next: RegistreSegmentDraft[]) => void;
  readonly?: boolean;
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function normalizeSegments(next: RegistreSegmentDraft[]) {
  return (next ?? []).map((s, i) => ({ ...s, sort_order: i }));
}

function scopeLabel(scope: SegmentScope) {
  if (scope === 'full') return 'Complet';
  if (scope === 'interest') return 'Zone utile';
  return 'À vérifier';
}

function formatCoverage(s: RegistreSegmentDraft) {
  const hasDates = Boolean(s.date_from || s.date_to);
  const hasYears = s.year_from != null || s.year_to != null;

  const datePart = hasDates ? `${s.date_from ?? '—'} → ${s.date_to ?? '—'}` : '';
  const yearPart = hasYears ? `${s.year_from ?? '—'} → ${s.year_to ?? '—'}` : '';

  if (datePart && yearPart) return `${datePart} · ${yearPart}`;
  return datePart || yearPart || '';
}

function emptySegment(seed?: Partial<RegistreSegmentDraft>): RegistreSegmentDraft {
  return {
    kind_ref: null,
    kind_label: null,
    label_override: null,
    scope: 'full',
    range_start: null,
    range_end: null,
    year_from: null,
    year_to: null,
    date_from: null,
    date_to: null,
    note: null,
    sort_order: null,
    ...seed,
  };
}

// ------------------------------------------------------------
// Hydration kind label (id -> "label")
// ------------------------------------------------------------
type RefKindRow = { id: string; code: string | null; label: string | null };

function buildRefDisplayLabel(r: RefKindRow) {
  const label = (r.label ?? '').toString().trim();
  if (label) return label;
  return r.id;
}

function useKindLabels(table: string, ids: (string | null | undefined)[]) {
  const idsKey = useMemo(() => {
    const uniq = Array.from(new Set((ids ?? []).filter(Boolean) as string[]));
    uniq.sort();
    return uniq.join('|');
  }, [ids]);

  const cacheRef = useRef<Map<string, string>>(new Map());
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMissing() {
      const uniq = Array.from(new Set((ids ?? []).filter(Boolean) as string[]));
      const missing = uniq.filter((id) => !cacheRef.current.has(id));
      if (missing.length === 0) return;

      const { data, error } = await supabase
        .from(table)
        .select('id, code, label')
        .in('id', missing);

      if (cancelled) return;
      if (error) return;

      for (const row of (data ?? []) as any[]) {
        const r: RefKindRow = {
          id: String(row.id),
          code: row.code ?? null,
          label: row.label ?? null,
        };
        cacheRef.current.set(r.id, buildRefDisplayLabel(r));
      }
      setTick((x) => x + 1);
    }

    loadMissing();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, idsKey]);

  const getLabel = (id: string | null | undefined) => {
    if (!id) return null;
    return cacheRef.current.get(id) ?? null;
  };

  return { getLabel };
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
export function SegmentsEditor(props: Props) {
  const { ex, segments, onChange, readonly = false } = props;

  const canEdit = !readonly && typeof onChange === 'function';

  const unitLabel = String(ex?.pagination_type_label ?? '').toLowerCase();
  const unitLabelCap = unitLabel ? unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1) : '';

  const setSegments = useCallback(
    (next: RegistreSegmentDraft[]) => {
      if (!canEdit || !onChange) return;
      onChange(normalizeSegments(next));
    },
    [canEdit, onChange],
  );

  const removeSegment = useCallback(
    (i: number) => {
      if (!canEdit) return;
      const next = (segments ?? []).slice();
      next.splice(i, 1);
      setSegments(next);
    },
    [canEdit, segments, setSegments],
  );

  const moveSegment = useCallback(
    (i: number, dir: -1 | 1) => {
      if (!canEdit) return;
      const j = i + dir;
      if (j < 0 || j >= (segments?.length ?? 0)) return;
      const next = (segments ?? []).slice();
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      setSegments(next);
    },
    [canEdit, segments, setSegments],
  );

  const prefillNMD = useCallback(() => {
    if (!canEdit) return;
    setSegments([
      emptySegment({ label_override: 'Naissances', scope: 'full' }),
      emptySegment({ label_override: 'Mariages', scope: 'full' }),
      emptySegment({ label_override: 'Décès', scope: 'full' }),
    ]);
  }, [canEdit, setSegments]);

  // ------------------------------------------------------------
  // Kind labels
  // ------------------------------------------------------------
  const KIND_TABLE = 'ref_ec_registre_segment_kinds';
  const kindIds = useMemo(
    () => (segments ?? []).map((s) => s.kind_ref).filter(Boolean) as string[],
    [segments],
  );
  const { getLabel: getKindLabel } = useKindLabels(KIND_TABLE, kindIds);

  // ------------------------------------------------------------
  // Modal create/edit (disabled if readonly)
  // ------------------------------------------------------------
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<RegistreSegmentDraft>(emptySegment());

  const startCreate = useCallback(() => {
    if (!canEdit) return;
    setEditingIndex(null);
    setDraft(emptySegment({ scope: 'full' }));
    setOpen(true);
  }, [canEdit]);

  const startEdit = useCallback(
    (idx: number) => {
      if (!canEdit) return;
      setEditingIndex(idx);
      setDraft(segments[idx] ?? emptySegment());
      setOpen(true);
    },
    [canEdit, segments],
  );

  const saveDraft = useCallback(() => {
    if (!canEdit) return;

    if (!draft.kind_ref) {
      alert('Choisis un type de repère.');
      return;
    }

    const next = (segments ?? []).slice();
    if (editingIndex == null) next.push(draft);
    else next[editingIndex] = draft;

    setSegments(next);
    setOpen(false);
  }, [canEdit, draft, editingIndex, segments, setSegments]);

  // ------------------------------------------------------------
  // DataTable rows/columns
  // ------------------------------------------------------------
  const rows = useMemo(() => {
    return (segments ?? []).map((s, i) => ({
      _idx: i,
      _isFirst: i === 0,
      _isLast: i === (segments?.length ?? 0) - 1,
      numero: i + 1,
      type: getKindLabel(s.kind_ref) ?? s.kind_label ?? '',
      libelle: s.label_override ?? '',
      scope: s.scope,
      coverage: formatCoverage(s),
      note: s.note ?? '',
    }));
  }, [segments, getKindLabel]);

  const columns: ColumnDef<any>[] = useMemo(() => {
    const base: ColumnDef<any>[] = [
      { key: 'numero', label: '#', render: (row) => row.numero },
      { key: 'type', label: 'Type', render: (row) => row.type || '—' },
      { key: 'libelle', label: 'Libellé', render: (row) => row.libelle || '—' },
      {
        key: 'scope',
        label: 'Scope',
        render: (row) => scopeLabel(row.scope as SegmentScope),
      },
      { key: 'coverage', label: 'Dates / années', render: (row) => row.coverage || '—' },
      {
        key: 'note',
        label: 'Note',
        render: (row) => (row.note ? <span className='line-clamp-2'>{row.note}</span> : '—'),
      },
    ];

    if (!canEdit) return base;

    return [
      ...base,
      {
        key: 'actions',
        label: '',
        render: (row) => (
          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              size='icon'
              title='Monter'
              onClick={() => moveSegment(row._idx, -1)}
              disabled={row._isFirst}
            >
              ↑
            </Button>
            <Button
              variant='outline'
              size='icon'
              title='Descendre'
              onClick={() => moveSegment(row._idx, 1)}
              disabled={row._isLast}
            >
              ↓
            </Button>

            <Button
              variant='outline'
              size='icon'
              title='Modifier'
              onClick={() => startEdit(row._idx)}
            >
              <Pen className='h-4 w-4' />
            </Button>

            <Button
              variant='outline'
              size='icon'
              title='Supprimer'
              className='text-red-500 hover:text-red-600'
              onClick={() => removeSegment(row._idx)}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        ),
      },
    ];
  }, [canEdit, moveSegment, removeSegment, startEdit]);

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  const openedByDefault = (segments?.length ?? 0) > 0 ? true : undefined;

  return (
    <details className='group rounded-xl border border-slate-200 bg-white' open={openedByDefault}>
      <summary className='list-none cursor-pointer select-none'>
        <div className='flex items-start justify-between gap-3 rounded-xl border-b border-slate-200 bg-slate-50 px-4 py-3'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <ChevronDown className='h-4 w-4 text-slate-500 transition-transform group-open:rotate-180' />
              <div className='text-sm font-semibold text-slate-900'>
                Repères dans l’exemplaire
                <span className='ml-2 text-xs font-normal text-slate-500'>
                  ({segments?.length ?? 0})
                </span>
              </div>

              {readonly ? (
                <span className='ml-2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600'>
                  Lecture seule
                </span>
              ) : null}
            </div>

            <div className='mt-1 text-xs text-slate-600'>
              <div>
                Cet exemplaire contient{' '}
                <span className='font-medium text-slate-800'>
                  {ex?.nb_pages} {String(ex?.pagination_type_label ?? '').toLowerCase()}
                </span>
                .
              </div>
              {canEdit ? (
                <div className='mt-1'>
                  Ajoute des repères : <span className='font-medium'>naissances</span>,{' '}
                  <span className='font-medium'>mariages</span>,{' '}
                  <span className='font-medium'>décès</span>, tables…
                </div>
              ) : null}
            </div>
          </div>

          <div className='shrink-0 text-xs text-slate-500'>
            {(segments?.length ?? 0) === 0 ? 'Replié' : 'Déplié'}
          </div>
        </div>
      </summary>

      <div className='p-4'>
        {canEdit ? (
          <div className='flex flex-wrap items-center justify-end gap-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type='button' variant='outline' size='sm' onClick={startCreate}>
                  <Plus className='h-4 w-4 mr-2' />
                  Ajouter un repère
                </Button>
              </TooltipTrigger>
              <TooltipContent>Créer un repère</TooltipContent>
            </Tooltip>

            <Button type='button' variant='outline' size='sm' onClick={prefillNMD}>
              Ajouter Naissances / Mariages / Décès
            </Button>
          </div>
        ) : null}

        {(!rows || rows.length === 0) && (
          <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
            Aucun repère.
            {canEdit ? (
              <div className='mt-2 text-xs text-slate-600'>
                Exemple : “Naissances”, “Tables”, “Année 1905 (zone utile)”.
              </div>
            ) : null}
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className='mt-3'>
            <DataTable
              title=''
              data={rows}
              columns={columns}
              defaultVisibleColumns={[
                'numero',
                'type',
                'libelle',
                'scope',
                'coverage',
                'note',
                ...(canEdit ? ['actions'] : []),
              ]}
            />
          </div>
        )}

        {/* MODAL (edit-only) */}
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!canEdit) {
              setOpen(false);
              return;
            }
            setOpen(v);
          }}
        >
          <DialogContent className='sm:max-w-[820px]'>
            <DialogHeader>
              <DialogTitle>
                {editingIndex == null
                  ? 'Ajouter un repère'
                  : `Modifier le repère #${(editingIndex ?? 0) + 1}`}
              </DialogTitle>
            </DialogHeader>

            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                <div className='md:col-span-6'>
                  <div className='text-xs font-medium text-slate-700'>Type de repère</div>
                  <RefSinglePickerSmart
                    table={KIND_TABLE}
                    mode={readonly ? 'view' : 'edit'}
                    actionsInvisible={readonly ? true : false}
                    value={(draft.kind_ref ?? null) as any}
                    onChange={(next) => {
                      if (readonly) return;
                      setDraft((p) => ({
                        ...p,
                        kind_ref: next,
                        kind_label: next ? getKindLabel(next) : null,
                      }));
                    }}
                  />
                  <div className='mt-1 text-[11px] text-slate-500'>Obligatoire</div>
                </div>

                <div className='md:col-span-6'>
                  <div className='text-xs font-medium text-slate-700'>
                    Libellé (optionnel) <span className='text-slate-500'>· utile si “Autre”</span>
                  </div>
                  <Input
                    className='mt-1'
                    value={String(draft.label_override ?? '')}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, label_override: e.target.value || null }))
                    }
                    placeholder='Ex. Tables, Annexes, Année 1905…'
                    disabled={readonly}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                <div className='md:col-span-3'>
                  <div className='text-xs font-medium text-slate-700'>{unitLabelCap} début</div>
                  <Input
                    className='mt-1'
                    value={draft.range_start ?? ''}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, range_start: toIntOrNull(e.target.value) }))
                    }
                    disabled={readonly}
                  />
                </div>

                <div className='md:col-span-3'>
                  <div className='text-xs font-medium text-slate-700'>{unitLabelCap} fin</div>
                  <Input
                    className='mt-1'
                    value={draft.range_end ?? ''}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, range_end: toIntOrNull(e.target.value) }))
                    }
                    disabled={readonly}
                  />
                </div>

                <div className='md:col-span-6'>
                  <div className='text-xs font-medium text-slate-700'>Scope</div>
                  <select
                    className='mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-60'
                    value={draft.scope ?? 'full'}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, scope: e.target.value as SegmentScope }))
                    }
                    disabled={readonly}
                  >
                    <option value='full'>Complet</option>
                    <option value='interest'>Zone utile</option>
                    <option value='unknown'>À vérifier</option>
                  </select>
                  <div className='mt-1 text-[11px] text-slate-500'>
                    Complet = segment complet · Zone utile = portion pertinente · À vérifier =
                    incertain
                  </div>
                </div>
              </div>

              <div className='rounded-lg border border-slate-200 bg-slate-50 p-4'>
                <div className='text-sm font-semibold text-slate-900'>Période couverte</div>
                <div className='mt-1 text-xs text-slate-600'>Années ou dates (au choix).</div>

                <div className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-12'>
                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>Année début</div>
                    <Input
                      className='mt-1'
                      value={draft.year_from ?? ''}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, year_from: toIntOrNull(e.target.value) }))
                      }
                      placeholder='1905'
                      disabled={readonly}
                    />
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>Année fin</div>
                    <Input
                      className='mt-1'
                      value={draft.year_to ?? ''}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, year_to: toIntOrNull(e.target.value) }))
                      }
                      placeholder='1905'
                      disabled={readonly}
                    />
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>Date début</div>
                    <Input
                      className='mt-1'
                      type='date'
                      value={draft.date_from ?? ''}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, date_from: e.target.value || null }))
                      }
                      disabled={readonly}
                    />
                  </div>

                  <div className='md:col-span-3'>
                    <div className='text-xs font-medium text-slate-700'>Date fin</div>
                    <Input
                      className='mt-1'
                      type='date'
                      value={draft.date_to ?? ''}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, date_to: e.target.value || null }))
                      }
                      disabled={readonly}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className='text-xs font-medium text-slate-700'>Note</div>
                <Textarea
                  className='mt-1 min-h-[90px]'
                  value={String(draft.note ?? '')}
                  onChange={(e) => setDraft((p) => ({ ...p, note: e.target.value || null }))}
                  placeholder='Ex. pagination irrégulière / tables incluses / bornes approximatives…'
                  disabled={readonly}
                />
              </div>
            </div>

            <DialogFooter className='gap-2'>
              <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                {canEdit ? 'Annuler' : 'Fermer'}
              </Button>
              {canEdit ? (
                <Button type='button' onClick={saveDraft}>
                  Enregistrer
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </details>
  );
}