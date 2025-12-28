// transcriptionTab.service.ts
// Business logic + Supabase access + parsing helpers to mitigate “angles morts”
//
// IMPORTANT: No DB schema changes required.
// - META is stored in a NoteRow with content starting `[META]`
// - Diff causes are stored inside META diff map (keyed by version ids)
//
// ✅ Source-first additions:
// - latest version per source
// - createNewVersionForSource (save = new version + link to active source)
// - carryOverChildrenBestEffort (annotations/notes/tags) with anchor revalidation
//
// ⚠️ This file returns NO React nodes (only plain data). UI stays in transcriptionTab.ui.tsx.

import { supabase } from "@/lib/supabase";

// -------------------- Supabase helpers --------------------

export type SBResult<T> = { data: T | null; error: any };

export function assertNoSbError<T>(res: SBResult<T>, context: string): asserts res is { data: T; error: null } {
  if (res.error) {
    console.error(context, res.error);
    const msg = typeof res.error?.message === "string" ? res.error.message : context;
    throw new Error(msg);
  }
}

function toMsg(e: any, fallback: string) {
  return typeof e?.message === "string" ? e.message : fallback;
}

// -------------------- Table names (adjust here if needed) --------------------

const T = {
  actes: "etat_civil_actes",
  acteSources: "etat_civil_acte_citations",

  versions: "ec_transcription_versions",
  versionSources: "ec_transcription_version_sources",

  annotations: "ec_transcription_annotations",
  notes: "ec_transcription_notes",
  tags: "ec_transcription_tags",

  acteurs: "etat_civil_actes_acteurs",
  gabarits: "ec_transcription_gabarits",
} as const;

// -------------------- Types --------------------

export type TranscriptionStatus = "draft" | "in_review" | "validated" | "contested";
export type AnchorStatus = "ok" | "needs_review" | "orphaned";

export type TranscriptionKind = "diplomatique" | "semi_normalisee" | "travail";
export type SourceLectureKind = "image_originale" | "microfilm" | "transcription_secondaire" | "autre";
export type ConfidenceLevel = "high" | "medium" | "low";

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

export type EcActeSourceRow = {
  id: string;
  acte_id: string;
  depot_type: string | null;
  nom_depot: string | null;
  serie: string | null;
  cote: string | null;
  registre: string | null;
  folio_page: string | null;
  vue_image: string | null;
  support: string | null;
  langue: string | null;
  ecriture: string | null;
  etat_conservation: string | null;
  note: string | null;
  created_at?: string;
};

export type TranscriptionVersionRow = {
  id: string;
  acte_id: string;
  version: number;
  status: TranscriptionStatus;
  content: string;

  transcription_kind: TranscriptionKind | null;
  source_lecture_kind: SourceLectureKind | null;
  conventions_text: string | null;
  langue_vue: string | null;
  ecriture_vue: string | null;
  confidence: ConfidenceLevel | null;

  created_at: string;
  created_by: string | null;

  validated_at: string | null;
  validated_by: string | null;

  contested_at: string | null;
  contested_by: string | null;
  contested_reason: string | null;

  gabarit_id: string | null;
};

export type TranscriptionVersionSourceRow = {
  id: string;
  transcription_version_id: string;
  acte_source_id: string;
};

export type AnnotationRow = {
  id: string;
  transcription_version_id: string;
  type: "doubt" | "rature" | "lacune" | "mention" | "other";
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

export type GabaritRow = {
  id: string;
  label: string;
  scope_type_acte: string | null;
  bureau_id: string | null;
  registre_id: string | null;
  year_from: number | null;
  year_to: number | null;
  template_content: string;
  created_at: string;
};

export type TranscriptionTagRow = {
  id: string;
  transcription_version_id: string;
  kind: "date" | "acteur" | "lieu";
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
  acte_id: string;
  manifestation_id: string | null;
  vues_start: number | null;
  vues_end: number | null;
  vues_raw: string | null;
  page_start: number | null;
  page_end: number | null;
  page_raw: string | null;
  acte_manquant: boolean | null;
  note: string | null;
  sort_order: number | null;
};

export type ManifestationPick = {
  manifestation_id: string;
  type_manifestation: string | null;
  unite_id: string | null;
  unite_titre: string | null;
  unite_cote: string | null;
  pagination_type: string | null;
  depot_nom: string | null;
  depot_type: string | null;
  institution_nom: string | null;
  institution_sigle: string | null;
  url_base: string | null;
  plateforme_code: string | null;
};

export type CitationDraft = {
  id: string;
  acte_id: string;
  manifestation_id: string | null;

  // pagination / vues/pages
  vues_start: number | null;
  vues_end: number | null;
  vues_raw: string | null;
  page_start: number | null;
  page_end: number | null;
  page_raw: string | null;

  acte_manquant: boolean;
  note: string | null;
  sort_order: number | null;

  // enrich
  manifestation?: {
    type_manifestation: string | null;
    unite_titre: string | null;
    unite_cote: string | null;
    pagination_type: string | null;
    depot_nom: string | null;
    depot_type: string | null;
    institution_nom: string | null;
    institution_sigle: string | null;
    url_base: string | null;
    plateforme_code: string | null;
  } | null;
};

export const PAGE_BREAK_TOKEN = "[SAUT_DE_PAGE]";

// -------------------- Anchors / helpers --------------------

export function computeAnchor(content: string, start: number, end: number) {
  const quote = content.slice(start, end);
  const prefixStart = Math.max(0, start - 40);
  const suffixEnd = Math.min(content.length, end + 40);
  const prefix = content.slice(prefixStart, start);
  const suffix = content.slice(end, suffixEnd);
  return { quote, prefix, suffix };
}

export function safeYearFromDate(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

export function formatSourceLabel(s: EcActeSourceRow) {
  const depot = [s.depot_type, s.nom_depot].filter(Boolean).join(" · ");
  const cote = [s.serie, s.cote].filter(Boolean).join(" ");
  const folio = s.folio_page ? `p./folio ${s.folio_page}` : "";
  const vue = s.vue_image ? `vue ${s.vue_image}` : "";
  const rest = [cote, folio, vue].filter(Boolean).join(" · ");
  return [depot, rest].filter(Boolean).join(" — ");
}

export function buildLineDiff(left: string, right: string) {
  const L = left.split(/\r?\n/);
  const R = right.split(/\r?\n/);
  const n = Math.max(L.length, R.length);
  const rows: Array<{ i: number; left: string; right: string; same: boolean }> = [];
  for (let i = 0; i < n; i++) {
    const a = L[i] ?? "";
    const b = R[i] ?? "";
    rows.push({ i, left: a, right: b, same: a === b });
  }
  return rows;
}

export function insertAtSelection(text: string, start: number, end: number, insert: string) {
  return text.slice(0, start) + insert + text.slice(end);
}

export function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

// -------------------- Read mode rendering --------------------

export type RenderBlock =
  | { kind: "section"; label: string; text: string }
  | { kind: "page_break" }
  | { kind: "paragraph"; text: string };

export function splitIntoReadableBlocks(raw: string): RenderBlock[] {
  const parts = raw.split(PAGE_BREAK_TOKEN);
  const blocks: RenderBlock[] = [];

  parts.forEach((part, idx) => {
    const t = part;

    const markers: Array<{ label: string; re: RegExp }> = [
      { label: "En-tête", re: /\bAujourd['’]hui\b/i },
      { label: "Comparants", re: /\bPar devant Nous\b|\bPar devant nous\b/i },
      { label: "Témoins", re: /\ben présence\b|\bprésence\b/i },
      { label: "Signatures", re: /\bet lecture faite\b|\bnous l['’]avons signé\b/i },
    ];

    const hits: Array<{ idx: number; label: string }> = [];
    for (const m of markers) {
      const match = m.re.exec(t);
      if (match && match.index != null) hits.push({ idx: match.index, label: m.label });
      m.re.lastIndex = 0;
    }
    hits.sort((a, b) => a.idx - b.idx);

    if (hits.length === 0) {
      const paras = t
        .split(/\n{2,}/)
        .map((x) => x.trim())
        .filter(Boolean);
      for (const p of paras) blocks.push({ kind: "paragraph", text: p });
    } else {
      for (let i = 0; i < hits.length; i++) {
        const start = hits[i].idx;
        const end = i + 1 < hits.length ? hits[i + 1].idx : t.length;
        const chunk = t.slice(start, end).trim();
        if (chunk) blocks.push({ kind: "section", label: hits[i].label, text: chunk });
      }
    }

    if (idx < parts.length - 1) blocks.push({ kind: "page_break" });
  });

  return blocks;
}

// -------------------- Repérages --------------------

export type Hit = { label: string; start: number; end: number };

function findAll(re: RegExp, text: string): Hit[] {
  const hits: Hit[] = [];
  let m: RegExpExecArray | null;
  const rr = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
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

// -------------------- Anchor revalidation --------------------

export function revalidateAnchor(content: string, a: Pick<AnnotationRow, "quote" | "start_offset" | "end_offset">): AnchorStatus {
  const quote = a.quote || "";
  if (!quote.trim()) return "orphaned";

  const expected = content.slice(a.start_offset, a.end_offset);
  if (expected === quote) return "ok";

  const winStart = Math.max(0, a.start_offset - 120);
  const winEnd = Math.min(content.length, a.end_offset + 120);
  const windowText = content.slice(winStart, winEnd);
  if (windowText.includes(quote)) return "needs_review";

  if (content.includes(quote)) return "needs_review";
  return "orphaned";
}

// Try to relocate by quote (best effort)
function relocateByQuote(newContent: string, quote: string, hintStart: number | null) {
  const q = quote?.trim() ?? "";
  if (!q) return null;

  // First: search near the hint
  if (hintStart != null) {
    const winStart = Math.max(0, hintStart - 800);
    const winEnd = Math.min(newContent.length, hintStart + 800);
    const w = newContent.slice(winStart, winEnd);
    const idx = w.indexOf(q);
    if (idx >= 0) {
      const abs = winStart + idx;
      return { start: abs, end: abs + q.length, confidence: "near" as const };
    }
  }

  // Global fallback
  const idx2 = newContent.indexOf(q);
  if (idx2 >= 0) return { start: idx2, end: idx2 + q.length, confidence: "global" as const };
  return null;
}

// -------------------- Gabarit selection --------------------

export function chooseBestGabaritForInitialDraft(acte: EcActeRow, gabarits: GabaritRow[]): GabaritRow | null {
  if (!gabarits.length) return null;

  const year = safeYearFromDate(acte.date);
  const type = acte.type_acte ?? null;

  const scored = gabarits
    .map((g) => {
      let score = 0;

      if (type && g.scope_type_acte && g.scope_type_acte === type) score += 40;
      if (!g.scope_type_acte) score += 5;

      if (year != null) {
        const from = g.year_from ?? null;
        const to = g.year_to ?? null;
        const inRange = (from == null || year >= from) && (to == null || year <= to);
        if (inRange) score += 20;
      } else {
        score += 2;
      }

      if (acte.registre_id && g.registre_id && g.registre_id === acte.registre_id) score += 15;
      if (acte.bureau_id && g.bureau_id && g.bureau_id === acte.bureau_id) score += 10;

      return { g, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.g ?? null;
}

// -------------------- “Angles morts” encoding --------------------

export function compareKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function parseMetaFromNotes(notes: NoteRow[]): {
  metaNoteId: string | null;
  completeness: "complete" | "partial" | null;
  referenceReason: string | null;
  diffNotesByKey: Record<string, string>;
} {
  const metaNote = notes.find((n) => (n.content ?? "").startsWith("[META]")) ?? null;
  const out = {
    metaNoteId: metaNote?.id ?? null,
    completeness: null as "complete" | "partial" | null,
    referenceReason: null as string | null,
    diffNotesByKey: {} as Record<string, string>,
  };

  if (!metaNote) return out;

  const lines = (metaNote.content ?? "").split(/\r?\n/).map((l) => l.trim());
  for (const line of lines) {
    if (!line || line === "[META]") continue;

    if (line.startsWith("completeness=")) {
      const v = line.slice("completeness=".length).trim();
      if (v === "complete" || v === "partial") out.completeness = v;
    } else if (line.startsWith("reference_reason=")) {
      const v = line.slice("reference_reason=".length).trim();
      out.referenceReason = v || null;
    } else if (line.startsWith("diff:")) {
      const rest = line.slice("diff:".length);
      const eq = rest.indexOf("=");
      if (eq > 0) {
        const key = rest.slice(0, eq).trim();
        const reason = rest.slice(eq + 1).trim();
        if (key && reason) out.diffNotesByKey[key] = reason;
      }
    }
  }

  return out;
}

export function composeMetaNote(payload: {
  completeness: "complete" | "partial" | null;
  referenceReason: string | null;
  diffNotesByKey: Record<string, string>;
}) {
  const lines: string[] = ["[META]"];
  if (payload.completeness) lines.push(`completeness=${payload.completeness}`);
  if (payload.referenceReason) lines.push(`reference_reason=${payload.referenceReason}`);
  const keys = Object.keys(payload.diffNotesByKey ?? {}).sort();
  for (const k of keys) lines.push(`diff:${k}=${payload.diffNotesByKey[k]}`);
  return lines.join("\n");
}

export function composeDiffNote(a: string, b: string, reason: string) {
  return `[DIFF ${compareKey(a, b)}] ${reason}`;
}

// -------------------- Supabase access (bundle + CRUD) --------------------

type ActeBundle = {
  acte: EcActeRow;
  acteSources: EcActeSourceRow[];
  versions: TranscriptionVersionRow[];
  versionSources: Record<string, string[]>;
  acteurs: ActeurLightRow[];
  gabarits: GabaritRow[];
};

export async function loadActeBundle(acteId: string): Promise<ActeBundle> {
  try {
    const [acteRes, sourcesRes, versionsRes, acteursRes, gabaritsRes] = await Promise.all([
      supabase.from(T.actes).select("*").eq("id", acteId).single(),
      supabase.from(T.acteSources).select("*").eq("acte_id", acteId).order("created_at", { ascending: true }),
      supabase.from(T.versions).select("*").eq("acte_id", acteId).order("version", { ascending: false }),
      supabase.from(T.acteurs).select("id, role, prenom, nom").eq("acte_id", acteId).order("created_at", { ascending: true }),
      supabase.from(T.gabarits).select("*").order("created_at", { ascending: false }),
    ]);

    assertNoSbError(acteRes as any, "load acte");
    assertNoSbError(sourcesRes as any, "load acte sources");
    assertNoSbError(versionsRes as any, "load versions");

    const acteurs: ActeurLightRow[] = acteursRes.error ? [] : ((acteursRes.data as any) ?? []);
    const gabarits: GabaritRow[] = gabaritsRes.error ? [] : ((gabaritsRes.data as any) ?? []);

    const acte = acteRes.data as any as EcActeRow;
    const acteSources = (sourcesRes.data ?? []) as any as EcActeSourceRow[];
    const versions = (versionsRes.data ?? []) as any as TranscriptionVersionRow[];

    const versionSources = await loadVersionSourcesMap(versions.map((v) => v.id));
    return { acte, acteSources, versions, versionSources, acteurs, gabarits };
  } catch (e) {
    console.error(e);
    throw new Error(toMsg(e, "Erreur lors du chargement des données (bundle)"));
  }
}

async function loadVersionSourcesMap(versionIds: string[]): Promise<Record<string, string[]>> {
  if (!versionIds.length) return {};
  const res = await supabase.from(T.versionSources).select("*").in("transcription_version_id", versionIds);
  assertNoSbError(res as any, "load version sources map");

  const rows = (res.data ?? []) as any as TranscriptionVersionSourceRow[];
  const map: Record<string, string[]> = {};
  for (const r of rows) {
    const vid = r.transcription_version_id;
    if (!map[vid]) map[vid] = [];
    map[vid].push(r.acte_source_id);
  }
  for (const k of Object.keys(map)) map[k] = Array.from(new Set(map[k]));
  return map;
}

export async function refreshVersions(acteId: string): Promise<{ versions: TranscriptionVersionRow[]; versionSources: Record<string, string[]> }> {
  const versionsRes = await supabase.from(T.versions).select("*").eq("acte_id", acteId).order("version", { ascending: false });
  assertNoSbError(versionsRes as any, "refresh versions");
  const versions = (versionsRes.data ?? []) as any as TranscriptionVersionRow[];
  const versionSources = await loadVersionSourcesMap(versions.map((v) => v.id));
  return { versions, versionSources };
}

export async function loadVersionChildren(versionId: string): Promise<{ annotations: AnnotationRow[]; notes: NoteRow[] }> {
  const [annRes, noteRes] = await Promise.all([
    supabase.from(T.annotations).select("*").eq("transcription_version_id", versionId).order("created_at", { ascending: true }),
    supabase.from(T.notes).select("*").eq("transcription_version_id", versionId).order("created_at", { ascending: true }),
  ]);
  assertNoSbError(annRes as any, "load annotations");
  assertNoSbError(noteRes as any, "load notes");
  return { annotations: (annRes.data ?? []) as any, notes: (noteRes.data ?? []) as any };
}

export async function loadVersionTags(versionId: string): Promise<TranscriptionTagRow[]> {
  const res = await supabase.from(T.tags).select("*").eq("transcription_version_id", versionId).order("created_at", { ascending: true });
  assertNoSbError(res as any, "load tags");
  return (res.data ?? []) as any;
}

export async function createVersion(
  acteId: string,
  payload: {
    version: number;
    status: TranscriptionStatus;
    content: string;
    gabarit_id?: string | null;
    transcription_kind?: TranscriptionKind | null;
    source_lecture_kind?: SourceLectureKind | null;
    conventions_text?: string | null;
    langue_vue?: string | null;
    ecriture_vue?: string | null;
    confidence?: ConfidenceLevel | null;
    sourceIds?: string[];
  }
): Promise<TranscriptionVersionRow> {
  const insertPayload: any = {
    acte_id: acteId,
    version: payload.version,
    status: payload.status,
    content: payload.content ?? "",
    gabarit_id: payload.gabarit_id ?? null,
    transcription_kind: payload.transcription_kind ?? null,
    source_lecture_kind: payload.source_lecture_kind ?? null,
    conventions_text: payload.conventions_text ?? null,
    langue_vue: payload.langue_vue ?? null,
    ecriture_vue: payload.ecriture_vue ?? null,
    confidence: payload.confidence ?? null,
  };

  const res = await supabase.from(T.versions).insert(insertPayload).select("*").single();
  assertNoSbError(res as any, "create version");
  const row = res.data as any as TranscriptionVersionRow;

  const sourceIds = payload.sourceIds ?? [];
  if (sourceIds.length) await syncVersionSources(row.id, [], sourceIds);

  return row;
}

export async function setVersionStatus(versionId: string, patch: Partial<TranscriptionVersionRow>) {
  const res = await supabase.from(T.versions).update(patch as any).eq("id", versionId).select("*").single();
  assertNoSbError(res as any, "update version");
  return res.data as any as TranscriptionVersionRow;
}

// -------------------- Version sources sync --------------------

export async function syncVersionSources(versionId: string, currentSourceIds: string[], nextSourceIds: string[]) {
  const cur = new Set(currentSourceIds ?? []);
  const next = new Set(nextSourceIds ?? []);

  const toAdd: string[] = [];
  const toRemove: string[] = [];

  for (const id of next) if (!cur.has(id)) toAdd.push(id);
  for (const id of cur) if (!next.has(id)) toRemove.push(id);

  if (toAdd.length) {
    const rows = toAdd.map((acte_source_id) => ({
      transcription_version_id: versionId,
      acte_source_id,
    }));
    const ins = await supabase.from(T.versionSources).insert(rows as any);
    if (ins.error) {
      console.error("syncVersionSources insert", ins.error);
      throw new Error(toMsg(ins.error, "Impossible d’ajouter des sources à la version"));
    }
  }

  if (toRemove.length) {
    const del = await supabase.from(T.versionSources).delete().eq("transcription_version_id", versionId).in("acte_source_id", toRemove);
    if (del.error) {
      console.error("syncVersionSources delete", del.error);
      throw new Error(toMsg(del.error, "Impossible de retirer des sources de la version"));
    }
  }
}

// -------------------- ✅ Source-first helpers --------------------

export function buildLatestVersionBySourceMap(
  versions: TranscriptionVersionRow[],
  versionSources: Record<string, string[]>
): Map<string, string> {
  const sorted = [...versions].sort((a, b) => {
    const av = Number(a.version ?? 0);
    const bv = Number(b.version ?? 0);
    if (bv !== av) return bv - av;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const map = new Map<string, string>(); // sourceId -> latestVersionId
  for (const v of sorted) {
    const sids = versionSources[v.id] ?? [];
    for (const sid of sids) if (!map.has(sid)) map.set(sid, v.id);
  }
  return map;
}

export function getLatestVersionIdForSource(
  sourceId: string,
  versions: TranscriptionVersionRow[],
  versionSources: Record<string, string[]>
): string | null {
  const map = buildLatestVersionBySourceMap(versions, versionSources);
  return map.get(sourceId) ?? null;
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
    supabase.from(T.annotations).select("*").eq("transcription_version_id", prevVersionId).order("created_at", { ascending: true }),
    supabase.from(T.notes).select("*").eq("transcription_version_id", prevVersionId).order("created_at", { ascending: true }),
    supabase.from(T.tags).select("*").eq("transcription_version_id", prevVersionId).order("created_at", { ascending: true }),
  ]);

  if (prevAnn.error) console.error("carryOver: load annotations", prevAnn.error);
  if (prevNotes.error) console.error("carryOver: load notes", prevNotes.error);
  if (prevTags.error) console.error("carryOver: load tags", prevTags.error);

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
      let status: AnchorStatus = "ok";
      if (!rel) status = "orphaned";
      else if (expected !== a.quote) status = "needs_review";
      else status = rel.confidence === "near" ? "ok" : "needs_review"; // found globally -> needs_review

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
    if (ins.error) console.error("carryOver: insert annotations", ins.error);
  }

  // ---- notes (skip [META] and [DIFF ...] notes: they are version-specific)
  const userNotes = notes.filter((n) => !(n.content ?? "").startsWith("[META]") && !(n.content ?? "").startsWith("[DIFF "));
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
          content: n.content ?? "",
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
        content: n.content ?? "",
      };
    });

    const ins = await supabase.from(T.notes).insert(insRows as any);
    if (ins.error) console.error("carryOver: insert notes", ins.error);
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
    if (ins.error) console.error("carryOver: insert tags", ins.error);
  }
}

// -------------------- ✅ Create version for a single active source --------------------
// Save = new version (auto increment) + link to exactly ONE active source + carry over best effort.

export async function createNewVersionForSource(args: {
  acteId: string;
  activeSourceId: string;
  editorContent: string;
  status?: TranscriptionStatus; // default draft
  // from previous “working version”:
  prevVersionId: string | null;
  prevContent: string | null;

  // meta fields (optional)
  gabarit_id?: string | null;
  transcription_kind?: TranscriptionKind | null;
  source_lecture_kind?: SourceLectureKind | null;
  conventions_text?: string | null;
  langue_vue?: string | null;
  ecriture_vue?: string | null;
  confidence?: ConfidenceLevel | null;

  // next version number computed in logic
  nextVersionNumber: number;
}): Promise<{ newVersion: TranscriptionVersionRow }> {
  const status = args.status ?? "draft";

  const newVersion = await createVersion(args.acteId, {
    version: args.nextVersionNumber,
    status,
    content: args.editorContent ?? "",
    gabarit_id: args.gabarit_id ?? null,
    transcription_kind: args.transcription_kind ?? null,
    source_lecture_kind: args.source_lecture_kind ?? null,
    conventions_text: args.conventions_text ?? null,
    langue_vue: args.langue_vue ?? null,
    ecriture_vue: args.ecriture_vue ?? null,
    confidence: args.confidence ?? null,
    sourceIds: [args.activeSourceId], // ✅ exactly one “active source”
  });

  // carry over children from prev (best effort)
  if (args.prevVersionId && args.prevContent != null) {
    await carryOverChildrenBestEffort({
      prevVersionId: args.prevVersionId,
      newVersionId: newVersion.id,
      prevContent: args.prevContent,
      newContent: args.editorContent ?? "",
    });
  }

  return { newVersion };
}

// -------------------- Annotation CRUD --------------------

export async function insertAnnotation(payload: Partial<AnnotationRow> & { transcription_version_id: string }) {
  const res = await supabase.from(T.annotations).insert(payload as any).select("*").single();
  assertNoSbError(res as any, "insert annotation");
  return res.data as any as AnnotationRow;
}

export async function updateAnnotation(id: string, patch: Partial<AnnotationRow>) {
  const res = await supabase.from(T.annotations).update(patch as any).eq("id", id).select("*").single();
  assertNoSbError(res as any, "update annotation");
  return res.data as any as AnnotationRow;
}

export async function deleteAnnotation(id: string) {
  const res = await supabase.from(T.annotations).delete().eq("id", id);
  if (res.error) {
    console.error("delete annotation", res.error);
    throw new Error(toMsg(res.error, "Suppression impossible"));
  }
  return true;
}

export async function persistAnnotationStatuses(changed: Array<{ id: string; status: AnchorStatus }>) {
  if (!changed.length) return;
  const ops = changed.map((c) => supabase.from(T.annotations).update({ status: c.status } as any).eq("id", c.id));
  const results = await Promise.all(ops);
  for (const r of results) if (r.error) console.error("persistAnnotationStatuses", r.error);
}

// -------------------- Note CRUD --------------------

export async function insertNote(payload: Partial<NoteRow> & { transcription_version_id: string }) {
  const res = await supabase.from(T.notes).insert(payload as any).select("*").single();
  assertNoSbError(res as any, "insert note");
  return res.data as any as NoteRow;
}

export async function updateNote(id: string, patch: Partial<NoteRow>) {
  const res = await supabase.from(T.notes).update(patch as any).eq("id", id).select("*").single();
  assertNoSbError(res as any, "update note");
  return res.data as any as NoteRow;
}

export async function deleteNote(id: string) {
  const res = await supabase.from(T.notes).delete().eq("id", id);
  if (res.error) {
    console.error("delete note", res.error);
    throw new Error(toMsg(res.error, "Suppression impossible"));
  }
  return true;
}

// -------------------- Tag CRUD --------------------

export async function createTag(payload: Partial<TranscriptionTagRow> & { transcription_version_id: string }) {
  const res = await supabase.from(T.tags).insert(payload as any).select("*").single();
  assertNoSbError(res as any, "create tag");
  return res.data as any as TranscriptionTagRow;
}

export async function deleteTag(id: string) {
  const res = await supabase.from(T.tags).delete().eq("id", id);
  if (res.error) {
    console.error("delete tag", res.error);
    throw new Error(toMsg(res.error, "Suppression impossible"));
  }
  return true;
}

// -------------------- Acte source update (decision stamp) --------------------

export async function updateActeSourceNote(acteSourceId: string, nextNote: string) {
  const res = await supabase.from(T.acteSources).update({ note: nextNote } as any).eq("id", acteSourceId).select("*").single();
  assertNoSbError(res as any, "update acte source note");
  return res.data as any as EcActeSourceRow;
}
