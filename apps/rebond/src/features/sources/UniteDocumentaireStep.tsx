// UniteDocumentaireStep.tsx
import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';

type YearGap = { start: number; end: number };
type CoverageExpandedRow = { year: number; covered: boolean };
type CoverageExpanded = {
  coveredYears: number[];
  rows: CoverageExpandedRow[];
  minYear: number | null;
  maxYear: number | null;
};

type CoverageParse = {
  raw: string;
  normalized: string;
  isValid: boolean;
  years: number[];
  minYear: number | null;
  maxYear: number | null;
  error?: string;
}

function computeGaps(rows: { year: number; covered: boolean }[]): YearGap[] {
  const gaps: YearGap[] = [];
  let current: YearGap | null = null;

  for (const r of rows) {
    if (!r.covered) {
      if (!current) current = { start: r.year, end: r.year };
      else current.end = r.year;
    } else if (current) {
      gaps.push(current);
      current = null;
    }
  }

  if (current) gaps.push(current);
  return gaps;
}

function formatGap(g: YearGap): string {
  return g.start === g.end ? `${g.start}` : `${g.start}–${g.end}`;
}

type Props = {

  typeUniteRef: string;
  setTypeUniteRef: (v: string) => void;
  
  serieRef: string;
  setSerieRef: (v: string) => void;

  couvertureLabel: string;
  setCouvertureLabel: (v: string) => void;

  couvertureParsed: CoverageParse;
  couvertureExpanded: CoverageExpanded | null;

  description: string;
  setDescription: (v: string) => void;

  identifiantInterne: string;
  setIdentifiantInterne: (v: string) => void;
};

export function UniteDocumentaireStep({
  typeUniteRef,
  setTypeUniteRef,

  serieRef,
  setSerieRef,

  couvertureLabel,
  setCouvertureLabel,

  couvertureParsed,
  couvertureExpanded,

  description,
  setDescription,

  identifiantInterne,
  setIdentifiantInterne,
}: Props) {
  const gaps = useMemo(() => {
    if (!couvertureParsed.isValid) return [];
    if (!couvertureExpanded?.rows?.length) return [];
    return computeGaps(couvertureExpanded.rows);
  }, [couvertureParsed.isValid, couvertureExpanded]);

  return (
    <div className='space-y-3'>
      {/* 1) Type d'unité + Série */}
      <div className='grid gap-2 md:grid-cols-2'>
        <div className='space-y-1'>
          <div className='text-xs font-medium'>Type d’unité *</div>
          <RefSinglePickerSmart
            table='ref_type_unite'
            value={typeUniteRef || null}
            onChange={(id) => setTypeUniteRef(id ?? '')}
            mode='edit'
            actionsInvisible={false}
          />
        </div>

        <div className='space-y-1'>
          <div className='text-xs font-medium'>Série *</div>
          <RefSinglePickerSmart
            table='ref_series_documentaires'
            value={serieRef || null}
            onChange={(id) => setSerieRef(id ?? '')}
            mode='edit'
            actionsInvisible={false}
          />
        </div>
      </div>

      <div className='h-px bg-border' />

      {/* 2) Période couverte */}
      <div className='space-y-1'>
        <div className='text-xs font-medium'>Période couverte *</div>
        <Input
          value={couvertureLabel}
          onChange={(e) => setCouvertureLabel(e.target.value)}
          placeholder='ex: 1780, 1820 ; an IV-1810 ; octobre 1821-05/1830'
        />

        <div className='text-xs text-muted-foreground'>
          Formats acceptés : <b>1780</b>, <b>an IV-1810</b>, <b>1812</b>, <b>1815-1820</b>,{' '}
          <b>octobre 1821-05/1830</b>
        </div>

        {couvertureParsed.isValid && gaps.length > 0 && couvertureExpanded ? (
          <details className='mt-2 rounded-md border bg-muted/30 px-3 py-2'>
            <summary className='cursor-pointer text-xs font-medium'>
              Trous dans la couverture ({gaps.length})
            </summary>

            <div className='mt-2 space-y-1 text-xs text-muted-foreground'>
              <div>
                {gaps.map((g, i) => (
                  <span
                    key={i}
                    className='mr-2 mb-1 inline-block rounded border bg-background px-2 py-0.5'
                  >
                    {formatGap(g)}
                  </span>
                ))}
              </div>

              <div className='text-[11px] italic'>
                Années non couvertes entre {couvertureExpanded.minYear} et{' '}
                {couvertureExpanded.maxYear}
              </div>
            </div>
          </details>
        ) : null}

        {!couvertureParsed.isValid ? (
          <div className='text-xs text-red-600'>{couvertureParsed.error}</div>
        ) : null}
      </div>

      <div className='h-px bg-border' />

      {/* 4) Description */}
      <div className='space-y-1'>
        <div className='text-xs font-medium'>Description (optionnelle)</div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Description courte'
          className='min-h-[80px]'
        />
      </div>

      <div className='h-px bg-border' />

      {/* 5) Identifiant interne */}
      <div className='space-y-1'>
        <div className='text-xs font-medium'>Identifiant interne (optionnel)</div>
        <Input
          value={identifiantInterne}
          onChange={(e) => setIdentifiantInterne(e.target.value)}
          placeholder='ex: ANOM_EC_GUA_DESHAIES_1859_M'
        />
      </div>
    </div>
  );
}
