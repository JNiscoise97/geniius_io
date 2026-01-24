//UniteDocumentaireStep.tsx
import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { TypeUnite } from './source.constants';
import { TYPE_UNITE_OPTIONS } from './source.constants';

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
};

type SerieOption = { id: string; code?: string | null; label: string };
type EcritureOption = { id: string; code?: string | null; label: string };
type LangueOption = { id: string; code?: string | null; label: string };

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
  // lookups
  series: SerieOption[];
  langues: LangueOption[];
  ecritures: EcritureOption[];

  // state
  typeUnite: TypeUnite;
  setTypeUnite: (v: TypeUnite) => void;

  serieRef: string;
  setSerieRef: (v: string) => void;

  couvertureLabel: string;
  setCouvertureLabel: (v: string) => void;

  couvertureParsed: CoverageParse;
  couvertureExpanded: CoverageExpanded | null;

  langueRef: string;
  setLangueRef: (v: string) => void;

  ecritureRef: string;
  setEcritureRef: (v: string) => void;

  description: string;
  setDescription: (v: string) => void;

  identifiantInterne: string;
  setIdentifiantInterne: (v: string) => void;
};

export function UniteDocumentaireStep({
  series,
  langues,
  ecritures,

  typeUnite,
  setTypeUnite,

  serieRef,
  setSerieRef,

  couvertureLabel,
  setCouvertureLabel,

  couvertureParsed,
  couvertureExpanded,

  langueRef,
  setLangueRef,

  ecritureRef,
  setEcritureRef,

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
          <select
            className='w-full rounded-md border px-2 py-2 text-sm'
            value={typeUnite}
            onChange={(e) => setTypeUnite(e.target.value as TypeUnite)}
          >
            {TYPE_UNITE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className='space-y-1'>
          <div className='text-xs font-medium'>Série *</div>
          <select
            className='w-full rounded-md border px-2 py-2 text-sm'
            value={serieRef}
            onChange={(e) => setSerieRef(e.target.value)}
          >
            <option value=''>— Choisir —</option>
            {series.length === 0 ? <option value={serieRef || ''}>Chargement…</option> : null}
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
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
                Années non couvertes entre {couvertureExpanded.minYear} et {couvertureExpanded.maxYear}
              </div>
            </div>
          </details>
        ) : null}

        {!couvertureParsed.isValid ? (
          <div className='text-xs text-red-600'>{couvertureParsed.error}</div>
        ) : null}
      </div>

      <div className='h-px bg-border' />

      {/* 3) Langue + Écriture */}
      <div className='grid gap-2 md:grid-cols-2'>
        <div className='space-y-1'>
          <div className='text-xs font-medium'>Langue (optionnelle)</div>
          <select
            className='w-full rounded-md border px-2 py-2 text-sm'
            value={langueRef}
            onChange={(e) => setLangueRef(e.target.value)}
          >
            <option value=''>— Choisir —</option>
            {langues.length === 0 ? (
              <option value='' disabled>
                Chargement…
              </option>
            ) : null}
            {langues.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className='space-y-1'>
          <div className='text-xs font-medium'>Écriture (optionnelle)</div>
          <select
            className='w-full rounded-md border px-2 py-2 text-sm'
            value={ecritureRef}
            onChange={(e) => setEcritureRef(e.target.value)}
          >
            <option value=''>— Choisir —</option>
            {ecritures.length === 0 ? (
              <option value='' disabled>
                Chargement…
              </option>
            ) : null}
            {ecritures.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
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
