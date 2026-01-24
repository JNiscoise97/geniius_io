// CreateSourceDialog.tsx
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

import { type TypeUnite } from './source.constants';
import { ExemplairesStep } from './ExemplairesStep';
import { UniteDocumentaireStep } from './UniteDocumentaireStep';
import { EtatCivilStep } from './EtatCivilStep';
import type { ExemplaireDraft } from './source.types';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  sourceId?: string | null;
};

function normSpaces(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

function stripAllSpaces(s: string) {
  return (s ?? '').replace(/\s+/g, '');
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
  //    (segments vides filtrés comme tu l’as décrit)
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

    // 4) mots + année (on récupère l’année)
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

    // a) Plus d’un tiret => > 2 morceaux
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

type SerieOption = { id: string; code?: string | null; label: string };
type EcritureOption = { id: string; code?: string | null; label: string };
type LangueOption = { id: string; code?: string | null; label: string };
type DepotOption = { id: string; label: string };
type NatureOption = { id: string; label: string };
type SupportOption = { id: string; label: string; code?: string | null };
type PlateformeOption = { id: string; label: string };
type TypeAccesOption = { id: string; code: string; label: string };
type BureauOption = {
  id: string;
  nom: string;
  commune: string | null;
  departement: string | null;
  region: string | null;
  label: string; // affichage
};

type TypeActeOption = { id: string; label: string };

function uid() {
  return crypto.randomUUID();
}

function toIntOrNull(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

const PAGINATION_OPTIONS = [
  { value: '', label: '—' },
  { value: 'vues', label: 'Vues' },
  { value: 'pages', label: 'Pages' },
  { value: 'folios', label: 'Folios' },
  { value: 'images', label: 'Images' },
] as const;

function compactList(items: string[], max = 3) {
  const clean = items.map((s) => normSpaces(s)).filter(Boolean);
  if (clean.length <= max) return clean.join(', ');
  return `${clean.slice(0, max).join(', ')} +${clean.length - max}`;
}

function createEmptyExemplaireDraft(): ExemplaireDraft {
  return {
    id: uid(),
    depot_id: '',
    nature_id: null,
    support_id: null,

    cote_locale: '',
    identifiant_interne: '',
    localisation_interne: '',
    conditionnement: '',

    qualite: '',
    etat_conservation: '',

    pagination_type: '',
    nb_pages: '',

    source_exemplaire_id: '',

    couverture_label: '',
    couverture_sort_start: '',
    couverture_sort_end: '',

    description: '',
    note: '',

    acces: [],
  };
}

export function CreateSourceDialog({ open, onClose, onCreated, sourceId }: Props) {
  const isEdit = !!sourceId;
  const [step, setStep] = useState(0);

  // -----------------------------
  // Lookups
  // -----------------------------
  const [series, setSeries] = useState<SerieOption[]>([]);
  const [ecritures, setEcritures] = useState<EcritureOption[]>([]);
  const [langues, setLangues] = useState<LangueOption[]>([]);
  const [depots, setDepots] = useState<DepotOption[]>([]);
  const [natures, setNatures] = useState<NatureOption[]>([]);
  const [supports, setSupports] = useState<SupportOption[]>([]);
  const [plateformes, setPlateformes] = useState<PlateformeOption[]>([]);
  const [typesAcces, setTypesAcces] = useState<TypeAccesOption[]>([]);
  const [bureaux, setBureaux] = useState<BureauOption[]>([]);
  const [typesActes, setTypesActes] = useState<TypeActeOption[]>([]);

  // -----------------------------
  // Step 1 — Unité documentaire
  // -----------------------------
  const [typeUnite, setTypeUnite] = useState<TypeUnite>('registre');
  const [titre, setTitre] = useState('');
  const [identifiantInterne, setIdentifiantInterne] = useState('');
  const [description, setDescription] = useState('');

  const [serieRef, setSerieRef] = useState<string>('');
  const [ecritureRef, setEcritureRef] = useState<string>('');
  const [langueRef, setLangueRef] = useState<string>('');
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
    // Si pas d’année détectée, on vide.
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
    const map = new Map(typesActes.map((t) => [t.id, t.label]));
    return typeActeIds.map((id) => map.get(id)).filter(Boolean) as string[];
  }, [typeActeIds, typesActes]);

  const stepSerieLabel = useMemo(() => {
    // Tant que la série n'est pas choisie : pas de titre
    if (!serieRef) return '';
    // Sinon : on affiche le label de la série (Etat-civil ou autre)
    return serieLabel || '';
  }, [serieRef, serieLabel]);

  const steps = useMemo(() => {
    return ['Unité documentaire', stepSerieLabel, 'Exemplaires'];
  }, [stepSerieLabel]);

  useEffect(() => {
    // Période sans espaces
    const periodeNoSpaces = couvertureLabel?.trim()
      ? stripAllSpaces(normSpaces(couvertureLabel).replace(/[–—]/g, '-'))
      : null;

    const parts: string[] = [serieLabel || 'Série'].filter(Boolean) as string[];

    // ✅ si état civil, ajoute bureaux + types d’acte
    if (isEtatCivil) {
      const b = compactList(selectedBureauxLabels, 3);
      const t = compactList(selectedTypeActeLabels, 3);

      if (b) parts.push(`Bureaux: ${b}`);
      if (t) parts.push(`Actes: ${t}`);
    }
    if (periodeNoSpaces) parts.push('(' + periodeNoSpaces + ')');
    setTitre(parts.join(' — '));
  }, [serieLabel, couvertureLabel, isEtatCivil, selectedBureauxLabels, selectedTypeActeLabels]);

  // -----------------------------
  // Load lookups when open
  // -----------------------------
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10] = await Promise.all([
        supabase.from('ref_series_documentaires').select('id, code, label').order('label'),
        supabase
          .from('ref_depots')
          .select('id, nom, institution:ref_institutions (nom, sigle)')
          .order('nom'),
        supabase.from('ref_natures').select('id, libelle').order('libelle'),
        supabase.from('ref_supports').select('id, libelle, code').order('libelle'),
        supabase.from('ref_plateformes').select('id, libelle, code').order('libelle'),
        supabase.from('ref_type_acces').select('id, code, label').order('label'),
        supabase
          .from('etat_civil_bureaux')
          .select('id, nom, commune, departement, region')
          .order('nom'),
        supabase.from('ref_ec_type_acte').select('id, label, code').order('label'),
        supabase.from('ref_ecritures').select('id, libelle').order('libelle'),
        supabase.from('ref_langues').select('id, libelle').order('libelle'),
      ]);

      if (s1.error) toast.error(s1.error.message);
      if (s2.error) toast.error(s2.error.message);
      if (s3.error) toast.error(s3.error.message);
      if (s4.error) toast.error(s4.error.message);
      if (s5.error) toast.error(s5.error.message);
      if (s6.error) toast.error(s6.error.message);
      if (s7.error) toast.error(s7.error.message);
      if (s8.error) toast.error(s8.error.message);
      if (s9.error) toast.error(s9.error.message);
      if (s10.error) toast.error(s10.error.message);

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
          label: d.institution?.sigle
            ? `${d.institution?.nom} (${d.institution.sigle}) — ${d.nom}`
            : `${d.institution?.nom ?? 'Institution'} — ${d.nom}`,
        })),
      );

      setNatures((s3.data ?? []).map((n: any) => ({ id: n.id, label: n.libelle })));

      setSupports(
        (s4.data ?? []).map((x: any) => ({
          id: x.id,
          code: x.code ?? null,
          label: x.libelle,
        })),
      );

      setPlateformes(
        (s5.data ?? []).map((p: any) => ({
          id: p.id,
          label: p.code ? `${p.code} — ${p.libelle}` : p.libelle,
        })),
      );

      setTypesAcces(
        (s6.data ?? []).map((t: any) => ({
          id: t.id,
          code: String(t.code ?? ''),
          label: `${t.label} (${t.code})`,
        })),
      );

      setBureaux(
        (s7.data ?? []).map((b: any) => ({
          id: b.id,
          nom: b.nom ?? '—',
          commune: b.commune ?? null,
          departement: b.departement ?? null,
          region: b.region ?? null,
          label: b.commune ? `${b.nom} (${b.commune})` : b.nom,
        })),
      );

      setTypesActes(
        (s8.data ?? []).map((a: any) => ({
          id: a.id,
          label: a.label,
        })),
      );

      setEcritures((s9.data ?? []).map((n: any) => ({ id: n.id, label: n.libelle })));

      setLangues((s10.data ?? []).map((n: any) => ({ id: n.id, label: n.libelle })));

      // defaults
      if (!depotId && (s2.data?.[0]?.id ?? null)) setDepotId(s2.data![0].id);
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // reset when close
  useEffect(() => {
    if (open) return;
    setStep(0);
    setTypeUnite('registre');
    setTitre('');
    setIdentifiantInterne('');
    setDescription('');
    setLangueRef('');
    setEcritureRef('');
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
    if (step === 0) {
      const okBase = !!typeUnite && !!serieRef;
      const okCoverage = couvertureLabel.trim().length > 0 && couvertureParsed.isValid;
      return okBase && okCoverage;
    }

    if (step === 1) {
      // ✅ si ETAT_CIVIL : au moins 1 bureau + 1 type d’acte
      if (isEtatCivil) return bureauIds.length > 0 && typeActeIds.length > 0;
      return true;
    }

    if (step === 2) return exemplaires.length > 0 && exemplaires.every((e) => !!e.depot_id);

    return true;
  }, [
    step,
    typeUnite,
    serieRef,
    depotId,
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
          type_unite: typeUnite,
          titre: titre.trim(),
          identifiant_interne: identifiantInterne.trim() || null,
          description: description.trim() || null,
          langue_id: langueRef || null,
          ecriture_id: ecritureRef || null,
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
            nature_id: exDraft.nature_id || null,
            support_id: exDraft.support_id || null,

            cote_locale: exDraft.cote_locale.trim() || null,
            identifiant_interne: exDraft.identifiant_interne.trim() || null,
            localisation_interne: exDraft.localisation_interne.trim() || null,
            conditionnement: exDraft.conditionnement.trim() || null,
            description: exDraft.description.trim() || null,
            note: exDraft.note.trim() || null,

            qualite: exDraft.qualite.trim() || null,
            etat_conservation: exDraft.etat_conservation.trim() || null,

            pagination_type: exDraft.pagination_type || null,
            nb_pages: toIntOrNull(exDraft.nb_pages),

            source_exemplaire_id: exDraft.source_exemplaire_id.trim() || null,

            couverture_label: exDraft.couverture_label.trim() || null,
            couverture_sort_start: toIntOrNull(exDraft.couverture_sort_start),
            couverture_sort_end: toIntOrNull(exDraft.couverture_sort_end),
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

      toast.success('Source créée');
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

  const Step2 = (
    <ExemplairesStep
      depots={depots}
      natures={natures}
      supports={supports}
      paginationOptions={PAGINATION_OPTIONS as any}
      plateformes={plateformes}
      typesAcces={typesAcces}
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
  );

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent
        className='flex flex-col overflow-hidden p-0'
        style={{ width: '80vw', height: '80vh', maxWidth: 'none', maxHeight: 'none' }}
      >
        {/* Header */}
        <div className='shrink-0 border-b px-6 py-4'>
          <DialogHeader className='p-0'>
            <DialogTitle>Créer une source</DialogTitle>
          </DialogHeader>
        </div>

        {/* Body (scroll) */}
        {/* Body */}
        <div className='flex-1 min-h-0 px-6 py-4 flex flex-col gap-4'>
          {/* Partie haute fixe */}
          <div className='shrink-0 space-y-4'>
            {StepHeader}

            <div className='space-y-1'>
              <div className='text-xs font-medium'>Titre (généré automatiquement)</div>
              <Input value={titre} readOnly className='bg-muted' />
            </div>
          </div>

          {/* Panel qui prend TOUT le reste */}
          <div
            className={[
              'rounded-md border p-4 flex-1 min-h-0',
              step === 2 ? 'overflow-hidden flex flex-col' : 'overflow-y-auto',
            ].join(' ')}
          >
            {step === 0 ? (
              <UniteDocumentaireStep
                series={series}
                langues={langues}
                ecritures={ecritures}
                typeUnite={typeUnite}
                setTypeUnite={setTypeUnite}
                serieRef={serieRef}
                setSerieRef={setSerieRef}
                couvertureLabel={couvertureLabel}
                setCouvertureLabel={setCouvertureLabel}
                couvertureParsed={couvertureParsed}
                couvertureExpanded={couvertureExpanded}
                langueRef={langueRef}
                setLangueRef={setLangueRef}
                ecritureRef={ecritureRef}
                setEcritureRef={setEcritureRef}
                description={description}
                setDescription={setDescription}
                identifiantInterne={identifiantInterne}
                setIdentifiantInterne={setIdentifiantInterne}
              />
            ) : null}

            {step === 1 ? (
              <EtatCivilStep
                isEtatCivil={isEtatCivil}
                serieLabel={serieLabel}
                bureaux={bureaux}
                bureauIds={bureauIds}
                setBureauIds={setBureauIds}
                typesActes={typesActes}
                typeActeIds={typeActeIds}
                setTypeActeIds={setTypeActeIds}
              />
            ) : null}

            {step === 2 ? Step2 : null}
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

              <Button variant='secondary' onClick={prev} disabled={submitting || step === 0}>
                Retour
              </Button>

              {step < steps.length - 1 ? (
                <Button onClick={next} disabled={!canNext || submitting}>
                  Suivant
                </Button>
              ) : (
                <Button onClick={submitAll} disabled={!canNext || submitting}>
                  {sourceId ? 'Enregistrer' : 'Créer'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
