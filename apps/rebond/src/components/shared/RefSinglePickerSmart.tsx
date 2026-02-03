import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { ListeChipsViewSmart } from '@/components/shared/ListeChipsViewSmart';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ALL_COLUMNS, REF_TABLES, type RefColumnKey, type RefRow } from '@/types/referentiel';

type Mode = 'view' | 'edit';

type Props = {
  table: string;
  value: string | null;
  onChange?: (next: string | null) => void;
  mode: Mode;

  // optionnels
  titleOverride?: string; // titre sheet/affichage
  readonly?: boolean;
  placeholderEmpty?: string;

  actionsInvisible?: boolean;

  // recherche/tri
  limit?: number;
  orderBy?: { column: string; ascending?: boolean };

  // colonnes : par défaut on prend REF_TABLES.columns si présent, sinon on assume tout
  columns?: Partial<Record<RefColumnKey, boolean>>;

  // affichage
  showDescriptionUnderRadio?: boolean;
};

function getTableMeta(table: string) {
  return REF_TABLES.find((t) => t.value === table);
}

function resolveColumns(table: string, columnsOverride?: Partial<Record<RefColumnKey, boolean>>) {
  // Priorité: override > meta.columns > default(all true)
  const meta = getTableMeta(table);

  const base: Record<RefColumnKey, boolean> = {
    code: false,
    label: true,
    description: true,
    note: true,
    ordre: false,
    color: false,
  };

  const fromMeta = meta?.columns ? { ...base, ...meta.columns } : base;
  return columnsOverride ? { ...fromMeta, ...columnsOverride } : fromMeta;
}

function buildSelect(columns: Record<RefColumnKey, boolean>) {
  const cols = ['id'] as string[];
  for (const k of ALL_COLUMNS) {
    if (columns[k]) cols.push(k);
  }
  // évite un select "id," vide
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

  // on ne force pas la présence des autres champs (optionnels)
  const r = v as Record<string, unknown>;

  const ordre =
    typeof r.ordre === 'number'
      ? r.ordre
      : typeof r.ordre === 'string' && r.ordre.trim() !== ''
        ? Number(r.ordre)
        : null;
  return {
    id: String(r.id),
    code: typeof r.code === 'string' ? r.code : ((r.code as any) ?? null),
    label: typeof r.label === 'string' ? r.label : ((r.label as any) ?? null),
    description:
      typeof r.description === 'string' ? r.description : ((r.description as any) ?? null),
    note: typeof r.note === 'string' ? r.note : ((r.note as any) ?? null),
    ordre: Number.isFinite(ordre as number) ? (ordre as number) : null,
    color: typeof r.color === 'string' ? r.color : ((r.color as any) ?? null),
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

export function RefSinglePickerSmart({
  table,
  value,
  onChange,
  mode,

  titleOverride,
  readonly = false,
  placeholderEmpty = 'Non renseigné',

  actionsInvisible = true,

  limit = 500,
  orderBy = { column: 'label', ascending: true },

  columns: columnsOverride,
  showDescriptionUnderRadio = true,
}: Props) {
  const canEdit = mode === 'edit' && !readonly && !!onChange;

  const meta = useMemo(() => getTableMeta(table), [table]);
  const title = titleOverride ?? meta?.label ?? table;

  const columns = useMemo(() => resolveColumns(table, columnsOverride), [table, columnsOverride]);
  const selectCols = useMemo(() => buildSelect(columns), [columns]);

  const [open, setOpen] = useState(false);

  // affichage chip
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);

  // liste
  const [loadingList, setLoadingList] = useState(false);
  const [rows, setRows] = useState<RefRow[]>([]);
  const [q, setQ] = useState('');

  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // valeur temporaire dans la sheet (radio)
  const [draft, setDraft] = useState<string>(''); // RadioGroup attend string non-null

  // 1) charger la valeur sélectionnée (pour chip)
  useEffect(() => {
    let cancelled = false;

    async function loadSelected() {
      if (!value) {
        setSelectedText(null);
        setSelectedColor(null);

        return;
      }

      setLoadingSelected(true);

      const { data, error } = await supabase
        .from(table)
        .select(selectCols)
        .eq('id', value)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setSelectedText(value);
        setSelectedColor(null);
      } else {
        const row = toRefRow(data);
        setSelectedText(row ? buildDisplayLabel(row, columns) : value);
        setSelectedColor(row?.color ?? null);
      }

      setLoadingSelected(false);
    }

    loadSelected();
    return () => {
      cancelled = true;
    };
  }, [table, value, selectCols, columns]);

  // 2) ouverture sheet -> init draft + charge liste
  useEffect(() => {
    if (!open) return;
    setDraft(value ?? '');
  }, [open, value]);

  useEffect(() => {
    let cancelled = false;

    async function loadList() {
      if (!open) return;

      setLoadingList(true);

      let query = supabase.from(table).select(selectCols).limit(limit);

      // tri : ordre si activé, sinon fallback orderBy
      if (columns.ordre) {
        query = query.order('ordre', { ascending: true });

        // tri secondaire stable : label si dispo, sinon code, sinon id
        if (columns.label) query = query.order('label', { ascending: true });
        else if (columns.code) query = query.order('code', { ascending: true });
        else query = query.order('id', { ascending: true });
      } else if (orderBy?.column) {
        const col = orderBy.column; // string

        const isSupported =
          col === 'id' ||
          (ALL_COLUMNS.includes(col as RefColumnKey) &&
            (columns as Record<RefColumnKey, boolean>)[col as RefColumnKey]);

        if (isSupported) {
          query = query.order(col, { ascending: orderBy.ascending ?? true });
        } else {
          // fallback safe
          if (columns.label) query = query.order('label', { ascending: true });
          else if (columns.code) query = query.order('code', { ascending: true });
          else query = query.order('id', { ascending: true });
        }
      }

      // filtre recherche : priorité label, sinon code, sinon rien
      const qq = q.trim();
      if (qq.length > 0) {
        if (columns.label) {
          query = query.ilike('label', `%${qq}%`);
        } else if (columns.code) {
          query = query.ilike('code', `%${qq}%`);
        }
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
    columns.label,
    columns.code,
    columns.ordre,
  ]);

  const chipValues = useMemo(() => {
    if (!value) return [];
    if (loadingSelected) return ['Chargement…'];
    return [selectedText ?? value];
  }, [value, loadingSelected, selectedText]);

  return (
    <>
      {/* Affichage principal (chips) */}
      <ListeChipsViewSmart
        titre={title}
        values={chipValues}
        dense
        colors={value ? [selectedColor] : []}
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
                onChange?.(null);
              }
            : undefined
        }
      />

      {/* Sheet */}
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
                  ) : (
                    <RadioGroup value={draft} onValueChange={setDraft} className='space-y-3'>
                      {/* option "vide" */}
                      <div className='rounded-md border'>
                        <Label
                          htmlFor={`${table}-empty`}
                          className={[
                            'flex cursor-pointer items-start gap-3 px-3 py-2 rounded-md',
                            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring',
                            draft === '' ? 'border border-primary bg-muted' : '',
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

                      {rows.map((r) => {
                        const id = String(r.id);
                        const main = buildDisplayLabel(r, columns);
                        const desc = columns.description ? (r.description ?? '') : '';
                        const note = columns.note ? (r.note ?? '') : '';

                        const checked = draft === id;

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
                                      <div className='text-xs text-muted-foreground whitespace-pre-wrap'>
                                        {desc}
                                      </div>
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
                      })}
                    </RadioGroup>
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
                const next = draft === '' ? null : draft;
                onChange?.(next);
                setOpen(false);
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
