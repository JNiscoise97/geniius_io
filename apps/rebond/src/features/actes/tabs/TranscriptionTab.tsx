// TranscriptionTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  GitCompare,
  Plus,
  Save,
  Settings2,
  Tags,
  Wand2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";

type SBResult<T> = { data: T | null; error: any };

function assertNoSbError<T>(res: SBResult<T>, context: string): asserts res is { data: T; error: null } {
  if (res.error) {
    console.error(context, res.error);
    throw res.error;
  }
}

type TranscriptionStatus = "draft" | "in_review" | "validated" | "contested";
type AnchorStatus = "ok" | "needs_review" | "orphaned";

type TranscriptionKind = "diplomatique" | "semi_normalisee" | "travail";
type SourceLectureKind = "image_originale" | "microfilm" | "transcription_secondaire" | "autre";
type ConfidenceLevel = "high" | "medium" | "low";

type EcActeRow = {
  id: string;
  date: string | null;
  numero_acte: string | null;
  registre_id: string | null;
  bureau_id: string | null;
  type_acte: string | null; // ex: "naissance"
  type_acte_ref: string | null;
  label: string | null;
};

type EcActeSourceRow = {
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

type TranscriptionVersionRow = {
  id: string;
  acte_id: string;
  version: number;
  status: TranscriptionStatus;
  content: string;

  // --- Métadonnées de transcription (bloc 1) ---
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

  // gabarit (optionnel)
  gabarit_id: string | null;
};

type TranscriptionVersionSourceRow = {
  id: string;
  transcription_version_id: string;
  acte_source_id: string;
};

type AnnotationRow = {
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

type NoteRow = {
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

type ActeurLightRow = {
  id: string;
  role: string | null;
  prenom: string | null;
  nom: string | null;
};

type GabaritRow = {
  id: string;
  label: string;
  scope_type_acte: string | null; // "naissance"/"mariage"...
  bureau_id: string | null;
  registre_id: string | null;
  year_from: number | null;
  year_to: number | null;
  template_content: string;
  created_at: string;
};

// ---------------- UI helpers ----------------

function statusBadge(status: TranscriptionStatus) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Brouillon</Badge>;
    case "in_review":
      return <Badge className="bg-yellow-600 text-white">En relecture</Badge>;
    case "validated":
      return <Badge className="bg-emerald-600 text-white">Validée</Badge>;
    case "contested":
      return <Badge className="bg-red-600 text-white">Contestée</Badge>;
  }
}

function anchorBadge(status: AnchorStatus) {
  switch (status) {
    case "ok":
      return <Badge variant="secondary">OK</Badge>;
    case "needs_review":
      return <Badge className="bg-yellow-600 text-white">À revoir</Badge>;
    case "orphaned":
      return <Badge className="bg-red-600 text-white">Orpheline</Badge>;
  }
}

function computeAnchor(content: string, start: number, end: number) {
  const quote = content.slice(start, end);
  const prefixStart = Math.max(0, start - 40);
  const suffixEnd = Math.min(content.length, end + 40);
  const prefix = content.slice(prefixStart, start);
  const suffix = content.slice(end, suffixEnd);
  return { quote, prefix, suffix };
}

function safeYearFromDate(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

function formatSourceLabel(s: EcActeSourceRow) {
  const depot = [s.depot_type, s.nom_depot].filter(Boolean).join(" · ");
  const cote = [s.serie, s.cote].filter(Boolean).join(" ");
  const folio = s.folio_page ? `p./folio ${s.folio_page}` : "";
  const vue = s.vue_image ? `vue ${s.vue_image}` : "";
  const rest = [cote, folio, vue].filter(Boolean).join(" · ");
  return [depot, rest].filter(Boolean).join(" — ");
}

// Diff très simple par lignes : on met en évidence les lignes qui diffèrent à l’index.
// (Suffisant pour une V1 “diff visuel” sans dépendances.)
function buildLineDiff(left: string, right: string) {
  const L = left.split(/\r?\n/);
  const R = right.split(/\r?\n/);
  const n = Math.max(L.length, R.length);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const a = L[i] ?? "";
    const b = R[i] ?? "";
    rows.push({
      i,
      left: a,
      right: b,
      same: a === b,
    });
  }
  return rows;
}

// Repérages minimalistes (sans NLP / OCR) : dates “visibles” + tokens capitalisés.
function detectDates(text: string) {
  const out = new Set<string>();
  const re1 = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
  const re2 = /\b(\d{4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re1.exec(text))) out.add(m[0]);
  // On garde les années mais on limite un peu (1800-2099)
  while ((m = re2.exec(text))) {
    const y = Number(m[1]);
    if (y >= 1800 && y <= 2099) out.add(m[0]);
  }
  return Array.from(out).slice(0, 30);
}

function detectLikelyNames(text: string) {
  // heuristique : mots en MAJUSCULES (nom) + limite
  const out = new Set<string>();
  const re = /\b[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]{3,}\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.add(m[0]);
  return Array.from(out).slice(0, 30);
}

type Props = {
  acteId: string;
  onGoToTab?: (tabLabel: string) => void; // CTA vers autres onglets (optionnel)
};

export default function TranscriptionTab({ acteId, onGoToTab }: Props) {
  const [loading, setLoading] = useState(false);

  // Acte + sources
  const [acte, setActe] = useState<EcActeRow | null>(null);
  const [acteSources, setActeSources] = useState<EcActeSourceRow[]>([]);

  // Versions
  const [versions, setVersions] = useState<TranscriptionVersionRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const currentVersion = useMemo(
    () => versions.find((v) => v.id === currentId) ?? null,
    [versions, currentId]
  );

  // Join table: version -> sources
  const [versionSources, setVersionSources] = useState<Record<string, string[]>>({}); // versionId -> acte_source_id[]

  // Editor
  const [editorValue, setEditorValue] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Annotations / notes
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);

  // Repérages + acteurs (pont)
  const [acteurs, setActeurs] = useState<ActeurLightRow[]>([]);

  // Gabarits / similarités
  const [gabarits, setGabarits] = useState<GabaritRow[]>([]);

  // Selection state
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  // Sheets
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<
    "annotation" | "note" | "metadata" | "sources" | "compare"
  >("annotation");

  // Draft payload for annotation/note
  const [annoType, setAnnoType] = useState<AnnotationRow["type"]>("doubt");
  const [annoComment, setAnnoComment] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Metadata drafts
  const [metaDraft, setMetaDraft] = useState<Partial<TranscriptionVersionRow>>({});
  const [selectedSourceIdsDraft, setSelectedSourceIdsDraft] = useState<string[]>([]);

  // Compare
  const [compareLeftId, setCompareLeftId] = useState<string>("");
  const [compareRightId, setCompareRightId] = useState<string>("");

  // ---------------- Load acte + sources + versions ----------------

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);

      try {
        // 1) acte
        const acteRes = await supabase
          .from("etat_civil_actes")
          .select("id, date, numero_acte, registre_id, bureau_id, type_acte, type_acte_ref, label")
          .eq("id", acteId)
          .single();

        if (acteRes.error) throw acteRes.error;
        const acteRow = acteRes.data as EcActeRow;

        // 2) sources par dépôts (déjà dans ton onglet référence archive)
        const sourcesRes = await supabase
          .from("etat_civil_actes_sources")
          .select(
            "id, acte_id, depot_type, nom_depot, serie, cote, registre, folio_page, vue_image, support, langue, ecriture, etat_conservation, note, created_at"
          )
          .eq("acte_id", acteId)
          .order("created_at", { ascending: true });

        if (sourcesRes.error) throw sourcesRes.error;

        // 3) transcription versions
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

        if (verRes.error) throw verRes.error;

        // 4) join version <-> sources
        //    (table recommandée : ec_transcription_version_sources)
        const joinRes = await supabase
          .from("ec_transcription_version_sources")
          .select("id, transcription_version_id, acte_source_id")
          .in(
            "transcription_version_id",
            (verRes.data ?? []).map((r: any) => r.id)
          );

        // joinRes peut échouer si tu n’as pas encore créé la table => on gère
        const joinRows = joinRes.error ? [] : ((joinRes.data ?? []) as TranscriptionVersionSourceRow[]);
        const joinMap: Record<string, string[]> = {};
        for (const j of joinRows) {
          joinMap[j.transcription_version_id] = joinMap[j.transcription_version_id] ?? [];
          joinMap[j.transcription_version_id].push(j.acte_source_id);
        }

        // 5) acteurs (pont – lecture seule ici)
        const actRes = await supabase
          .from("v_acteurs_enrichis")
          .select("id, role, prenom, nom")
          .eq("acte_id", acteId)
          .order("role", { ascending: true });

        // 6) gabarits (similarité inter-actes – indispensable pour toi)
        //    (table recommandée : ec_transcription_gabarits)
        const year = safeYearFromDate(acteRow.date);
        const gabRes = await supabase
          .from("ec_transcription_gabarits")
          .select("id, label, scope_type_acte, bureau_id, registre_id, year_from, year_to, template_content, created_at")
          .or(
            [
              acteRow.registre_id ? `registre_id.eq.${acteRow.registre_id}` : "",
              acteRow.bureau_id ? `bureau_id.eq.${acteRow.bureau_id}` : "",
            ].filter(Boolean).join(",")
          )
          .order("created_at", { ascending: false });

        if (cancelled) return;

        setActe(acteRow);
        setActeSources((sourcesRes.data ?? []) as EcActeSourceRow[]);
        setVersions(verRes.data ?? []);
        setVersionSources(joinMap);

        setActeurs(((actRes.data ?? []) as ActeurLightRow[]) ?? []);

        // Filtre “intelligent” côté front : même type acte + plage année (si définie)
        const allGab = ((gabRes.data ?? []) as GabaritRow[]) ?? [];
        const filtered = allGab.filter((g) => {
          const okType = !g.scope_type_acte || !acteRow.type_acte || g.scope_type_acte === acteRow.type_acte;
          if (!okType) return false;
          if (!year) return true;
          const from = g.year_from ?? null;
          const to = g.year_to ?? null;
          if (from && year < from) return false;
          if (to && year > to) return false;
          return true;
        });
        setGabarits(filtered);

        // Select latest by default
        if (!currentId && (verRes.data ?? []).length) {
          setCurrentId((verRes.data as any[])[0].id);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "Erreur lors du chargement de l’onglet Transcription");
        setActe(null);
        setActeSources([]);
        setVersions([]);
        setVersionSources({});
        setCurrentId(null);
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [acteId]);

  // ---------------- When version changes, load editor & children ----------------

  useEffect(() => {
    if (!currentVersion) return;

    setEditorValue(currentVersion.content ?? "");
    setIsDirty(false);
    setSelection(null);

    (async () => {
      const [a, n] = await Promise.all([
        supabase
          .from("ec_transcription_annotations")
          .select(
            "id, transcription_version_id, type, start_offset, end_offset, quote, prefix, suffix, status, comment, created_at"
          )
          .eq("transcription_version_id", currentVersion.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("ec_transcription_notes")
          .select("id, transcription_version_id, start_offset, end_offset, quote, prefix, suffix, content, created_at")
          .eq("transcription_version_id", currentVersion.id)
          .order("created_at", { ascending: true }),
      ]);

      if (a.error) setAnnotations([]);
      else setAnnotations((a.data ?? []) as AnnotationRow[]);

      if (n.error) setNotes([]);
      else setNotes((n.data ?? []) as NoteRow[]);
    })();
  }, [currentId]);

  // ---------------- Selection capture ----------------

  const captureSelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start === end) {
      setSelection(null);
      return;
    }
    setSelection({ start, end });
  };

  // ---------------- Version numbers ----------------

  const nextVersionNumber = useMemo(() => {
    const max = versions.reduce((acc, v) => Math.max(acc, v.version ?? 0), 0);
    return max + 1;
  }, [versions]);

  // ---------------- Create / save versions ----------------

  async function refreshVersionsAndSelect(idToSelect?: string) {
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

    if (verRes.error) throw verRes.error;

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

    setVersions(verRes.data ?? []);
    setVersionSources(joinMap);

    if (idToSelect) setCurrentId(idToSelect);
  }

  const createNewVersion = async (payload: {
    status: TranscriptionStatus;
    content: string;
    gabarit_id?: string | null;
    // meta defaults
    transcription_kind?: TranscriptionKind | null;
    source_lecture_kind?: SourceLectureKind | null;
    conventions_text?: string | null;
    langue_vue?: string | null;
    ecriture_vue?: string | null;
    confidence?: ConfidenceLevel | null;
    sourceIds?: string[];
  }) => {
    if (!acteId) return;

    setLoading(true);
    try {
      const insertPayload: any = {
        acte_id: acteId,
        version: nextVersionNumber,
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

      // Attacher les sources (si table existante)
      if (payload.sourceIds && payload.sourceIds.length) {
        const joinPayload = payload.sourceIds.map((sid) => ({
          transcription_version_id: row.id,
          acte_source_id: sid,
        }));
        const join = await supabase.from("ec_transcription_version_sources").insert(joinPayload);
        // Si la table n’existe pas encore, on échoue silencieusement avec un toast explicite
        if (join.error) {
          toast("Sources non attachées (table ec_transcription_version_sources absente ?)", { icon: "⚠️" });
        }
      }

      toast.success("Version créée");
      await refreshVersionsAndSelect(row.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Erreur lors de la création de version");
    } finally {
      setLoading(false);
    }
  };

  const saveAsNewDraftVersion = async () => {
    // On crée une nouvelle version (pas un update in-place) => cohérent avec “versions”
    await createNewVersion({
      status: "draft",
      content: editorValue ?? "",
      transcription_kind: currentVersion?.transcription_kind ?? null,
      source_lecture_kind: currentVersion?.source_lecture_kind ?? null,
      conventions_text: currentVersion?.conventions_text ?? null,
      langue_vue: currentVersion?.langue_vue ?? null,
      ecriture_vue: currentVersion?.ecriture_vue ?? null,
      confidence: currentVersion?.confidence ?? null,
      sourceIds: (currentVersion?.id ? (versionSources[currentVersion.id] ?? []) : []) as string[],
    });
  };

  const setValidated = async () => {
    if (!currentVersion) return;
    if (currentVersion.status === "validated") return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("ec_transcription_versions")
        .update({ status: "validated", validated_at: now })
        .eq("id", currentVersion.id);

      if (error) throw error;

      toast.success("Version validée");
      await refreshVersionsAndSelect(currentVersion.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Erreur de validation");
    } finally {
      setLoading(false);
    }
  };

  const setInReview = async () => {
    if (!currentVersion) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("ec_transcription_versions")
        .update({ status: "in_review" })
        .eq("id", currentVersion.id);
      if (error) throw error;
      toast.success("Marquée en relecture");
      await refreshVersionsAndSelect(currentVersion.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Annotations / Notes ----------------

  const openAddAnnotation = () => {
    if (!currentVersion) return;
    if (!selection) {
      toast("Sélectionnez un passage dans le texte", { icon: "🖊️" });
      return;
    }
    setSheetMode("annotation");
    setAnnoType("doubt");
    setAnnoComment("");
    setSheetOpen(true);
  };

  const openAddNote = () => {
    if (!currentVersion) return;
    setSheetMode("note");
    setNoteContent("");
    setSheetOpen(true);
  };

  const submitAnnotation = async () => {
    if (!currentVersion || !selection) return;

    const { quote, prefix, suffix } = computeAnchor(editorValue, selection.start, selection.end);
    const payload = {
      transcription_version_id: currentVersion.id,
      type: annoType,
      start_offset: selection.start,
      end_offset: selection.end,
      quote,
      prefix,
      suffix,
      status: "ok" as AnchorStatus,
      comment: annoComment || null,
    };

    const { data, error } = await supabase
      .from("ec_transcription_annotations")
      .insert(payload)
      .select(
        "id, transcription_version_id, type, start_offset, end_offset, quote, prefix, suffix, status, comment, created_at"
      )
      .single();

    if (error) {
      console.error(error);
      toast.error("Erreur lors de l’ajout de l’annotation");
      return;
    }

    setAnnotations((prev) => [...prev, data as AnnotationRow]);
    toast.success("Annotation ajoutée");
    setSheetOpen(false);
  };

  const submitNote = async () => {
    if (!currentVersion) return;

    const anchored = selection
      ? computeAnchor(editorValue, selection.start, selection.end)
      : { quote: null, prefix: null, suffix: null };

    const payload = {
      transcription_version_id: currentVersion.id,
      start_offset: selection ? selection.start : null,
      end_offset: selection ? selection.end : null,
      quote: selection ? anchored.quote : null,
      prefix: selection ? anchored.prefix : null,
      suffix: selection ? anchored.suffix : null,
      content: noteContent.trim(),
    };

    if (!payload.content) {
      toast("Écrivez une note", { icon: "📝" });
      return;
    }

    const { data, error } = await supabase
      .from("ec_transcription_notes")
      .insert(payload)
      .select("id, transcription_version_id, start_offset, end_offset, quote, prefix, suffix, content, created_at")
      .single();

    if (error) {
      console.error(error);
      toast.error("Erreur lors de l’ajout de la note");
      return;
    }

    setNotes((prev) => [...prev, data as NoteRow]);
    toast.success("Note ajoutée");
    setSheetOpen(false);
  };

  const jumpToRange = (start: number, end: number) => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(start, end);
  };

  // ---------------- Metadata editing (intuitif + relié aux “sources par dépôts”) ----------------

  const openMetadata = () => {
    if (!currentVersion) return;
    setSheetMode("metadata");

    setMetaDraft({
      transcription_kind: currentVersion.transcription_kind ?? null,
      source_lecture_kind: currentVersion.source_lecture_kind ?? null,
      conventions_text: currentVersion.conventions_text ?? null,
      langue_vue: currentVersion.langue_vue ?? null,
      ecriture_vue: currentVersion.ecriture_vue ?? null,
      confidence: currentVersion.confidence ?? null,
      status: currentVersion.status,
      contested_reason: currentVersion.contested_reason ?? null,
    });

    setSelectedSourceIdsDraft(versionSources[currentVersion.id] ?? []);
    setSheetOpen(true);
  };

  const toggleSourceDraft = (sourceId: string) => {
    setSelectedSourceIdsDraft((prev) => {
      if (prev.includes(sourceId)) return prev.filter((x) => x !== sourceId);
      return [...prev, sourceId];
    });
  };

  const saveMetadata = async () => {
    if (!currentVersion) return;

    setLoading(true);
    try {
      // 1) update version meta
      const patch: any = {
        transcription_kind: metaDraft.transcription_kind ?? null,
        source_lecture_kind: metaDraft.source_lecture_kind ?? null,
        conventions_text: metaDraft.conventions_text ?? null,
        langue_vue: metaDraft.langue_vue ?? null,
        ecriture_vue: metaDraft.ecriture_vue ?? null,
        confidence: metaDraft.confidence ?? null,
      };

      // statut “contesté” optionnel
      // -> si l’utilisateur met “contesté”, on renseigne contested_reason
      if (metaDraft.status === "contested") {
        patch.status = "contested";
        patch.contested_at = new Date().toISOString();
        patch.contested_reason = (metaDraft.contested_reason ?? "").trim() || null;
      }

      const u = await supabase.from("ec_transcription_versions").update(patch).eq("id", currentVersion.id);
      if (u.error) throw u.error;

      // 2) sync join table version_sources
      //    On fait : delete diff + insert diff
      //    Si la table n’existe pas, on explique et on n’empêche pas le reste.
      const current = new Set(versionSources[currentVersion.id] ?? []);
      const next = new Set(selectedSourceIdsDraft);

      const toAdd = Array.from(next).filter((x) => !current.has(x));
      const toDel = Array.from(current).filter((x) => !next.has(x));

      // delete
      if (toDel.length) {
        const del = await supabase
          .from("ec_transcription_version_sources")
          .delete()
          .eq("transcription_version_id", currentVersion.id)
          .in("acte_source_id", toDel);

        if (del.error) {
          toast("Impossible de synchroniser les sources (table ec_transcription_version_sources absente ?)", {
            icon: "⚠️",
          });
        }
      }

      // insert
      if (toAdd.length) {
        const ins = await supabase
          .from("ec_transcription_version_sources")
          .insert(toAdd.map((sid) => ({ transcription_version_id: currentVersion.id, acte_source_id: sid })));

        if (ins.error) {
          toast("Impossible de synchroniser les sources (table ec_transcription_version_sources absente ?)", {
            icon: "⚠️",
          });
        }
      }

      toast.success("Métadonnées enregistrées");
      await refreshVersionsAndSelect(currentVersion.id);
      setSheetOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Erreur lors de l’enregistrement des métadonnées");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Compare UI ----------------

  const openCompare = () => {
    setSheetMode("compare");
    // preselect : current vs previous
    const sorted = [...versions].sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
    const cur = currentVersion?.id ?? (sorted[0]?.id ?? "");
    const other = sorted.find((v) => v.id !== cur)?.id ?? "";
    setCompareLeftId(cur);
    setCompareRightId(other);
    setSheetOpen(true);
  };

  const compareLeft = versions.find((v) => v.id === compareLeftId) ?? null;
  const compareRight = versions.find((v) => v.id === compareRightId) ?? null;
  const diffRows = useMemo(() => {
    if (!compareLeft || !compareRight) return [];
    return buildLineDiff(compareLeft.content ?? "", compareRight.content ?? "");
  }, [compareLeftId, compareRightId, versions]);

  // ---------------- Repérages (panneau + CTA) ----------------

  const repDates = useMemo(() => detectDates(editorValue), [editorValue]);
  const repNames = useMemo(() => detectLikelyNames(editorValue), [editorValue]);

  // ---------------- Gabarits ----------------

  const createDraftFromGabarit = async (g: GabaritRow) => {
    // important : brouillon + bandeau “à relire”
    const defaults: Partial<TranscriptionVersionRow> = {
      transcription_kind: "travail",
      source_lecture_kind: "image_originale",
      conventions_text:
        "Conventions conseillées : [illisible], [barré], [lacune], [ajout en marge].",
      confidence: "low",
    };

    await createNewVersion({
      status: "draft",
      content: g.template_content,
      gabarit_id: g.id,
      transcription_kind: defaults.transcription_kind ?? null,
      source_lecture_kind: defaults.source_lecture_kind ?? null,
      conventions_text: defaults.conventions_text ?? null,
      confidence: defaults.confidence ?? null,
      sourceIds: [], // tu choisis ensuite les sources exactes en métadonnées
    });

    toast("Brouillon créé depuis un gabarit : relisez mot à mot.", { icon: "🧩", duration: 5000 });
  };

  // ---------------- Render ----------------

  if (loading && !currentVersion && versions.length === 0) {
    return <div className="p-4 text-sm text-slate-600">Chargement…</div>;
  }

  const currentSourceLabels = (currentVersion?.id ? (versionSources[currentVersion.id] ?? []) : [])
    .map((id) => acteSources.find((s) => s.id === id))
    .filter(Boolean) as EcActeSourceRow[];

  return (
    <div className="p-4 space-y-4">
      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Transcription</h2>
              {currentVersion ? statusBadge(currentVersion.status) : null}
              {annotations.some((a) => a.status === "needs_review" || a.status === "orphaned") && (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )}
            </div>

            <p className="text-sm text-slate-600">
              Le texte est la source canonique. Métadonnées, repérages, gabarits et ponts t’aident à travailler{" "}
              <span className="font-medium">sans générer</span> ni interpréter le contenu à ta place.
            </p>

            {/* Mini résumé meta (intuitif) */}
            {currentVersion && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  <Settings2 className="h-3.5 w-3.5" />
                  {currentVersion.transcription_kind ? (
                    <>
                      Type :{" "}
                      <span className="font-medium">
                        {currentVersion.transcription_kind === "diplomatique"
                          ? "Diplomatique"
                          : currentVersion.transcription_kind === "semi_normalisee"
                          ? "Semi-normalisée"
                          : "Travail"}
                      </span>
                    </>
                  ) : (
                    <>Type : <span className="font-medium">non précisé</span></>
                  )}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  <Tags className="h-3.5 w-3.5" />
                  {currentSourceLabels.length ? (
                    <>
                      Sources : <span className="font-medium">{currentSourceLabels.length}</span>
                    </>
                  ) : (
                    <>Sources : <span className="font-medium">non rattachées</span></>
                  )}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  <Workflow className="h-3.5 w-3.5" />
                  {currentVersion.confidence ? (
                    <>
                      Confiance :{" "}
                      <span className="font-medium">
                        {currentVersion.confidence === "high"
                          ? "élevée"
                          : currentVersion.confidence === "medium"
                          ? "moyenne"
                          : "faible"}
                      </span>
                    </>
                  ) : (
                    <>Confiance : <span className="font-medium">non précisée</span></>
                  )}
                </span>

                {currentVersion.gabarit_id ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>Issue d’un gabarit</span>
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currentId ?? ""}
              onChange={(e) => setCurrentId(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none"
            >
              <option value="" disabled>
                Sélectionner une version
              </option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version} · {v.status} · {new Date(v.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>

            <Button variant="outline" onClick={openMetadata} disabled={!currentVersion} className="gap-2">
              <Settings2 className="w-4 h-4" />
              Métadonnées
            </Button>

            <Button variant="outline" onClick={openCompare} disabled={versions.length < 2} className="gap-2">
              <GitCompare className="w-4 h-4" />
              Diff
            </Button>

            <Button
              variant="secondary"
              onClick={() =>
                createNewVersion({
                  status: "draft",
                  content: "",
                  transcription_kind: "travail",
                  source_lecture_kind: "image_originale",
                  conventions_text:
                    "Conventions conseillées : [illisible], [barré], [lacune], [ajout en marge].",
                  confidence: "low",
                  sourceIds: [],
                })
              }
              disabled={loading}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau brouillon
            </Button>

            <Button onClick={setValidated} disabled={loading || !currentVersion || currentVersion.status === "validated"} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Valider
            </Button>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Editor */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* “Bandeau gabarit” si applicable */}
          {currentVersion?.gabarit_id ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Brouillon issu d’un gabarit : <span className="font-semibold">relisez intégralement</span> et adaptez le texte à l’acte réel.
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">Texte</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={openAddAnnotation} className="gap-2">
                <Plus className="w-4 h-4" /> Annotation
              </Button>
              <Button variant="outline" onClick={openAddNote} className="gap-2">
                <Plus className="w-4 h-4" /> Note
              </Button>
              <Button
                onClick={saveAsNewDraftVersion}
                disabled={loading}
                className="gap-2"
                title="Enregistre une nouvelle version (le texte reste l'autorité)"
              >
                <Save className="w-4 h-4" />
                Enregistrer (v{nextVersionNumber})
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <textarea
              ref={textareaRef}
              value={editorValue}
              onChange={(e) => {
                setEditorValue(e.target.value);
                setIsDirty(true);
              }}
              onMouseUp={captureSelection}
              onKeyUp={captureSelection}
              placeholder="Transcrivez ici le texte… (orthographe d’époque, ex : [illisible], [barré], [lacune], [ajout en marge])"
              className="min-h-[520px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-900 shadow-sm outline-none focus:border-slate-400"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <div>
                {selection ? (
                  <span>
                    Sélection : {selection.start}–{selection.end} ({selection.end - selection.start} caractères)
                  </span>
                ) : (
                  <span>Sélectionnez un passage pour créer une annotation ou une note ancrée.</span>
                )}
              </div>
              {isDirty ? <span className="text-yellow-700">Modifications non enregistrées</span> : <span>—</span>}
            </div>

            {/* Sources rattachées (utile pour ton cas AD974 vs ANOM) */}
            {currentVersion && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-700">Sources utilisées pour cette transcription</div>
                {currentSourceLabels.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-slate-700">
                    {currentSourceLabels.map((s) => (
                      <li key={s.id} className="list-disc ml-4">
                        {formatSourceLabel(s)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-xs text-slate-600">
                    Aucune source rattachée. (Tu peux l’indiquer dans <span className="font-medium">Métadonnées</span>.)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Repérages + CTA (bloc 6, hyper important) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Repérages & ponts</div>
              <Badge variant="secondary">passif</Badge>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-700">Acteurs déjà saisis (lecture seule)</div>
                {acteurs.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {acteurs.slice(0, 12).map((a) => (
                      <span
                        key={a.id}
                        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                      >
                        {a.role ? `${a.role} — ` : ""}
                        {[a.prenom, a.nom].filter(Boolean).join(" ").trim() || "(sans nom)"}
                      </span>
                    ))}
                    {acteurs.length > 12 ? (
                      <span className="text-xs text-slate-500">+{acteurs.length - 12}</span>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-600">Aucun acteur saisi.</div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGoToTab?.("Acteurs & rôles")}
                    disabled={!onGoToTab}
                  >
                    Aller à Acteurs & rôles
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGoToTab?.("Faits familiaux")}
                    disabled={!onGoToTab}
                  >
                    Aller à Faits familiaux
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGoToTab?.("Mentions complémentaires")}
                    disabled={!onGoToTab}
                  >
                    Aller à Mentions complémentaires
                  </Button>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Le pont peut servir à <span className="font-medium">pré-remplir</span> ailleurs, mais ici on ne crée rien automatiquement.
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-700">Dans le texte (heuristique)</div>
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="text-[11px] text-slate-600">Dates repérées</div>
                    {repDates.length ? (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {repDates.map((d) => (
                          <span key={d} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-600">—</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-600">Mots en majuscules (souvent noms)</div>
                    {repNames.length ? (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {repNames.map((w) => (
                          <span key={w} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                            {w}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-600">—</div>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Repérages purement visuels pour te guider. Aucune extraction persistée ici.
                </div>
              </div>
            </div>
          </div>

          {/* Gabarits / similarité inter-actes (indispensable pour toi) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Gabarits (actes similaires)</div>
              <Badge variant="secondary">{gabarits.length}</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Accélère la saisie sur séries homogènes (même commune / même registre / même période), sans remplacer la relecture.
            </p>

            <div className="mt-3 space-y-2">
              {gabarits.length === 0 && <div className="text-sm text-slate-600">Aucun gabarit trouvé pour ce contexte.</div>}
              {gabarits.slice(0, 8).map((g) => (
                <div key={g.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-semibold text-slate-900">{g.label}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    {[
                      g.scope_type_acte ? `Type : ${g.scope_type_acte}` : null,
                      g.year_from || g.year_to ? `Période : ${g.year_from ?? "?"}–${g.year_to ?? "?"}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => createDraftFromGabarit(g)} className="gap-2">
                      <Wand2 className="h-4 w-4" />
                      Créer brouillon
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Annotations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Annotations</div>
              <Badge variant="secondary">{annotations.length}</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {annotations.length === 0 && <div className="text-sm text-slate-600">Aucune annotation.</div>}
              {annotations.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => jumpToRange(a.start_offset, a.end_offset)}
                  className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-semibold text-slate-900">{a.type}</div>
                    <div className="shrink-0">{anchorBadge(a.status)}</div>
                  </div>
                  <div className="mt-1 text-sm text-slate-800 line-clamp-2">“{a.quote}”</div>
                  {a.comment ? <div className="mt-1 text-xs text-slate-600 line-clamp-2">{a.comment}</div> : null}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Notes du transcripteur</div>
              <Badge variant="secondary">{notes.length}</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {notes.length === 0 && <div className="text-sm text-slate-600">Aucune note.</div>}
              {notes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (n.start_offset != null && n.end_offset != null) jumpToRange(n.start_offset, n.end_offset);
                  }}
                  className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100"
                >
                  {n.quote ? <div className="text-xs text-slate-600 line-clamp-1">Ancrée : “{n.quote}”</div> : null}
                  <div className="mt-1 text-sm text-slate-900 line-clamp-3">{n.content}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Workflow quick actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Workflow</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={setInReview} disabled={!currentVersion || loading}>
                Marquer en relecture
              </Button>
              <Button variant="outline" size="sm" onClick={openCompare} disabled={versions.length < 2}>
                Comparer deux versions
              </Button>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Même si tu as peu de versions, le diff est utile pour ton cas “AD974 vs ANOM”.
            </div>
          </div>
        </div>
      </div>

      {/* Sheet: annotation / note / metadata / compare */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[520px] sm:w-[720px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>
              {sheetMode === "annotation"
                ? "Ajouter une annotation"
                : sheetMode === "note"
                ? "Ajouter une note"
                : sheetMode === "metadata"
                ? "Métadonnées de transcription"
                : sheetMode === "compare"
                ? "Comparer deux transcriptions"
                : "Panneau"}
            </SheetTitle>
            <SheetDescription>
              {sheetMode === "annotation"
                ? "Signalez un doute, une rature, une lacune… sans interprétation."
                : sheetMode === "note"
                ? "Note de lecture : choix de transcription, hésitation, justification."
                : sheetMode === "metadata"
                ? "Décrivez comment la transcription a été produite (type, sources exactes par dépôt, conventions, confiance…)."
                : sheetMode === "compare"
                ? "Diff visuel pour repérer les divergences entre deux transcriptions (ex : AD974 vs ANOM)."
                : ""}
            </SheetDescription>
          </SheetHeader>

          {/* --------- ANNOTATION / NOTE --------- */}
          {(sheetMode === "annotation" || sheetMode === "note") && (
            <div className="p-4 space-y-4">
              {selection ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-slate-600">Passage sélectionné</div>
                  <div className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">
                    {editorValue.slice(selection.start, selection.end)}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  Aucune sélection (ok pour une note globale). Pour une annotation, sélectionnez un passage.
                </div>
              )}

              {sheetMode === "annotation" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Type</label>
                    <select
                      value={annoType}
                      onChange={(e) => setAnnoType(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                    >
                      <option value="doubt">Doute (lecture incertaine)</option>
                      <option value="rature">Rature (barré)</option>
                      <option value="lacune">Lacune / trou</option>
                      <option value="mention">Mention (ex : marginale)</option>
                      <option value="other">Autre</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      Ces annotations restent liées au texte et n’extraient pas de faits.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">Commentaire (optionnel)</label>
                    <textarea
                      value={annoComment}
                      onChange={(e) => setAnnoComment(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                      placeholder="Ex : mot effacé, lecture incertaine…"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSheetOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={submitAnnotation} disabled={!selection}>
                      Ajouter
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Note</label>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                      placeholder="Ex : lecture confirmée par signature ; passage atypique ; incertitude persistante…"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      L’idée : rendre explicite tes choix de transcription (utile en relecture / collaboration).
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSheetOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={submitNote}>Ajouter</Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* --------- METADATA (bloc 1, avec sources AD974/ANOM etc.) --------- */}
          {sheetMode === "metadata" && currentVersion && (
            <div className="p-4 space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Sources exactes utilisées</div>
                  <Badge variant="secondary">{selectedSourceIdsDraft.length}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Important pour ton cas : un même acte peut être plus détaillé selon le dépôt (AD974 vs ANOM). Ici tu déclares{" "}
                  <span className="font-medium">quelle(s) source(s)</span> a(ont) servi à produire cette version.
                </p>

                <div className="mt-3 space-y-2">
                  {acteSources.length === 0 && (
                    <div className="text-sm text-slate-600">
                      Aucune source dans “Référence archive”. Ajoute-les d’abord, puis reviens ici.
                    </div>
                  )}

                  {acteSources.map((s) => {
                    const checked = selectedSourceIdsDraft.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSourceDraft(s.id)}
                          className="mt-0.5 h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900">{formatSourceLabel(s)}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            {[
                              s.support ? `Support : ${s.support}` : null,
                              s.langue ? `Langue : ${s.langue}` : null,
                              s.ecriture ? `Écriture : ${s.ecriture}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Caractéristiques de la transcription</div>
                <p className="mt-1 text-xs text-slate-600">
                  Ces champs sont là pour être intuitifs : ils décrivent <span className="font-medium">ta méthode</span>, pas le contenu.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-700">Type de transcription</label>
                    <select
                      value={(metaDraft.transcription_kind as any) ?? ""}
                      onChange={(e) =>
                        setMetaDraft((p) => ({ ...p, transcription_kind: (e.target.value || null) as any }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                    >
                      <option value=""></option>
                      <option value="diplomatique">Diplomatique (stricte, au plus près)</option>
                      <option value="semi_normalisee">Semi-normalisée (mise au clair limitée)</option>
                      <option value="travail">Travail (brouillon de lecture)</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      “Diplomatique” = fidèle aux graphies et ruptures ; “travail” = utile pour avancer vite puis relire.
                    </p>
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-700">Support de lecture</label>
                    <select
                      value={(metaDraft.source_lecture_kind as any) ?? ""}
                      onChange={(e) =>
                        setMetaDraft((p) => ({ ...p, source_lecture_kind: (e.target.value || null) as any }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                    >
                      <option value=""></option>
                      <option value="image_originale">Image numérisée / original (référence)</option>
                      <option value="microfilm">Microfilm</option>
                      <option value="transcription_secondaire">Transcription secondaire (tierce)</option>
                      <option value="autre">Autre</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      Sert à expliquer pourquoi certaines variantes existent (qualité, détail, etc.).
                    </p>
                  </div>

                  <div className="md:col-span-12">
                    <label className="block text-xs font-medium text-slate-700">Conventions utilisées</label>
                    <textarea
                      value={(metaDraft.conventions_text as any) ?? ""}
                      onChange={(e) => setMetaDraft((p) => ({ ...p, conventions_text: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                      placeholder="Ex : [illisible], [barré], [lacune], ⟦ajout marginal⟧ ..."
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Ça rend la lecture et la relecture plus “standard” au sein de ton corpus.
                    </p>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-700">Langue (vue)</label>
                    <input
                      value={(metaDraft.langue_vue as any) ?? ""}
                      onChange={(e) => setMetaDraft((p) => ({ ...p, langue_vue: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                      placeholder="français, créole, latin..."
                    />
                    <p className="mt-1 text-xs text-slate-500">Même si c’est déjà en “sources”, tu peux le réaffirmer ici par version.</p>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-700">Écriture (vue)</label>
                    <input
                      value={(metaDraft.ecriture_vue as any) ?? ""}
                      onChange={(e) => setMetaDraft((p) => ({ ...p, ecriture_vue: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                      placeholder="manuscrite, imprimée..."
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-700">Niveau de confiance</label>
                    <select
                      value={(metaDraft.confidence as any) ?? ""}
                      onChange={(e) =>
                        setMetaDraft((p) => ({ ...p, confidence: (e.target.value || null) as any }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                    >
                      <option value=""></option>
                      <option value="high">Élevée (lecture claire)</option>
                      <option value="medium">Moyenne (quelques doutes)</option>
                      <option value="low">Faible (beaucoup d’incertitudes)</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      Ce n’est pas “validé ou pas” : c’est un indicateur de qualité de lecture.
                    </p>
                  </div>

                  <div className="md:col-span-12">
                    <label className="block text-xs font-medium text-slate-700">Statut “contesté” (optionnel)</label>
                    <div className="mt-1 grid grid-cols-1 gap-3 md:grid-cols-12">
                      <div className="md:col-span-4">
                        <select
                          value={(metaDraft.status as any) ?? currentVersion.status}
                          onChange={(e) => setMetaDraft((p) => ({ ...p, status: e.target.value as any }))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                        >
                          <option value="draft">Brouillon</option>
                          <option value="in_review">En relecture</option>
                          <option value="validated">Validée</option>
                          <option value="contested">Contestée</option>
                        </select>
                      </div>
                      <div className="md:col-span-8">
                        <input
                          value={(metaDraft.contested_reason as any) ?? ""}
                          onChange={(e) => setMetaDraft((p) => ({ ...p, contested_reason: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                          placeholder="Raison (ex : divergence AD974/ANOM sur une phrase, lecture incertaine…)"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      “Contestée” = version à discuter / à arbitrer. Utile si plusieurs sources donnent des contenus divergents.
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-2 p-4 pt-0">
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={saveMetadata} disabled={loading}>
                  Enregistrer
                </Button>
              </div>
            </div>
          )}

          {/* --------- COMPARE (bloc 4) --------- */}
          {sheetMode === "compare" && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-6">
                  <label className="block text-xs font-medium text-slate-700">Version A</label>
                  <select
                    value={compareLeftId}
                    onChange={(e) => setCompareLeftId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                  >
                    <option value=""></option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version} · {v.status} · {new Date(v.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-6">
                  <label className="block text-xs font-medium text-slate-700">Version B</label>
                  <select
                    value={compareRightId}
                    onChange={(e) => setCompareRightId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                  >
                    <option value=""></option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version} · {v.status} · {new Date(v.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {compareLeft && compareRight ? (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="grid grid-cols-2 border-b bg-slate-50">
                    <div className="p-3 text-sm font-semibold text-slate-900">
                      v{compareLeft.version} · {compareLeft.status}
                      <div className="mt-1 text-xs text-slate-600">
                        Sources : {(versionSources[compareLeft.id] ?? []).length}
                      </div>
                    </div>
                    <div className="p-3 text-sm font-semibold text-slate-900 border-l">
                      v{compareRight.version} · {compareRight.status}
                      <div className="mt-1 text-xs text-slate-600">
                        Sources : {(versionSources[compareRight.id] ?? []).length}
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[560px] overflow-auto">
                    {diffRows.map((r) => (
                      <div key={r.i} className={`grid grid-cols-2 text-sm ${r.same ? "" : "bg-amber-50"}`}>
                        <div className="p-2 whitespace-pre-wrap border-b border-slate-100">{r.left || " "}</div>
                        <div className="p-2 whitespace-pre-wrap border-b border-slate-100 border-l">{r.right || " "}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600">Sélectionne deux versions pour afficher le diff.</div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
