// RefSinglePickerSmart.tsx
import { useEffect, useMemo, useState } from 'react';
import { resolveRefTableClient } from '@/lib/supabase/refSchemaRouting';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { ListeChipsViewSmart } from '@/components/shared/ListeChipsViewSmart';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

import { ALL_COLUMNS, REF_TABLES, type RefColumnKey, type RefRow } from '@/types/referentiel';

type Mode = 'view' | 'edit';

type BaseProps = {
  table: string;
  mode: Mode;

  titleOverride?: string;
  readonly?: boolean;
  placeholderEmpty?: string;
  actionsInvisible?: boolean;

  limit?: number;
  orderBy?: { column: string; ascending?: boolean };

  columns?: Partial<Record<RefColumnKey, boolean>>;
  showDescriptionUnderRadio?: boolean;

  queryTransform?: (q: any) => any;
};

type SingleProps = {
  multi?: false;
  value: string | null;
  onChange?: (next: string | null) => void;
};

type MultiProps = {
  multi: true;
  value: string[] | null;
  onChange?: (next: string[] | null) => void;
};

export type Props = BaseProps & (SingleProps | MultiProps);

function getTableMeta(table: string) {
  return REF_TABLES.find((t) => t.value === table);
}

function resolveColumns(table: string, columnsOverride?: Partial<Record<RefColumnKey, boolean>>) {
  const meta = getTableMeta(table);

  const base: Record<RefColumnKey, boolean> = {
    code: false,
    label: true,
    description: true,
    note: true,
    position: false,
    color: false,
    categorie: false,
  };

  const fromMeta = meta?.columns ? { ...base, ...meta.columns } : base;
  return columnsOverride ? { ...fromMeta, ...columnsOverride } : fromMeta;
}

function buildSelect(columns: Record<RefColumnKey, boolean>) {
  const cols = ['id'] as string[];
  for (const k of ALL_COLUMNS) if (columns[k]) cols.push(k);
  return cols.join(', ');
}

function buildDisplayLabel(row: RefRow, columns: Record<RefColumnKey, boolean>) {
  const code = (columns.code ? (row.code ?? '') : '')?.toString().trim();
  const label = (columns.label ? (row.label ?? '') : '')?.toString().trim();
  if (code && label) return `${code} — ${label}`;
  if (label) return label;
  if (code) return code;
  return row.id;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function hasId(v: unknown): v is { id: string } {
  return isRecord(v) && typeof (v as any).id === 'string';
}

function toRefRow(v: unknown): RefRow | null {
  if (!hasId(v)) return null;
  const r = v as Record<string, unknown>;

  const position =
    typeof r.position === 'number'
      ? r.position
      : typeof r.position === 'string' && r.position.trim() !== ''
        ? Number(r.position)
        : null;

  return {
    id: String(r.id),
    code: typeof r.code === 'string' ? r.code : ((r.code as any) ?? null),
    label: typeof r.label === 'string' ? r.label : ((r.label as any) ?? null),
    description:
      typeof r.description === 'string' ? r.description : ((r.description as any) ?? null),
    note: typeof r.note === 'string' ? r.note : ((r.note as any) ?? null),
    position: Number.isFinite(position as number) ? (position as number) : null,
    color: typeof r.color === 'string' ? r.color : ((r.color as any) ?? null),
    categorie: typeof r.categorie === 'string' ? r.categorie : ((r.categorie as any) ?? null),
  };
}

function toRefRows(v: unknown): RefRow[] {
  if (!Array.isArray(v)) return [];
  const out: RefRow[] = [];
  for (const item of v) {
    const rr = toRefRow(item);
    if (rr) out.push(rr);
  }
  return out;
}

function uniqStrings(xs: string[]) {
  return Array.from(new Set(xs.filter(Boolean)));
}

function toIds(value: string | string[] | null): string[] {
  if (!value) return [];
  return Array.isArray(value) ? uniqStrings(value.map(String)) : [String(value)];
}

// --- Grouping by categorie (UI only) ---
function normalizeCategorie(raw?: string | null) {
  const c = (raw ?? '').trim();
  return c.length ? c : 'Sans catégorie';
}
type GroupedRows = Array<{ categorie: string; rows: RefRow[] }>;

function groupRowsByCategorie(rows: RefRow[]): GroupedRows {
  const map = new Map<string, RefRow[]>();
  for (const r of rows) {
    const cat = normalizeCategorie(r.categorie);
    const arr = map.get(cat);
    if (arr) arr.push(r);
    else map.set(cat, [r]);
  }

  const cats = Array.from(map.keys()).sort((a, b) => {
    if (a === 'Sans catégorie') return 1;
    if (b === 'Sans catégorie') return -1;
    return a.localeCompare(b, 'fr');
  });

  return cats.map((categorie) => ({ categorie, rows: map.get(categorie)! }));
}

function CategoryHeader({ categorie }: { categorie: string }) {
  return (
    <div className='sticky top-0 z-10 -mx-3 px-3 py-2 bg-background/95 backdrop-blur border-b'>
      <div className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
        {categorie}
      </div>
    </div>
  );
}

export function RefSinglePickerSmart(props: Props) {
  const {
    table,
    value,
    mode,
    titleOverride,
    readonly = false,
    placeholderEmpty = 'Non renseigné',
    actionsInvisible = true,
    limit = 500,
    orderBy = { column: 'label', ascending: true },
    columns: columnsOverride,
    showDescriptionUnderRadio = true,
    queryTransform,
  } = props;

  const canEdit = mode === 'edit' && !readonly && !!props.onChange;
  const isMulti = props.multi === true;

  const meta = useMemo(() => getTableMeta(table), [table]);
  const title = titleOverride ?? meta?.label ?? table;

  const resolvedColumns = useMemo(
    () => resolveColumns(table, columnsOverride),
    [table, columnsOverride],
  );
  const selectCols = useMemo(() => buildSelect(resolvedColumns), [resolvedColumns]);

  const [open, setOpen] = useState(false);

  // chips
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [selectedTexts, setSelectedTexts] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<(string | null)[]>([]);

  // list
  const [loadingList, setLoadingList] = useState(false);
  const [rows, setRows] = useState<RefRow[]>([]);
  const [q, setQ] = useState('');

  // draft
  const [draftSingle, setDraftSingle] = useState<string>(''); // RadioGroup expects string
  const [draftMulti, setDraftMulti] = useState<string[]>([]);

  // group by categorie if enabled
  const groupedRows = useMemo(() => {
    if (!resolvedColumns.categorie) return null;
    return groupRowsByCategorie(rows);
  }, [rows, resolvedColumns.categorie]);

  // --- 1) load selected (for chips) ---
  useEffect(() => {
    let cancelled = false;

    async function loadSelected() {
      const ids = toIds(value);

      if (ids.length === 0) {
        setSelectedTexts([]);
        setSelectedColors([]);
        return;
      }

      setLoadingSelected(true);

      if (!isMulti) {
        const id = ids[0];
        const { data, error } = await resolveRefTableClient(table)
          .from(table)
          .select(selectCols)
          .eq('id', id)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data) {
          setSelectedTexts([id]);
          setSelectedColors([null]);
        } else {
          const row = toRefRow(data);
          setSelectedTexts([row ? buildDisplayLabel(row, resolvedColumns) : id]);
          setSelectedColors([row?.color ?? null]);
        }

        setLoadingSelected(false);
        return;
      }

      const { data, error } = await resolveRefTableClient(table).from(table).select(selectCols).in('id', ids).limit(ids.length);

      if (cancelled) return;

      if (error || !data) {
        setSelectedTexts(ids);
        setSelectedColors(ids.map(() => null));
      } else {
        const rr = toRefRows(data);
        const byId = new Map(rr.map((r) => [String(r.id), r]));
        const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as RefRow[];

        setSelectedTexts(ordered.map((r) => buildDisplayLabel(r, resolvedColumns)));
        setSelectedColors(ordered.map((r) => r.color ?? null));
      }

      setLoadingSelected(false);
    }

    loadSelected();
    return () => {
      cancelled = true;
    };
  }, [table, value, selectCols, resolvedColumns, isMulti]);

  // --- 2) open sheet -> init draft ---
  useEffect(() => {
    if (!open) return;

    const ids = toIds(value);
    if (!isMulti) setDraftSingle(ids[0] ?? '');
    else setDraftMulti(ids);
  }, [open, value, isMulti]);

  // --- 3) open sheet / search -> load list ---
  useEffect(() => {
    let cancelled = false;

    async function loadList() {
      if (!open) return;

      setLoadingList(true);

      let query = resolveRefTableClient(table).from(table).select(selectCols).limit(limit);

      if (resolvedColumns.position) {
        query = query.order('position', { ascending: true });
        if (resolvedColumns.label) query = query.order('label', { ascending: true });
        else if (resolvedColumns.code) query = query.order('code', { ascending: true });
        else query = query.order('id', { ascending: true });
      } else if (orderBy?.column) {
        const col = orderBy.column;

        const isSupported =
          col === 'id' ||
          (ALL_COLUMNS.includes(col as RefColumnKey) &&
            (resolvedColumns as Record<RefColumnKey, boolean>)[col as RefColumnKey]);

        if (isSupported) query = query.order(col, { ascending: orderBy.ascending ?? true });
        else {
          if (resolvedColumns.label) query = query.order('label', { ascending: true });
          else if (resolvedColumns.code) query = query.order('code', { ascending: true });
          else query = query.order('id', { ascending: true });
        }
      }

      const qq = q.trim();
      if (qq.length > 0) {
        // simple filter: label first, else code
        if (resolvedColumns.label) query = query.ilike('label', `%${qq}%`);
        else if (resolvedColumns.code) query = query.ilike('code', `%${qq}%`);
      }

      if (queryTransform) {
        query = queryTransform(query);
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) setRows([]);
      else setRows(toRefRows(data));

      setLoadingList(false);
    }

    loadList();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    q,
    table,
    selectCols,
    limit,
    orderBy?.column,
    orderBy?.ascending,
    resolvedColumns.label,
    resolvedColumns.code,
    resolvedColumns.position,
    queryTransform,
  ]);

  const chipValues = useMemo(() => {
    const ids = toIds(value);
    if (ids.length === 0) return [];
    if (loadingSelected) return ['Chargement…'];
    return selectedTexts.length ? selectedTexts : ids;
  }, [value, loadingSelected, selectedTexts]);

  const chipColors = useMemo(() => {
    const ids = toIds(value);
    if (ids.length === 0) return [];
    if (loadingSelected) return [];
    return selectedColors;
  }, [value, loadingSelected, selectedColors]);

  const toggleMulti = (id: string) => {
    setDraftMulti((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return Array.from(set);
    });
  };

  const renderRowSingle = (r: RefRow) => {
    const id = String(r.id);
    const main = buildDisplayLabel(r, resolvedColumns);
    const desc = resolvedColumns.description ? (r.description ?? '') : '';
    const note = resolvedColumns.note ? (r.note ?? '') : '';
    const checked = draftSingle === id;

    return (
      <div key={id} className='rounded-md border'>
        <Label
          htmlFor={`${table}-${id}`}
          className={[
            'flex cursor-pointer items-start gap-3 px-3 py-2 rounded-md',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring',
            checked ? 'border border-primary bg-muted' : '',
          ].join(' ')}
        >
          <RadioGroupItem value={id} id={`${table}-${id}`} className='mt-1' />
          <div className='flex-1 min-w-0'>
            <div className='text-sm font-medium'>{main}</div>
            {showDescriptionUnderRadio && (desc || note) ? (
              <div className='mt-1 space-y-1'>
                {desc ? (
                  <div className='text-xs text-muted-foreground whitespace-pre-wrap'>{desc}</div>
                ) : null}
                {note ? (
                  <div className='text-[11px] text-muted-foreground italic whitespace-pre-wrap'>
                    {note}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </Label>
      </div>
    );
  };

  const renderRowMulti = (r: RefRow) => {
    const id = String(r.id);
    const main = buildDisplayLabel(r, resolvedColumns);
    const desc = resolvedColumns.description ? (r.description ?? '') : '';
    const note = resolvedColumns.note ? (r.note ?? '') : '';
    const checked = draftMulti.includes(id);

    return (
      <div key={id} className='rounded-md border'>
        <Label
          className={[
            'flex cursor-pointer items-start gap-3 px-3 py-2 rounded-md',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring',
            checked ? 'border border-primary bg-muted' : '',
          ].join(' ')}
        >
          <Checkbox checked={checked} onCheckedChange={() => toggleMulti(id)} className='mt-1' />
          <div className='flex-1 min-w-0'>
            <div className='text-sm font-medium'>{main}</div>
            {showDescriptionUnderRadio && (desc || note) ? (
              <div className='mt-1 space-y-1'>
                {desc ? (
                  <div className='text-xs text-muted-foreground whitespace-pre-wrap'>{desc}</div>
                ) : null}
                {note ? (
                  <div className='text-[11px] text-muted-foreground italic whitespace-pre-wrap'>
                    {note}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </Label>
      </div>
    );
  };

  return (
    <>
      <ListeChipsViewSmart
        titre={title}
        values={chipValues}
        dense
        colors={chipColors}
        readonly={!canEdit}
        actionsInvisible={actionsInvisible}
        placeholderEmpty={placeholderEmpty}
        onEdit={
          canEdit
            ? () => {
              setQ('');
              setOpen(true);
            }
            : undefined
        }
        onDelete={
          canEdit
            ? () => {
              props.onChange?.(null);
            }
            : undefined
        }
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side='right'
          className='w-full sm:max-w-[720px] flex flex-col h-full overflow-hidden'
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>

          <div className='mt-4 flex-1 min-h-0 flex flex-col gap-3'>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Rechercher…' />

            <div className='rounded-md border flex-1 min-h-0 overflow-hidden'>
              <ScrollArea className='h-full'>
                <div className='p-3'>
                  {loadingList ? (
                    <div className='text-sm text-muted-foreground'>Chargement…</div>
                  ) : rows.length === 0 ? (
                    <div className='text-sm text-muted-foreground'>Aucun résultat</div>
                  ) : !isMulti ? (
                    <RadioGroup value={draftSingle} onValueChange={setDraftSingle} className='space-y-3'>
                      {/* empty option */}
                      <div className='rounded-md border'>
                        <Label
                          htmlFor={`${table}-empty`}
                          className={[
                            'flex cursor-pointer items-start gap-3 px-3 py-2 rounded-md',
                            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring',
                            draftSingle === '' ? 'border border-primary bg-muted' : '',
                          ].join(' ')}
                        >
                          <RadioGroupItem value='' id={`${table}-empty`} className='mt-1' />
                          <div className='flex-1 min-w-0'>
                            <div className='text-sm font-medium'>Aucune sélection</div>
                            {showDescriptionUnderRadio ? (
                              <div className='text-xs text-muted-foreground mt-1'>
                                Mettre ce champ à <b>NULL</b>.
                              </div>
                            ) : null}
                          </div>
                        </Label>
                      </div>

                      {/* rows (grouped if categorie enabled) */}
                      {resolvedColumns.categorie && groupedRows ? (
                        groupedRows.map((g) => (
                          <div key={g.categorie} className='space-y-2'>
                            <CategoryHeader categorie={g.categorie} />
                            {g.rows.map(renderRowSingle)}
                          </div>
                        ))
                      ) : (
                        rows.map(renderRowSingle)
                      )}
                    </RadioGroup>
                  ) : (
                    <div className='space-y-3'>
                      {/* empty option */}
                      <div className='rounded-md border'>
                        <Label
                          className={[
                            'flex cursor-pointer items-start gap-3 px-3 py-2 rounded-md',
                            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring',
                            draftMulti.length === 0 ? 'border border-primary bg-muted' : '',
                          ].join(' ')}
                        >
                          <Checkbox
                            checked={draftMulti.length === 0}
                            onCheckedChange={() => setDraftMulti([])}
                            className='mt-1'
                          />
                          <div className='flex-1 min-w-0'>
                            <div className='text-sm font-medium'>Aucune sélection</div>
                            {showDescriptionUnderRadio ? (
                              <div className='text-xs text-muted-foreground mt-1'>
                                Mettre ce champ à <b>NULL</b>.
                              </div>
                            ) : null}
                          </div>
                        </Label>
                      </div>

                      {/* rows (grouped if categorie enabled) */}
                      {resolvedColumns.categorie && groupedRows ? (
                        groupedRows.map((g) => (
                          <div key={g.categorie} className='space-y-2'>
                            <CategoryHeader categorie={g.categorie} />
                            {g.rows.map(renderRowMulti)}
                          </div>
                        ))
                      ) : (
                        rows.map(renderRowMulti)
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <SheetFooter className='mt-4 gap-2'>
            <Button variant='outline' type='button' onClick={() => setOpen(false)}>
              Annuler
            </Button>

            <Button
              type='button'
              onClick={() => {
                if (!canEdit) return;

                if (props.multi === true) {
                  const ids = uniqStrings(draftMulti);
                  const next = ids.length === 0 ? null : ids;
                  props.onChange?.(next);
                  setOpen(false);
                } else {
                  const next = draftSingle === '' ? null : draftSingle;
                  props.onChange?.(next);
                  setOpen(false);
                }
              }}
              disabled={!canEdit}
            >
              Valider
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
