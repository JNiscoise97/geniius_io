// transcriptionTab.logic.ts

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
    PAGE_BREAK_TOKEN,
    type AnchorStatus,
    type AnnotationRow,
    type ConfidenceLevel,
    type EcActeRow,
    type NoteRow,
    type SourceLectureKind,
    type TranscriptionKind,
    type TranscriptionStatus,
    type TranscriptionTagRow,
    type TranscriptionVersionRow,
    computeAnchor,
    insertAtSelection,
    loadActeBundle,
    loadVersionChildren,
    loadVersionTags,
    refreshTranscriptionsAndVersions,
    setVersionStatusWithEvent,
    updateAnnotation,
    deleteAnnotation,
    updateNote,
    deleteNote,
    createTag,
    deleteTag,
    persistAnnotationStatuses,
    revalidateAnchor,
    insertAnnotation,
    insertNote,
    parseMetaFromNotes,
    composeMetaNote,
    compareKey,
    type CitationDraft,
    type ActeCitationRow,
    type ManifestationPick,
    type TranscriptionRow,
    createNewVersionForSource,
    updateTranscription,
    setTranscriptionReference,
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

    const [transcriptions, setTranscriptions] = useState<TranscriptionRow[]>([]);
    const [versions, setVersions] = useState<TranscriptionVersionRow[]>([]);
    const [transcriptionBySourceId, setTranscriptionBySourceId] = useState<Record<string, TranscriptionRow>>({});
    const [latestVersionIdBySourceId, setLatestVersionIdBySourceId] = useState<Record<string, string>>({});


    const [currentId, setCurrentId] = useState<string | null>(null);
    const currentVersion = useMemo(
        () => versions.find((v) => v.id === currentId) ?? null,
        [versions, currentId]
    );

    // -----------------------------
    // ✅ Sources-first state
    // -----------------------------
    const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
    const preferredSourceId = useMemo(() => {
        const ref = transcriptions.find((t) => t.is_reference);
        return ref?.acte_source_id ?? null;
    }, [transcriptions]);


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

    const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
    const [referenceTargetSourceId, setReferenceTargetSourceId] = useState<string | null>(null);

    type RefReasonKey = "best_legibility" | "most_complete" | "best_match" | "other";
    const [refReason, setRefReason] = useState<RefReasonKey | "">("");
    const [refComment, setRefComment] = useState("");


    // Metadata drafts (DB fields)
    type MetaDraft = {
        // version-level
        transcription_kind: TranscriptionKind | null;
        confidence: ConfidenceLevel | null;

        // transcription-level
        source_lecture_kind: SourceLectureKind | null;
        langue_vue: string | null;
        handwriting_style: string | null;
        handwriting_legibility: string | null;
        conventions_override_text: string | null;
    };

    const [metaDraft, setMetaDraft] = useState<MetaDraft>({
        transcription_kind: null,
        confidence: null,
        source_lecture_kind: null,
        langue_vue: null,
        handwriting_style: null,
        handwriting_legibility: null,
        conventions_override_text: null,
    });


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

    const autoDraftInFlightRef = useRef(false);
    const autoDraftDoneRef = useRef(false);

    // ✅ Debounce timer pour création auto de v1 draft quand l'utilisateur s'arrête de taper
    // number (window.setTimeout) pour éviter NodeJS.Timeout
    const autoDraftDebounceTimer = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (autoDraftDebounceTimer.current !== null) {
                window.clearTimeout(autoDraftDebounceTimer.current);
            }
        };
    }, []);


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
    function getNextVersionNumberForSource(sourceId: string | null): number {
        if (!sourceId) {
            const maxAll = versions.reduce((acc, v) => Math.max(acc, v.version ?? 0), 0);
            return maxAll + 1;
        }

        const tr = transcriptionBySourceId[sourceId];
        if (!tr) return 1;

        const maxForTranscription = versions
            .filter((v) => v.transcription_id === tr.id)
            .reduce((acc, v) => Math.max(acc, v.version ?? 0), 0);

        return maxForTranscription + 1;
    }

    const nextVersionNumber = useMemo(() => {
        return getNextVersionNumberForSource(activeSourceId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [versions, activeSourceId, transcriptionBySourceId]);


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
        return latestVersionIdBySourceId[sourceId] ?? null;
    }


    function getTwoTranscribedSourcesVersionIds(): { left: string; right: string } | null {
        // On veut 2 sources transcrites : on prend la “latest version” de 2 sources distinctes
        const pairs: Array<{ sourceId: string; versionId: string }> = [];
        for (const s of sources) {
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
            setTranscriptions([]);
            setVersions([]);
            setTranscriptionBySourceId({});
            setLatestVersionIdBySourceId({});
            setCurrentId(null);

            setActiveSourceId(null);
            setWorkingVersionId(null);

            setActeurs([]);
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
                setTranscriptions(bundle.transcriptions);
                setVersions(bundle.versions);
                setTranscriptionBySourceId(bundle.transcriptionBySourceId);
                setLatestVersionIdBySourceId(bundle.latestVersionIdBySourceId);
                setActeurs(bundle.acteurs);

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
        const res = await refreshTranscriptionsAndVersions(acteId);
        setTranscriptions(res.transcriptions);
        setVersions(res.versions);
        setTranscriptionBySourceId(res.transcriptionBySourceId);
        setLatestVersionIdBySourceId(res.latestVersionIdBySourceId);
        if (idToSelect) setCurrentId(idToSelect);
    }

    // -----------------------------
    // Version creation helpers
    // -----------------------------
    const createNewVersion = async (payload: {
        status: TranscriptionStatus;
        content: string;
        transcription_kind?: TranscriptionKind | null;
        confidence?: ConfidenceLevel | null;
        sourceIds?: string[];
    }): Promise<TranscriptionVersionRow> => {
        if (!activeSourceId) throw new Error("Aucune source active");

        setLoading(true);
        try {
            const row = await createNewVersionForSource({
                acteId,
                activeSourceId,
                editorContent: payload.content,
                status: payload.status,
                prevVersionId: (workingVersion ?? currentVersion)?.id ?? null,
                prevContent: (workingVersion ?? currentVersion)?.content ?? null,

                transcription_kind: payload.transcription_kind ?? null,
                confidence: payload.confidence ?? null,

                nextVersionNumber: getNextVersionNumberForSource(activeSourceId),
            });

            toast.success("Version créée");

            // IMPORTANT: on sélectionne tout de suite l'id connu
            setCurrentId(row.newVersion.id);
            setWorkingVersionId(row.newVersion.id);

            // puis refresh (async)
            await refreshVersionsAndSelect(row.newVersion.id);

            return row.newVersion;
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Erreur lors de la création de version");
            throw e;
        } finally {
            setLoading(false);
        }
    };


    const setInReview = async () => {

        const target = workingVersion ?? currentVersion;
        if (!target) return;

        if (target.status !== "TRANSCRIBED") {
            toast("Marque d’abord la transcription comme transcrite.", { icon: "🧾" });
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            await setVersionStatusWithEvent(
                target.id,
                { status: "IN_REVIEW" },
                { type: "status_change", payload: { to: "IN_REVIEW" } }
            );

            toast.success("Marquée en relecture");
            await refreshVersionsAndSelect(target.id);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Erreur");
        } finally {
            setLoading(false);
        }
    };

    const markAsTranscribed = async () => {
        const target = workingVersion ?? currentVersion;
        if (!target) return;

        setLoading(true);
        try {
            await setVersionStatusWithEvent(
                target.id,
                { status: "TRANSCRIBED" },
                { type: "status_change", payload: { to: "TRANSCRIBED" } }
            );

            toast.success("Marquée comme transcrite");
            await refreshVersionsAndSelect(target.id);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Erreur");
        } finally {
            setLoading(false);
        }
    };


    const autoStartDraftIfNeeded = async (nextText: string) => {
        if (!activeSourceId) return;
        // déjà une version pour cette source (workingVersion suffit, currentVersion peut être "legacy")
        if (workingVersion) return;
        if (autoDraftDoneRef.current || autoDraftInFlightRef.current) return;

        const trimmed = (nextText ?? "").trim();
        if (!trimmed) return; // pas au 1er caractère "utile"

        autoDraftInFlightRef.current = true;
        try {
            // crée une v1 brouillon avec le texte courant (1 char, paste, etc.)
            const v1 = await createNewVersion({
                status: (nextText ?? "").trim() ? "IN_PROGRESS" : "DRAFT",
                content: nextText ?? "",
                transcription_kind: "travail",
                confidence: "low",
                sourceIds: [activeSourceId],
            });


            // comme on vient de persister ce texte, on n’est pas dirty à cet instant
            setEditorValue(v1.content ?? "");
            setIsDirty(false);

            autoDraftDoneRef.current = true;
        } catch (e) {
            console.error(e);
            // si ça échoue, on laisse l’utilisateur taper quand même (isDirty restera true)
        } finally {
            autoDraftInFlightRef.current = false;
        }
    };


    // -----------------------------
    // Editor changes
    // -----------------------------
    const onChangeEditor = (next: string) => {
        setEditorValue(next);
        setIsDirty(true);

        // ✅ Auto-brouillon : seulement après une pause de frappe (debounce)
        // Conditions de base : source active + pas encore de version pour cette source + pas déjà fait
        if (!activeSourceId) return;
        if (workingVersion) return;
        if (autoDraftDoneRef.current || autoDraftInFlightRef.current) return;

        // Reset du timer à chaque frappe/collage
        if (autoDraftDebounceTimer.current !== null) {
            window.clearTimeout(autoDraftDebounceTimer.current);
        }

        // Après une courte pause, si le texte contient quelque chose de "utile", on crée la v1 draft
        autoDraftDebounceTimer.current = window.setTimeout(() => {
            void autoStartDraftIfNeeded(next);
        }, 800);
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
    const selectSource = (sourceId: string) => {
        setActiveSourceId(sourceId);
        const latest = getLatestVersionIdForSource(sourceId);
        void onActiveSourceChanged(sourceId, latest);
    };


    const onActiveSourceChanged = async (sourceId: string, latestVersionId: string | null) => {
        const nextWorking = latestVersionId ?? getLatestVersionIdForSource(sourceId);
        setWorkingVersionId(nextWorking);

        autoDraftDoneRef.current = false;
        autoDraftInFlightRef.current = false;
        if (autoDraftDebounceTimer.current !== null) {
            window.clearTimeout(autoDraftDebounceTimer.current);
            autoDraftDebounceTimer.current = null;
        }


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

    const startTranscriptionForActiveSource = async (): Promise<TranscriptionVersionRow | null> => {
        if (!activeSourceId) return null;

        const existing = getLatestVersionIdForSource(activeSourceId);
        if (existing) {
            toast("Cette source a déjà une transcription active.", { icon: "✅" });
            setWorkingVersionId(existing);
            setCurrentId(existing);
            return versions.find((v) => v.id === existing) ?? null;
        }

        const newV = await createNewVersion({
            status: (editorValue ?? "").trim() ? "IN_PROGRESS" : "DRAFT",
            content: "",
            transcription_kind: "travail",
            confidence: "low",
            sourceIds: [activeSourceId],
        });


        toast("Brouillon créé pour la source active", { icon: "📝" });
        return newV;
    };



    const normalizeContentForCompare = (s: string) =>
        (s ?? "").replace(/\r\n/g, "\n").trim();

    const saveNewVersionForActiveSource = async () => {
        if (!activeSourceId) return;

        const base = workingVersion ?? currentVersion;
        const next = normalizeContentForCompare(editorValue ?? "");
        const prev = normalizeContentForCompare(base?.content ?? "");

        if (!base) {
            // cas rare: aucune version (auto-brouillon n’a pas encore eu le temps / a échoué)
            await createNewVersion({
                status: (editorValue ?? "").trim() ? "IN_PROGRESS" : "DRAFT",
                content: editorValue ?? "",
                transcription_kind: "travail",
                confidence: "low",
                sourceIds: [activeSourceId],
            });
            toast("Brouillon créé et enregistré", { icon: "📝" });
            return;
        }


        if (!next) {
            toast("Texte vide : rien à enregistrer.", { icon: "⛔" });
            return;
        }

        if (base && next === prev) {
            toast("Aucun changement : nouvelle version non créée.", { icon: "🟰" });
            return;
        }

        await createNewVersion({
            status: (editorValue ?? "").trim() ? "IN_PROGRESS" : "DRAFT",
            content: editorValue ?? "",
            transcription_kind: base?.transcription_kind ?? null,
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

    const openMetadata = async () => {
        // On veut permettre d’ouvrir les métadonnées même si aucune version n’existe encore.
        // Donc : si pas de working/current version, on crée un brouillon pour la source active, puis on ouvre.

        if (!activeSourceId) {
            toast("Sélectionne une source d’abord.", { icon: "🧩" });
            return;
        }

        const target = workingVersion ?? currentVersion;
        if (!target) {
            toast("Commence par transcrire : le brouillon sera créé automatiquement au 1er caractère.", { icon: "📝" });
            return;
        }



        setSheetMode("metadata");

        // transcription liée à la source active
        const tr = activeSourceId ? transcriptionBySourceId[activeSourceId] : undefined;

        setMetaDraft({
            // version-level
            transcription_kind: target.transcription_kind ?? null,
            confidence: target.confidence ?? null,

            // transcription-level
            source_lecture_kind: tr?.source_lecture_kind ?? null,
            langue_vue: tr?.langue_vue ?? null,
            handwriting_style: (tr as any)?.handwriting_style ?? null,
            handwriting_legibility: (tr as any)?.handwriting_legibility ?? null,
            conventions_override_text: (tr as any)?.conventions_override_text ?? null,
        });


        // seed meta drafts from current META note
        const m = parseMetaFromNotes(notes);
        setMetaDraftCompleteness(m.completeness ?? "");
        setMetaDraftReferenceReason(m.referenceReason ?? "");

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
            // 1) update version (version-level)
            await setVersionStatusWithEvent(
                target.id,
                {
                    transcription_kind: metaDraft.transcription_kind ?? null,
                    confidence: metaDraft.confidence ?? null,
                } as any,
                {
                    type: "metadata",
                    payload: {
                        transcription_kind: metaDraft.transcription_kind ?? null,
                        confidence: metaDraft.confidence ?? null,
                    },
                }
            );


            // 2) update transcription (transcription-level)
            if (activeSourceId) {
                const tr = transcriptionBySourceId[activeSourceId];
                if (tr?.id) {
                    await updateTranscription(tr.id, {
                        source_lecture_kind: (metaDraft.source_lecture_kind ?? tr.source_lecture_kind) as any,
                        langue_vue: metaDraft.langue_vue ?? null,
                        handwriting_style: metaDraft.handwriting_style ?? null,
                        handwriting_legibility: metaDraft.handwriting_legibility ?? null,
                        conventions_override_text: metaDraft.conventions_override_text ?? null,
                    } as any);
                }
            }


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

    const openSetReference = (sourceId: string) => {
        setReferenceTargetSourceId(sourceId);
        setRefReason("");
        setRefComment("");
        setReferenceDialogOpen(true);
    };

    const submitSetReference = async () => {
        if (!referenceTargetSourceId) return;

        if (!refReason) {
            toast("Choisis une raison", { icon: "⭐" });
            return;
        }

        const commentRequired = refReason === "other";
        if (commentRequired && !refComment.trim()) {
            toast("Le commentaire est requis pour 'Autre'", { icon: "✍️" });
            return;
        }

        const tr = transcriptionBySourceId[referenceTargetSourceId];
        if (!tr?.id) {
            toast("Aucune transcription pour cette source (commence par transcrire)", { icon: "🧩" });
            return;
        }

        // Raison persistée dans preference_reason (texte)
        const reasonText =
            refReason === "best_legibility" ? "Meilleure lisibilité / meilleure image"
                : refReason === "most_complete" ? "Transcription la plus complète"
                    : refReason === "best_match" ? "Correspond le mieux aux autres sources"
                        : `Autre: ${refComment.trim()}`;

        setLoading(true);
        try {
            await setTranscriptionReference({
                transcriptionId: tr.id,
                preferenceReason: reasonText,
            });

            toast("Transcription définie comme référence", { icon: "⭐" });
            await refreshVersionsAndSelect(workingVersion?.id ?? undefined);
            setReferenceDialogOpen(false);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Erreur");
        } finally {
            setLoading(false);
        }
    };


    // -----------------------------
    // API surface
    // -----------------------------
    return {
        // state
        loading,
        acte,
        versions,
        currentId,
        currentVersion,

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

        setInReview,
        markAsTranscribed,

        // ✅ sources-first actions
        selectSource,
        onActiveSourceChanged,
        startTranscriptionForActiveSource,
        saveNewVersionForActiveSource,
        openSourceDiffPicker,
        openSourceDiff,

        // metadata
        openMetadata,
        saveMetadata,

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

        // split
        split: splitApi,

        sources,
        loadingSources,
        errorMsg,

        getLatestVersionIdForSource,
        latestVersionIdBySourceId,
        transcriptionBySourceId,

        openSetReference,
        submitSetReference
    };
}
