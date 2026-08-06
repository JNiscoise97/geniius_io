// transcriptionTab.service.ts

import { supabase } from '@/lib/supabase';
import { getMarkersForActeType, type MarkerDef } from './transcriptionMarkers.registry';

// -------------------- Supabase helpers --------------------

export type SBResult<T> = { data: T | null; error: any };

export function assertNoSbError<T>(
  res: SBResult<T>,
  context: string,
): asserts res is { data: T; error: null } {
  if (res.error) {
    console.error(context, res.error);
    const msg = typeof res.error?.message === 'string' ? res.error.message : context;
    throw new Error(msg);
  }
}

function toMsg(e: any, fallback: string) {
  return typeof e?.message === 'string' ? e.message : fallback;
}

// -------------------- Table names (adjust here if needed) --------------------

const T = {
  actes: 'etat_civil_actes',

  transcriptions: 'ec_transcriptions',
  versions: 'ec_transcription_versions',
  events: 'ec_transcription_version_events',

  annotations: 'ec_transcription_annotations',
  notes: 'ec_transcription_notes',
  tags: 'ec_transcription_tags',

  acteurs: 'etat_civil_actes_acteurs',
} as const;

// -------------------- Types --------------------

export const REF_TRANSCRIPTION_STATUS_KEYS = [
  'TO_TRANSCRIBE',
  'DRAFT',
  'IN_PROGRESS',
  'TRANSCRIBED',
  'IN_REVIEW',
  'VALIDATED',
] as const;

export type TranscriptionStatus = (typeof REF_TRANSCRIPTION_STATUS_KEYS)[number];

export type AnchorStatus = 'ok' | 'needs_review' | 'orphaned';

export type TranscriptionKind = 'diplomatique' | 'semi_normalisee' | 'travail';

export const REF_TRANSCRIPTION_PARTS = [
  'main_body',
  'marginal_mentions',
  'signatures',
  'marginal_crossouts',
] as const;

export type TranscriptionPart = (typeof REF_TRANSCRIPTION_PARTS)[number];

export type SourceLectureKind =
  | 'image_originale'
  | 'microfilm'
  | 'transcription_secondaire'
  | 'autre';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type EcActeRow = {
  id: string;
  date: string | null;
  numero_acte: string | null;
  registre_id: string | null;
  bureau_id: string | null;
  type_acte: string | null;
  type_acte_ref: string | null;
  auteur_institutionnel_ref: string | null;
  label: string | null;
};

export type TranscriptionVersionRow = {
  id: string;
  transcription_id: string;
  version: number;
  status: TranscriptionStatus;
  content: string;

  transcription_kind: TranscriptionKind | null;
  confidence: ConfidenceLevel | null;

  change_summary: string | null;

  created_at: string;
  created_by: string | null;

  updated_at?: string;
  updated_by?: string | null;

  contested_at: string | null;
  contested_by: string | null;
  contested_reason: string | null;
};

export type TranscriptionVersionSourceRow = {
  id: string;
  transcription_version_id: string;
  acte_source_id: string;
};

export type AnnotationRow = {
  id: string;
  transcription_version_id: string;
  type: 'doubt' | 'rature' | 'lacune' | 'mention' | 'other';
  start_offset: number;
  end_offset: number;
  quote: string;
  prefix: string;
  suffix: string;
  status: AnchorStatus;
  comment: string | null;
  created_at: string;
};

export type NoteRow = {
  id: string;
  transcription_version_id: string;
  start_offset: number | null;
  end_offset: number | null;
  quote: string | null;
  prefix: string | null;
  suffix: string | null;
  content: string;
  created_at: string;
};

export type ActeurLightRow = {
  id: string;
  role: string | null;
  prenom: string | null;
  nom: string | null;
};

export type TranscriptionTagRow = {
  id: string;
  transcription_version_id: string;
  kind: 'date' | 'acteur' | 'lieu';
  label: string;
  start_offset: number;
  end_offset: number;
  quote: string;
  prefix: string;
  suffix: string;
  linked_acteur_id: string | null;
  created_at: string;
};

export type ActeCitationRow = {
  id: string;
  target_id: string;
  exemplaire_id: string | null;
  is_missing: boolean | null;
  note: string | null;
  sort_order: number | null;
  locating: Record<string, any> | null;
  marginalia: Record<string, any> | null;
};

export type ExemplairePick = {
  exemplaire_id: string;
  nature_id: string | null;
  nature_code: string | null;
  nature_label: string | null;
  support_id: string | null;
  support_code: string | null;
  support_label: string | null;
  physical_condition_ref: string | null;
  physical_condition_code: string | null;
  physical_condition_label: string | null;
  unite_id: string | null;
  unite_titre: string | null;
  cote_locale: string | null;
  pagination_type_ref: string | null;
  pagination_type_code: string | null;
  pagination_type_label: string | null;
  nb_pages: number | null;
  depot_nom: string | null;
  depot_is_physical: boolean | null;
  depot_is_online: boolean | null;
  institution_nom: string | null;
  institution_sigle: string | null;
  identifiant_interne: string | null;
  localisation_interne: string | null;
  etat_conservation: string | null;
  qualite: string | null;
  url_base: string | null;
  plateforme_code: string | null;
  source_exemplaire_id: string | null;
};

export type CitationDraft = {
  id: string;
  acte_id: string;
  unite_id?: string;
  exemplaire_id: string | null;

  // pagination / vues/pages
  loc_start: number | null;
  loc_end: number | null;
  loc_raw: string | null;

  is_missing: boolean | null;
  note: string | null;
  sort_order: number | null;

  marginal_mentions_present: boolean | null;
  marginal_mentions_count: number | null;

  signatures_present: boolean | null;
  signatures_count: number | null;

  marginal_crossouts_present: boolean | null;
  marginal_crossouts_count: number | null;

  // enrich
  exemplaire?: ExemplairePick | null;
};

export type EcSignatureRow = {
  id: string;
  acte_id: string;
  acte_source_id: string | null;
  transcription_id: string | null;
  transcription_version_id: string;

  label: string;
  signature_kind: string | null;
  confidence: string | null;
  legibility: string | null;

  signature_kind_ref?: string | null;
  signature_kind_label?: string | null;

  confidence_ref?: string | null;
  confidence_label?: string | null;

  handwriting_legibility_ref?: string | null;
  handwriting_legibility_label?: string | null;

  pattern: string | null;
  note: string | null;

  created_at: string;
  updated_at: string;
};

export type EcMarginalMentionRow = {
  id: string;
  acte_id: string;
  acte_source_id: string | null;
  transcription_id: string | null;
  transcription_version_id: string;

  type_acte_ref: string | null;
  type_acte_label?: string | null;
  type_acte_color?: string | null;
  confidence_ref?: string | null;
  confidence_label?: string | null;

  legibility_ref?: string | null;
  legibility_label?: string | null;

  handwriting_style_ref?: string | null;
  handwriting_style_label?: string | null;

  handwriting_legibility_ref?: string | null;
  handwriting_legibility_label?: string | null;

  mention_date_raw: string | null;
  mention_date: string | null; // date ISO string côté JS, Supabase gère en date
  mention_content: string;
  note: string | null;

  created_at: string;
  updated_at: string;
};

export type EcMarginalCrossoutRow = {
  id: string;
  acte_id: string;
  acte_source_id: string | null;
  transcription_id: string | null;
  transcription_version_id: string;

  crossout_type: string | null;
  target: string | null;
  struck_text: string | null;
  replacement_text: string | null;
  note: string | null;

  created_at: string;
  updated_at: string;
};

export type TranscriptionRow = {
  id: string;
  acte_id: string;

  // lien à la citation/source (ta logique “1 transcription par source”)
  acte_source_id: string | null;

  transcription_part: TranscriptionPart;

  status: TranscriptionStatus;

  is_reference: boolean;
  preference_reason: string | null;

  // champs transcription-level (d’après ton SQL ec_transcriptions)
  source_lecture_kind: SourceLectureKind;
  langue_vue: string | null;
  language_confidence: ConfidenceLevel | null;

  handwriting_style: string | null; // (enum côté DB, on garde string côté TS)
  handwriting_legibility: string | null; // (enum côté DB, on garde string côté TS)

  completeness: 'complete' | 'partial' | 'fragment' | null;
  incompleteness_reason: string | null;
  reserve_level: 'none' | 'minor' | 'major' | null;
  reserve_reason: string | null;

  // --- "Qualité de la transcription" (_ref) ---
  source_lecture_kind_ref?: string | null;
  langue_ref?: string | null;
  language_confidence_ref?: string | null;
  handwriting_style_ref?: string | null;
  handwriting_legibility_ref?: string | null;
  completeness_ref?: string | null;
  reserve_level_ref?: string | null;

  conventions_override_text: string | null;
  gabarit_id: string | null;

  created_at: string;
  created_by: string | null;
  updated_at?: string;
  updated_by?: string | null;
};

export const PAGE_BREAK_TOKEN = '[SAUT_DE_PAGE]';
// -------------------- Inline formatting (read mode) --------------------
// Conventions:
// - *texte* => bold
// - ~texte~ => strikethrough
// - [ILLISIBLE_CARACTERE{x}_MOT{y}_LIGNE{z}] => illisible badge

export const ILLISIBLE_TOKEN_RE = /\[ILLISIBLE_CARACTERE(\d+)_MOT(\d+)_LIGNE(\d+)\]/g;

// "suspect" = commence comme un token illisible mais pas forcément valide (token cassé)
export const ILLISIBLE_SUSPECT_RE = /\[ILLISIBLE[^\]\n]*\]?/g;

export type InlineToken =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'strike'; text: string }
  | { kind: 'illisible'; raw: string; x: number; y: number; z: number };

const INLINE_RE = /\[ILLISIBLE_CARACTERE(\d+)_MOT(\d+)_LIGNE(\d+)\]|\*([^*\n]+)\*|~([^~\n]+)~/g;

/**
 * Tokenize a string into InlineToken[]
 * - non-greedy, line-safe (*...* and ~...~ do not cross newlines)
 * - illisible token is strict (must match exact format)
 */
export function tokenizeInline(raw: string): InlineToken[] {
  const s = raw ?? '';
  const out: InlineToken[] = [];

  let last = 0;
  for (const m of s.matchAll(INLINE_RE)) {
    const idx = m.index ?? 0;

    if (idx > last) out.push({ kind: 'text', text: s.slice(last, idx) });

    // 1) illisible
    if (m[1] != null && m[2] != null && m[3] != null) {
      const x = Number(m[1]);
      const y = Number(m[2]);
      const z = Number(m[3]);
      out.push({ kind: 'illisible', raw: m[0], x, y, z });
      last = idx + m[0].length;
      continue;
    }

    // 2) bold
    if (m[4] != null) {
      out.push({ kind: 'bold', text: m[4] });
      last = idx + m[0].length;
      continue;
    }

    // 3) strike
    if (m[5] != null) {
      out.push({ kind: 'strike', text: m[5] });
      last = idx + m[0].length;
      continue;
    }

    // fallback
    out.push({ kind: 'text', text: m[0] });
    last = idx + m[0].length;
  }

  if (last < s.length) out.push({ kind: 'text', text: s.slice(last) });
  return out;
}

export type TextRange = { start: number; end: number; text: string };

export function findIllisibleValidRanges(raw: string): TextRange[] {
  const s = raw ?? '';
  const ranges: TextRange[] = [];
  for (const m of s.matchAll(ILLISIBLE_TOKEN_RE)) {
    const idx = m.index ?? 0;
    ranges.push({ start: idx, end: idx + m[0].length, text: m[0] });
  }
  return ranges;
}

export function findIllisibleSuspectRanges(raw: string): TextRange[] {
  const s = raw ?? '';
  const ranges: TextRange[] = [];
  for (const m of s.matchAll(ILLISIBLE_SUSPECT_RE)) {
    const idx = m.index ?? 0;
    ranges.push({ start: idx, end: idx + m[0].length, text: m[0] });
  }
  return ranges;
}

export function rangesOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
) {
  return a.start < b.end && b.start < a.end;
}

export function isInsideAnyRange(sel: { start: number; end: number }, ranges: TextRange[]) {
  return ranges.some((r) => rangesOverlap(sel, r));
}

export function buildIllisibleToken(x: number, y: number, z: number) {
  const nx = Math.max(0, Math.floor(Number.isFinite(x) ? x : 0));
  const ny = Math.max(0, Math.floor(Number.isFinite(y) ? y : 0));
  const nz = Math.max(0, Math.floor(Number.isFinite(z) ? z : 0));
  return `[ILLISIBLE_CARACTERE${nx}_MOT${ny}_LIGNE${nz}]`;
}

export function computeVersionStatusFromContent(args: {
  content: string;
  currentStatus?: TranscriptionStatus | null;
}): TranscriptionStatus {
  const trimmed = (args.content ?? '').trim();

  // Si déjà marqué TRANSCRIBED / IN_REVIEW / VALIDATED, on ne rétrograde pas automatiquement
  const sticky = args.currentStatus;
  if (sticky === 'TRANSCRIBED' || sticky === 'IN_REVIEW' || sticky === 'VALIDATED') return sticky;

  // Règles demandées
  if (!trimmed) return 'DRAFT';
  return 'IN_PROGRESS';
}

/**
 * ec_transcriptions.status doit refléter le status de la DERNIÈRE version.
 * Si pas de version (cas rare si transcription existe mais aucune version), on met TO_TRANSCRIBE.
 */
export async function syncTranscriptionStatusFromLatestVersion(args: {
  transcriptionId: string;
  latestVersion: Pick<TranscriptionVersionRow, 'status' | 'content'> | null;
}) {
  const nextStatus: TranscriptionStatus = args.latestVersion
    ? (args.latestVersion.status ??
      computeVersionStatusFromContent({
        content: args.latestVersion.content ?? '',
      }))
    : 'TO_TRANSCRIBE';

  await updateTranscription(args.transcriptionId, { status: nextStatus } as any);
  return nextStatus;
}

// -------------------- Anchors / helpers --------------------

export function computeAnchor(content: string, start: number, end: number) {
  const quote = content.slice(start, end);
  const prefixStart = Math.max(0, start - 40);
  const suffixEnd = Math.min(content.length, end + 40);
  const prefix = content.slice(prefixStart, start);
  const suffix = content.slice(end, suffixEnd);
  return { quote, prefix, suffix };
}

export function buildLineDiff(left: string, right: string) {
  const L = left.split(/\r?\n/);
  const R = right.split(/\r?\n/);
  const n = Math.max(L.length, R.length);
  const rows: Array<{ i: number; left: string; right: string; same: boolean }> = [];
  for (let i = 0; i < n; i++) {
    const a = L[i] ?? '';
    const b = R[i] ?? '';
    rows.push({ i, left: a, right: b, same: a === b });
  }
  return rows;
}

export function insertAtSelection(text: string, start: number, end: number, insert: string) {
  return text.slice(0, start) + insert + text.slice(end);
}

export function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

// -------------------- Read mode rendering --------------------

export type RenderBlock =
  | { kind: 'section'; label: string; text: string }
  | { kind: 'page_break' }
  | { kind: 'paragraph'; label: string; text: string };

function pushParagraphs(blocks: RenderBlock[], text: string, label = 'Texte') {
  const paras = (text ?? '')
    .split(/\n{2,}/)
    .map((x) => x.trim())
    .filter(Boolean);

  for (const p of paras) blocks.push({ kind: 'paragraph', label, text: p });
}

function renumberRepeatedSectionLabels(blocks: RenderBlock[]) {
  // Compte occurrences des sections par label
  const counts = new Map<string, number>();
  for (const b of blocks) {
    if (b.kind === 'section') {
      counts.set(b.label, (counts.get(b.label) ?? 0) + 1);
    }
  }

  // Pour chaque label qui apparaît >1 fois, renomme en "Label i/n"
  const seen = new Map<string, number>();
  return blocks.map((b) => {
    if (b.kind !== 'section') return b;

    const total = counts.get(b.label) ?? 1;
    if (total <= 1) return b;

    const cur = (seen.get(b.label) ?? 0) + 1;
    seen.set(b.label, cur);

    return { ...b, label: `${b.label} ${cur}/${total}` };
  });
}

function mergeTinySections(blocks: RenderBlock[], minChars = 80): RenderBlock[] {
  const out: RenderBlock[] = [];

  for (const b of blocks) {
    if (b.kind === 'page_break') {
      out.push(b);
      continue;
    }
    if (b.kind !== 'section') {
      out.push(b);
      continue;
    }

    const text = (b.text ?? '').trim();
    if (!text) continue;

    const prev = out[out.length - 1];

    // ✅ si micro-bloc => on le colle au bloc précédent (section), sinon on garde
    if (text.length < minChars && prev && prev.kind === 'section') {
      prev.text = normalizeSpaces(`${prev.text} ${text}`);
      continue;
    }

    out.push({ ...b, text });
  }

  return out;
}

/**
 * Empêche certains labels de se répéter (cause principale de “Époux 2/2”, “Célébration 3/3”…)
 * Règle : si un label réapparaît, on fusionne son texte dans la section précédente.
 */
function squashRepeatForbiddenLabels(
  blocks: RenderBlock[],
  forbiddenRepeatLabels: Set<string>,
): RenderBlock[] {
  const out: RenderBlock[] = [];
  const seen = new Set<string>();

  for (const b of blocks) {
    if (b.kind !== 'section') {
      out.push(b);
      continue;
    }

    const label = b.label;
    const text = (b.text ?? '').trim();
    if (!text) continue;

    if (forbiddenRepeatLabels.has(label) && seen.has(label)) {
      const prev = out[out.length - 1];
      if (prev && prev.kind === 'section') {
        prev.text = normalizeSpaces(`${prev.text} ${text}`);
        continue;
      }
    }

    out.push({ ...b, text });
    if (forbiddenRepeatLabels.has(label)) seen.add(label);
  }

  return out;
}

type NormalizedWithMap = { norm: string; map: number[] };

/**
 * Normalisation "loose" :
 * - lower
 * - supprime diacritiques
 * - remplace ponctuation/symboles par espace
 * - collapse espaces
 *
 * Et on construit map[normIndex] = rawIndex (index dans texte brut).
 */
function normalizeWithMap(raw: string): NormalizedWithMap {
  const s = raw ?? '';
  const normChars: string[] = [];
  const map: number[] = [];

  let lastWasSpace = true;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    // 1) normalize unicode + remove diacritics
    const decomposed = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let c = decomposed.toLowerCase();

    // 2) lettres/chiffres => keep ; sinon => space
    if (!/[a-z0-9]/.test(c)) c = ' ';

    // 3) collapse spaces
    if (c === ' ') {
      if (!lastWasSpace) {
        normChars.push(' ');
        map.push(i);
        lastWasSpace = true;
      }
      continue;
    }

    normChars.push(c);
    map.push(i);
    lastWasSpace = false;
  }

  // trim end space
  while (normChars.length && normChars[normChars.length - 1] === ' ') {
    normChars.pop();
    map.pop();
  }

  // trim start space
  while (normChars.length && normChars[0] === ' ') {
    normChars.shift();
    map.shift();
  }

  return { norm: normChars.join(''), map };
}

function normalizeLoose(s: string) {
  return normalizeWithMap(s).norm;
}

function computeAllHits(raw: string, markers: MarkerDef[]) {
  // ✅ 1 seul hit par label : on garde le + tôt (rawIdx minimal).
  const { norm, map } = normalizeWithMap(raw);

  const bestByLabel = new Map<string, { idx: number; priority: number }>();

  for (const m of markers) {
    const pri = m.priority ?? 100;
    let bestIdx: number | null = null;

    // phrases
    if (m.phrases?.length) {
      for (const phrase of m.phrases) {
        const p = normalizeLoose(phrase);
        if (!p) continue;

        const nIdx = norm.indexOf(p);
        if (nIdx >= 0) {
          const rawIdx = map[nIdx] ?? 0;
          if (bestIdx == null || rawIdx < bestIdx) bestIdx = rawIdx;
        }
      }
    }

    // regexRaw (si aucun hit phrases)
    if (bestIdx == null && m.regexRaw) {
      try {
        const re = new RegExp(m.regexRaw, 'iu');
        const match = re.exec(raw);
        if (match && match.index != null) bestIdx = match.index;
      } catch {
        // ignore
      }
    }

    if (bestIdx == null) continue;

    const prev = bestByLabel.get(m.label);
    if (!prev || bestIdx < prev.idx || (bestIdx === prev.idx && pri < prev.priority)) {
      bestByLabel.set(m.label, { idx: bestIdx, priority: pri });
    }
  }

  const hits = Array.from(bestByLabel.entries()).map(([label, v]) => ({
    idx: v.idx,
    label,
    priority: v.priority,
  }));

  // Tri : index puis priority
  hits.sort((a, b) => a.idx - b.idx || a.priority - b.priority);

  // ⚠️ on garde plusieurs labels même si même idx : on dédupe au post-traitement
  return hits.map((h) => ({ idx: h.idx, label: h.label }));
}

export function splitIntoReadableBlocks(
  raw: string,
  opts?: { typeActe?: string | null },
): RenderBlock[] {
  const parts = (raw ?? '').split(PAGE_BREAK_TOKEN);
  const blocks: RenderBlock[] = [];

  // Labels que l’on autorise à “continuer” après un saut de page
  // (tu peux élargir ensuite si besoin)
  const CONTINUABLE = new Set(
    getMarkersForActeType(opts?.typeActe ?? null)
      .markers.filter((m) => m.continuable)
      .map((m) => m.label),
  );

  // Si une page se termine par une section continuable,
  // on garde son label pour rattacher le début de la page suivante.
  let carryLabel: string | null = null;

  parts.forEach((part, idx) => {
    const t = part ?? '';

    const profile = getMarkersForActeType(opts?.typeActe ?? null);
    const markers = profile.markers;

    // hits = 1er match par marker (phrase loose / regexRaw)
    const hits = computeAllHits(t, markers);

    if (hits.length === 0) {
      const whole = t.trim();
      if (whole) {
        if (carryLabel) {
          // ✅ page entière rattachée à la section précédente (ex: Comparants continue)
          blocks.push({ kind: 'section', label: carryLabel, text: whole });
        } else {
          // sinon paragraphes “Texte”
          pushParagraphs(blocks, whole, 'Texte');
        }
      }
      // carryLabel reste inchangé si page vide, sinon on l’annule (car pas de nouveau repère fiable)
      carryLabel = null;
    } else {
      // ✅ contenu AVANT le premier marqueur
      const pre = t.slice(0, hits[0].idx).trim();
      if (pre) {
        if (carryLabel) {
          // ✅ on considère que c’est la suite de la section précédente
          blocks.push({ kind: 'section', label: carryLabel, text: pre });
        } else {
          blocks.push({ kind: 'section', label: 'Texte', text: pre });
        }
      }

      // sections à partir des marqueurs
      for (let i = 0; i < hits.length; i++) {
        const start = hits[i].idx;
        const end = i + 1 < hits.length ? hits[i + 1].idx : t.length;
        const chunk = t.slice(start, end).trim();
        if (chunk) blocks.push({ kind: 'section', label: hits[i].label, text: chunk });
      }

      // déterminer le prochain carryLabel (dernier bloc section continuable dans cette page)
      let lastSectionLabel: string | null = null;
      for (let j = blocks.length - 1; j >= 0; j--) {
        const b = blocks[j];
        if (b.kind === 'section') {
          lastSectionLabel = b.label;
          break;
        }
        if (b.kind === 'page_break') break; // sécurité : ne remonte pas avant la page précédente
      }
      carryLabel = lastSectionLabel && CONTINUABLE.has(lastSectionLabel) ? lastSectionLabel : null;
    }

    if (idx < parts.length - 1) blocks.push({ kind: 'page_break' });
  });

  // ✅ Post-traitement :
  // 1) empêche les micro-blocs
  let out = mergeTinySections(blocks, 90);

  // 2) empêche la répétition de certains labels (sinon tu te retrouves avec 1/2, 2/2, etc.)
  out = squashRepeatForbiddenLabels(
    out,
    new Set(['Époux', 'Épouse', 'Formalités préalables', 'Célébration du mariage']),
  );

  // 3) renumérote uniquement ce qui reste réellement répété (souvent “Témoins” si multi)
  return renumberRepeatedSectionLabels(out);
}

// -------------------- Repérages --------------------

export type Hit = { label: string; start: number; end: number };

function findAll(re: RegExp, text: string): Hit[] {
  const hits: Hit[] = [];
  let m: RegExpExecArray | null;
  const rr = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = rr.exec(text))) {
    if (m.index == null) continue;
    hits.push({ label: m[0], start: m.index, end: m.index + m[0].length });
  }
  return hits;
}

export function detectActeReperages(text: string) {
  const hits: { dates: Hit[]; ages: Hit[]; numeros: Hit[]; majuscules: Hit[] } = {
    dates: [],
    ages: [],
    numeros: [],
    majuscules: [],
  };

  hits.dates.push(...findAll(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g, text));
  hits.dates.push(...findAll(/\b(1[6-9]\d{2}|20\d{2})\b/g, text));
  hits.ages.push(...findAll(/\b(âgé|agé)\s+de\s+[^,\n]{0,30}?\bans\b/gi, text));
  hits.numeros.push(...findAll(/\b(N°|n°|No)\s*\d+\b/g, text));
  hits.majuscules.push(...findAll(/\b[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]{3,}\b/g, text));

  const uniq = (arr: Hit[]) => {
    const key = (h: Hit) => `${h.start}:${h.end}:${h.label}`;
    const set = new Set<string>();
    return arr.filter((h) => {
      const k = key(h);
      if (set.has(k)) return false;
      set.add(k);
      return true;
    });
  };

  hits.dates = uniq(hits.dates).slice(0, 40);
  hits.ages = uniq(hits.ages).slice(0, 40);
  hits.numeros = uniq(hits.numeros).slice(0, 40);
  hits.majuscules = uniq(hits.majuscules).slice(0, 40);

  return hits;
}

export type VersionEventRow = {
  id: string;
  transcription_version_id: string;
  event_type: RefTranscriptionEventType; // enum côté TS
  event_at: string; // timestamptz
  event_by: string | null;
  payload: any; // jsonb
};

// -------------------- Events (audit) --------------------
export const REF_TRANSCRIPTION_EVENT_TYPES = [
  'create',
  'edit',
  'submit_review',
  'validate',
  'contest',
  'archive',
  'restore',
  'note',
  'annotation',
  'tag',
  'metadata',
  'status_change',
] as const;

export type RefTranscriptionEventType = (typeof REF_TRANSCRIPTION_EVENT_TYPES)[number];

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function logVersionEvent(args: {
  transcription_version_id: string;
  event_type: RefTranscriptionEventType;
  payload?: Record<string, any>;
  event_by?: string | null;
}) {
  const event_by = args.event_by ?? (await getCurrentUserId());

  const res = await supabase.from(T.events).insert({
    transcription_version_id: args.transcription_version_id,
    event_type: args.event_type as any, // enum côté DB
    event_by,
    payload: args.payload ?? {},
  } as any);

  // ⚠️ On ne casse pas le flux si l’audit échoue : log console uniquement
  if (res.error) {
    console.error('logVersionEvent error:', res.error.message, {
      versionId: args.transcription_version_id,
      type: args.event_type,
    });
  }
}

export async function loadVersionEvents(versionId: string): Promise<VersionEventRow[]> {
  const res = await supabase
    .from(T.events)
    .select('id, transcription_version_id, event_type, event_at, event_by, payload')
    .eq('transcription_version_id', versionId)
    .order('event_at', { ascending: false });

  assertNoSbError(res as any, 'load version events');
  return (res.data ?? []) as any as VersionEventRow[];
}

export async function setTranscriptionReference(args: {
  transcriptionId: string;
  preferenceReason: string;
}) {
  const { transcriptionId, preferenceReason } = args;

  const res = await supabase.rpc('set_transcription_reference', {
    p_transcription_id: transcriptionId,
    p_preference_reason: preferenceReason,
  });

  if (res.error) {
    console.error('set_transcription_reference error:', res.error);
    throw new Error(res.error.message || 'Impossible de définir la transcription de référence');
  }
}

export async function clearTranscriptionReference(args: { transcriptionId: string }) {
  const { transcriptionId } = args;

  const res = await supabase
    .from(T.transcriptions)
    .update({
      is_reference: false,
      preference_reason: null,
    })
    .eq('id', transcriptionId);

  if (res.error) {
    console.error('clearTranscriptionReference error:', res.error);
    throw new Error(res.error.message || 'Impossible de retirer la source de référence');
  }
}

// -------------------- Anchor revalidation --------------------

export function revalidateAnchor(
  content: string,
  a: Pick<AnnotationRow, 'quote' | 'start_offset' | 'end_offset'>,
): AnchorStatus {
  const quote = a.quote || '';
  if (!quote.trim()) return 'orphaned';

  const expected = content.slice(a.start_offset, a.end_offset);
  if (expected === quote) return 'ok';

  const winStart = Math.max(0, a.start_offset - 120);
  const winEnd = Math.min(content.length, a.end_offset + 120);
  const windowText = content.slice(winStart, winEnd);
  if (windowText.includes(quote)) return 'needs_review';

  if (content.includes(quote)) return 'needs_review';
  return 'orphaned';
}

// Try to relocate by quote (best effort)
function relocateByQuote(newContent: string, quote: string, hintStart: number | null) {
  const q = quote?.trim() ?? '';
  if (!q) return null;

  // First: search near the hint
  if (hintStart != null) {
    const winStart = Math.max(0, hintStart - 800);
    const winEnd = Math.min(newContent.length, hintStart + 800);
    const w = newContent.slice(winStart, winEnd);
    const idx = w.indexOf(q);
    if (idx >= 0) {
      const abs = winStart + idx;
      return { start: abs, end: abs + q.length, confidence: 'near' as const };
    }
  }

  // Global fallback
  const idx2 = newContent.indexOf(q);
  if (idx2 >= 0) return { start: idx2, end: idx2 + q.length, confidence: 'global' as const };
  return null;
}

// -------------------- “Angles morts” encoding --------------------

export function transcriptionKey(acteSourceId: string, part: TranscriptionPart) {
  return `${acteSourceId}::${part}`;
}

// -------------------- Supabase access (bundle + CRUD) --------------------

type ActeBundle = {
  acte: EcActeRow;
  transcriptions: TranscriptionRow[];
  versions: TranscriptionVersionRow[];
  // maps pratiques
  transcriptionByKey: Record<string, TranscriptionRow>; // key = `${sourceId}::${part}`
  latestVersionIdByKey: Record<string, string>; // key -> latest version id
  acteurs: ActeurLightRow[];
};

export async function loadActeBundle(acteId: string): Promise<ActeBundle> {
  try {
    const [acteRes, transRes, acteursRes] = await Promise.all([
      supabase.from(T.actes).select('*').eq('id', acteId).single(),
      supabase
        .from(T.transcriptions)
        .select('*')
        .eq('acte_id', acteId)
        .order('created_at', { ascending: true }),
      supabase
        .from(T.acteurs)
        .select('id, role, prenom, nom')
        .eq('acte_id', acteId)
        .order('created_at', { ascending: true }),
    ]);

    assertNoSbError(acteRes as any, 'load acte');
    assertNoSbError(transRes as any, 'load transcriptions');

    const acte = acteRes.data as any as EcActeRow;
    const transcriptions = (transRes.data ?? []) as any as TranscriptionRow[];

    const acteurs: ActeurLightRow[] = acteursRes.error ? [] : ((acteursRes.data as any) ?? []);

    // charger les versions pour toutes les transcriptions de l’acte
    const transcriptionIds = transcriptions.map((t) => t.id);
    let versions: TranscriptionVersionRow[] = [];

    if (transcriptionIds.length) {
      const vRes = await supabase
        .from(T.versions)
        .select('*')
        .in('transcription_id', transcriptionIds)
        .order('version', { ascending: false });

      assertNoSbError(vRes as any, 'load versions');
      versions = (vRes.data ?? []) as any as TranscriptionVersionRow[];
    }

    const transcriptionByKey: Record<string, TranscriptionRow> = {};
    for (const t of transcriptions) {
      if (t.acte_source_id) {
        const k = transcriptionKey(t.acte_source_id, t.transcription_part ?? 'main_body');
        transcriptionByKey[k] = t;
      }
    }

    const latestVersionIdByKey: Record<string, string> = {};
    for (const t of transcriptions) {
      const v = versions
        .filter((vv) => vv.transcription_id === t.id)
        .sort((a, b) => {
          const av = Number(a.version ?? 0);
          const bv = Number(b.version ?? 0);
          if (bv !== av) return bv - av;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })[0];

      if (v && t.acte_source_id) {
        const k = transcriptionKey(t.acte_source_id, t.transcription_part ?? 'main_body');
        latestVersionIdByKey[k] = v.id;
      }
    }

    return {
      acte,
      transcriptions,
      versions,
      transcriptionByKey,
      latestVersionIdByKey,
      acteurs,
    };
  } catch (e) {
    console.error(e);
    throw new Error(toMsg(e, 'Erreur lors du chargement des données (bundle)'));
  }
}

export async function refreshTranscriptionsAndVersions(acteId: string): Promise<{
  transcriptions: TranscriptionRow[];
  versions: TranscriptionVersionRow[];
  transcriptionByKey: Record<string, TranscriptionRow>; // key = `${sourceId}::${part}`
  latestVersionIdByKey: Record<string, string>; // key -> latest version id
}> {
  const transRes = await supabase
    .from(T.transcriptions)
    .select('*')
    .eq('acte_id', acteId)
    .order('created_at', { ascending: true });

  assertNoSbError(transRes as any, 'refresh transcriptions');
  const transcriptions = (transRes.data ?? []) as any as TranscriptionRow[];

  // map: sourceId::part -> transcription
  const transcriptionByKey: Record<string, TranscriptionRow> = {};
  for (const t of transcriptions) {
    if (!t.acte_source_id) continue;
    const part = (t.transcription_part ?? 'main_body') as TranscriptionPart;
    const k = transcriptionKey(t.acte_source_id, part);
    transcriptionByKey[k] = t;
  }

  // load versions for all transcriptions
  const transcriptionIds = transcriptions.map((t) => t.id);
  let versions: TranscriptionVersionRow[] = [];

  if (transcriptionIds.length) {
    const vRes = await supabase
      .from(T.versions)
      .select('*')
      .in('transcription_id', transcriptionIds)
      .order('version', { ascending: false });

    assertNoSbError(vRes as any, 'refresh versions');
    versions = (vRes.data ?? []) as any as TranscriptionVersionRow[];
  }

  // map: sourceId::part -> latest version id
  const latestVersionIdByKey: Record<string, string> = {};

  // petit index rapide versions par transcription_id (évite filter/sort à répétition)
  const versionsByTranscriptionId: Record<string, TranscriptionVersionRow[]> = {};
  for (const v of versions) {
    (versionsByTranscriptionId[v.transcription_id] ||= []).push(v);
  }

  for (const t of transcriptions) {
    if (!t.acte_source_id) continue;

    const part = (t.transcription_part ?? 'main_body') as TranscriptionPart;
    const k = transcriptionKey(t.acte_source_id, part);

    const list = versionsByTranscriptionId[t.id] ?? [];
    if (!list.length) continue;

    // list est déjà globalement triée par version desc via la query,
    // mais on sécurise en prenant la “meilleure”:
    const best = list.slice().sort((a, b) => {
      const av = Number(a.version ?? 0);
      const bv = Number(b.version ?? 0);
      if (bv !== av) return bv - av;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0];

    if (best) latestVersionIdByKey[k] = best.id;
  }

  return { transcriptions, versions, transcriptionByKey, latestVersionIdByKey };
}

export async function ensureTranscription(
  acteId: string,
  acteSourceId: string,
  part: TranscriptionPart = 'main_body',
): Promise<TranscriptionRow> {
  const getRes = await supabase
    .from(T.transcriptions)
    .select('*')
    .eq('acte_id', acteId)
    .eq('acte_source_id', acteSourceId)
    .eq('transcription_part', part)
    .maybeSingle();

  if (getRes.error) throw new Error(toMsg(getRes.error, 'Impossible de charger la transcription'));
  if (getRes.data) return getRes.data as any as TranscriptionRow;

  const insRes = await supabase
    .from(T.transcriptions)
    .insert({
      acte_id: acteId,
      acte_source_id: acteSourceId,
      transcription_part: part,
    } as any)
    .select('*')
    .single();

  assertNoSbError(insRes as any, 'create transcription');
  return insRes.data as any as TranscriptionRow;
}

export async function loadVersionChildren(
  versionId: string,
): Promise<{ annotations: AnnotationRow[]; notes: NoteRow[] }> {
  const [annRes, noteRes] = await Promise.all([
    supabase
      .from(T.annotations)
      .select('*')
      .eq('transcription_version_id', versionId)
      .order('created_at', { ascending: true }),
    supabase
      .from(T.notes)
      .select('*')
      .eq('transcription_version_id', versionId)
      .order('created_at', { ascending: true }),
  ]);
  assertNoSbError(annRes as any, 'load annotations');
  assertNoSbError(noteRes as any, 'load notes');
  return { annotations: (annRes.data ?? []) as any, notes: (noteRes.data ?? []) as any };
}

export async function loadVersionTags(versionId: string): Promise<TranscriptionTagRow[]> {
  const res = await supabase
    .from(T.tags)
    .select('*')
    .eq('transcription_version_id', versionId)
    .order('created_at', { ascending: true });
  assertNoSbError(res as any, 'load tags');
  return (res.data ?? []) as any;
}

export async function createVersion(
  transcriptionId: string,
  payload: {
    version: number;
    status: TranscriptionStatus;
    content: string;

    transcription_kind?: TranscriptionKind | null;
    confidence?: ConfidenceLevel | null;

    change_summary?: string | null;
  },
): Promise<TranscriptionVersionRow> {
  const insertPayload: any = {
    transcription_id: transcriptionId,
    version: payload.version,
    status: payload.status,
    content: payload.content ?? '',

    transcription_kind: payload.transcription_kind ?? null,
    confidence: payload.confidence ?? null,
    change_summary: payload.change_summary ?? null,
  };

  const res = await supabase.from(T.versions).insert(insertPayload).select('*').single();
  assertNoSbError(res as any, 'create version');
  return res.data as any as TranscriptionVersionRow;
}

export async function setVersionStatus(versionId: string, patch: Partial<TranscriptionVersionRow>) {
  const res = await supabase
    .from(T.versions)
    .update(patch as any)
    .eq('id', versionId)
    .select('*')
    .single();
  assertNoSbError(res as any, 'update version');
  return res.data as any as TranscriptionVersionRow;
}

export async function setVersionStatusWithEvent(
  versionId: string,
  patch: Partial<TranscriptionVersionRow>,
  event: { type: RefTranscriptionEventType; payload?: Record<string, any> },
) {
  const updated = await setVersionStatus(versionId, patch);

  await logVersionEvent({
    transcription_version_id: versionId,
    event_type: event.type,
    payload: {
      patch,
      ...event.payload,
    },
  });

  // ✅ sync transcription.status avec le nouveau status de la dernière version (ici: updated)
  await syncTranscriptionStatusFromLatestVersion({
    transcriptionId: updated.transcription_id,
    latestVersion: { status: updated.status, content: updated.content },
  });

  return updated;
}

export async function updateTranscription(
  transcriptionId: string,
  patch: Partial<TranscriptionRow>,
) {
  const res = await supabase
    .from(T.transcriptions)
    .update(patch as any)
    .eq('id', transcriptionId)
    .select('*')
    .single();

  assertNoSbError(res as any, 'update transcription');
  return res.data as any as TranscriptionRow;
}

// -------------------- ✅ Carry over (best effort) --------------------
// Clone annotations/notes/tags from prevVersionId to newVersionId.
// - If quote can be found in newContent -> relocate offsets and set status:
//   - exact same slice -> ok
//   - found elsewhere -> needs_review
// - If not found -> keep old offsets, status orphaned (annotations only).
// Notes/tags keep offsets if found, else keep offsets but do NOT “orphan” (they’re less strict).

export async function carryOverChildrenBestEffort(args: {
  prevVersionId: string;
  newVersionId: string;
  prevContent: string;
  newContent: string;
}) {
  const { prevVersionId, newVersionId, prevContent, newContent } = args;

  // load prev children
  const [prevAnn, prevNotes, prevTags] = await Promise.all([
    supabase
      .from(T.annotations)
      .select('*')
      .eq('transcription_version_id', prevVersionId)
      .order('created_at', { ascending: true }),
    supabase
      .from(T.notes)
      .select('*')
      .eq('transcription_version_id', prevVersionId)
      .order('created_at', { ascending: true }),
    supabase
      .from(T.tags)
      .select('*')
      .eq('transcription_version_id', prevVersionId)
      .order('created_at', { ascending: true }),
  ]);

  if (prevAnn.error) console.error('carryOver: load annotations', prevAnn.error);
  if (prevNotes.error) console.error('carryOver: load notes', prevNotes.error);
  if (prevTags.error) console.error('carryOver: load tags', prevTags.error);

  const annotations = (prevAnn.data ?? []) as any as AnnotationRow[];
  const notes = (prevNotes.data ?? []) as any as NoteRow[];
  const tags = (prevTags.data ?? []) as any as TranscriptionTagRow[];

  // ---- annotations
  if (annotations.length) {
    const insRows = annotations.map((a) => {
      const rel = relocateByQuote(newContent, a.quote, a.start_offset);
      const start = rel?.start ?? a.start_offset;
      const end = rel?.end ?? a.end_offset;

      const expected = newContent.slice(start, end);
      let status: AnchorStatus = 'ok';
      if (!rel) status = 'orphaned';
      else if (expected !== a.quote) status = 'needs_review';
      else status = rel.confidence === 'near' ? 'ok' : 'needs_review'; // found globally -> needs_review

      const anchor = computeAnchor(newContent, start, end);

      return {
        transcription_version_id: newVersionId,
        type: a.type,
        start_offset: start,
        end_offset: end,
        quote: anchor.quote,
        prefix: anchor.prefix,
        suffix: anchor.suffix,
        status,
        comment: a.comment ?? null,
      };
    });

    const ins = await supabase.from(T.annotations).insert(insRows as any);
    if (ins.error) console.error('carryOver: insert annotations', ins.error);
  }

  const userNotes = notes.filter((n) => !(n.content ?? '').startsWith('[DIFF '));
  if (userNotes.length) {
    const insRows = userNotes.map((n) => {
      if (n.start_offset == null || n.end_offset == null || !n.quote) {
        return {
          transcription_version_id: newVersionId,
          start_offset: null,
          end_offset: null,
          quote: null,
          prefix: null,
          suffix: null,
          content: n.content ?? '',
        };
      }

      const rel = relocateByQuote(newContent, n.quote, n.start_offset);
      const start = rel?.start ?? n.start_offset;
      const end = rel?.end ?? n.end_offset;
      const anchor = computeAnchor(newContent, start, end);

      return {
        transcription_version_id: newVersionId,
        start_offset: start,
        end_offset: end,
        quote: anchor.quote,
        prefix: anchor.prefix,
        suffix: anchor.suffix,
        content: n.content ?? '',
      };
    });

    const ins = await supabase.from(T.notes).insert(insRows as any);
    if (ins.error) console.error('carryOver: insert notes', ins.error);
  }

  // ---- tags
  if (tags.length) {
    const insRows = tags.map((tg) => {
      const rel = relocateByQuote(newContent, tg.quote, tg.start_offset);
      const start = rel?.start ?? tg.start_offset;
      const end = rel?.end ?? tg.end_offset;
      const anchor = computeAnchor(newContent, start, end);

      return {
        transcription_version_id: newVersionId,
        kind: tg.kind,
        label: tg.label,
        start_offset: start,
        end_offset: end,
        quote: anchor.quote,
        prefix: anchor.prefix,
        suffix: anchor.suffix,
        linked_acteur_id: tg.linked_acteur_id ?? null,
      };
    });

    const ins = await supabase.from(T.tags).insert(insRows as any);
    if (ins.error) console.error('carryOver: insert tags', ins.error);
  }
}

// -------------------- ✅ Create version for a single active source --------------------
// Save = new version (auto increment) + link to exactly ONE active source + carry over best effort.

export async function createNewVersionForSource(args: {
  acteId: string;
  activeSourceId: string; // = acte_source_id
  part: TranscriptionPart; // ✅ zone
  editorContent: string;
  status?: TranscriptionStatus; // default draft

  prevVersionId: string | null;
  prevContent: string | null;

  transcription_kind?: TranscriptionKind | null;
  confidence?: ConfidenceLevel | null;
  change_summary?: string | null;

  nextVersionNumber: number;
}): Promise<{ transcription: TranscriptionRow; newVersion: TranscriptionVersionRow }> {
  // Status auto basé sur le contenu, sauf si on force explicitement TRANSCRIBED/IN_REVIEW/VALIDATED
  const computed = computeVersionStatusFromContent({
    content: args.editorContent ?? '',
    currentStatus: args.status ?? null,
  });

  const status = (args.status ?? computed) as TranscriptionStatus;

  // ✅ 1 transcription par source
  const transcription = await ensureTranscription(args.acteId, args.activeSourceId, args.part);

  const newVersion = await createVersion(transcription.id, {
    version: args.nextVersionNumber,
    status,
    content: args.editorContent ?? '',
    transcription_kind: args.transcription_kind ?? null,
    confidence: args.confidence ?? null,
    change_summary: args.change_summary ?? null,
  });

  // ✅ sync ec_transcriptions.status = status de la dernière version
  await syncTranscriptionStatusFromLatestVersion({
    transcriptionId: transcription.id,
    latestVersion: { status: newVersion.status, content: newVersion.content },
  });

  await logVersionEvent({
    transcription_version_id: newVersion.id,
    event_type: 'create',
    payload: {
      acte_id: args.acteId,
      acte_source_id: args.activeSourceId,
      transcription_part: args.part,
      transcription_id: transcription.id,
      version: newVersion.version,
      status: newVersion.status,
      prev_version_id: args.prevVersionId,
      content_len: (args.editorContent ?? '').length,
    },
  });

  if (args.prevVersionId && args.prevContent != null) {
    await carryOverChildrenBestEffort({
      prevVersionId: args.prevVersionId,
      newVersionId: newVersion.id,
      prevContent: args.prevContent,
      newContent: args.editorContent ?? '',
    });
  }

  return { transcription, newVersion };
}

// -------------------- Annotation CRUD --------------------

export async function insertAnnotation(
  payload: Partial<AnnotationRow> & { transcription_version_id: string },
) {
  const res = await supabase
    .from(T.annotations)
    .insert(payload as any)
    .select('*')
    .single();
  assertNoSbError(res as any, 'insert annotation');

  const row = res.data as any as AnnotationRow;

  await logVersionEvent({
    transcription_version_id: row.transcription_version_id,
    event_type: 'annotation',
    payload: { action: 'create', annotation_id: row.id, type: row.type },
  });

  return row;
}

export async function updateAnnotation(id: string, patch: Partial<AnnotationRow>) {
  const res = await supabase
    .from(T.annotations)
    .update(patch as any)
    .eq('id', id)
    .select('*')
    .single();
  assertNoSbError(res as any, 'update annotation');

  const row = res.data as any as AnnotationRow;

  await logVersionEvent({
    transcription_version_id: row.transcription_version_id,
    event_type: 'annotation',
    payload: { action: 'update', annotation_id: row.id, patch },
  });

  return row;
}

export async function deleteAnnotation(id: string) {
  // 1) read to know version
  const getRes = await supabase
    .from(T.annotations)
    .select('id, transcription_version_id, type')
    .eq('id', id)
    .single();
  if (getRes.error) {
    console.error('delete annotation read', getRes.error);
    throw new Error(toMsg(getRes.error, 'Suppression impossible'));
  }

  const row = getRes.data as any as { id: string; transcription_version_id: string; type: string };

  // 2) delete
  const res = await supabase.from(T.annotations).delete().eq('id', id);
  if (res.error) {
    console.error('delete annotation', res.error);
    throw new Error(toMsg(res.error, 'Suppression impossible'));
  }

  // 3) log
  await logVersionEvent({
    transcription_version_id: row.transcription_version_id,
    event_type: 'annotation',
    payload: { action: 'delete', annotation_id: row.id, type: row.type },
  });

  return true;
}

export async function persistAnnotationStatuses(
  changed: Array<{ id: string; status: AnchorStatus }>,
) {
  if (!changed.length) return;
  const ops = changed.map((c) =>
    supabase
      .from(T.annotations)
      .update({ status: c.status } as any)
      .eq('id', c.id),
  );
  const results = await Promise.all(ops);
  for (const r of results) if (r.error) console.error('persistAnnotationStatuses', r.error);
}

// -------------------- Note CRUD --------------------

export async function insertNote(payload: Partial<NoteRow> & { transcription_version_id: string }) {
  const res = await supabase
    .from(T.notes)
    .insert(payload as any)
    .select('*')
    .single();
  assertNoSbError(res as any, 'insert note');

  const row = res.data as any as NoteRow;

  await logVersionEvent({
    transcription_version_id: row.transcription_version_id,
    event_type: 'note',
    payload: {
      action: 'create',
      note_id: row.id,
      anchored: row.start_offset != null && row.end_offset != null,
    },
  });

  return row;
}

export async function updateNote(id: string, patch: Partial<NoteRow>) {
  const res = await supabase
    .from(T.notes)
    .update(patch as any)
    .eq('id', id)
    .select('*')
    .single();
  assertNoSbError(res as any, 'update note');

  const row = res.data as any as NoteRow;

  await logVersionEvent({
    transcription_version_id: row.transcription_version_id,
    event_type: 'note',
    payload: { action: 'update', note_id: row.id, patch },
  });

  return row;
}

export async function deleteNote(id: string) {
  const getRes = await supabase
    .from(T.notes)
    .select('id, transcription_version_id')
    .eq('id', id)
    .single();
  if (getRes.error) {
    console.error('delete note read', getRes.error);
    throw new Error(toMsg(getRes.error, 'Suppression impossible'));
  }
  const row = getRes.data as any as { id: string; transcription_version_id: string };

  const res = await supabase.from(T.notes).delete().eq('id', id);
  if (res.error) {
    console.error('delete note', res.error);
    throw new Error(toMsg(res.error, 'Suppression impossible'));
  }

  await logVersionEvent({
    transcription_version_id: row.transcription_version_id,
    event_type: 'note',
    payload: { action: 'delete', note_id: row.id },
  });

  return true;
}

// -------------------- Tag CRUD --------------------

export async function createTag(
  payload: Partial<TranscriptionTagRow> & { transcription_version_id: string },
) {
  const res = await supabase
    .from(T.tags)
    .insert(payload as any)
    .select('*')
    .single();
  assertNoSbError(res as any, 'create tag');

  const row = res.data as any as TranscriptionTagRow;

  await logVersionEvent({
    transcription_version_id: row.transcription_version_id,
    event_type: 'tag',
    payload: { action: 'create', tag_id: row.id, kind: row.kind, label: row.label },
  });

  return row;
}

export async function deleteTag(id: string) {
  const getRes = await supabase
    .from(T.tags)
    .select('id, transcription_version_id, kind')
    .eq('id', id)
    .single();
  if (getRes.error) {
    console.error('delete tag read', getRes.error);
    throw new Error(toMsg(getRes.error, 'Suppression impossible'));
  }
  const row = getRes.data as any as { id: string; transcription_version_id: string; kind: string };

  const res = await supabase.from(T.tags).delete().eq('id', id);
  if (res.error) {
    console.error('delete tag', res.error);
    throw new Error(toMsg(res.error, 'Suppression impossible'));
  }

  await logVersionEvent({
    transcription_version_id: row.transcription_version_id,
    event_type: 'tag',
    payload: { action: 'delete', tag_id: row.id, kind: row.kind },
  });

  return true;
}
