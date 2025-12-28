// transcriptionTab.logic.ts
// Hook/controller: local state + orchestration calls.
//
// ✅ Pilotage par sources (MVP):
// - activeSourceId : la source sélectionnée dans le dashboard
// - preferredSourceId : source “préférée / référence” (MVP local, non persistant)
// - workingVersion : “transcription active” = dernière version liée à la source active
// - Save = crée une nouvelle version liée à la source active (historique conservé)
//
// ⚠️ DB inchangée (pour l’instant) :
// - la note [META] reste par version (complétude + raison + diffNotes map)

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
    PAGE_BREAK_TOKEN,
    type AnchorStatus,
    type AnnotationRow,
    type ConfidenceLevel,
    type EcActeRow,
    type EcActeSourceRow,
    type GabaritRow,
    type NoteRow,
    type SourceLectureKind,
    type TranscriptionKind,
    type TranscriptionStatus,
    type TranscriptionTagRow,
    type TranscriptionVersionRow,
    chooseBestGabaritForInitialDraft,
    computeAnchor,
    insertAtSelection,
    loadActeBundle,
    loadVersionChildren,
    loadVersionTags,
    refreshVersions,
    createVersion,
    setVersionStatus,
    updateAnnotation,
    deleteAnnotation,
    updateNote,
    deleteNote,
    createTag,
    deleteTag,
    syncVersionSources,
    persistAnnotationStatuses,
    revalidateAnchor,
    insertAnnotation,
    insertNote,
    updateActeSourceNote,
    parseMetaFromNotes,
    composeMetaNote,
    compareKey,
    type CitationDraft,
    type ActeCitationRow,
    type ManifestationPick,
} from "./transcriptionTab.service";
import { supabase } from "@/lib/supabase";

type SheetMode = "annotation" | "note" | "metadata" | "compare" | "tag";
type Props = { acteId: string };

type SplitState = { leftPct: number };
const SPLIT_LS_KEY = "rebond.transcription.split";

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

function emptyCitation(acteId: string): CitationDraft {
  return {
    id: "tmp-" + crypto.randomUUID(),
    acte_id: acteId,
    manifestation_id: null,
    vues_start: null,
    vues_end: null,
    vues_raw: null,
    page_start: null,
    page_end: null,
    page_raw: null,
    acte_manquant: false,
    note: null,
    sort_order: 0,
    manifestation: null,
  };
}

function normalizeCitationRow(r: ActeCitationRow): CitationDraft {
  return {
    id: r.id,
    acte_id: r.acte_id,
    manifestation_id: r.manifestation_id,
    vues_start: r.vues_start,
    vues_end: r.vues_end,
    vues_raw: r.vues_raw,
    page_start: r.page_start,
    page_end: r.page_end,
    page_raw: r.page_raw,
    acte_manquant: Boolean(r.acte_manquant),
    note: r.note,
    sort_order: r.sort_order,
    manifestation: null,
  };
}

function bestPickPerManifestation(picks: any[]): Map<string, ManifestationPick> {
  const bestByManId = new Map<string, ManifestationPick>();

  for (const r of picks) {
    const candidate: ManifestationPick = {
      manifestation_id: r.manifestation_id,
      type_manifestation: r.type_manifestation ?? null,
      unite_id: r.unite_id ?? null,
      unite_titre: r.unite_titre ?? null,
      unite_cote: r.unite_cote ?? null,
      pagination_type: r.pagination_type ?? null,
      depot_nom: r.depot_nom ?? null,
      depot_type: r.depot_type ?? null,
      institution_nom: r.institution_nom ?? null,
      institution_sigle: r.institution_sigle ?? null,
      url_base: r.url_base ?? null,
      plateforme_code: r.plateforme_code ?? null,
    };

    const current = bestByManId.get(candidate.manifestation_id);
    if (!current) {
      bestByManId.set(candidate.manifestation_id, candidate);
      continue;
    }

    // règle: préférer une ligne avec url_base si possible
    const curHasUrl = Boolean((current.url_base ?? "").trim());
    const candHasUrl = Boolean((candidate.url_base ?? "").trim());

    if (!curHasUrl && candHasUrl) {
      bestByManId.set(candidate.manifestation_id, candidate);
    }
  }

  return bestByManId;
}

export function useActeCitationsSources(acteId: string) {
  const [sources, setSources] = useState<CitationDraft[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadingSources(true);
      setErrorMsg(null);

      // 1) load raw citations
      const { data, error } = await supabase
        .from("etat_civil_acte_citations")
        .select(
          "id, acte_id, manifestation_id, vues_start, vues_end, vues_raw, page_start, page_end, page_raw, acte_manquant, note, sort_order"
        )
        .eq("acte_id", acteId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        setErrorMsg(error.message);
        setSources([emptyCitation(acteId)]);
        setLoadingSources(false);
        return;
      }

      const rows = (data ?? []) as ActeCitationRow[];
      const drafts = rows.map((r) => normalizeCitationRow(r));

      if (!drafts.length) {
        setSources([emptyCitation(acteId)]);
        setLoadingSources(false);
        return;
      }

      // 2) enrich from view
      const manIds = Array.from(
        new Set(drafts.map((d) => d.manifestation_id).filter(Boolean) as string[])
      );

      if (!manIds.length) {
        setSources(drafts);
        setLoadingSources(false);
        return;
      }

      const { data: pickData, error: pickErr } = await supabase
        .from("v_manifestations_pick")
        .select(
          "manifestation_id,type_manifestation,unite_id,unite_titre,unite_cote,pagination_type,depot_nom,depot_type,institution_nom,institution_sigle,url_base,plateforme_code"
        )
        .in("manifestation_id", manIds);

      if (cancelled) return;

      if (pickErr) {
        setSources(drafts);
        setLoadingSources(false);
        return;
      }

      const bestByManId = bestPickPerManifestation(pickData ?? []);

      const enriched = drafts.map((d) => {
        const m = d.manifestation_id ? bestByManId.get(d.manifestation_id) : null;
        if (!m) return d;

        return {
          ...d,
          manifestation: {
            type_manifestation: m.type_manifestation,
            unite_titre: m.unite_titre,
            unite_cote: m.unite_cote,
            pagination_type: m.pagination_type,
            depot_nom: m.depot_nom,
            depot_type: m.depot_type,
            institution_nom: m.institution_nom,
            institution_sigle: m.institution_sigle,
            url_base: m.url_base,
            plateforme_code: m.plateforme_code,
          },
        } satisfies CitationDraft;
      });

      setSources(enriched);
      setLoadingSources(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [acteId]);

  return { sources, setSources, loadingSources, errorMsg };
}

export function useTranscriptionTab({ acteId }: Props) {
    // -----------------------------
    // Base state
    // -----------------------------
    const [loading, setLoading] = useState(false);

    const [acte, setActe] = useState<EcActeRow | null>(null);
    const [acteSources, setActeSources] = useState<EcActeSourceRow[]>([]);

    const [versions, setVersions] = useState<TranscriptionVersionRow[]>([]);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const currentVersion = useMemo(
        () => versions.find((v) => v.id === currentId) ?? null,
        [versions, currentId]
    );

    const [versionSources, setVersionSources] = useState<Record<string, string[]>>({});

    // -----------------------------
    // ✅ Sources-first state
    // -----------------------------
    const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
    const [preferredSourceId, setPreferredSourceId] = useState<string | null>(null);

    const [workingVersionId, setWorkingVersionId] = useState<string | null>(null);
    const workingVersion = useMemo(
        () => versions.find((v) => v.id === workingVersionId) ?? null,
        [versions, workingVersionId]
    );

    // -----------------------------
    // Editor
    // -----------------------------
    const [editorValue, setEditorValue] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [textMode, setTextMode] = useState<"edit" | "read">("edit");

    // Children
    const [annotations, setAnnotations] = useState<AnnotationRow[]>([]);
    const [notes, setNotes] = useState<NoteRow[]>([]);
    const [tags, setTags] = useState<TranscriptionTagRow[]>([]);

    // Actors + gabarits
    const [acteurs, setActeurs] = useState<
        Array<{ id: string; role: string | null; prenom: string | null; nom: string | null }>
    >([]);
    const [gabarits, setGabarits] = useState<GabaritRow[]>([]);

    // Selection
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

    // Sheet
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<SheetMode>("annotation");

    // Annotation drafts
    const [annoType, setAnnoType] = useState<AnnotationRow["type"]>("doubt");
    const [annoComment, setAnnoComment] = useState("");
    const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);

    // Note drafts
    const [noteContent, setNoteContent] = useState("");
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

    // Tag drafts
    const [tagKind, setTagKind] = useState<TranscriptionTagRow["kind"]>("date");
    const [tagLabel, setTagLabel] = useState("");
    const [tagActeurId, setTagActeurId] = useState("");

    // Metadata drafts (DB fields)
    const [metaDraft, setMetaDraft] = useState<Partial<TranscriptionVersionRow>>({});
    const [selectedSourceIdsDraft, setSelectedSourceIdsDraft] = useState<string[]>([]);

    // Metadata drafts (angles morts) stored in [META] note
    const [metaDraftCompleteness, setMetaDraftCompleteness] = useState<"" | "complete" | "partial">(
        ""
    );
    const [metaDraftReferenceReason, setMetaDraftReferenceReason] = useState<string>("");

    // Compare (version-based internal)
    const [compareLeftId, setCompareLeftId] = useState<string>("");
    const [compareRightId, setCompareRightId] = useState<string>("");
    const [compareReasonDraft, setCompareReasonDraft] = useState<string>("");

    // Anchor overrides (auto revalidation)
    const [anchorStatusOverrides, setAnchorStatusOverrides] = useState<Record<string, AnchorStatus>>(
        {}
    );

    // ✅ IMPORTANT: éviter le conflit NodeJS.Timeout vs number (si @types/node est présent)
    const anchorRevalidateTimer = useRef<number | null>(null);

    // -----------------------------
    // Split pane (UI-only)
    // -----------------------------
    const [split, setSplit] = useState<SplitState>(() => {
        try {
            const raw = localStorage.getItem(SPLIT_LS_KEY);
            if (!raw) return { leftPct: 66 };
            const parsed = JSON.parse(raw);
            const pct = Number(parsed?.leftPct);
            if (!Number.isFinite(pct)) return { leftPct: 66 };
            return { leftPct: clamp(pct, 40, 80) };
        } catch {
            return { leftPct: 66 };
        }
    });

    const dragRef = useRef<{ dragging: boolean; startX: number; startPct: number } | null>(null);

    function setSplitPct(next: number) {
        const clamped = clamp(next, 40, 80);
        setSplit({ leftPct: clamped });
        try {
            localStorage.setItem(SPLIT_LS_KEY, JSON.stringify({ leftPct: clamped }));
        } catch {
            // ignore
        }
    }

    const splitApi = {
        leftPct: split.leftPct,
        onMouseDownDivider: (e: any) => {
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
        },
    };

    // -----------------------------
    // Derived
    // -----------------------------
    const nextVersionNumber = useMemo(() => {
        const max = versions.reduce((acc, v) => Math.max(acc, v.version ?? 0), 0);
        return max + 1;
    }, [versions]);

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

    // -----------------------------
    // Helpers: latest version per source
    // -----------------------------
    function getLatestVersionIdForSource(sourceId: string): string | null {
        const sorted = [...versions].sort((a, b) => {
            const av = Number(a.version ?? 0);
            const bv = Number(b.version ?? 0);
            if (bv !== av) return bv - av;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        for (const v of sorted) {
            const sids = versionSources[v.id] ?? [];
            if (sids.includes(sourceId)) return v.id;
        }
        return null;
    }

    function getTwoTranscribedSourcesVersionIds(): { left: string; right: string } | null {
        // On veut 2 sources transcrites : on prend la “latest version” de 2 sources distinctes
        const pairs: Array<{ sourceId: string; versionId: string }> = [];
        for (const s of acteSources) {
            const vid = getLatestVersionIdForSource(s.id);
            if (vid) pairs.push({ sourceId: s.id, versionId: vid });
        }
        if (pairs.length < 2) return null;
        return { left: pairs[0].versionId, right: pairs[1].versionId };
    }

    const { sources, loadingSources, errorMsg } = useActeCitationsSources(acteId);

    // -----------------------------
    // Load bundle (and create v1 if needed)
    // -----------------------------
    useEffect(() => {
        let cancelled = false;

        const hardReset = () => {
            setActe(null);
            setActeSources([]);
            setVersions([]);
            setVersionSources({});
            setCurrentId(null);

            setActiveSourceId(null);
            setPreferredSourceId(null);
            setWorkingVersionId(null);

            setActeurs([]);
            setGabarits([]);
            setAnnotations([]);
            setNotes([]);
            setTags([]);
            setEditorValue("");
            setIsDirty(false);
            setSelection(null);
            setAnchorStatusOverrides({});
        };

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

                // Default: pick a “current”
                if (!currentId && bundle.versions.length) {
                    setCurrentId(bundle.versions[0].id);
                }
            } catch (err: any) {
                console.error(err);
                toast.error(err?.message ?? "Erreur lors du chargement de l’onglet Transcription");
                hardReset();
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acteId]);

    // -----------------------------
    // When current version changes: load children + seed meta drafts from [META]
    // -----------------------------
    useEffect(() => {
        if (!currentVersion) return;

        let cancelled = false;

        // reset editor state to that version
        setEditorValue(currentVersion.content ?? "");
        setIsDirty(false);
        setSelection(null);
        setTextMode("edit");
        setAnchorStatusOverrides({});

        const run = async () => {
            try {
                const children = await loadVersionChildren(currentVersion.id);
                const t = await loadVersionTags(currentVersion.id);
                if (cancelled) return;

                setAnnotations(children.annotations);
                setNotes(children.notes);
                setTags(t);

                const meta = parseMetaFromNotes(children.notes);
                setMetaDraftCompleteness(meta.completeness ?? "");
                setMetaDraftReferenceReason(meta.referenceReason ?? "");
            } catch (e) {
                console.error(e);
                if (cancelled) return;
                setAnnotations([]);
                setNotes([]);
                setTags([]);
                setMetaDraftCompleteness("");
                setMetaDraftReferenceReason("");
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [currentId]); // intentionally

    // -----------------------------
    // Selection capture
    // -----------------------------
    const captureSelection = () => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        if (start === end) return setSelection(null);
        setSelection({ start, end });
    };

    // -----------------------------
    // Refresh versions helper
    // -----------------------------
    async function refreshVersionsAndSelect(idToSelect?: string) {
        const res = await refreshVersions(acteId);
        setVersions(res.versions);
        setVersionSources(res.versionSources);
        if (idToSelect) setCurrentId(idToSelect);
    }

    // -----------------------------
    // Version creation helpers
    // -----------------------------
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
        setLoading(true);
        try {
            const row = await createVersion(acteId, { version: nextVersionNumber, ...payload });
            toast.success("Version créée");
            await refreshVersionsAndSelect(row.id);

            // Keep workingVersion aligned (sources-first)
            if (payload.sourceIds?.length === 1 && payload.sourceIds[0] === activeSourceId) {
                setWorkingVersionId(row.id);
            }
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Erreur lors de la création de version");
        } finally {
            setLoading(false);
        }
    };

    const createEmptyDraft = async () => {
        await createNewVersion({
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
        });
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
            sourceIds: currentVersion?.id ? versionSources[currentVersion.id] ?? [] : [],
        });
    };

    const setInReview = async () => {
        const target = workingVersion ?? currentVersion;
        if (!target) return;

        setLoading(true);
        try {
            await setVersionStatus(target.id, { status: "in_review" });
            toast.success("Marquée en relecture");
            await refreshVersionsAndSelect(target.id);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Erreur");
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // Editor changes
    // -----------------------------
    const onChangeEditor = (next: string) => {
        setEditorValue(next);
        setIsDirty(true);
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

    // -----------------------------
    // Anchors auto-revalidation (debounced)
    // -----------------------------
    useEffect(() => {
        if (!currentVersion) return;
        if (!annotations.length) return;

        if (anchorRevalidateTimer.current !== null) {
            window.clearTimeout(anchorRevalidateTimer.current);
        }

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
            if (anchorRevalidateTimer.current !== null) window.clearTimeout(anchorRevalidateTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editorValue, currentId]);

    // -----------------------------
    // ✅ Sources-first actions
    // -----------------------------
    const setActiveSource = (sourceId: string) => {
        setActiveSourceId(sourceId);
    };

    const onActiveSourceChanged = async (sourceId: string, latestVersionId: string | null) => {
        const nextWorking = latestVersionId ?? getLatestVersionIdForSource(sourceId);
        setWorkingVersionId(nextWorking);

        if (nextWorking) {
            setCurrentId(nextWorking); // déclenche load children + reset editor
            return;
        }

        // Pas de transcription liée à cette source
        setCurrentId(null);
        setEditorValue("");
        setIsDirty(false);
        setSelection(null);
        setAnnotations([]);
        setNotes([]);
        setTags([]);
        setAnchorStatusOverrides({});
    };

    const setPreferredSource = (sourceId: string) => {
        setPreferredSourceId(sourceId);
        toast("Source marquée comme préférée", { icon: "⭐" });
    };

    const ensureActiveSourceSelectedInMetadata = () => {
        if (!activeSourceId) return;
        setSelectedSourceIdsDraft((prev) => (prev.includes(activeSourceId) ? prev : [...prev, activeSourceId]));
    };

    const createDraftForActiveSourceFromTemplateIfAny = async () => {
        if (!activeSourceId) return;

        const existing = getLatestVersionIdForSource(activeSourceId);
        if (existing) {
            toast("Cette source a déjà une transcription active.", { icon: "✅" });
            setWorkingVersionId(existing);
            setCurrentId(existing);
            return;
        }

        const best = chooseBestGabaritForInitialDraft(
            acte ?? ({} as EcActeRow),
            gabarits
        );


        const content = best?.template_content ?? "";
        const gabarit_id = best?.id ?? null;

        await createNewVersion({
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
            sourceIds: [activeSourceId],
        });

        toast("Brouillon créé pour la source active", { icon: "📝" });
    };

    const saveNewVersionForActiveSource = async () => {
        if (!activeSourceId) return;

        const base = workingVersion ?? currentVersion;

        await createNewVersion({
            status: "draft",
            content: editorValue ?? "",
            transcription_kind: base?.transcription_kind ?? null,
            source_lecture_kind: base?.source_lecture_kind ?? null,
            conventions_text: base?.conventions_text ?? null,
            langue_vue: base?.langue_vue ?? null,
            ecriture_vue: base?.ecriture_vue ?? null,
            confidence: base?.confidence ?? null,
            sourceIds: [activeSourceId],
        });

        toast("Nouvelle version enregistrée (historique conservé)", { icon: "💾" });
    };

    // -----------------------------
    // Diff sources (bridging to compare versions)
    // -----------------------------
    const openSourceDiff = (leftSourceId?: string | null, rightSourceId?: string | null) => {
        const leftV = leftSourceId ? getLatestVersionIdForSource(leftSourceId) : null;
        const rightV = rightSourceId ? getLatestVersionIdForSource(rightSourceId) : null;

        if (!leftV || !rightV) {
            toast("Il faut 2 sources transcrites pour faire un diff.", { icon: "🧩" });
            return;
        }

        setSheetMode("compare");
        setCompareLeftId(leftV);
        setCompareRightId(rightV);

        const m = parseMetaFromNotes(notes);
        setCompareReasonDraft(m.diffNotesByKey?.[compareKey(leftV, rightV)] ?? "");

        setSheetOpen(true);
    };

    const openSourceDiffPicker = () => {
        const pair = getTwoTranscribedSourcesVersionIds();
        if (!pair) {
            toast("Ajoute au moins 2 transcriptions (2 sources transcrites) pour comparer.", { icon: "🧩" });
            return;
        }

        setSheetMode("compare");
        setCompareLeftId(pair.left);
        setCompareRightId(pair.right);

        const m = parseMetaFromNotes(notes);
        setCompareReasonDraft(m.diffNotesByKey?.[compareKey(pair.left, pair.right)] ?? "");

        setSheetOpen(true);
    };

    // -----------------------------
    // Sheet openers
    // -----------------------------
    const openAddAnnotation = () => {
        const target = workingVersion ?? currentVersion;
        if (!target) return;
        if (!selection) return toast("Sélectionnez un passage dans le texte", { icon: "🖊️" });

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
        const target = workingVersion ?? currentVersion;
        if (!target) return;
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
        const target = workingVersion ?? currentVersion;
        if (!target) return;
        if (!selection) return toast("Sélectionnez un passage à tagger", { icon: "🏷️" });

        setEditingAnnotationId(null);
        setEditingNoteId(null);
        setSheetMode("tag");
        setTagKind("date");
        setTagLabel("");
        setTagActeurId("");
        setSheetOpen(true);
    };

    const onChangeTagKind = (k: TranscriptionTagRow["kind"]) => {
        setTagKind(k);
        setTagActeurId("");
    };

    const openMetadata = () => {
        const target = workingVersion ?? currentVersion;
        if (!target) return;

        setSheetMode("metadata");

        setMetaDraft({
            transcription_kind: target.transcription_kind ?? null,
            source_lecture_kind: target.source_lecture_kind ?? null,
            conventions_text: target.conventions_text ?? null,
            langue_vue: target.langue_vue ?? null,
            ecriture_vue: target.ecriture_vue ?? null,
            confidence: target.confidence ?? null,
            status: target.status,
            contested_reason: target.contested_reason ?? null,
        });

        setSelectedSourceIdsDraft(versionSources[target.id] ?? []);

        // seed meta drafts from current META note
        const m = parseMetaFromNotes(notes);
        setMetaDraftCompleteness(m.completeness ?? "");
        setMetaDraftReferenceReason(m.referenceReason ?? "");

        setSheetOpen(true);
    };

    // Legacy (version compare) still available
    const openCompare = () => {
        setSheetMode("compare");

        const sorted = [...versions].sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
        const cur = (workingVersion ?? currentVersion)?.id ?? (sorted[0]?.id ?? "");
        const other = sorted.find((v) => v.id !== cur)?.id ?? "";

        setCompareLeftId(cur);
        setCompareRightId(other);

        const m = parseMetaFromNotes(notes);
        if (cur && other) {
            const key = compareKey(cur, other);
            setCompareReasonDraft(m.diffNotesByKey[key] ?? "");
        } else {
            setCompareReasonDraft("");
        }

        setSheetOpen(true);
    };

    // -----------------------------
    // Persist actions: annotation / note / tag
    // -----------------------------
    const submitAnnotation = async () => {
        const target = workingVersion ?? currentVersion;
        if (!target || !selection) return;

        try {
            if (editingAnnotationId) {
                const updated = await updateAnnotation(editingAnnotationId, {
                    type: annoType,
                    comment: annoComment.trim() || null,
                });
                setAnnotations((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                toast.success("Annotation modifiée");
                setSheetOpen(false);
                return;
            }

            const { quote, prefix, suffix } = computeAnchor(editorValue, selection.start, selection.end);
            const row = await insertAnnotation({
                transcription_version_id: target.id,
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
        const target = workingVersion ?? currentVersion;
        if (!target) return;

        const content = noteContent.trim();
        if (!content) return toast("Écrivez une note", { icon: "📝" });

        const anchored = selection
            ? computeAnchor(editorValue, selection.start, selection.end)
            : { quote: null, prefix: null, suffix: null };

        try {
            if (editingNoteId) {
                const updated = await updateNote(editingNoteId, { content });
                setNotes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                toast.success("Note modifiée");
                setSheetOpen(false);
                return;
            }

            const row = await insertNote({
                transcription_version_id: target.id,
                start_offset: selection ? selection.start : null,
                end_offset: selection ? selection.end : null,
                quote: selection ? anchored.quote : null,
                prefix: selection ? anchored.prefix : null,
                suffix: selection ? anchored.suffix : null,
                content,
            } as any);

            setNotes((prev) => [...prev, row]);
            toast.success("Note ajoutée");
            setSheetOpen(false);
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de l’enregistrement de la note");
        }
    };

    const submitTag = async () => {
        const target = workingVersion ?? currentVersion;
        if (!target || !selection) return;

        try {
            const { quote, prefix, suffix } = computeAnchor(editorValue, selection.start, selection.end);
            const cleanLabel = tagLabel.trim() || quote?.trim() || "";
            if (!cleanLabel) return toast("Renseigne un libellé", { icon: "🏷️" });

            const acteurId = tagKind === "acteur" ? (tagActeurId || null) : null;
            if (tagKind === "acteur" && !acteurId) return toast("Choisis un acteur", { icon: "👤" });

            const row = await createTag({
                transcription_version_id: target.id,
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

    // -----------------------------
    // Metadata save (DB fields + [META] note + version_sources sync)
    // -----------------------------
    const toggleSourceDraft = (sourceId: string) => {
        setSelectedSourceIdsDraft((prev) =>
            prev.includes(sourceId) ? prev.filter((x) => x !== sourceId) : [...prev, sourceId]
        );
    };

    const upsertMetaNote = async (versionId: string, nextMetaNoteText: string) => {
        const meta = parseMetaFromNotes(notes);

        if (meta.metaNoteId) {
            const updated = await updateNote(meta.metaNoteId, { content: nextMetaNoteText });
            setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
            return;
        }

        const row = await insertNote({
            transcription_version_id: versionId,
            start_offset: null,
            end_offset: null,
            quote: null,
            prefix: null,
            suffix: null,
            content: nextMetaNoteText,
        } as any);
        setNotes((prev) => [...prev, row]);
    };

    const saveMetadata = async () => {
        const target = workingVersion ?? currentVersion;
        if (!target) return;

        setLoading(true);
        try {
            // persist DB fields
            await setVersionStatus(target.id, {
                transcription_kind: metaDraft.transcription_kind ?? null,
                source_lecture_kind: metaDraft.source_lecture_kind ?? null,
                conventions_text: metaDraft.conventions_text ?? null,
                langue_vue: metaDraft.langue_vue ?? null,
                ecriture_vue: metaDraft.ecriture_vue ?? null,
                confidence: metaDraft.confidence ?? null,
            } as any);

            // persist sources used by this version
            const curIds = versionSources[target.id] ?? [];
            await syncVersionSources(target.id, curIds, selectedSourceIdsDraft);

            // persist META note (angles morts)
            const prevMeta = parseMetaFromNotes(notes);
            const nextMetaNoteText = composeMetaNote({
                completeness: metaDraftCompleteness || null,
                referenceReason: metaDraftReferenceReason.trim() || null,
                diffNotesByKey: prevMeta.diffNotesByKey ?? {},
            });

            await upsertMetaNote(target.id, nextMetaNoteText);

            toast.success("Métadonnées enregistrées");
            await refreshVersionsAndSelect(target.id);
            setSheetOpen(false);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Erreur lors de l’enregistrement des métadonnées");
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // Compare note save (stored in META note’s diff map)
    // -----------------------------
    const saveCompareReason = async () => {
        const target = workingVersion ?? currentVersion;
        if (!target) return;
        if (!compareLeftId || !compareRightId) return;

        const key = compareKey(compareLeftId, compareRightId);
        const nextText = compareReasonDraft.trim();

        setLoading(true);
        try {
            const meta = parseMetaFromNotes(notes);
            const nextDiffMap = { ...(meta.diffNotesByKey ?? {}) };
            if (nextText) nextDiffMap[key] = nextText;
            else delete nextDiffMap[key];

            const nextMetaNoteText = composeMetaNote({
                completeness: metaDraftCompleteness || meta.completeness || null,
                referenceReason: metaDraftReferenceReason.trim() || meta.referenceReason || null,
                diffNotesByKey: nextDiffMap,
            });

            await upsertMetaNote(target.id, nextMetaNoteText);
            toast.success("Note de diff enregistrée");
        } catch (e) {
            console.error(e);
            toast.error("Impossible d’enregistrer la note de diff");
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // Gabarit draft create (manual)
    // -----------------------------
    const createDraftFromGabarit = async (g: GabaritRow) => {
        await createNewVersion({
            status: "draft",
            content: g.template_content,
            gabarit_id: g.id,
            transcription_kind: "travail",
            source_lecture_kind: "image_originale",
            conventions_text:
                "Conventions conseillées : [illisible], [barré], [lacune], [ajout en marge], " +
                PAGE_BREAK_TOKEN +
                " (saut de page).",
            confidence: "low",
            sourceIds: activeSourceId ? [activeSourceId] : [],
        });

        toast("Brouillon créé depuis un gabarit : relisez mot à mot.", { icon: "🧩", duration: 5000 });
    };

    // -----------------------------
    // API surface
    // -----------------------------
    return {
        // state
        loading,
        acte,
        acteSources,
        versions,
        currentId,
        currentVersion,
        versionSources,

        // sources-first
        activeSourceId,
        preferredSourceId,
        workingVersion,

        // editor + children
        editorValue,
        isDirty,
        textMode,
        annotations,
        notes,
        tags,
        acteurs,
        gabarits,
        selection,
        textareaRef,

        // sheet
        sheetOpen,
        sheetMode,
        setSheetOpen,
        setSheetMode,

        // drafts
        annoType,
        annoComment,
        noteContent,
        tagKind,
        tagLabel,
        tagActeurId,
        editingAnnotationId,
        editingNoteId,

        // meta drafts
        metaDraft,
        setMetaDraft,
        selectedSourceIdsDraft,
        metaDraftCompleteness,
        metaDraftReferenceReason,
        setMetaDraftCompleteness,
        setMetaDraftReferenceReason,

        // compare
        compareLeftId,
        compareRightId,
        setCompareLeftId,
        setCompareRightId,
        compareReasonDraft,
        setCompareReasonDraft,

        // computed
        nextVersionNumber,
        groupedAnnotations,
        anchorStatusOverrides,

        // actions: versions
        setCurrentId,
        setTextMode,
        captureSelection,
        onChangeEditor,
        jumpToRange,
        insertPageBreak,

        createEmptyDraft,
        saveAsNewDraftVersion,
        setInReview,

        // ✅ sources-first actions
        setActiveSource,
        onActiveSourceChanged,
        setPreferredSource,
        ensureActiveSourceSelectedInMetadata,
        createDraftForActiveSourceFromTemplateIfAny,
        saveNewVersionForActiveSource,
        openSourceDiffPicker,
        openSourceDiff,

        // metadata
        openMetadata,
        toggleSourceDraft,
        saveMetadata,

        // legacy compare (still useful)
        openCompare,
        saveCompareReason,

        // annotations / notes / tags
        openAddAnnotation,
        openEditAnnotation,
        openAddNote,
        openEditNote,
        openTagPassage,
        onChangeTagKind,

        setAnnoType,
        setAnnoComment,
        setNoteContent,
        setTagLabel,
        setTagActeurId,

        submitAnnotation,
        submitNote,
        submitTag,

        removeAnnotation,
        removeNote,
        removeTag,

        createDraftFromGabarit,

        // split
        split: splitApi,

        sources,
        loadingSources,
        errorMsg,
    };
}
