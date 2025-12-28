// transcriptionTab.service.ts
// Tout ce qui est "métier" / helpers / accès Supabase pour l'onglet Transcription.
// Objectif : alléger TranscriptionTab.tsx et améliorer la maintenabilité.

import { supabase } from "@/lib/supabase";

export type SBResult<T> = { data: T | null; error: any };

export function assertNoSbError<T>(
  res: SBResult<T>,
  context: string
): asserts res is { data: T; error: null } {
  if (res.error) {
    console.error(context, res.error);
    throw res.error;
  }
}

export type TranscriptionStatus = "draft" | "in_review" | "validated" | "contested";
export type AnchorStatus = "ok" | "needs_review" | "orphaned";

export type TranscriptionKind = "diplomatique" | "semi_normalisee" | "travail";
export type SourceLectureKind =
  | "image_originale"
  | "microfilm"
  | "transcription_secondaire"
  | "autre";
export type ConfidenceLevel = "high" | "medium" | "low";

export type EcActeRow = {
  id: string;
  date: string | null;
  numero_acte: string | null;
  registre_id: string | null;
  bureau_id: string | null;
  type_acte: string | null;
  type_acte_ref: string | null;
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

// ----------------- Tags (nouveau) -----------------

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

// ----------------- Tokens / petits helpers -----------------

export const PAGE_BREAK_TOKEN = "[SAUT_DE_PAGE]";

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

// Diff simple par lignes
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

// ----------------- "Mise en page" (lecture mode) -----------------

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
      { label: "Futur époux", re: /\ble Sieur\b/i },
      { label: "Futur épouse", re: /\bet Demoiselle\b|\bet demoiselle\b/i },
      { label: "Contrat / publications", re: /\bles futurs époux\b|\bles publications\b/i },
      { label: "Consentement", re: /\bnous avons demandé\b/i },
      { label: "Déclaration d’union", re: /\bnous avons déclaré\b|\bau nom de la loi\b/i },
      { label: "Enfant déclaré", re: /\baussitôt\b|\bné d['’]eux\b/i },
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

// ----------------- Repérages "actes" -----------------

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

  hits.dates.push(...findAll(/\b(Aujourd['’]hui\b[^.\n]{0,160}?\bmil\b[^.\n]{0,80})/gi, text));
  hits.dates.push(
    ...findAll(/\b(le|la)\s+[^.\n]{0,40}?\bdu mois de\b[^.\n]{0,60}?\bmil\b[^.\n]{0,80}/gi, text)
  );

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

// ----------------- Anchor revalidation -----------------

export function revalidateAnchor(content: string, a: AnnotationRow): AnchorStatus {
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

// ----------------- Initial draft: choisir meilleur gabarit -----------------
// Heuristique simple (stable et lisible) :
// 1) type_acte match exact (si dispo)
// 2) gabarits dont [year_from..year_to] contient l'année (si dispo)
// 3) plus récent created_at
export function chooseBestGabaritForInitialDraft(acte: EcActeRow, gabarits: GabaritRow[]): GabaritRow | null {
  if (!gabarits.length) return null;

  const year = safeYearFromDate(acte.date);
  const type = acte.type_acte ?? null;

  const scored = gabarits
    .map((g) => {
      let score = 0;

      // type match
      if (type && g.scope_type_acte && g.scope_type_acte === type) score += 40;
      if (!g.scope_type_acte) score += 5; // gabarit générique

      // year in range
      if (year != null) {
        const from = g.year_from ?? null;
        const to = g.year_to ?? null;
        const inRange =
          (from == null || year >= from) &&
          (to == null || year <= to);
        if (inRange) score += 20;
      } else {
        score += 2;
      }

      // registry/bureau match (si le gabarit est scoped)
      if (acte.registre_id && g.registre_id && g.registre_id === acte.registre_id) score += 15;
      if (acte.bureau_id && g.bureau_id && g.bureau_id === acte.bureau_id) score += 10;

      // recency
      const ts = new Date(g.created_at).getTime();
      score += Math.min(10, Math.max(0, (ts ? 1 : 0)));

      return { g, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.g ?? null;
}

// ----------------- Supabase: loads / saves -----------------

export type LoadBundle = {
  acte: EcActeRow;
  acteSources: EcActeSourceRow[];
  versions: TranscriptionVersionRow[];
  versionSources: Record<string, string[]>;
  acteurs: ActeurLightRow[];
  gabarits: GabaritRow[];
};

export async function loadActeBundle(acteId: string): Promise<LoadBundle> {
  const acteRes = await supabase
    .from("etat_civil_actes")
    .select("id, date, numero_acte, registre_id, bureau_id, type_acte, type_acte_ref, label")
    .eq("id", acteId)
    .single();
  if (acteRes.error) throw acteRes.error;
  const acte = acteRes.data as EcActeRow;

  const sourcesRes = await supabase
    .from("etat_civil_actes_sources")
    .select(
      "id, acte_id, depot_type, nom_depot, serie, cote, registre, folio_page, vue_image, support, langue, ecriture, etat_conservation, note, created_at"
    )
    .eq("acte_id", acteId)
    .order("created_at", { ascending: true });
  if (sourcesRes.error) throw sourcesRes.error;

  const verRes = (await supabase
    .from("ec_transcription_versions")
    .select(
      [
        "id",
        "acte_id",
        "version",
        "status",
        "content",
        "transcription_kind",
        "source_lecture_kind",
        "conventions_text",
        "langue_vue",
        "ecriture_vue",
        "confidence",
        "created_at",
        "created_by",
        "validated_at",
        "validated_by",
        "contested_at",
        "contested_by",
        "contested_reason",
        "gabarit_id",
      ].join(",")
    )
    .eq("acte_id", acteId)
    .order("version", { ascending: false })) as unknown as SBResult<TranscriptionVersionRow[]>;
  assertNoSbError(verRes, "load versions");

  const joinRes = await supabase
    .from("ec_transcription_version_sources")
    .select("id, transcription_version_id, acte_source_id")
    .in(
      "transcription_version_id",
      (verRes.data ?? []).map((r: any) => r.id)
    );

  const joinRows = joinRes.error ? [] : ((joinRes.data ?? []) as TranscriptionVersionSourceRow[]);
  const versionSources: Record<string, string[]> = {};
  for (const j of joinRows) {
    versionSources[j.transcription_version_id] = versionSources[j.transcription_version_id] ?? [];
    versionSources[j.transcription_version_id].push(j.acte_source_id);
  }

  const actRes = await supabase
    .from("v_acteurs_enrichis")
    .select("id, role, prenom, nom")
    .eq("acte_id", acteId)
    .order("role", { ascending: true });

  const year = safeYearFromDate(acte.date);
  const gabRes = await supabase
    .from("ec_transcription_gabarits")
    .select("id, label, scope_type_acte, bureau_id, registre_id, year_from, year_to, template_content, created_at")
    .or(
      [
        acte.registre_id ? `registre_id.eq.${acte.registre_id}` : "",
        acte.bureau_id ? `bureau_id.eq.${acte.bureau_id}` : "",
      ]
        .filter(Boolean)
        .join(",")
    )
    .order("created_at", { ascending: false });

  const allGab = ((gabRes.data ?? []) as GabaritRow[]) ?? [];
  const filtered = allGab.filter((g) => {
    const okType = !g.scope_type_acte || !acte.type_acte || g.scope_type_acte === acte.type_acte;
    if (!okType) return false;
    if (!year) return true;
    const from = g.year_from ?? null;
    const to = g.year_to ?? null;
    if (from && year < from) return false;
    if (to && year > to) return false;
    return true;
  });

  return {
    acte,
    acteSources: (sourcesRes.data ?? []) as EcActeSourceRow[],
    versions: verRes.data ?? [],
    versionSources,
    acteurs: ((actRes.data ?? []) as ActeurLightRow[]) ?? [],
    gabarits: filtered,
  };
}

export async function loadVersionChildren(versionId: string): Promise<{
  annotations: AnnotationRow[];
  notes: NoteRow[];
}> {
  const [a, n] = await Promise.all([
    supabase
      .from("ec_transcription_annotations")
      .select("id, transcription_version_id, type, start_offset, end_offset, quote, prefix, suffix, status, comment, created_at")
      .eq("transcription_version_id", versionId)
      .order("created_at", { ascending: true }),
    supabase
      .from("ec_transcription_notes")
      .select("id, transcription_version_id, start_offset, end_offset, quote, prefix, suffix, content, created_at")
      .eq("transcription_version_id", versionId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    annotations: a.error ? [] : ((a.data ?? []) as AnnotationRow[]),
    notes: n.error ? [] : ((n.data ?? []) as NoteRow[]),
  };
}

export async function loadVersionTags(versionId: string): Promise<TranscriptionTagRow[]> {
  const res = await supabase
    .from("ec_transcription_tags")
    .select("id, transcription_version_id, kind, label, start_offset, end_offset, quote, prefix, suffix, linked_acteur_id, created_at")
    .eq("transcription_version_id", versionId)
    .order("created_at", { ascending: true });

  return res.error ? [] : ((res.data ?? []) as TranscriptionTagRow[]);
}

export async function refreshVersions(acteId: string): Promise<{
  versions: TranscriptionVersionRow[];
  versionSources: Record<string, string[]>;
}> {
  const verRes = (await supabase
    .from("ec_transcription_versions")
    .select(
      [
        "id",
        "acte_id",
        "version",
        "status",
        "content",
        "transcription_kind",
        "source_lecture_kind",
        "conventions_text",
        "langue_vue",
        "ecriture_vue",
        "confidence",
        "created_at",
        "created_by",
        "validated_at",
        "validated_by",
        "contested_at",
        "contested_by",
        "contested_reason",
        "gabarit_id",
      ].join(",")
    )
    .eq("acte_id", acteId)
    .order("version", { ascending: false })) as unknown as SBResult<TranscriptionVersionRow[]>;
  assertNoSbError(verRes, "load versions");

  const joinRes = await supabase
    .from("ec_transcription_version_sources")
    .select("id, transcription_version_id, acte_source_id")
    .in(
      "transcription_version_id",
      (verRes.data ?? []).map((r: any) => r.id)
    );

  const joinRows = joinRes.error ? [] : ((joinRes.data ?? []) as TranscriptionVersionSourceRow[]);
  const joinMap: Record<string, string[]> = {};
  for (const j of joinRows) {
    joinMap[j.transcription_version_id] = joinMap[j.transcription_version_id] ?? [];
    joinMap[j.transcription_version_id].push(j.acte_source_id);
  }

  return { versions: verRes.data ?? [], versionSources: joinMap };
}

export async function createVersion(acteId: string, payload: {
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
}): Promise<TranscriptionVersionRow> {
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

  const insRes = (await supabase
    .from("ec_transcription_versions")
    .insert(insertPayload)
    .select(
      [
        "id",
        "acte_id",
        "version",
        "status",
        "content",
        "transcription_kind",
        "source_lecture_kind",
        "conventions_text",
        "langue_vue",
        "ecriture_vue",
        "confidence",
        "created_at",
        "created_by",
        "validated_at",
        "validated_by",
        "contested_at",
        "contested_by",
        "contested_reason",
        "gabarit_id",
      ].join(",")
    )
    .single()) as unknown as SBResult<TranscriptionVersionRow>;

  assertNoSbError(insRes, "insert version");
  const row = insRes.data;

  if (payload.sourceIds && payload.sourceIds.length) {
    const joinPayload = payload.sourceIds.map((sid) => ({
      transcription_version_id: row.id,
      acte_source_id: sid,
    }));
    await supabase.from("ec_transcription_version_sources").insert(joinPayload);
  }

  return row;
}

export async function setVersionStatus(versionId: string, patch: Partial<TranscriptionVersionRow>) {
  const { error } = await supabase.from("ec_transcription_versions").update(patch).eq("id", versionId);
  if (error) throw error;
}

export async function insertAnnotation(payload: Omit<AnnotationRow, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("ec_transcription_annotations")
    .insert(payload)
    .select("id, transcription_version_id, type, start_offset, end_offset, quote, prefix, suffix, status, comment, created_at")
    .single();
  if (error) throw error;
  return data as AnnotationRow;
}

export async function updateAnnotation(annotationId: string, patch: Partial<AnnotationRow>) {
  const { data, error } = await supabase
    .from("ec_transcription_annotations")
    .update(patch)
    .eq("id", annotationId)
    .select("id, transcription_version_id, type, start_offset, end_offset, quote, prefix, suffix, status, comment, created_at")
    .single();
  if (error) throw error;
  return data as AnnotationRow;
}

export async function deleteAnnotation(annotationId: string) {
  const { error } = await supabase.from("ec_transcription_annotations").delete().eq("id", annotationId);
  if (error) throw error;
}

export async function insertNote(payload: Omit<NoteRow, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("ec_transcription_notes")
    .insert(payload)
    .select("id, transcription_version_id, start_offset, end_offset, quote, prefix, suffix, content, created_at")
    .single();
  if (error) throw error;
  return data as NoteRow;
}

export async function updateNote(noteId: string, patch: Partial<NoteRow>) {
  const { data, error } = await supabase
    .from("ec_transcription_notes")
    .update(patch)
    .eq("id", noteId)
    .select("id, transcription_version_id, start_offset, end_offset, quote, prefix, suffix, content, created_at")
    .single();
  if (error) throw error;
  return data as NoteRow;
}

export async function deleteNote(noteId: string) {
  const { error } = await supabase.from("ec_transcription_notes").delete().eq("id", noteId);
  if (error) throw error;
}

// ----------------- Tags persistence -----------------

export async function createTag(payload: Omit<TranscriptionTagRow, "id" | "created_at">): Promise<TranscriptionTagRow> {
  const { data, error } = await supabase
    .from("ec_transcription_tags")
    .insert(payload)
    .select("id, transcription_version_id, kind, label, start_offset, end_offset, quote, prefix, suffix, linked_acteur_id, created_at")
    .single();
  if (error) throw error;
  return data as TranscriptionTagRow;
}

export async function deleteTag(tagId: string) {
  const { error } = await supabase.from("ec_transcription_tags").delete().eq("id", tagId);
  if (error) throw error;
}

export async function syncVersionSources(versionId: string, currentSourceIds: string[], nextSourceIds: string[]) {
  const current = new Set(currentSourceIds);
  const next = new Set(nextSourceIds);

  const toAdd = Array.from(next).filter((x) => !current.has(x));
  const toDel = Array.from(current).filter((x) => !next.has(x));

  if (toDel.length) {
    await supabase
      .from("ec_transcription_version_sources")
      .delete()
      .eq("transcription_version_id", versionId)
      .in("acte_source_id", toDel);
  }

  if (toAdd.length) {
    await supabase
      .from("ec_transcription_version_sources")
      .insert(toAdd.map((sid) => ({ transcription_version_id: versionId, acte_source_id: sid })));
  }
}

export async function persistAnnotationStatuses(changed: Array<{ id: string; status: AnchorStatus }>) {
  await Promise.all(
    changed.map((c) =>
      supabase.from("ec_transcription_annotations").update({ status: c.status }).eq("id", c.id)
    )
  );
}
