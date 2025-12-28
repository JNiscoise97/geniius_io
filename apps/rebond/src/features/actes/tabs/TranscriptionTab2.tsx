// TranscriptionTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
  SeparatorHorizontal,
  Eye,
  Pencil,
  Trash2,
  GripVertical,
  Calendar,
  User,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

import {
  PAGE_BREAK_TOKEN,
  type AnchorStatus,
  type AnnotationRow,
  type ConfidenceLevel,
  type EcActeRow,
  type EcActeSourceRow,
  type GabaritRow,
  type Hit,
  type NoteRow,
  type SourceLectureKind,
  type TranscriptionKind,
  type TranscriptionStatus,
  type TranscriptionVersionRow,
  type TranscriptionTagRow,
  buildLineDiff,
  computeAnchor,
  detectActeReperages,
  formatSourceLabel,
  insertAtSelection,
  loadActeBundle,
  loadVersionChildren,
  normalizeSpaces,
  persistAnnotationStatuses,
  revalidateAnchor,
  refreshVersions,
  setVersionStatus,
  splitIntoReadableBlocks,
  syncVersionSources,
  createVersion,
  chooseBestGabaritForInitialDraft,
  updateAnnotation,
  deleteAnnotation,
  updateNote,
  deleteNote,
  createTag,
  deleteTag,
  loadVersionTags,
} from "./transcriptionTab.service2";

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

function tagBadge(kind: TranscriptionTagRow["kind"]) {
  switch (kind) {
    case "date":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700">
          <Calendar className="h-3.5 w-3.5" />
          Date
        </span>
      );
    case "acteur":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700">
          <User className="h-3.5 w-3.5" />
          Acteur
        </span>
      );
    case "lieu":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700">
          <MapPin className="h-3.5 w-3.5" />
          Lieu
        </span>
      );
  }
}

type Props = {
  acteId: string;
  onGoToTab?: (tabLabel: string) => void;
};

type SheetMode =
  | "annotation"
  | "note"
  | "metadata"
  | "compare"
  | "tag"
  | "charte";


type SplitState = {
  leftPct: number; // 40..80
};

const SPLIT_LS_KEY = "rebond.transcription.split";

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
  const [versionSources, setVersionSources] = useState<Record<string, string[]>>({});

  // Editor
  const [editorValue, setEditorValue] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Edit vs Lecture modes
  const [textMode, setTextMode] = useState<"edit" | "read">("edit");

  // Annotations / notes / tags
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [tags, setTags] = useState<TranscriptionTagRow[]>([]);

  // Repérages + acteurs (pont)
  const [acteurs, setActeurs] = useState<Array<{ id: string; role: string | null; prenom: string | null; nom: string | null }>>([]);

  // Gabarits
  const [gabarits, setGabarits] = useState<GabaritRow[]>([]);

  // Selection state
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  // Sheets
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("annotation");

  // Draft payload for annotation/note/tag
  const [annoType, setAnnoType] = useState<AnnotationRow["type"]>("doubt");
  const [annoComment, setAnnoComment] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Editing existing annotation / note
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Tagging
  const [tagKind, setTagKind] = useState<TranscriptionTagRow["kind"]>("date");
  const [tagLabel, setTagLabel] = useState<string>("");
  const [tagActeurId, setTagActeurId] = useState<string>(""); // only for kind=acteur

  // Metadata drafts
  const [metaDraft, setMetaDraft] = useState<Partial<TranscriptionVersionRow>>({});
  const [selectedSourceIdsDraft, setSelectedSourceIdsDraft] = useState<string[]>([]);

  // Compare
  const [compareLeftId, setCompareLeftId] = useState<string>("");
  const [compareRightId, setCompareRightId] = useState<string>("");

  // Anchor status override cache
  const [anchorStatusOverrides, setAnchorStatusOverrides] = useState<Record<string, AnchorStatus>>({});
  const anchorRevalidateTimer = useRef<number | null>(null);

  // Split pane
  const [split, setSplit] = useState<SplitState>(() => {
    try {
      const raw = localStorage.getItem(SPLIT_LS_KEY);
      if (!raw) return { leftPct: 66 };
      const parsed = JSON.parse(raw);
      const pct = Number(parsed?.leftPct);
      if (!Number.isFinite(pct)) return { leftPct: 66 };
      return { leftPct: Math.min(80, Math.max(40, pct)) };
    } catch {
      return { leftPct: 66 };
    }
  });
  const dragRef = useRef<{ dragging: boolean; startX: number; startPct: number } | null>(null);

  function setSplitPct(next: number) {
    const clamped = Math.min(80, Math.max(40, next));
    setSplit({ leftPct: clamped });
    try {
      localStorage.setItem(SPLIT_LS_KEY, JSON.stringify({ leftPct: clamped }));
    } catch {
      // ignore
    }
  }

  // ---------------- Load acte + sources + versions (AUTO v1 if empty) ----------------

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const bundle = await loadActeBundle(acteId);
        if (cancelled) return;

        setActe(bundle.acte);
        setActeSources(bundle.acteSources);
        setVersions(bundle.versions);
        setVersionSources(bundle.versionSources);
        setActeurs(bundle.acteurs);
        setGabarits(bundle.gabarits);

        // ✅ si aucune version : créer automatiquement un brouillon v1
        if (bundle.versions.length === 0) {
          const best = chooseBestGabaritForInitialDraft(bundle.acte, bundle.gabarits);
          const content = best?.template_content ?? "";
          const gabarit_id = best?.id ?? null;

          const created = await createVersion(acteId, {
            version: 1,
            status: "draft",
            content,
            gabarit_id,
            transcription_kind: "travail",
            source_lecture_kind: "image_originale",
            conventions_text:
              "Conventions conseillées : [illisible], [barré], [lacune], [ajout en marge], " +
              PAGE_BREAK_TOKEN +
              " (saut de page).",
            confidence: "low",
            sourceIds: [],
          });

          toast("Brouillon v1 créé automatiquement", { icon: "📝" });

          const refreshed = await refreshVersions(acteId);
          if (cancelled) return;
          setVersions(refreshed.versions);
          setVersionSources(refreshed.versionSources);
          setCurrentId(created.id);
          return;
        }

        // Sinon : sélectionner 1ère version si pas déjà sélectionnée
        if (!currentId && bundle.versions.length) {
          setCurrentId(bundle.versions[0].id);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "Erreur lors du chargement de l’onglet Transcription");
        setActe(null);
        setActeSources([]);
        setVersions([]);
        setVersionSources({});
        setCurrentId(null);
        setActeurs([]);
        setGabarits([]);
        setAnnotations([]);
        setNotes([]);
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acteId]);

  // ---------------- When version changes, load editor & children ----------------

  useEffect(() => {
    if (!currentVersion) return;

    setEditorValue(currentVersion.content ?? "");
    setIsDirty(false);
    setSelection(null);
    setTextMode("edit");
    setAnchorStatusOverrides({});

    (async () => {
      try {
        const children = await loadVersionChildren(currentVersion.id);
        const t = await loadVersionTags(currentVersion.id);
        setAnnotations(children.annotations);
        setNotes(children.notes);
        setTags(t);
      } catch (e) {
        console.error(e);
        setAnnotations([]);
        setNotes([]);
        setTags([]);
      }
    })();
  }, [currentId]); // volontairement sur currentId

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

  // ---------------- Refresh ----------------

  async function refreshVersionsAndSelect(idToSelect?: string) {
    const res = await refreshVersions(acteId);
    setVersions(res.versions);
    setVersionSources(res.versionSources);
    if (idToSelect) setCurrentId(idToSelect);
  }

  // ---------------- Create / save versions ----------------

  const createNewVersion = async (payload: {
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
  }) => {
    if (!acteId) return;

    setLoading(true);
    try {
      const row = await createVersion(acteId, {
        version: nextVersionNumber,
        ...payload,
      });
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
    await createNewVersion({
      status: "draft",
      content: editorValue ?? "",
      transcription_kind: currentVersion?.transcription_kind ?? null,
      source_lecture_kind: currentVersion?.source_lecture_kind ?? null,
      conventions_text: currentVersion?.conventions_text ?? null,
      langue_vue: currentVersion?.langue_vue ?? null,
      ecriture_vue: currentVersion?.ecriture_vue ?? null,
      confidence: currentVersion?.confidence ?? null,
      sourceIds: currentVersion?.id ? (versionSources[currentVersion.id] ?? []) : [],
    });
  };

  const setValidated = async () => {
    if (!currentVersion) return;
    if (currentVersion.status === "validated") return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      await setVersionStatus(currentVersion.id, { status: "validated", validated_at: now });
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
      await setVersionStatus(currentVersion.id, { status: "in_review" });
      toast.success("Marquée en relecture");
      await refreshVersionsAndSelect(currentVersion.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Annotations / Notes / Tags ----------------

  const openAddAnnotation = () => {
    if (!currentVersion) return;
    if (!selection) {
      toast("Sélectionnez un passage dans le texte", { icon: "🖊️" });
      return;
    }
    setEditingAnnotationId(null);
    setEditingNoteId(null);
    setSheetMode("annotation");
    setAnnoType("doubt");
    setAnnoComment("");
    setSheetOpen(true);
  };

  const openEditAnnotation = (a: AnnotationRow) => {
    setEditingAnnotationId(a.id);
    setEditingNoteId(null);
    setSheetMode("annotation");
    setAnnoType(a.type);
    setAnnoComment(a.comment ?? "");
    setSheetOpen(true);
  };

  const openAddNote = () => {
    if (!currentVersion) return;
    setEditingAnnotationId(null);
    setEditingNoteId(null);
    setSheetMode("note");
    setNoteContent("");
    setSheetOpen(true);
  };

  const openEditNote = (n: NoteRow) => {
    setEditingAnnotationId(null);
    setEditingNoteId(n.id);
    setSheetMode("note");
    setNoteContent(n.content ?? "");
    setSheetOpen(true);
  };

  const openTagPassage = () => {
    if (!currentVersion) return;
    if (!selection) {
      toast("Sélectionnez un passage à tagger", { icon: "🏷️" });
      return;
    }
    setEditingAnnotationId(null);
    setEditingNoteId(null);
    setSheetMode("tag");
    setTagKind("date");
    setTagLabel("");
    setTagActeurId("");
    setSheetOpen(true);
  };

  const submitAnnotation = async () => {
    if (!currentVersion || !selection) return;

    try {
      // Update
      if (editingAnnotationId) {
        const patch: Partial<AnnotationRow> = {
          type: annoType,
          comment: annoComment.trim() || null,
        };
        const updated = await updateAnnotation(editingAnnotationId, patch);
        setAnnotations((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        toast.success("Annotation modifiée");
        setSheetOpen(false);
        return;
      }

      // Insert
      const { quote, prefix, suffix } = computeAnchor(editorValue, selection.start, selection.end);
      const row = await (await import("./transcriptionTab.service2")).insertAnnotation({
        transcription_version_id: currentVersion.id,
        type: annoType,
        start_offset: selection.start,
        end_offset: selection.end,
        quote,
        prefix,
        suffix,
        status: "ok",
        comment: annoComment.trim() || null,
      } as any);

      setAnnotations((prev) => [...prev, row]);
      toast.success("Annotation ajoutée");
      setSheetOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l’enregistrement de l’annotation");
    }
  };

  const submitNote = async () => {
    if (!currentVersion) return;

    const anchored = selection
      ? computeAnchor(editorValue, selection.start, selection.end)
      : { quote: null, prefix: null, suffix: null };

    const content = noteContent.trim();
    if (!content) {
      toast("Écrivez une note", { icon: "📝" });
      return;
    }

    try {
      // Update
      if (editingNoteId) {
        const updated = await updateNote(editingNoteId, { content });
        setNotes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        toast.success("Note modifiée");
        setSheetOpen(false);
        return;
      }

      // Insert
      const payload = {
        transcription_version_id: currentVersion.id,
        start_offset: selection ? selection.start : null,
        end_offset: selection ? selection.end : null,
        quote: selection ? anchored.quote : null,
        prefix: selection ? anchored.prefix : null,
        suffix: selection ? anchored.suffix : null,
        content,
      };

      const row = await (await import("./transcriptionTab.service2")).insertNote(payload as any);
      setNotes((prev) => [...prev, row]);
      toast.success("Note ajoutée");
      setSheetOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l’enregistrement de la note");
    }
  };

  const submitTag = async () => {
    if (!currentVersion || !selection) return;

    try {
      const { quote, prefix, suffix } = computeAnchor(editorValue, selection.start, selection.end);

      const cleanLabel = tagLabel.trim() || quote?.trim() || "";
      if (!cleanLabel) {
        toast("Renseigne un libellé", { icon: "🏷️" });
        return;
      }

      // Lien acteur uniquement (pour l’instant)
      const acteurId = tagKind === "acteur" ? (tagActeurId || null) : null;
      if (tagKind === "acteur" && !acteurId) {
        toast("Choisis un acteur à lier", { icon: "👤" });
        return;
      }

      const row = await createTag({
        transcription_version_id: currentVersion.id,
        kind: tagKind,
        label: cleanLabel,
        start_offset: selection.start,
        end_offset: selection.end,
        quote,
        prefix,
        suffix,
        linked_acteur_id: acteurId,
      });

      setTags((prev) => [...prev, row]);
      toast.success("Tag ajouté");
      setSheetOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l’ajout du tag");
    }
  };

  const removeAnnotation = async (id: string) => {
    try {
      await deleteAnnotation(id);
      setAnnotations((prev) => prev.filter((x) => x.id !== id));
      toast.success("Annotation supprimée");
    } catch (e) {
      console.error(e);
      toast.error("Suppression impossible");
    }
  };

  const removeNote = async (id: string) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((x) => x.id !== id));
      toast.success("Note supprimée");
    } catch (e) {
      console.error(e);
      toast.error("Suppression impossible");
    }
  };

  const removeTag = async (id: string) => {
    try {
      await deleteTag(id);
      setTags((prev) => prev.filter((x) => x.id !== id));
      toast.success("Tag supprimé");
    } catch (e) {
      console.error(e);
      toast.error("Suppression impossible");
    }
  };

  const jumpToRange = (start: number, end: number) => {
    const el = textareaRef.current;
    if (!el) return;
    setTextMode("edit");
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, end);
      setSelection({ start, end });
    });
  };

  // ---------------- Metadata editing ----------------

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
    setSelectedSourceIdsDraft((prev) => (prev.includes(sourceId) ? prev.filter((x) => x !== sourceId) : [...prev, sourceId]));
  };

  const saveMetadata = async () => {
    if (!currentVersion) return;

    setLoading(true);
    try {
      const patch: any = {
        transcription_kind: metaDraft.transcription_kind ?? null,
        source_lecture_kind: metaDraft.source_lecture_kind ?? null,
        conventions_text: metaDraft.conventions_text ?? null,
        langue_vue: metaDraft.langue_vue ?? null,
        ecriture_vue: metaDraft.ecriture_vue ?? null,
        confidence: metaDraft.confidence ?? null,
      };

      if (metaDraft.status === "contested") {
        patch.status = "contested";
        patch.contested_at = new Date().toISOString();
        patch.contested_reason = (metaDraft.contested_reason ?? "").trim() || null;
      }

      await setVersionStatus(currentVersion.id, patch);

      const curIds = versionSources[currentVersion.id] ?? [];
      await syncVersionSources(currentVersion.id, curIds, selectedSourceIdsDraft);

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

  // ---------------- Repérages ----------------

  const rep = useMemo(() => detectActeReperages(editorValue), [editorValue]);
  const goToHit = (h: Hit) => jumpToRange(h.start, h.end);

  // ---------------- Gabarits ----------------

  const createDraftFromGabarit = async (g: GabaritRow) => {
    const defaults: Partial<TranscriptionVersionRow> = {
      transcription_kind: "travail",
      source_lecture_kind: "image_originale",
      conventions_text:
        "Conventions conseillées : [illisible], [barré], [lacune], [ajout en marge], " +
        PAGE_BREAK_TOKEN +
        " (saut de page).",
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
      sourceIds: [],
    });

    toast("Brouillon créé depuis un gabarit : relisez mot à mot.", { icon: "🧩", duration: 5000 });
  };

  // ---------------- Page break insertion ----------------

  const insertPageBreak = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? editorValue.length;
    const end = el.selectionEnd ?? editorValue.length;

    const toInsert = `${start > 0 && !/\n$/.test(editorValue.slice(0, start)) ? "\n" : ""}${PAGE_BREAK_TOKEN}\n`;
    const next = insertAtSelection(editorValue, start, end, toInsert);

    setEditorValue(next);
    setIsDirty(true);

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + toInsert.length;
      el.setSelectionRange(pos, pos);
      setSelection(null);
    });

    toast("Saut de page inséré", { icon: "📄" });
  };

  // ---------------- Anchor auto-revalidation (debounced) ----------------

  useEffect(() => {
    if (!currentVersion) return;
    if (!annotations.length) return;

    if (anchorRevalidateTimer.current) window.clearTimeout(anchorRevalidateTimer.current);

    anchorRevalidateTimer.current = window.setTimeout(async () => {
      const nextOverrides: Record<string, AnchorStatus> = {};
      const changed: Array<{ id: string; status: AnchorStatus }> = [];

      for (const a of annotations) {
        const newStatus = revalidateAnchor(editorValue, a);
        const effectiveNow = anchorStatusOverrides[a.id] ?? a.status;
        nextOverrides[a.id] = newStatus;
        if (newStatus !== effectiveNow) changed.push({ id: a.id, status: newStatus });
      }

      setAnchorStatusOverrides(nextOverrides);

      if (changed.length) {
        await persistAnnotationStatuses(changed);
        setAnnotations((prev) =>
          prev.map((a) => (nextOverrides[a.id] ? { ...a, status: nextOverrides[a.id] } : a))
        );
      }
    }, 700);

    return () => {
      if (anchorRevalidateTimer.current) window.clearTimeout(anchorRevalidateTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorValue, currentId]);

  // ---------------- Grouped annotations ----------------

  const groupedAnnotations = useMemo(() => {
    const groups: Record<AnnotationRow["type"], AnnotationRow[]> = {
      doubt: [],
      rature: [],
      lacune: [],
      mention: [],
      other: [],
    };
    for (const a of annotations) groups[a.type].push(a);
    return groups;
  }, [annotations]);

  const typeLabel: Record<AnnotationRow["type"], string> = {
    doubt: "Doutes",
    rature: "Ratures",
    lacune: "Lacunes",
    mention: "Mentions",
    other: "Autres",
  };

  // ---------------- Render helpers ----------------

  const readableBlocks = useMemo(() => splitIntoReadableBlocks(editorValue), [editorValue]);

  const currentSourceLabels = (currentVersion?.id ? versionSources[currentVersion.id] ?? [] : [])
    .map((id) => acteSources.find((s) => s.id === id))
    .filter(Boolean) as EcActeSourceRow[];

  const hasAnchorIssues = annotations.some((a) => (anchorStatusOverrides[a.id] ?? a.status) !== "ok");

  // ---------------- Split pane drag ----------------

  const onMouseDownDivider = (e: React.MouseEvent) => {
    const container = document.getElementById("transcription-split-root");
    if (!container) return;
    dragRef.current = { dragging: true, startX: e.clientX, startPct: split.leftPct };

    const rect = container.getBoundingClientRect();
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current?.dragging) return;
      const dx = ev.clientX - dragRef.current.startX;
      const pctDelta = (dx / rect.width) * 100;
      setSplitPct(dragRef.current.startPct + pctDelta);
    };
    const onUp = () => {
      if (dragRef.current) dragRef.current.dragging = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  if (loading && !currentVersion && versions.length === 0) {
    return <div className="p-4 text-sm text-slate-600">Chargement…</div>;
  }

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
              {hasAnchorIssues && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
            </div>

            <p className="text-sm text-slate-600">
              Le texte est la source canonique. Annotations, tags, gabarits et ponts t’aident à travailler{" "}
              <span className="font-medium">sans générer</span> ni interpréter.
            </p>

            {/* Convention de transcription */}
            <Button
              variant="outline"
              onClick={() => {
                setSheetMode("charte");
                setSheetOpen(true);
              }}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Charte de transcription
            </Button>


            {/* Mini résumé meta */}
            {currentVersion && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  <Settings2 className="h-3.5 w-3.5" />
                  Type :{" "}
                  <span className="font-medium">
                    {currentVersion.transcription_kind === "diplomatique"
                      ? "Diplomatique"
                      : currentVersion.transcription_kind === "semi_normalisee"
                        ? "Semi-normalisée"
                        : "Travail"}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  <Tags className="h-3.5 w-3.5" />
                  Sources : <span className="font-medium">{currentSourceLabels.length}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  <Workflow className="h-3.5 w-3.5" />
                  Confiance :{" "}
                  <span className="font-medium">
                    {currentVersion.confidence === "high"
                      ? "élevée"
                      : currentVersion.confidence === "medium"
                        ? "moyenne"
                        : "faible"}
                  </span>
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
            {/* Plus d'état vide : on a toujours une version (auto v1) */}
            <select
              value={currentId ?? ""}
              onChange={(e) => setCurrentId(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none"
            >
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
                    "Conventions conseillées : [illisible], [barré], [lacune], [ajout en marge], " +
                    PAGE_BREAK_TOKEN +
                    " (saut de page).",
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

      {/* Split layout */}
      <div
        id="transcription-split-root"
        className="grid gap-0"
        style={{
          gridTemplateColumns: `minmax(360px, ${split.leftPct}%) 12px minmax(320px, ${100 - split.leftPct}%)`,
        }}
      >
        {/* Left */}
        <div className="pr-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {currentVersion?.gabarit_id ? (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Brouillon issu d’un gabarit : <span className="font-semibold">relisez intégralement</span> et adaptez le texte à l’acte réel.
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-slate-900">Texte</div>

                <div className="ml-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setTextMode("edit")}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${textMode === "edit" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
                      }`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Édition
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextMode("read")}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${textMode === "read" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
                      }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Lecture
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={openAddAnnotation} className="gap-2">
                  <Plus className="w-4 h-4" /> Annotation
                </Button>
                <Button variant="outline" onClick={openAddNote} className="gap-2">
                  <Plus className="w-4 h-4" /> Note
                </Button>

                <Button variant="outline" onClick={openTagPassage} className="gap-2">
                  <Tags className="w-4 h-4" />
                  Tag
                </Button>

                <Button variant="outline" onClick={insertPageBreak} className="gap-2">
                  <SeparatorHorizontal className="w-4 h-4" />
                  Saut de page
                </Button>

                <Button onClick={saveAsNewDraftVersion} disabled={loading} className="gap-2" title="Enregistre une nouvelle version">
                  <Save className="w-4 h-4" />
                  Enregistrer (v{nextVersionNumber})
                </Button>
              </div>
            </div>

            <div className="mt-3">
              {textMode === "edit" ? (
                <>
                  <textarea
                    ref={textareaRef}
                    value={editorValue}
                    onChange={(e) => {
                      setEditorValue(e.target.value);
                      setIsDirty(true);
                    }}
                    onMouseUp={captureSelection}
                    onKeyUp={captureSelection}
                    placeholder={`Transcrivez ici le texte… (orthographe d’époque, ex : [illisible], [barré], [lacune], [ajout en marge], ${PAGE_BREAK_TOKEN} = saut de page)`}
                    className="min-h-[520px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      {selection ? (
                        <span>
                          Sélection : {selection.start}–{selection.end} ({selection.end - selection.start} caractères)
                        </span>
                      ) : (
                        <span>Sélectionnez un passage pour créer une annotation / note / tag ancré.</span>
                      )}
                    </div>
                    {isDirty ? <span className="text-yellow-700">Modifications non enregistrées</span> : <span>—</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="min-h-[520px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-900 shadow-sm">
                    {readableBlocks.length === 0 ? (
                      <div className="text-slate-600">—</div>
                    ) : (
                      <div className="space-y-3">
                        {readableBlocks.map((b, idx) => {
                          if (b.kind === "page_break") {
                            return (
                              <div key={`pb-${idx}`} className="my-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-px flex-1 bg-slate-200" />
                                  <div className="text-xs text-slate-500">Saut de page</div>
                                  <div className="h-px flex-1 bg-slate-200" />
                                </div>
                              </div>
                            );
                          }
                          if (b.kind === "section") {
                            return (
                              <div key={`sec-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-semibold text-slate-700">{b.label}</div>
                                <div className="mt-1 whitespace-pre-wrap text-slate-900">{b.text}</div>
                              </div>
                            );
                          }
                          return (
                            <div key={`p-${idx}`} className="whitespace-pre-wrap">
                              {b.text}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    Affichage “mise en page” : aucun changement du texte stocké. Reviens en <span className="font-medium">Édition</span> pour modifier.
                  </div>
                </>
              )}

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
        </div>

        {/* Divider */}
        <div className="flex items-stretch justify-center">
          <div
            role="separator"
            onMouseDown={onMouseDownDivider}
            className="mx-1 my-2 w-[10px] cursor-col-resize rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center"
            title="Glisser pour redimensionner"
          >
            <GripVertical className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Right sticky + internal scroll */}
        <div className="pl-2">
          <div className="sticky top-4">
            <div className="max-h-[calc(100vh-160px)] overflow-auto space-y-4 pr-1">
              {/* Repérages + ponts */}
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
                          <span key={a.id} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                            {a.role ? `${a.role} — ` : ""}
                            {[a.prenom, a.nom].filter(Boolean).join(" ").trim() || "(sans nom)"}
                          </span>
                        ))}
                        {acteurs.length > 12 ? <span className="text-xs text-slate-500">+{acteurs.length - 12}</span> : null}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-600">Aucun acteur saisi.</div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => onGoToTab?.("Acteurs & rôles")} disabled={!onGoToTab}>
                        Aller à Acteurs & rôles
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onGoToTab?.("Faits familiaux")} disabled={!onGoToTab}>
                        Aller à Faits familiaux
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onGoToTab?.("Mentions complémentaires")} disabled={!onGoToTab}>
                        Aller à Mentions complémentaires
                      </Button>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      Le pont peut servir à <span className="font-medium">pré-remplir</span> ailleurs, mais ici on ne crée rien automatiquement.
                    </div>
                  </div>

                  {/* Repérages */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-700">Dans le texte (heuristique “actes”)</div>

                    <div className="mt-2 space-y-3">
                      <div>
                        <div className="text-[11px] text-slate-600">Dates repérées</div>
                        {rep.dates.length ? (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {rep.dates.map((h, i) => (
                              <button
                                key={`${h.start}-${h.end}-${i}`}
                                type="button"
                                onClick={() => goToHit(h)}
                                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                                title="Cliquer pour surligner dans le texte"
                              >
                                {normalizeSpaces(h.label).slice(0, 36)}
                                {normalizeSpaces(h.label).length > 36 ? "…" : ""}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-slate-600">—</div>
                        )}
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-600">Âges repérés</div>
                        {rep.ages.length ? (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {rep.ages.map((h, i) => (
                              <button
                                key={`${h.start}-${h.end}-${i}`}
                                type="button"
                                onClick={() => goToHit(h)}
                                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                              >
                                {normalizeSpaces(h.label).slice(0, 34)}
                                {normalizeSpaces(h.label).length > 34 ? "…" : ""}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-slate-600">—</div>
                        )}
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-600">Numéros (N°, n°, No)</div>
                        {rep.numeros.length ? (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {rep.numeros.map((h, i) => (
                              <button
                                key={`${h.start}-${h.end}-${i}`}
                                type="button"
                                onClick={() => goToHit(h)}
                                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                              >
                                {h.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-slate-600">—</div>
                        )}
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-600">Mots en majuscules (souvent noms)</div>
                        {rep.majuscules.length ? (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {rep.majuscules.map((h, i) => (
                              <button
                                key={`${h.start}-${h.end}-${i}`}
                                type="button"
                                onClick={() => goToHit(h)}
                                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                              >
                                {h.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-slate-600">—</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      Repérages purement visuels. Aucune extraction persistée ici.
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Tags</div>
                  <Badge variant="secondary">{tags.length}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Taguer un passage et le relier (acteur / lieu / date). Objectif : préparer des liens sans interpréter.
                </p>

                <div className="mt-3 space-y-2">
                  {tags.length === 0 && <div className="text-sm text-slate-600">Aucun tag.</div>}

                  {tags.map((t) => (
                    <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {tagBadge(t.kind)}
                            <div className="text-sm font-semibold text-slate-900 truncate">{t.label}</div>
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            {t.start_offset}–{t.end_offset}
                            {t.linked_acteur_id ? (
                              <>
                                {" · "}
                                <span className="font-medium">
                                  lié à{" "}
                                  {(() => {
                                    const a = acteurs.find((x) => x.id === t.linked_acteur_id);
                                    return a ? ([a.prenom, a.nom].filter(Boolean).join(" ").trim() || "(sans nom)") : "acteur";
                                  })()}
                                </span>
                              </>
                            ) : null}
                          </div>
                          <div className="mt-1 text-sm text-slate-800 line-clamp-2">“{t.quote}”</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => jumpToRange(t.start_offset, t.end_offset)}>
                            Voir
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => removeTag(t.id)} className="gap-1">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gabarits */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Gabarits (actes similaires)</div>
                  <Badge variant="secondary">{gabarits.length}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Accélère la saisie sur séries homogènes, sans remplacer la relecture.
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

                <div className="mt-3 space-y-3">
                  {annotations.length === 0 && <div className="text-sm text-slate-600">Aucune annotation.</div>}

                  {(Object.keys(groupedAnnotations) as Array<AnnotationRow["type"]>).map((k) => {
                    const list = groupedAnnotations[k];
                    if (!list.length) return null;
                    return (
                      <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-slate-700">{typeLabel[k]}</div>
                          <Badge variant="secondary">{list.length}</Badge>
                        </div>

                        <div className="mt-2 space-y-2">
                          {list.map((a) => {
                            const effective = anchorStatusOverrides[a.id] ?? a.status;
                            return (
                              <div key={a.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                <div className="flex items-start justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => jumpToRange(a.start_offset, a.end_offset)}
                                    className="text-left min-w-0"
                                  >
                                    <div className="text-xs font-semibold text-slate-900">
                                      {a.type} · {a.start_offset}–{a.end_offset}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-800 line-clamp-2">“{a.quote}”</div>
                                    {a.comment ? <div className="mt-1 text-xs text-slate-600 line-clamp-2">{a.comment}</div> : null}
                                  </button>

                                  <div className="shrink-0 flex flex-col items-end gap-2">
                                    {anchorBadge(effective)}
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" onClick={() => openEditAnnotation(a)} className="gap-1">
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => removeAnnotation(a.id)} className="gap-1">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Statut automatique : si tu modifies le texte, les ancres passent à <span className="font-medium">À revoir</span> ou{" "}
                  <span className="font-medium">Orpheline</span> si nécessaire.
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
                    <div key={n.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (n.start_offset != null && n.end_offset != null) jumpToRange(n.start_offset, n.end_offset);
                          }}
                          className="text-left min-w-0"
                        >
                          {n.quote ? <div className="text-xs text-slate-600 line-clamp-1">Ancrée : “{n.quote}”</div> : null}
                          <div className="mt-1 text-sm text-slate-900 line-clamp-3">{n.content}</div>
                        </button>

                        <div className="shrink-0 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditNote(n)} className="gap-1">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => removeNote(n.id)} className="gap-1">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow */}
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
                  Le diff est particulièrement utile pour ton cas “AD974 vs ANOM”.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className='!w-[40vw] !max-w-none p-0'>
          <SheetHeader className="p-4 border-b">
            <SheetTitle>
              {sheetMode === "annotation"
                ? editingAnnotationId
                  ? "Modifier l’annotation"
                  : "Ajouter une annotation"
                : sheetMode === "note"
                  ? editingNoteId
                    ? "Modifier la note"
                    : "Ajouter une note"
                  : sheetMode === "metadata"
                    ? "Métadonnées de transcription"
                    : sheetMode === "compare"
                      ? "Comparer deux transcriptions"
                      : sheetMode === "tag"
                        ? "Tagger un passage"
                        : sheetMode === "charte"
                          ? "Charte de transcription"
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
                      : sheetMode === "tag"
                        ? "Tagger un passage et (optionnel) le relier à un acteur."
                        : sheetMode === "charte"
                          ? "Règles communes de transcription des actes : fidélité au document, signalement des incertitudes, usage des annotations et des tags."
                          : ""}
            </SheetDescription>
          </SheetHeader>

          {(sheetMode === "annotation" || sheetMode === "note" || sheetMode === "tag") && (
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
                  Aucune sélection (ok pour une note globale). Pour annotation / tag, sélectionnez un passage.
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
                      {editingAnnotationId ? "Enregistrer" : "Ajouter"}
                    </Button>
                  </div>
                </>
              ) : sheetMode === "note" ? (
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
                    <Button onClick={submitNote}>{editingNoteId ? "Enregistrer" : "Ajouter"}</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <div className="md:col-span-6">
                      <label className="block text-xs font-medium text-slate-700">Type de tag</label>
                      <select
                        value={tagKind}
                        onChange={(e) => {
                          const k = e.target.value as TranscriptionTagRow["kind"];
                          setTagKind(k);
                          setTagActeurId("");
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                      >
                        <option value="date">Date</option>
                        <option value="acteur">Acteur</option>
                        <option value="lieu">Lieu</option>
                      </select>
                    </div>

                    <div className="md:col-span-6">
                      <label className="block text-xs font-medium text-slate-700">Libellé</label>
                      <input
                        value={tagLabel}
                        onChange={(e) => setTagLabel(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                        placeholder="Ex : 12/03/1859 ; VULCAIN Valère ; Grand Anse..."
                      />
                      <div className="mt-1 text-xs text-slate-500">
                        Si vide, on utilisera le texte sélectionné comme libellé.
                      </div>
                    </div>

                    {tagKind === "acteur" ? (
                      <div className="md:col-span-12">
                        <label className="block text-xs font-medium text-slate-700">Lier à un acteur (déjà saisi)</label>
                        <select
                          value={tagActeurId}
                          onChange={(e) => setTagActeurId(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none"
                        >
                          <option value="">— sélectionner —</option>
                          {acteurs.map((a) => (
                            <option key={a.id} value={a.id}>
                              {(a.role ? `${a.role} — ` : "") + ([a.prenom, a.nom].filter(Boolean).join(" ").trim() || "(sans nom)")}
                            </option>
                          ))}
                        </select>
                        <div className="mt-1 text-xs text-slate-500">
                          Ce lien est stable : si l’acteur est modifié ailleurs, le tag reste rattaché.
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSheetOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={submitTag} disabled={!selection}>
                      Ajouter
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {sheetMode === "metadata" && currentVersion && (
            <div className="p-4 space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Sources exactes utilisées</div>
                  <Badge variant="secondary">{selectedSourceIdsDraft.length}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Déclare quelles sources (dépôts/vues) ont servi à produire cette version (utile pour “AD974 vs ANOM”).
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
                      <label key={s.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSourceDraft(s.id)}
                          className="mt-0.5 h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900">{formatSourceLabel(s)}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            {[s.support ? `Support : ${s.support}` : null, s.langue ? `Langue : ${s.langue}` : null, s.ecriture ? `Écriture : ${s.ecriture}` : null]
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
                  Ces champs décrivent <span className="font-medium">ta méthode</span>, pas le contenu.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-700">Type de transcription</label>
                    <select
                      value={(metaDraft.transcription_kind as any) ?? ""}
                      onChange={(e) => setMetaDraft((p) => ({ ...p, transcription_kind: (e.target.value || null) as any }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                    >
                      <option value=""></option>
                      <option value="diplomatique">Diplomatique (stricte, au plus près)</option>
                      <option value="semi_normalisee">Semi-normalisée (mise au clair limitée)</option>
                      <option value="travail">Travail (brouillon de lecture)</option>
                    </select>
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-700">Support de lecture</label>
                    <select
                      value={(metaDraft.source_lecture_kind as any) ?? ""}
                      onChange={(e) => setMetaDraft((p) => ({ ...p, source_lecture_kind: (e.target.value || null) as any }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                    >
                      <option value=""></option>
                      <option value="image_originale">Image numérisée / original</option>
                      <option value="microfilm">Microfilm</option>
                      <option value="transcription_secondaire">Transcription secondaire</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  <div className="md:col-span-12">
                    <label className="block text-xs font-medium text-slate-700">Conventions utilisées</label>
                    <textarea
                      value={(metaDraft.conventions_text as any) ?? ""}
                      onChange={(e) => setMetaDraft((p) => ({ ...p, conventions_text: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                      placeholder={`Ex : [illisible], [barré], [lacune], ⟦ajout marginal⟧, ${PAGE_BREAK_TOKEN} ...`}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-700">Langue (vue)</label>
                    <input
                      value={(metaDraft.langue_vue as any) ?? ""}
                      onChange={(e) => setMetaDraft((p) => ({ ...p, langue_vue: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                      placeholder="français, créole, latin..."
                    />
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
                      onChange={(e) => setMetaDraft((p) => ({ ...p, confidence: (e.target.value || null) as any }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                    >
                      <option value=""></option>
                      <option value="high">Élevée</option>
                      <option value="medium">Moyenne</option>
                      <option value="low">Faible</option>
                    </select>
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

          {sheetMode === "charte" && currentVersion && (
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] text-sm text-slate-800">
              {/* Principe */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">1. Finalité et principe directeur</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">
                  <li>La transcription est une reproduction fidèle du texte visible sur l’acte.</li>
                  <li>Aucune interprétation, correction logique ou reconstruction implicite n’est autorisée.</li>
                  <li>Toute incertitude doit être explicitement signalée par une annotation ou une note.</li>
                </ul>
              </section>

              {/* Fidélité */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">2. Niveau de fidélité</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">
                  <li><strong>Diplomatique</strong> : reproduction stricte (orthographe, ponctuation, casse).</li>
                  <li><strong>Semi-normalisée</strong> : mise au clair minimale sans modifier les mots.</li>
                  <li><strong>Travail</strong> : brouillon de lecture, lisible mais non interprétatif.</li>
                </ul>

                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                  Version actuelle :{" "}
                  <span className="font-semibold">
                    {currentVersion.transcription_kind ?? "non précisée"}
                  </span>
                </div>
              </section>

              {/* Pagination */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">3. Pagination</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">
                  <li>Chaque changement de page doit être matérialisé.</li>
                  <li>Utiliser le marqueur suivant, sur une ligne dédiée :</li>
                </ul>
                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs font-mono">
                  {PAGE_BREAK_TOKEN}
                </div>
              </section>

              {/* Illisible */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">4. Illisible, lacunes, ratures</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">
                  <li><code>[illisible]</code> : texte impossible à lire.</li>
                  <li><code>[lacune]</code> : portion manquante ou détériorée.</li>
                  <li>Les mots barrés mais lisibles doivent être transcrits et annotés.</li>
                </ul>
              </section>

              {/* Conventions version */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">
                  Conventions spécifiques à cette version
                </h3>
                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {(currentVersion.conventions_text ?? "").trim()
                    || "Aucune convention spécifique renseignée pour cette version."}
                </div>
              </section>

              <div className="pt-4 flex justify-end">
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}


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
                      <div className="mt-1 text-xs text-slate-600">Sources : {(versionSources[compareLeft.id] ?? []).length}</div>
                    </div>
                    <div className="p-3 text-sm font-semibold text-slate-900 border-l">
                      v{compareRight.version} · {compareRight.status}
                      <div className="mt-1 text-xs text-slate-600">Sources : {(versionSources[compareRight.id] ?? []).length}</div>
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
