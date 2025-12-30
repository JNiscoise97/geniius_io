// TranscriptionTab.tsx
// Orchestration / composition only (UI + hook).
// ✅ Pilotage par sources (MVP):
// - Dashboard “Sources” en premier : transcrite / préférée
// - 1 transcription “active” par source = dernière version liée à cette source
// - Diff Source A ↔ Source B (piloté depuis le dashboard)
// - Save = nouvelle version (historique conservé, non exposé)
// - Report annotations/notes/tags sur nouvelle version (best effort) -> géré dans logic/service

import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import {
    CheckCircle2,
    FileText,
    Plus,
    Save,
    Tags,
    SeparatorHorizontal,
    Eye,
    Pencil,
    Trash2,
    GripVertical,
    Star,
    Circle,
    Lock,
    Unlock,
} from "lucide-react";

import { anchorBadge, STEPPER_COPY, tagBadge, typeLabel } from "./transcriptionTab.ui";

import {
    PAGE_BREAK_TOKEN,
    normalizeSpaces,
    splitIntoReadableBlocks,
    detectActeReperages,
} from "./transcriptionTab.service";

import { useTranscriptionTab } from "./transcriptionTab.logic";
import { StatusPill } from "@/components/shared/StatusPill";

type Props = {
    acteId: string;
    onGoToTab?: (tabLabel: string) => void;
};

type SourceDashboardRow = {
    id: string;
    label: string;

    isPreferred: boolean;
    status: string

    latestVersionId: string | null; // “active transcription” for that source
    usedInWorkingVersion: boolean; // for info only
};

export default function TranscriptionTab({ acteId }: Props) {
    const t = useTranscriptionTab({ acteId });

    // Shortcuts
    const sources = t.sources;
    const versions = t.versions;
    const annotations = t.annotations;
    const notes = t.notes;
    const tags = t.tags;

    const onMouseDownDivider = (e: React.MouseEvent) => t.split.onMouseDownDivider(e);

    // Read/repérages
    const readableBlocks = useMemo(() => splitIntoReadableBlocks(t.editorValue), [t.editorValue]);
    const rep = useMemo(() => detectActeReperages(t.editorValue), [t.editorValue]);

    // Build “latest version per source” map (source-first)
    const latestBySourceId = useMemo(() => {
        const map = new Map<string, string>();
        for (const [sid, vid] of Object.entries(t.latestVersionIdBySourceId ?? {})) {
            map.set(sid, vid);
        }
        return map;
    }, [t.latestVersionIdBySourceId]);


    // Dashboard rows
    const dashboard = useMemo<SourceDashboardRow[]>(() => {

        const preferredSourceId = (t.preferredSourceId as string | null) ?? null;

        return (sources ?? []).map((s: any) => {
            const latestVersionId = latestBySourceId.get(s.id) ?? null;

            // label simple (tu peux l’affiner, mais on n’en dépend plus côté logic)
            const uniteTitre = s.manifestation?.unite_titre ?? "Source";
            const inst = s.manifestation?.institution_sigle ?? s.manifestation?.depot_type ?? null;
            const vuesPages =
                s.vues_raw ||
                (s.vues_start || s.vues_end
                    ? `Vues ${s.vues_start ?? "?"}–${s.vues_end ?? "?"}`
                    : s.page_raw ||
                    (s.page_start || s.page_end
                        ? `Pages ${s.page_start ?? "?"}–${s.page_end ?? "?"}`
                        : ""));
            const label = [uniteTitre, inst, vuesPages].filter(Boolean).join(" · ");
            const usedInWorkingVersion = t.activeSourceId === s.id;

            const tr = t.transcriptionBySourceId?.[s.id] ?? null;
            const status = (tr?.status ?? "TO_TRANSCRIBE") as string;

            return {
                id: s.id,
                label,
                isPreferred: !!preferredSourceId && preferredSourceId === s.id,
                status,
                latestVersionId,
                usedInWorkingVersion,
            };
        });
    }, [sources, latestBySourceId, t.preferredSourceId, t.workingVersion?.id]);


    // 🔒 Lock state (only for finalized statuses)
    const [textareaLocked, setTextareaLocked] = useState(true);

    // auto-lock when status becomes non-editable
    React.useEffect(() => {
        if (!t.isEditableStatus) {
            setTextareaLocked(true);
        }
    }, [t.isEditableStatus]);

    const activeLatestVersionId = t.activeSourceId
        ? t.getLatestVersionIdForSource(t.activeSourceId)
        : null;


    const StepItem = ({
        idx,
        title,
        subtitle,
        active,
        done,
        icon,
    }: {
        idx: 1 | 2 | 3 | 4;
        title: string;
        subtitle: string;
        active: boolean;
        done: boolean;
        icon: React.ReactNode;
    }) => {
        return (
            <div className="flex items-start gap-3">
                <div
                    className={[
                        "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border",
                        done
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : active
                                ? "border-slate-300 bg-white text-slate-900"
                                : "border-slate-200 bg-slate-50 text-slate-500",
                    ].join(" ")}
                >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : icon}
                </div>

                <div className="min-w-0">
                    <div
                        className={[
                            "text-sm font-semibold",
                            active ? "text-slate-900" : "text-slate-700",
                        ].join(" ")}
                    >
                        {idx}. {title}
                    </div>
                    <div className="text-xs text-slate-600">{subtitle}</div>
                </div>
            </div>
        );
    };

    const activeSourceRow = useMemo(() => {
        if (!t.activeSourceId) return null;
        return dashboard.find((d) => d.id === t.activeSourceId) ?? null;
    }, [dashboard, t.activeSourceId]);

    // Working version = latest version of active source (source-first),
    // otherwise fallback to currentVersion (legacy)
    const workingVersion = useMemo(() => {
        if (activeSourceRow?.latestVersionId) {
            return versions.find((v) => v.id === activeSourceRow.latestVersionId) ?? null;
        }
        return t.currentVersion ?? null;
    }, [activeSourceRow?.latestVersionId, versions, t.currentVersion]);

    // Loading
    if (t.loading && !workingVersion && versions.length === 0) {
        return <div className="p-4 text-sm text-slate-600">Chargement…</div>;
    }

    const isFinalized =
        (workingVersion?.status === "IN_REVIEW" || workingVersion?.status === "VALIDATED") ?? false;

    const step: 1 | 2 | 3 | 4 =
        !t.activeSourceId
            ? 1
            : !activeLatestVersionId
                ? 2
                : isFinalized
                    ? 4
                    : 3;



    const textareaDisabled =
        step === 1 ||
        (!t.isEditableStatus && textareaLocked);

    return (
        <div className="p-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    {/* Stepper */}
                    <div className="min-w-0 flex-1">
                        <div className="mt-3 grid gap-3 sm:grid-cols-4">
                            <StepItem
                                idx={1}
                                title={STEPPER_COPY[1].title}
                                subtitle={STEPPER_COPY[1].subtitle}
                                active={step === 1}
                                done={step > 1}
                                icon={<Circle className="h-4 w-4" />}
                            />

                            <StepItem
                                idx={2}
                                title={STEPPER_COPY[2].title}
                                subtitle={STEPPER_COPY[2].subtitle}
                                active={step === 2}
                                done={step > 2}
                                icon={<FileText className="h-4 w-4" />}
                            />

                            <StepItem
                                idx={3}
                                title={STEPPER_COPY[3].title}
                                subtitle={STEPPER_COPY[3].subtitle}
                                active={step === 3}
                                done={step > 3}
                                icon={<Tags className="h-4 w-4" />}
                            />

                            <StepItem
                                idx={4}
                                title={STEPPER_COPY[4].title}
                                subtitle={STEPPER_COPY[4].subtitle}
                                active={step === 4}
                                done={false}
                                icon={<Pencil className="h-4 w-4" />}
                            />
                        </div>


                        {step === 1 ? (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                Choisis une source à droite pour commencer. Le champ de transcription est désactivé tant que la source n’est pas sélectionnée.
                            </div>
                        ) : null}

                        {step === 2 ? (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                Cette source n’a pas encore de transcription. Commence à saisir le texte : un brouillon sera créé automatiquement après une courte pause.
                            </div>
                        ) : null}

                    </div>

                </div>
            </div>

            {/* Split layout */}
            <div
                id="transcription-split-root"
                className="grid gap-0"
                style={{
                    gridTemplateColumns: `minmax(360px, ${t.split.leftPct}%) 12px minmax(320px, ${100 - t.split.leftPct}%)`,
                }}
            >
                {/* Left: editor */}
                <div className="pr-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="text-sm font-semibold text-slate-900">Texte</div>

                                {/* mode edit/read */}
                                <div className="ml-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                                    <button
                                        type="button"
                                        onClick={() => t.setTextMode("edit")}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${t.textMode === "edit" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
                                            }`}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Édition
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => t.setTextMode("read")}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${t.textMode === "read" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
                                            }`}
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        Lecture
                                    </button>
                                </div>

                                {!t.isEditableStatus && t.textMode === "edit" && step !== 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setTextareaLocked((v) => !v)}
                                        className={[
                                            'inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm',
                                            textareaLocked
                                                ? 'border-slate-200 bg-white hover:bg-slate-50'
                                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
                                        ].join(' ')}
                                        title={
                                            textareaLocked
                                                ? "Déverrouiller l’édition (attention : version finalisée)"
                                                : "Verrouiller l’édition"
                                        }
                                    >
                                        {textareaLocked ? (
                                            <Lock className="h-4 w-4 text-slate-700" />
                                        ) : (
                                            <Unlock className="h-4 w-4 text-slate-800" />
                                        )}
                                    </button>
                                )}


                                {activeSourceRow ? (
                                    <div className="ml-2 flex items-center gap-2 min-w-0">
                                        {activeSourceRow.isPreferred ? <Badge className="bg-amber-500 text-white">Transcription de référence</Badge> : null}
                                    </div>
                                ) : null}

                                <StatusPill statut={(workingVersion?.status as any) || "TO_TRANSCRIBE"} />

                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Button variant="outline" onClick={t.openAddAnnotation} disabled={textareaDisabled || !workingVersion || t.loading} className="gap-2">
                                    <Plus className="w-4 h-4" /> Annotation
                                </Button>
                                <Button variant="outline" onClick={t.openAddNote} disabled={textareaDisabled || !workingVersion || t.loading} className="gap-2">
                                    <Plus className="w-4 h-4" /> Note
                                </Button>
                                <Button variant="outline" onClick={t.openTagPassage} disabled={textareaDisabled || !workingVersion || t.loading} className="gap-2">
                                    <Tags className="w-4 h-4" />
                                    Tag
                                </Button>
                                {t.textMode === "edit" && (
                                    <Button variant="outline" onClick={t.insertPageBreak} disabled={textareaDisabled || !workingVersion || t.loading} className="gap-2">
                                        <SeparatorHorizontal className="w-4 h-4" />
                                        Saut de page
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="mt-3">
                            {t.textMode === "edit" ? (
                                <>
                                    <textarea
                                        disabled={textareaDisabled}
                                        ref={t.textareaRef}
                                        value={t.editorValue}
                                        onChange={(e) => t.onChangeEditor(e.target.value)}
                                        onMouseUp={t.captureSelection}
                                        onKeyUp={t.captureSelection}
                                        placeholder={`Transcrivez ici le texte… (ex : [illisible], [barré], [lacune], [ajout en marge], ${PAGE_BREAK_TOKEN} = saut de page)`}
                                        className={[
                                            "min-h-[520px] w-full resize-y rounded-xl border px-3 py-3 text-sm leading-relaxed shadow-sm outline-none",
                                            textareaDisabled
                                                ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                                                : "border-slate-200 bg-white text-slate-900 focus:border-slate-400",
                                        ].join(" ")}
                                    />
                                    {textareaDisabled ? (
                                        <div className="mt-2 text-xs text-slate-500">
                                            Sélectionne une source pour commencer.
                                        </div>
                                    ) : null}
                                    <div className="mt-3">
                                        <Button
                                            onClick={t.saveNewVersionForActiveSource}
                                            disabled={t.loading || step !== 3 || !t.isDirty}
                                            className="w-full gap-2"
                                            title="Enregistrer : crée une nouvelle version"
                                        >
                                            <Save className="h-4 w-4" />
                                            Enregistrer
                                        </Button>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                        <div>
                                            {t.selection ? (
                                                <span>
                                                    Sélection : {t.selection.start}–{t.selection.end} ({t.selection.end - t.selection.start} caractères)
                                                </span>
                                            ) : (
                                                <span>Sélectionnez un passage pour créer une annotation / tag ancré.</span>
                                            )}
                                        </div>
                                        {t.isDirty ? <span className="text-yellow-700">Modifs non enregistrées</span> : <span>—</span>}
                                    </div>
                                </>
                            ) : (
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

                {/* Right panel */}
                <div className="pl-2">
                    <div className="sticky top-4">
                        <div className="max-h-[calc(100vh-160px)] overflow-auto space-y-4 pr-1">
                            {/* ✅ Sources dashboard (FIRST) */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-slate-900">Sources</div>
                                    <Badge variant="secondary">{dashboard.length}</Badge>
                                </div>
                                <p className="mt-1 text-xs text-slate-600">
                                    Chaque source a une transcription active (la dernière version liée). Le diff compare les transcriptions actives.
                                </p>

                                <div className="mt-3 space-y-2">
                                    {dashboard.length === 0 ? (
                                        <div className="text-sm text-slate-600">Aucune source enregistrée pour cet acte.</div>
                                    ) : (
                                        dashboard.map((d) => {
                                            const g = sources.find((x: any) => x.id === d.id) as any; // récupère l’objet enrichi
                                            const isActive = d.id === t.activeSourceId;

                                            const m = g?.manifestation ?? null;
                                            const online = Boolean((m?.url_base ?? "").trim());
                                            const uniteTitre = m?.unite_titre ?? "Source";
                                            const institutionSigle = m?.institution_sigle ?? m?.depot_type ?? null;
                                            const uniteCote = m?.unite_cote ?? null;

                                            console.log('d', d)
                                            console.log('g', g)
                                            console.log('m', m)

                                            const vuesPages =
                                                g?.vues_raw ||
                                                (g?.vues_start || g?.vues_end
                                                    ? `Vues ${g?.vues_start ?? "?"}–${g?.vues_end ?? "?"}`
                                                    : g?.page_raw ||
                                                    (g?.page_start || g?.page_end
                                                        ? `Pages ${g?.page_start ?? "?"}–${g?.page_end ?? "?"}`
                                                        : ""));

                                            const lineParts = [
                                                uniteCote ? uniteCote : null,
                                                vuesPages ? vuesPages : null,
                                                g?.acte_manquant ? "Acte manquant" : null,
                                            ].filter(Boolean);

                                            const line = lineParts.join(" · ");
                                            const isPreferred = d.id === t.preferredSourceId;

                                            const pick = () => t.selectSource(d.id);

                                            return (
                                                <div
                                                    key={d.id}
                                                    className={[
                                                        "w-full rounded-xl border p-3 text-left transition",
                                                        isActive
                                                            ? "border-slate-900/20 bg-slate-50 shadow-sm ring-2 ring-slate-900/10"
                                                            : "border-slate-200 bg-white hover:bg-slate-50",
                                                    ].join(" ")}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={pick}
                                                            className="min-w-0 flex-1 text-left"
                                                            title={d.label}
                                                        >
                                                            <div className="grid grid-cols-12 gap-x-2 gap-y-1">
                                                                <div className="col-span-12 min-w-0">
                                                                    <span className="block truncate text-sm font-semibold text-slate-900">
                                                                        {uniteTitre}
                                                                    </span>
                                                                </div>

                                                                <div className="col-span-12 flex flex-wrap items-center gap-2">
                                                                    {institutionSigle ? (
                                                                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                                                                            {institutionSigle}
                                                                        </span>
                                                                    ) : null}

                                                                    {online ? (
                                                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                                                            En ligne
                                                                        </span>
                                                                    ) : (
                                                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                                                                            Sur place
                                                                        </span>
                                                                    )}

                                                                    {m?.pagination_type ? (
                                                                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                                                                            pagination: {m.pagination_type}
                                                                        </span>
                                                                    ) : null}

                                                                    <StatusPill statut={d.status || "TO_TRANSCRIBE"} />

                                                                </div>
                                                            </div>

                                                            {line ? <div className="mt-1 text-xs text-slate-600">{line}</div> : null}
                                                        </button>

                                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    t.openSetReference(d.id);
                                                                }}
                                                                title={isPreferred ? "Source de référence" : "Définir comme référence"}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50"
                                                            >
                                                                <Star
                                                                    className={[
                                                                        "h-4 w-4 transition-colors",
                                                                        isPreferred ? "text-amber-500 fill-amber-500" : "text-slate-400 hover:text-amber-500",
                                                                    ].join(" ")}
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}

                                </div>

                            </div>

                            {/* Repérages */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-slate-900">Repérages</div>
                                    <Badge variant="secondary">heuristique</Badge>
                                </div>

                                <div className="mt-3 space-y-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <div className="text-xs font-semibold text-slate-700">Dans le texte</div>

                                        <div className="mt-2 space-y-3">
                                            <MiniHitRow title="Dates" hits={rep.dates} onPick={(a, b) => t.jumpToRange(a, b)} />
                                            <MiniHitRow title="Âges" hits={rep.ages} onPick={(a, b) => t.jumpToRange(a, b)} />
                                            <MiniHitRow title="Numéros" hits={rep.numeros} onPick={(a, b) => t.jumpToRange(a, b)} />
                                            <MiniHitRow title="Majuscules" hits={rep.majuscules} onPick={(a, b) => t.jumpToRange(a, b)} />
                                        </div>

                                        <div className="mt-2 text-xs text-slate-500">Repérages visuels : rien n’est créé automatiquement.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-slate-900">Tags</div>
                                    <Badge variant="secondary">{tags.length}</Badge>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {tags.length === 0 && <div className="text-sm text-slate-600">Aucun tag.</div>}

                                    {tags.map((tRow) => (
                                        <div key={tRow.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        {tagBadge(tRow.kind)}
                                                        <div className="text-sm font-semibold text-slate-900 truncate">{tRow.label}</div>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-600">
                                                        {tRow.start_offset}–{tRow.end_offset}
                                                        {tRow.linked_acteur_id ? <> · <span className="font-medium">lié à un acteur</span></> : null}
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-800 line-clamp-2">“{tRow.quote}”</div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => t.jumpToRange(tRow.start_offset, tRow.end_offset)}>
                                                        Voir
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => t.removeTag(tRow.id)} className="gap-1">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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

                                    {(Object.keys(t.groupedAnnotations) as Array<keyof typeof t.groupedAnnotations>).map((k) => {
                                        const list = t.groupedAnnotations[k];
                                        if (!list.length) return null;

                                        return (
                                            <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs font-semibold text-slate-700">{typeLabel[k]}</div>
                                                    <Badge variant="secondary">{list.length}</Badge>
                                                </div>

                                                <div className="mt-2 space-y-2">
                                                    {list.map((a) => {
                                                        const effective = t.anchorStatusOverrides[a.id] ?? a.status;
                                                        return (
                                                            <div key={a.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <button type="button" onClick={() => t.jumpToRange(a.start_offset, a.end_offset)} className="text-left min-w-0">
                                                                        <div className="text-xs font-semibold text-slate-900">
                                                                            {a.type} · {a.start_offset}–{a.end_offset}
                                                                        </div>
                                                                        <div className="mt-1 text-sm text-slate-800 line-clamp-2">“{a.quote}”</div>
                                                                        {a.comment ? <div className="mt-1 text-xs text-slate-600 line-clamp-2">{a.comment}</div> : null}
                                                                    </button>

                                                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                                                        {anchorBadge(effective)}
                                                                        <div className="flex gap-2">
                                                                            <Button variant="outline" size="sm" onClick={() => t.openEditAnnotation(a)} className="gap-1">
                                                                                <Pencil className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button variant="outline" size="sm" onClick={() => t.removeAnnotation(a.id)} className="gap-1">
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
                            </div>

                            {/* Notes */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-slate-900">Notes</div>
                                    <Badge variant="secondary">{notes.filter((n) => !n.content?.startsWith("[META]")).length}</Badge>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {notes.filter((n) => !n.content?.startsWith("[META]") && !n.content?.startsWith("[DIFF ")).length === 0 && (
                                        <div className="text-sm text-slate-600">Aucune note (hors méta/diff).</div>
                                    )}

                                    {notes
                                        .filter((n) => !n.content?.startsWith("[META]") && !n.content?.startsWith("[DIFF "))
                                        .map((n) => (
                                            <div key={n.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                                <div className="flex items-start justify-between gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (n.start_offset != null && n.end_offset != null) t.jumpToRange(n.start_offset, n.end_offset);
                                                        }}
                                                        className="text-left min-w-0"
                                                    >
                                                        {n.quote ? <div className="text-xs text-slate-600 line-clamp-1">Ancrée : “{n.quote}”</div> : null}
                                                        <div className="mt-1 text-sm text-slate-900 line-clamp-3">{n.content}</div>
                                                    </button>

                                                    <div className="shrink-0 flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => t.openEditNote(n)} className="gap-1">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => t.removeNote(n.id)} className="gap-1">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Workflow shortcuts */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="text-sm font-semibold text-slate-900">Workflow</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={t.markAsTranscribed}
                                        disabled={!workingVersion || t.loading || !(t.editorValue ?? "").trim()}
                                    >
                                        Marquer comme transcrit
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={t.setInReview}
                                        disabled={!workingVersion || t.loading || workingVersion?.status !== "TRANSCRIBED"}
                                    >
                                        Marquer en relecture
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => t.openSourceDiffPicker()}
                                        disabled={dashboard.filter((d) => !!d.latestVersionId).length < 2}
                                    >
                                        Comparer deux sources
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => t.openMetadata()}
                                        disabled={t.loading || !t.activeSourceId}
                                        className="gap-2"
                                        title="Voir / modifier les métadonnées de la transcription"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Finaliser
                                    </Button>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                    Save = nouvelle version liée à la source active, avec report best-effort des ancres (OK / À revoir / Orpheline).
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={t.referenceDialogOpen} onOpenChange={t.setReferenceDialogOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Définir la source de référence</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-medium text-slate-700">Raison principale</div>
                            <select
                                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                                value={t.refReason}
                                onChange={(e) => t.setRefReason(e.target.value as any)}
                            >
                                <option value="">—</option>
                                <option value="best_legibility">Meilleure lisibilité</option>
                                <option value="most_complete">Plus complète</option>
                                <option value="best_match">Correspond le mieux à l’acte</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>

                        <div>
                            <div className="text-xs font-medium text-slate-700">Détail (optionnel)</div>
                            <Textarea
                                className="mt-1 min-h-[90px]"
                                value={t.refComment}
                                onChange={(e) => t.setRefComment(e.target.value)}
                                placeholder="Ex : page plus nette, moins de lacunes, acte complet, meilleure exposition…"
                            />
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                            Conseil : garde ça factuel. L’info est stockée dans <code className="font-mono">ec_transcriptions.preference_reason</code>.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant='ghost' disabled={t.loading}>
                            Annuler
                        </Button>
                        <Button type="button" onClick={(e) => {
                            e.preventDefault();
                            t.confirmSetReference();
                        }}
                            disabled={t.loading || !t.referenceTargetSourceId}>
                            Définir comme référence
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Sheet */}
            <Sheet open={t.sheetOpen} onOpenChange={t.setSheetOpen}>
                <SheetContent side="right" className="!w-[50vw] !max-w-none p-0 flex flex-col max-h-screen">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>
                            {t.sheetMode === "annotation"
                                ? t.editingAnnotationId
                                    ? "Modifier l’annotation"
                                    : "Ajouter une annotation"
                                : t.sheetMode === "note"
                                    ? t.editingNoteId
                                        ? "Modifier la note"
                                        : "Ajouter une note"
                                    : t.sheetMode === "metadata"
                                        ? "Métadonnées & décisions"
                                        : t.sheetMode === "compare"
                                            ? "Comparer des sources (diff + note de cause)"
                                            : t.sheetMode === "tag"
                                                ? "Tagger un passage"
                                                : "Panneau"}
                        </SheetTitle>
                        <SheetDescription>
                            {t.sheetMode === "metadata"
                                ? "Référence / complétude / raisons : pour supprimer l’ambiguïté."
                                : t.sheetMode === "compare"
                                    ? "Diff visuel entre transcriptions actives de deux sources + note de cause."
                                    : ""}
                        </SheetDescription>
                    </SheetHeader>

                    {/* Le contenu Sheet reste géré par logic (on le refactor après) */}
                    <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                        {t.sheetMode === "metadata" ? (
                            <Tabs defaultValue="meta" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="meta">Métadonnées</TabsTrigger>
                                    <TabsTrigger value="history">Historique</TabsTrigger>
                                </TabsList>

                                <TabsContent value="meta" className="mt-4">
                                    <div className="space-y-4">
                                        {/* Bloc principal */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Visibility</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.visibility ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, visibility: e.target.value || null }))}
                                                    placeholder="ex: public / private / team…"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">State</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.state ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, state: e.target.value || null }))}
                                                    placeholder="ex: draft / final / archived…"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Source lecture</div>
                                                <select
                                                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                                                    value={(t.metaDraft.source_lecture_kind ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, source_lecture_kind: (e.target.value || null) as any }))}
                                                >
                                                    <option value="">—</option>
                                                    <option value="image_originale">Image originale</option>
                                                    <option value="microfilm">Microfilm</option>
                                                    <option value="transcription_secondaire">Transcription secondaire</option>
                                                    <option value="autre">Autre</option>
                                                </select>
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Scope</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.scope ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, scope: e.target.value || null }))}
                                                    placeholder="ex: acte complet / extrait / marge…"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <div className="text-xs font-medium text-slate-700">Scope details</div>
                                                <Textarea
                                                    className="mt-1 min-h-[80px]"
                                                    value={(t.metaDraft.scope_details ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, scope_details: e.target.value || null }))}
                                                    placeholder="Détails précis du périmètre…"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Langue (vue)</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.langue_vue ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, langue_vue: e.target.value || null }))}
                                                    placeholder="fr, la, ..."
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Language confidence</div>
                                                <select
                                                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                                                    value={(t.metaDraft.language_confidence ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, language_confidence: (e.target.value || null) as any }))}
                                                >
                                                    <option value="">—</option>
                                                    <option value="high">Haute</option>
                                                    <option value="medium">Moyenne</option>
                                                    <option value="low">Basse</option>
                                                </select>
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Handwriting style</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.handwriting_style ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, handwriting_style: e.target.value || null }))}
                                                    placeholder="cursive, ronde, mixte…"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Handwriting legibility</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.handwriting_legibility ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, handwriting_legibility: e.target.value || null }))}
                                                    placeholder="bonne, moyenne, faible…"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Goal</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.goal ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, goal: e.target.value || null }))}
                                                    placeholder="ex: indexation / extraction / édition…"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Normalisation policy</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.normalisation_policy ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, normalisation_policy: e.target.value || null }))}
                                                    placeholder="ex: none / light / strict…"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Conventions id</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.conventions_id ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, conventions_id: e.target.value || null }))}
                                                    placeholder="uuid (optionnel)"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <div className="text-xs font-medium text-slate-700">Conventions override</div>
                                                <Textarea
                                                    className="mt-1 min-h-[120px]"
                                                    value={(t.metaDraft.conventions_override_text ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, conventions_override_text: e.target.value || null }))}
                                                    placeholder="Règles, tokens, usages…"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Completeness</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.completeness ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, completeness: e.target.value || null }))}
                                                    placeholder="complete / partial…"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Reserve level</div>
                                                <Input
                                                    className="mt-1"
                                                    value={(t.metaDraft.reserve_level ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, reserve_level: e.target.value || null }))}
                                                    placeholder="none / low / medium / high…"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <div className="text-xs font-medium text-slate-700">Incompleteness reason</div>
                                                <Textarea
                                                    className="mt-1 min-h-[80px]"
                                                    value={(t.metaDraft.incompleteness_reason ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, incompleteness_reason: e.target.value || null }))}
                                                    placeholder="Pourquoi partiel ?"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <div className="text-xs font-medium text-slate-700">Reserve reason</div>
                                                <Textarea
                                                    className="mt-1 min-h-[80px]"
                                                    value={(t.metaDraft.reserve_reason ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, reserve_reason: e.target.value || null }))}
                                                    placeholder="Pourquoi réserve ?"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <div className="text-xs font-medium text-slate-700">Note</div>
                                                <Textarea
                                                    className="mt-1 min-h-[90px]"
                                                    value={(t.metaDraft.note ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, note: e.target.value || null }))}
                                                    placeholder="Notes internes…"
                                                />
                                            </div>

                                            {/* Version-level */}
                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Transcription kind (version)</div>
                                                <select
                                                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                                                    value={(t.metaDraft.transcription_kind ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, transcription_kind: (e.target.value || null) as any }))}
                                                >
                                                    <option value="">—</option>
                                                    <option value="travail">Travail</option>
                                                    <option value="diplomatique">Diplomatique</option>
                                                    <option value="semi_normalisee">Semi-normalisée</option>
                                                </select>
                                            </div>

                                            <div>
                                                <div className="text-xs font-medium text-slate-700">Confidence (version)</div>
                                                <select
                                                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                                                    value={(t.metaDraft.confidence ?? "") as any}
                                                    onChange={(e) => t.setMetaDraft((p) => ({ ...p, confidence: (e.target.value || null) as any }))}
                                                >
                                                    <option value="">—</option>
                                                    <option value="high">Haute</option>
                                                    <option value="medium">Moyenne</option>
                                                    <option value="low">Basse</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <Button variant="outline" onClick={() => t.setSheetOpen(false)}>
                                                Fermer
                                            </Button>
                                            <Button onClick={t.saveMetadata} disabled={t.loading}>
                                                Enregistrer
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="mt-4">
                                    <div className="space-y-2">
                                        {t.versionEvents?.length ? (
                                            t.versionEvents.map((ev) => (
                                                <div key={ev.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-slate-900 truncate">{ev.event_type}</div>
                                                            <div className="text-xs text-slate-600">
                                                                {new Date(ev.event_at).toLocaleString()}
                                                                {ev.event_by ? <> · <span className="font-mono">{ev.event_by}</span></> : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <pre className="mt-2 max-h-[240px] overflow-auto rounded-lg bg-slate-50 p-2 text-[11px] text-slate-800">
                                                        {JSON.stringify(ev.payload ?? {}, null, 2)}
                                                    </pre>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-slate-600">Aucun événement.</div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="text-sm text-slate-600">
                                (Contenu du panneau à implémenter pour ce mode.)
                            </div>
                        )}

                    </div>

                </SheetContent>
            </Sheet>
        </div>
    );
}

function MiniHitRow({
    title,
    hits,
    onPick,
}: {
    title: string;
    hits: Array<{ label: string; start: number; end: number }>;
    onPick: (start: number, end: number) => void;
}) {
    return (
        <div>
            <div className="text-[11px] text-slate-600">{title}</div>
            {hits.length ? (
                <div className="mt-1 flex flex-wrap gap-2">
                    {hits.map((h, i) => (
                        <button
                            key={`${h.start}-${h.end}-${i}`}
                            type="button"
                            onClick={() => onPick(h.start, h.end)}
                            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
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
    )
}