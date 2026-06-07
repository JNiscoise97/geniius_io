// SourceDialog.tsx
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ExemplairesStep } from './ExemplairesStep';
import { UniteDocumentaireStep } from './UniteDocumentaireStep';
import { EtatCivilStep } from './EtatCivilStep';
import type {
  BureauOption,
  DepotOption,
  ExemplaireDraft,
  NatureOption,
  PlateformeOption,
  SerieOption,
  TypeAccesOption,
  TypeActeOption,
} from './source.types';

export type SourceDialogMode = 'create' | 'edit-unite' | 'edit-exemplaire';

type TypeUnite = string;

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  mode: SourceDialogMode | null;
  sourceId?: string | null;
};

function normSpaces(s: string) {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

function stripAllSpaces(s: string) {
  return (s ?? '').replace(/\s+/g, '');
}

function formatDeSerie(serie: string): string {
  const s = normSpaces(serie).toLowerCase();
  if (!s) return '';

  // voyelles + variantes accentuées
  const startsWithVowel = /^[aeiouyàâäáæãåèêëéìîïíòôöóœùûüúÿh]/i.test(s);

  return startsWithVowel ? `d'${s}` : `de ${s}`;
}

function joinWithEt(items: string[]) {
  const clean = items.map(normSpaces).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} et ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')} et ${clean[clean.length - 1]}`;
}

function joinWithSlash(items: string[]) {
  const clean = items.map(normSpaces).filter(Boolean);
  return clean.join(' / ');
}

function romanToInt(romanRaw: string): number | null {
  const roman = romanRaw.trim().toUpperCase();
  if (!roman) return null;
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  let prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const v = map[roman[i]];
    if (!v) return null;
    if (v < prev) total -= v;
    else total += v;
    prev = v;
  }
  return total > 0 ? total : null;
}

/**
 * Convertit "an IV" -> année grégorienne approximative de début (an I = 1792).
 * On prend 1792 + (n-1). (Approximation suffisante pour le tri année min/max.)
 */
function frenchRepublicanYearToGregorianStart(yearN: number): number {
  return 1792 + (yearN - 1);
}

type CoverageParse = {
  raw: string;
  normalized: string;
  isValid: boolean;
  years: number[];
  minYear: number | null;
  maxYear: number | null;
  error?: string;
};

type CoverageExpandedRow = {
  year: number;
  covered: boolean;
  republicanLabel?: string; // ex "an VI (?)"
};

type CoverageExpanded = {
  coveredYears: number[]; // liste triée des années couvertes
  rows: CoverageExpandedRow[]; // affichage min..max avec trous
  minYear: number | null;
  maxYear: number | null;
};

function gregorianToApproxRepublicanLabel(year: number): string | null {
  // inverse approx de ton mapping: gregorian = 1792 + (n-1)
  // => n = (year - 1792) + 1
  const n = year - 1792 + 1;
  if (n < 1 || n > 30) return null; // borne “raisonnable” (à ajuster)
  // roman minimal (I..XXX) si tu veux ; sinon garde "an " + n
  return `an ${n} (?)`;
}

function partToYear(partRaw: string): number | null {
  const p = normSpaces(partRaw).replace(/[–—]/g, '-');

  if (/^\d{4}$/.test(p)) return Number(p);

  const mm = p.match(/^(\d{1,2})\/(\d{4})$/);
  if (mm) return Number(mm[2]);

  const rep = p.match(/^an\s+([ivxlcdm]+)$/i);
  if (rep) {
    const n = romanToInt(rep[1]);
    return n ? frenchRepublicanYearToGregorianStart(n) : null;
  }

  if (/^[\p{L}]+(?:\s+[\p{L}]+)*\s+\d{4}$/u.test(p)) {
    const y = p.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
    return y ? Number(y[1]) : null;
  }

  return null;
}

function expandCoverage(normalizedInput: string): CoverageExpanded | null {
  const input = normSpaces(normalizedInput).replace(/[–—]/g, '-');
  if (!input) return { coveredYears: [], rows: [], minYear: null, maxYear: null };

  const segments = input
    .split(/[;,]/)
    .map((s) => normSpaces(s))
    .filter(Boolean);

  const covered = new Set<number>();

  for (const seg of segments) {
    const dashParts = seg.split(/\s*-\s*/);
    if (dashParts.length > 2) return null;

    const a = partToYear(dashParts[0]);
    if (a == null) return null;

    if (dashParts.length === 1) {
      covered.add(a);
    } else {
      const b = partToYear(dashParts[1]);
      if (b == null) return null;

      const start = Math.min(a, b);
      const end = Math.max(a, b);
      for (let y = start; y <= end; y++) covered.add(y);
    }
  }

  const coveredYears = Array.from(covered).sort((x, y) => x - y);
  const minYear = coveredYears.length ? coveredYears[0] : null;
  const maxYear = coveredYears.length ? coveredYears[coveredYears.length - 1] : null;

  const rows: CoverageExpandedRow[] = [];
  if (minYear != null && maxYear != null) {
    for (let y = minYear; y <= maxYear; y++) {
      rows.push({
        year: y,
        covered: covered.has(y),
        republicanLabel: gregorianToApproxRepublicanLabel(y) ?? undefined,
      });
    }
  }

  return { coveredYears, rows, minYear, maxYear };
}

function parseCoverage(input: string): CoverageParse {
  const raw = input ?? '';

  // 1) Normalisations globales
  const normalized = normSpaces(raw).replace(/[–—]/g, '-'); // –/— -> '-'

  if (!normalized) {
    return { raw, normalized, isValid: true, years: [], minYear: null, maxYear: null };
  }

  // 2) Split INPUT en segments: ',' ou ';'
  //    (segments vides filtrés comme tu l'as décrit)
  const segments = normalized
    .split(/[;,]/)
    .map((s) => normSpaces(s))
    .filter(Boolean);

  if (segments.length === 0) {
    return { raw, normalized, isValid: true, years: [], minYear: null, maxYear: null };
  }

  // Patterns PART
  const isYear = (s: string) => /^\d{4}$/.test(s);
  const isMonthYear = (s: string) => /^\d{1,2}\/\d{4}$/.test(s); // 05/1830 et 5/1830
  const isRepublican = (s: string) => /^an\s+[ivxlcdm]+$/i.test(s);

  // "octobre 1821" (lettres + espaces + année), sans ponctuation
  // (utilise \p{L} pour les lettres Unicode, plus robuste que À-ÿ)
  const isWordsYear = (s: string) => /^[\p{L}]+(?:\s+[\p{L}]+)*\s+\d{4}$/u.test(s);

  const isPart = (s: string) => isYear(s) || isMonthYear(s) || isRepublican(s) || isWordsYear(s);

  const extractYearsFromPart = (partRaw: string): number[] => {
    const part = normSpaces(partRaw);

    // 1) AAAA
    if (isYear(part)) return [Number(part)];

    // 2) MM/AAAA
    const mm = part.match(/^(\d{1,2})\/(\d{4})$/);
    if (mm) return [Number(mm[2])];

    // 3) an IV -> année grégorienne approx (début)
    const rep = part.match(/^an\s+([ivxlcdm]+)$/i);
    if (rep) {
      const n = romanToInt(rep[1]);
      return n ? [frenchRepublicanYearToGregorianStart(n)] : [];
    }

    // 4) mots + année (on récupère l'année)
    const y = part.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
    if (y) return [Number(y[1])];

    return [];
  };

  const yearsAll: number[] = [];

  // 3) Pour chaque SEGMENT: PART ou PART-PART (max 1 tiret)
  for (const segRaw of segments) {
    const seg = normSpaces(segRaw);

    // On détecte le nombre de tirets "structurels" via split
    const dashParts = seg.split(/\s*-\s*/);

    // a) Plus d'un tiret => > 2 morceaux
    if (dashParts.length > 2) {
      return {
        raw,
        normalized,
        isValid: false,
        years: [],
        minYear: null,
        maxYear: null,
        error:
          "Format non reconnu : dans un même segment, utilise 0 ou 1 tiret (ex: '1780-1790'). Pour plusieurs intervalles, utilise une liste avec ',' ou ';'.",
      };
    }

    // b) Si un tiret est présent, on exige les 2 côtés non vides (sinon '1780-' passe “par accident”)
    if (dashParts.length === 2 && (!dashParts[0].trim() || !dashParts[1].trim())) {
      return {
        raw,
        normalized,
        isValid: false,
        years: [],
        minYear: null,
        maxYear: null,
        error:
          "Format non reconnu : un intervalle doit avoir un début et une fin (ex: '1780-1790').",
      };
    }

    // c) Validation stricte des PARTS
    for (const p of dashParts) {
      const part = normSpaces(p);
      if (!isPart(part)) {
        return {
          raw,
          normalized,
          isValid: false,
          years: [],
          minYear: null,
          maxYear: null,
          error:
            "Format non reconnu. Exemples : '1780', '1780-1790', 'an IV-1810', 'octobre 1821-05/1830', '1780, 1820', '1780-1790; an V; 05/1830'.",
        };
      }
      yearsAll.push(...extractYearsFromPart(part));
    }
  }

  const uniq = Array.from(new Set(yearsAll.filter((n) => Number.isFinite(n)))).sort(
    (a, b) => a - b,
  );

  return {
    raw,
    normalized,
    isValid: true,
    years: uniq,
    minYear: uniq.length ? uniq[0] : null,
    maxYear: uniq.length ? uniq[uniq.length - 1] : null,
  };
}

function uid() {
  return crypto.randomUUID();
}

function toIntOrNull(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function typeUniteToLabel(
  code: string | null | undefined,
  typeUnites: Array<{ code: string; label: string }>,
) {
  const c = (code ?? '').trim();
  if (!c) return '';
  return typeUnites.find((t) => t.code === c)?.label ?? c;
}

function createEmptyExemplaireDraft(): ExemplaireDraft {
  return {
    id: uid(),
    depot_id: '',
    nature_ref: null,
    support_ref: null,

    cote_locale: '',
    identifiant_interne: '',
    localisation_interne: '',
    conditionnement: '',

    pagination_type_ref: '',
    nb_pages: '',

    source_exemplaire_id: '',

    couverture_label: '',
    couverture_sort_start: '',
    couverture_sort_end: '',

    physical_condition_ref: '',

    description: '',
    note: '',

    acces: [],
  };
}

export function SourceDialog({ open, onClose, onCreated, sourceId, mode }: Props) {
  const [step, setStep] = useState(0);

  const effectiveMode: SourceDialogMode = mode ?? 'create';

  // -----------------------------
  // Lookups
  // -----------------------------
  const [series, setSeries] = useState<SerieOption[]>([]);
  const [depots, setDepots] = useState<DepotOption[]>([]);
  const [natures, setNatures] = useState<NatureOption[]>([]);
  const [plateformes, setPlateformes] = useState<PlateformeOption[]>([]);
  const [typesAcces, setTypesAcces] = useState<TypeAccesOption[]>([]);
  const [bureaux, setBureaux] = useState<BureauOption[]>([]);
  const [typesActes, setTypesActes] = useState<TypeActeOption[]>([]);
  const [typeUnites, setTypeUnites] = useState<Array<{ id: string; code: string; label: string }>>(
    [],
  );

  // -----------------------------
  // Step 1 — Unité documentaire
  // -----------------------------
  const [typeUnite, setTypeUnite] = useState<TypeUnite>('');
  const [titre, setTitre] = useState('');
  const [identifiantInterne, setIdentifiantInterne] = useState('');
  const [description, setDescription] = useState('');

  const [typeUniteRef, setTypeUniteRef] = useState<string>('');
  const [serieRef, setSerieRef] = useState<string>('');
  const [couvertureLabel, setCouvertureLabel] = useState('');
  const [couvertureStart, setCouvertureStart] = useState('');
  const [couvertureEnd, setCouvertureEnd] = useState('');

  // -----------------------------
  // Step 2 — Etat civil (conditional)
  // -----------------------------
  const [bureauIds, setBureauIds] = useState<string[]>([]);
  const [typeActeIds, setTypeActeIds] = useState<string[]>([]);

  // -----------------------------
  // Step 3 — Exemplaire
  // -----------------------------
  const [depotId, setDepotId] = useState<string>('');

  const [exemplaires, setExemplaires] = useState<ExemplaireDraft[]>(() => []);
  const [selectedExId, setSelectedExId] = useState<string | null>(null);
  const [natureRef, setNatureRef] = useState<string>('');
  const [supportRef, setSupportRef] = useState<string>('');
  const [paginationTypeRef, setPaginationTypeRef] = useState<string>('');
  const [physicalConditionRef, setPhysicalConditionRef] = useState<string>('');

  // -----------------------------
  // Step 4 — Accès numériques
  // -----------------------------

  const defaultTypeAccesId = useMemo(() => {
    const viewer = typesAcces.find((t) => t.code === 'VIEWER');
    return viewer?.id ?? typesAcces[0]?.id ?? null;
  }, [typesAcces]);

  // -----------------------------
  // Detect ETAT_CIVIL serie
  // -----------------------------
  const isEtatCivil = useMemo(() => {
    if (!serieRef) return false;
    const s = series.find((x) => x.id === serieRef);
    return (s?.code ?? '').toUpperCase() === 'ETAT_CIVIL';
  }, [serieRef, series]);

  const couvertureParsed = useMemo(() => parseCoverage(couvertureLabel), [couvertureLabel]);

  const couvertureExpanded = useMemo(() => {
    if (!couvertureParsed.isValid) return null;
    // on part du normalized issu du parseur (ou couvertureLabel)
    return expandCoverage(couvertureParsed.normalized);
  }, [couvertureParsed.isValid, couvertureParsed.normalized]);

  useEffect(() => {
    // Alimente automatiquement les champs de tri (en lecture seule)
    // Si pas d'année détectée, on vide.
    setCouvertureStart(couvertureParsed.minYear?.toString() ?? '');
    setCouvertureEnd(couvertureParsed.maxYear?.toString() ?? '');
  }, [couvertureParsed.minYear, couvertureParsed.maxYear]);

  const serieLabel = useMemo(() => {
    const s = series.find((x) => x.id === serieRef);
    return s?.label ?? '';
  }, [series, serieRef]);

  const selectedBureauxLabels = useMemo(() => {
    if (!bureauIds.length) return [];
    const map = new Map(bureaux.map((b) => [b.id, b.label]));
    return bureauIds.map((id) => map.get(id)).filter(Boolean) as string[];
  }, [bureauIds, bureaux]);

  const selectedTypeActeLabels = useMemo(() => {
    if (!typeActeIds.length) return [];

    const map = new Map(
      typesActes.map((t) => [
        t.id,
        { label: t.label, label_pluriel: t.label_pluriel, ordre: t.ordre ?? 9999 },
      ]),
    );

    return typeActeIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .sort((a, b) => {
        // tri principal: ordre
        if (a!.ordre !== b!.ordre) return a!.ordre - b!.ordre;
        // fallback: label (stable si ordre identique / null)
        return a!.label_pluriel.localeCompare(b!.label_pluriel, 'fr');
      })
      .map((x) => x!.label_pluriel);
  }, [typeActeIds, typesActes]);

  const stepSerieLabel = useMemo(() => {
    if (!serieRef) return '';
    return serieLabel || '';
  }, [serieRef, serieLabel]);

  const stepExemplairesLabel = 'Versions';
  const stepUnitesDocumentairesLabel = 'Collection';

  const steps = useMemo(() => {
    if (effectiveMode === 'edit-exemplaire') return [stepExemplairesLabel];
    if (effectiveMode === 'edit-unite') return [stepUnitesDocumentairesLabel, stepSerieLabel];
    return [stepUnitesDocumentairesLabel, stepSerieLabel, stepExemplairesLabel];
  }, [effectiveMode, stepSerieLabel]);

  useEffect(() => {
    setStep((s) => Math.min(s, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  type StepKind = 'unite' | 'etat_civil' | 'exemplaires';

  const stepKind: StepKind = useMemo(() => {
    if (effectiveMode === 'edit-exemplaire') return 'exemplaires';
    if (effectiveMode === 'edit-unite') return step === 0 ? 'unite' : 'etat_civil';
    // create
    return step === 0 ? 'unite' : step === 1 ? 'etat_civil' : 'exemplaires';
  }, [effectiveMode, step]);

  useEffect(() => {
    if (effectiveMode === 'edit-exemplaire') return;

    // Période sans espaces (on conserve les tirets longs –/—)
    const periodeNoSpaces = couvertureLabel?.trim()
      ? stripAllSpaces(normSpaces(couvertureLabel))
      : '';

    const typeLabel = typeUniteToLabel(typeUnite, typeUnites);
    const serie = normSpaces(serieLabel);

    const parts: string[] = [];

    // [TypeUnite label] + [de/d'] + [serieLabel]
    if (typeLabel && serie) {
      parts.push(`${typeLabel} ${formatDeSerie(serieLabel)}`);
    } else if (serie) {
      parts.push(serie);
    } else if (typeLabel) {
      parts.push(typeLabel);
    }

    // état civil : "incluant ..." + " – bureaux"
    if (isEtatCivil) {
      const actes = joinWithEt(selectedTypeActeLabels).toLowerCase(); // naissances...
      if (actes) parts[0] = `${parts[0]} des ${actes}`;

      const bureaux = joinWithSlash(selectedBureauxLabels);
      if (bureaux) parts.push(`– ${bureaux}`);
    }

    if (periodeNoSpaces) parts.push(`(${periodeNoSpaces})`);

    // Attention: on veut exactement un espace autour du tiret " – " (pas un em dash)
    // Ici on a mis "–" comme séparateur de bloc, donc on join sans " — "
    const titreFinal = parts
      .join(' ')
      .replace(/\s+–\s+/g, ' – ')
      .replace(/\s+/g, ' ')
      .trim();

    setTitre(titreFinal);
  }, [
    typeUnite,
    typeUnites,
    serieLabel,
    couvertureLabel,
    isEtatCivil,
    selectedTypeActeLabels,
    selectedBureauxLabels,
  ]);

  // -----------------------------
  // Load lookups when open
  // -----------------------------
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const [s1, s2, s3, s4, s5, s6, s7, s8] = await Promise.all([
        supabase.from('ref_series_documentaires').select('id, code, label').order('label'),
        supabase
          .from('ref_depots')
          .select('id, nom, institution:ref_institutions (nom, sigle)')
          .order('institution(nom)', { ascending: true })
          .order('nom', { ascending: true }),
        supabase.from('ref_natures').select('id, label').order('label'),
        supabase.from('ref_plateformes').select('id, label, code').order('label'),
        supabase.from('ref_type_acces').select('id, code, label').order('label'),
        supabase
          .from('etat_civil_bureaux')
          .select('id, nom, commune, departement, region')
          .order('nom'),
        supabase
          .from('ref_ec_type_acte')
          .select('id, label, label_pluriel, code, position')
          .order('label'),
        supabase.from('ref_type_unite').select('id, code, label').order('position').order('label'),
      ]);

      if (s1.error) toast.error(s1.error.message);
      if (s2.error) toast.error(s2.error.message);
      if (s3.error) toast.error(s3.error.message);
      if (s4.error) toast.error(s4.error.message);
      if (s5.error) toast.error(s5.error.message);
      if (s6.error) toast.error(s6.error.message);
      if (s7.error) toast.error(s7.error.message);
      if (s8.error) toast.error(s8.error.message);

      setSeries(
        (s1.data ?? []).map((x: any) => ({
          id: x.id,
          code: x.code ?? null,
          label: x.label ?? x.code ?? x.id,
        })),
      );

      setDepots(
        (s2.data ?? []).map((d: any) => ({
          id: d.id,
          labelCourt: d.institution?.sigle
            ? `${d.institution?.sigle} — ${d.nom}`
            : `${d.institution?.nom ?? 'Institution'} — ${d.nom}`,
          labelLong: d.institution?.sigle
            ? `${d.institution?.nom} (${d.institution.sigle}) — ${d.nom}`
            : `${d.institution?.nom ?? 'Institution'} — ${d.nom}`,
        })),
      );

      setNatures((s3.data ?? []).map((n: any) => ({ id: n.id, label: n.label })));

      setPlateformes(
        (s4.data ?? []).map((p: any) => ({
          id: p.id,
          label: p.code ? `${p.code} — ${p.label}` : p.label,
        })),
      );

      setTypesAcces(
        (s5.data ?? []).map((t: any) => ({
          id: t.id,
          code: String(t.code ?? ''),
          label: `${t.label} (${t.code})`,
        })),
      );

      setBureaux(
        (s6.data ?? []).map((b: any) => ({
          id: b.id,
          nom: b.nom ?? '—',
          commune: b.commune ?? null,
          departement: b.departement ?? null,
          region: b.region ?? null,
          label: b.commune ? `${b.nom} (${b.commune})` : b.nom,
        })),
      );

      setTypesActes(
        (s7.data ?? []).map((a: any) => ({
          id: a.id,
          label: a.label,
          label_pluriel: a.label_pluriel,
          ordre: a.position,
        })),
      );

      const typeUnitesFresh = (s8.data ?? []) as Array<{ id: string; code: string; label: string }>;
      setTypeUnites(typeUnitesFresh);

      if (!typeUnite && typeUnitesFresh[0]?.code) {
        setTypeUnite(typeUnitesFresh[0].code);
      }

      // defaults
      if (!depotId && (s2.data?.[0]?.id ?? null)) setDepotId(s2.data![0].id);

      // ---- EDIT: hydrate form from DB
      if (effectiveMode !== 'create') {
        if (!sourceId) {
          toast.error("sourceId manquant pour l'édition");
          return;
        }

        // 1) unité
        if (effectiveMode === 'edit-exemplaire') {
          const { data: uTitle, error: euTitle } = await supabase
            .from('ref_unites_documentaires')
            .select('id, titre') // ✅ seulement ce dont tu as besoin
            .eq('id', sourceId)
            .single();

          if (euTitle) {
            toast.error(euTitle.message);
            return;
          }

          setTitre(uTitle?.titre ?? '');
        } else {
          const { data: u, error: eu } = await supabase
            .from('ref_unites_documentaires')
            .select(
              'id, type_unite_ref, titre, identifiant_interne, description, serie_ref, couverture_label, couverture_sort_start, couverture_sort_end',
            )
            .eq('id', sourceId)
            .single();

          if (eu) {
            toast.error(eu.message);
            return;
          }

          const typeUnitesFresh = (s8.data ?? []) as Array<{
            id: string;
            code: string;
            label: string;
          }>;
          const code =
            typeUnitesFresh.find((t) => t.id === u.type_unite_ref)?.code ??
            typeUnitesFresh[0]?.code ??
            '';
          setTypeUnite(code);
          setTitre(u.titre ?? '');
          setIdentifiantInterne(u.identifiant_interne ?? '');
          setDescription(u.description ?? '');
          setTypeUniteRef(u.type_unite_ref ?? '');
          setSerieRef(u.serie_ref ?? '');
          setCouvertureLabel(u.couverture_label ?? '');
        }

        // 2) pivots EC (si edit-unite)
        if (effectiveMode === 'edit-unite') {
          const [pb, pa] = await Promise.all([
            supabase
              .from('ref_unites_documentaires_bureaux')
              .select('bureau_id')
              .eq('unite_id', sourceId),
            supabase
              .from('ref_unites_documentaires_types_actes')
              .select('type_acte_id')
              .eq('unite_id', sourceId),
          ]);

          if (pb.error) {
            toast.error(pb.error.message);
            return;
          }
          if (pa.error) {
            toast.error(pa.error.message);
            return;
          }

          setBureauIds((pb.data ?? []).map((x: any) => x.bureau_id));
          setTypeActeIds((pa.data ?? []).map((x: any) => x.type_acte_id));
        }

        // 3) exemplaires (si edit-exemplaire)
        if (effectiveMode === 'edit-exemplaire') {
          const { data: ex, error: eex } = await supabase
            .from('ref_exemplaires')
            .select(
              'id, depot_id, nature_ref, support_ref, cote_locale, identifiant_interne, localisation_interne, conditionnement, pagination_type_ref, nb_pages, source_exemplaire_id, couverture_label, couverture_sort_start, couverture_sort_end, physical_condition_ref, description, note',
            )
            .eq('unite_documentaire_id', sourceId)
            .order('created_at', { ascending: true });

          if (eex) {
            toast.error(eex.message);
            return;
          }

          const exIds = (ex ?? []).map((r: any) => r.id);

          const { data: accesRows, error: eAcc } = await supabase
            .from('ref_acces_numeriques')
            .select(
              'id, exemplaire_id, plateforme_id, type_acces_id, url_base, schema_deep_link, restrictions, note',
            )
            .in('exemplaire_id', exIds);

          if (eAcc) {
            toast.error(eAcc.message);
            return;
          }

          const accesByExId = new Map<string, any[]>();
          for (const r of accesRows ?? []) {
            const k = r.exemplaire_id as string;
            accesByExId.set(k, [...(accesByExId.get(k) ?? []), r]);
          }

          setExemplaires(
            (ex ?? []).map((row: any) => ({
              id: row.id,
              depot_id: row.depot_id ?? '',
              nature_ref: row.nature_ref ?? null,
              support_ref: row.support_ref ?? null,
              pagination_type_ref: row.pagination_type_ref ?? null,
              cote_locale: row.cote_locale ?? '',
              identifiant_interne: row.identifiant_interne ?? '',
              localisation_interne: row.localisation_interne ?? '',
              conditionnement: row.conditionnement ?? '',
              nb_pages: row.nb_pages?.toString?.() ?? '',
              source_exemplaire_id: row.source_exemplaire_id ?? '',
              couverture_label: row.couverture_label ?? '',
              couverture_sort_start: row.couverture_sort_start?.toString?.() ?? '',
              couverture_sort_end: row.couverture_sort_end?.toString?.() ?? '',
              physical_condition_ref: row.physical_condition_ref ?? null,
              description: row.description ?? '',
              note: row.note ?? '',
              acces: (accesByExId.get(row.id) ?? []).map((a: any) => ({
                id: a.id, // important : tu réutilises l'id DB ou un uuid, comme tu veux
                plateforme_id: a.plateforme_id ?? null,
                type_acces_id: a.type_acces_id ?? null,
                url_base: a.url_base ?? '',
                schema_deep_link: a.schema_deep_link ?? '',
                restrictions: a.restrictions ?? '',
                note: a.note ?? '',
              })),
            })),
          );

          setSelectedExId((ex?.[0]?.id ?? null) as string | null);
        }

        setStep(0);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, effectiveMode, sourceId]);

  // reset when close
  useEffect(() => {
    if (open) return;
    setStep(0);
    setTypeUnite('');
    setTitre('');
    setIdentifiantInterne('');
    setDescription('');
    setNatureRef('');
    setSupportRef('');
    setPaginationTypeRef('');
    setTypeUniteRef('');
    setSerieRef('');
    setCouvertureLabel('');
    setCouvertureStart('');
    setCouvertureEnd('');
    setBureauIds([]);
    setTypeActeIds([]);
    setDepotId('');
    setExemplaires([]);
    setSelectedExId(null);
  }, [open]);

  const canNext = useMemo(() => {
    // edit-exemplaire : une seule étape → bouton "Enregistrer", pas "Suivant"
    if (effectiveMode === 'edit-exemplaire') {
      // ex: au moins 1 exemplaire et chacun a un dépôt
      return exemplaires.length > 0 && exemplaires.every((e) => !!e.depot_id);
    }

    // edit-unite : 2 étapes
    if (effectiveMode === 'edit-unite') {
      if (step === 0) {
        const okBase = !!typeUniteRef && !!serieRef;
        const okCoverage = couvertureLabel.trim().length > 0 && couvertureParsed.isValid;
        return okBase && okCoverage;
      }
      if (step === 1) {
        if (isEtatCivil) return bureauIds.length > 0 && typeActeIds.length > 0;
        return true;
      }
      return true;
    }

    // create : ton comportement actuel
    if (step === 0) {
      const okBase = !!typeUniteRef && !!serieRef;
      const okCoverage = couvertureLabel.trim().length > 0 && couvertureParsed.isValid;
      return okBase && okCoverage;
    }
    if (step === 1) {
      if (isEtatCivil) return bureauIds.length > 0 && typeActeIds.length > 0;
      return true;
    }
    if (step === 2) return exemplaires.length > 0 && exemplaires.every((e) => !!e.depot_id);
    return true;
  }, [
    effectiveMode,
    step,
    typeUniteRef,
    typeUnite,
    typeUnites,
    serieRef,
    couvertureLabel,
    couvertureParsed.isValid,
    isEtatCivil,
    bureauIds.length,
    typeActeIds.length,
    exemplaires,
  ]);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  // petit composant checkbox "indeterminate"

  // -----------------------------------
  // Final submit (create everything)
  // -----------------------------------
  const [submitting, setSubmitting] = useState(false);

  const submitAll = async () => {
    setSubmitting(true);

    let uniteId: string | null = null;
    const exemplaireIdsCreated: string[] = [];

    try {
      // 1) Unite documentaire
      const { data: unite, error: eUnite } = await supabase
        .from('ref_unites_documentaires')
        .insert({
          type_unite_ref: typeUniteRef,
          titre: titre.trim(),
          identifiant_interne: identifiantInterne.trim() || null,
          description: description.trim() || null,
          serie_ref: serieRef,
          couverture_label: couvertureLabel.trim() || null,
          couverture_sort_start: toIntOrNull(couvertureStart),
          couverture_sort_end: toIntOrNull(couvertureEnd),
        })
        .select('id')
        .single();

      if (eUnite) throw eUnite;
      uniteId = unite.id;

      // 2) tables pivot (etat civil)
      if (isEtatCivil && uniteId) {
        if (bureauIds.length) {
          const { error } = await supabase
            .from('ref_unites_documentaires_bureaux')
            .insert(bureauIds.map((bid) => ({ unite_id: uniteId!, bureau_id: bid })));
          if (error) throw error;
        }

        if (typeActeIds.length) {
          const { error } = await supabase
            .from('ref_unites_documentaires_types_actes')
            .insert(typeActeIds.map((tid) => ({ unite_id: uniteId!, type_acte_id: tid })));
          if (error) throw error;
        }
      }

      // 3) Exemplaires (N)
      for (const exDraft of exemplaires) {
        const { data: ex, error: eEx } = await supabase
          .from('ref_exemplaires')
          .insert({
            unite_documentaire_id: uniteId,

            depot_id: exDraft.depot_id,
            nature_ref: exDraft.nature_ref || null,
            support_ref: exDraft.support_ref || null,

            cote_locale: exDraft.cote_locale.trim() || null,
            identifiant_interne: exDraft.identifiant_interne.trim() || null,
            localisation_interne: exDraft.localisation_interne.trim() || null,
            conditionnement: exDraft.conditionnement.trim() || null,
            description: exDraft.description.trim() || null,
            note: exDraft.note.trim() || null,

            pagination_type_ref: exDraft.pagination_type_ref || null,
            nb_pages: toIntOrNull(exDraft.nb_pages),

            source_exemplaire_id: exDraft.source_exemplaire_id.trim() || null,

            couverture_label: exDraft.couverture_label.trim() || null,
            couverture_sort_start: toIntOrNull(exDraft.couverture_sort_start),
            couverture_sort_end: toIntOrNull(exDraft.couverture_sort_end),

            physical_condition_ref: exDraft.physical_condition_ref || null,
          })
          .select('id')
          .single();

        if (eEx) throw eEx;
        exemplaireIdsCreated.push(ex.id);

        // 4) Accès pour cet exemplaire
        const accesToInsert = (exDraft.acces ?? [])
          .filter((a) => a.url_base.trim())
          .map((a) => ({
            exemplaire_id: ex.id,
            plateforme_id: a.plateforme_id || null,
            type_acces_id: a.type_acces_id || defaultTypeAccesId,
            url_base: a.url_base.trim(),
            schema_deep_link: a.schema_deep_link.trim() || null,
            restrictions: a.restrictions.trim() || null,
            note: a.note.trim() || null,
            last_checked_at: new Date().toISOString(),
          }));

        if (accesToInsert.length) {
          const { error: eAcc } = await supabase.from('ref_acces_numeriques').insert(accesToInsert);
          if (eAcc) throw eAcc;
        }
      }

      toast.success('Dépôt ajouté');
      await onCreated();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Erreur création');

      // rollback best-effort : delete unité (cascade sur exemplaires/acces si FK bien posées)
      try {
        if (uniteId) {
          await supabase.from('ref_unites_documentaires').delete().eq('id', uniteId);
        }
      } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  const submitUpdateUnite = async () => {
    if (!sourceId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('ref_unites_documentaires')
        .update({
          type_unite_ref: typeUniteRef,
          titre: titre.trim(),
          identifiant_interne: identifiantInterne.trim() || null,
          description: description.trim() || null,
          serie_ref: serieRef,
          couverture_label: couvertureLabel.trim() || null,
          couverture_sort_start: toIntOrNull(couvertureStart),
          couverture_sort_end: toIntOrNull(couvertureEnd),
        })
        .eq('id', sourceId);

      if (error) throw error;

      // pivots EC: stratégie simple = delete + insert
      if (isEtatCivil) {
        const [d1, d2] = await Promise.all([
          supabase.from('ref_unites_documentaires_bureaux').delete().eq('unite_id', sourceId),
          supabase.from('ref_unites_documentaires_types_actes').delete().eq('unite_id', sourceId),
        ]);
        if (d1.error) throw d1.error;
        if (d2.error) throw d2.error;

        if (bureauIds.length) {
          const { error: e1 } = await supabase
            .from('ref_unites_documentaires_bureaux')
            .insert(bureauIds.map((bid) => ({ unite_id: sourceId, bureau_id: bid })));
          if (e1) throw e1;
        }
        if (typeActeIds.length) {
          const { error: e2 } = await supabase
            .from('ref_unites_documentaires_types_actes')
            .insert(typeActeIds.map((tid) => ({ unite_id: sourceId, type_acte_id: tid })));
          if (e2) throw e2;
        }
      }

      toast.success('Collection mise à jour');
      await onCreated();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Erreur mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  const submitUpdateExemplaires = async () => {
    if (!sourceId) return;
    setSubmitting(true);

    try {
      for (const exDraft of exemplaires) {
        // 1) Upsert exemplaire
        const payload = {
          id: exDraft.id, // existant => update, sinon insert
          unite_documentaire_id: sourceId,

          depot_id: exDraft.depot_id,
          nature_ref: exDraft.nature_ref || null,
          support_ref: exDraft.support_ref || null,

          cote_locale: exDraft.cote_locale.trim() || null,
          identifiant_interne: exDraft.identifiant_interne.trim() || null,
          localisation_interne: exDraft.localisation_interne.trim() || null,
          conditionnement: exDraft.conditionnement.trim() || null,

          description: exDraft.description.trim() || null,
          note: exDraft.note.trim() || null,

          pagination_type_ref: exDraft.pagination_type_ref || null,
          nb_pages: toIntOrNull(exDraft.nb_pages),

          source_exemplaire_id: exDraft.source_exemplaire_id.trim() || null,

          couverture_label: exDraft.couverture_label.trim() || null,
          couverture_sort_start: toIntOrNull(exDraft.couverture_sort_start),
          couverture_sort_end: toIntOrNull(exDraft.couverture_sort_end),

          physical_condition_ref: exDraft.physical_condition_ref || null,
        };

        const { error: eUpsert } = await supabase
          .from('ref_exemplaires')
          .upsert(payload, { onConflict: 'id' });

        if (eUpsert) throw eUpsert;

        // 2) Accès numériques : stratégie simple = delete + insert
        const { error: eDel } = await supabase
          .from('ref_acces_numeriques')
          .delete()
          .eq('exemplaire_id', exDraft.id);

        if (eDel) throw eDel;

        const accesToInsert = (exDraft.acces ?? [])
          .filter((a) => (a.url_base ?? '').trim())
          .map((a) => ({
            exemplaire_id: exDraft.id,
            plateforme_id: a.plateforme_id || null,
            type_acces_id: a.type_acces_id || defaultTypeAccesId,
            url_base: (a.url_base ?? '').trim(),
            schema_deep_link: (a.schema_deep_link ?? '').trim() || null,
            restrictions: (a.restrictions ?? '').trim() || null,
            note: (a.note ?? '').trim() || null,
            last_checked_at: new Date().toISOString(),
          }))
          // sécurité : évite de casser l'index unique (exemplaire, plateforme, type)
          .filter((row) => !!row.type_acces_id);

        if (accesToInsert.length) {
          const { error: eIns } = await supabase.from('ref_acces_numeriques').insert(accesToInsert);
          if (eIns) throw eIns;
        }
      }

      toast.success('Versions mises à jour');
      await onCreated();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Erreur mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------
  // UI blocks per step
  // -----------------------------------
  const StepHeader = (
    <div className='flex items-center justify-between gap-3'>
      <div className='flex items-center gap-2 text-sm'>
        {steps.map((label, i) => (
          <div key={label} className='flex items-center gap-2'>
            <div
              className={[
                'h-6 w-6 rounded-full flex items-center justify-center text-xs border',
                i === step ? 'bg-foreground text-background' : 'bg-background',
              ].join(' ')}
            >
              {i + 1}
            </div>
            <div
              className={
                i === step ? 'font-semibold min-w-[90px]' : 'text-muted-foreground min-w-[90px]'
              }
            >
              {label || ''}
            </div>

            {i < steps.length - 1 ? <div className='w-6 h-px bg-border' /> : null}
          </div>
        ))}
      </div>
    </div>
  );

  const dialogTitle = useMemo(() => {
    if (effectiveMode === 'edit-unite') return 'Modifier la collection';
    if (effectiveMode === 'edit-exemplaire') return 'Modifier les versions';
    return 'Ajouter un dépôt';
  }, [effectiveMode]);

  const isSingleStep = effectiveMode === 'edit-exemplaire';
  const isLastStep = step >= steps.length - 1;

  const onSubmit = async () => {
    if (effectiveMode === 'create') return submitAll();
    if (effectiveMode === 'edit-unite') return submitUpdateUnite();
    if (effectiveMode === 'edit-exemplaire') return submitUpdateExemplaires();
    return;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent
        className='flex flex-col overflow-hidden p-0'
        style={{ width: '80vw', height: '80vh', maxWidth: 'none', maxHeight: 'none' }}
      >
        {/* Header */}
        <div className='shrink-0 border-b px-6 py-4'>
          <DialogHeader className='p-0'>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
        </div>

        <div className='flex-1 min-h-0 px-6 py-4 flex flex-col gap-4'>
          {/* Partie haute fixe */}
          <div className='shrink-0 space-y-4'>
            {StepHeader}

            <div className='space-y-1'>
              <div className='text-xs font-medium'>
                {effectiveMode === 'edit-exemplaire'
                  ? 'Titre (unité documentaire)'
                  : 'Titre (généré automatiquement)'}
              </div>

              <Input value={titre} readOnly className='bg-muted' />
            </div>
          </div>

          {/* Panel qui prend TOUT le reste */}
          <div
            className={[
              'rounded-md border p-4 flex-1 min-h-0',
              stepKind === 'exemplaires' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto',
            ].join(' ')}
          >
            {stepKind === 'unite' ? (
              <UniteDocumentaireStep
                typeUniteRef={typeUniteRef}
                setTypeUniteRef={setTypeUniteRef}
                serieRef={serieRef}
                setSerieRef={setSerieRef}
                couvertureLabel={couvertureLabel}
                setCouvertureLabel={setCouvertureLabel}
                couvertureParsed={couvertureParsed}
                couvertureExpanded={couvertureExpanded}
                description={description}
                setDescription={setDescription}
                identifiantInterne={identifiantInterne}
                setIdentifiantInterne={setIdentifiantInterne}
              />
            ) : null}

            {stepKind === 'etat_civil' ? (
              <EtatCivilStep
                isEtatCivil={isEtatCivil}
                serieLabel={serieLabel}
                bureaux={bureaux}
                bureauIds={bureauIds}
                setBureauIds={setBureauIds}
                typeActeIds={typeActeIds}
                setTypeActeIds={setTypeActeIds}
              />
            ) : null}

            {stepKind === 'exemplaires' ? (
              <ExemplairesStep
                depots={depots}
                natures={natures}
                plateformes={plateformes}
                defaultTypeAccesId={defaultTypeAccesId}
                uniteCouvertureLabel={couvertureLabel}
                exemplaires={exemplaires}
                setExemplaires={setExemplaires}
                selectedExId={selectedExId}
                setSelectedExId={(id) => setSelectedExId(id)}
                onAdd={() => {
                  const ex = createEmptyExemplaireDraft();
                  setExemplaires((prev) => [...prev, ex]);
                  setSelectedExId(ex.id);
                }}
              />
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className='shrink-0 border-t px-6 py-4'>
          <DialogFooter className='flex items-center justify-between'>
            <div className='text-xs text-muted-foreground'>
              Étape {step + 1} / {steps.length}
            </div>

            <div className='flex gap-2'>
              <Button variant='outline' onClick={onClose} disabled={submitting}>
                Annuler
              </Button>

              {!isSingleStep ? (
                <Button variant='secondary' onClick={prev} disabled={submitting || step === 0}>
                  Retour
                </Button>
              ) : null}

              {!isLastStep ? (
                <Button onClick={next} disabled={!canNext || submitting}>
                  Suivant
                </Button>
              ) : (
                <Button onClick={onSubmit} disabled={!canNext || submitting}>
                  {effectiveMode === 'create' ? 'Créer' : 'Enregistrer'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
