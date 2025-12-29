// TranscriptionTab.tsx
// Orchestration / composition only (UI + hook).
// ✅ Pilotage par sources (MVP):
// - Dashboard “Sources” en premier : transcrite / préférée
// - 1 transcription “active” par source = dernière version liée à cette source
// - Diff Source A ↔ Source B (piloté depuis le dashboard)
// - Save = nouvelle version (historique conservé, non exposé)
// - Report annotations/notes/tags sur nouvelle version (best effort) -> géré dans logic/service

import React, { useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


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
} from "lucide-react";

import { anchorBadge, tagBadge, typeLabel } from "./transcriptionTab.ui";

import {
    PAGE_BREAK_TOKEN,
    normalizeSpaces,
    splitIntoReadableBlocks,
    detectActeReperages,
} from "./transcriptionTab.service";

import { useTranscriptionTab } from "./transcriptionTab.logic";

type Props = {
    acteId: string;
    onGoToTab?: (tabLabel: string) => void;
};

type SourceDashboardRow = {
    id: string;
    label: string;

    isPreferred: boolean;
    isTranscribed: boolean;

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

            return {
                id: s.id,
                label,
                isPreferred: !!preferredSourceId && preferredSourceId === s.id,
                isTranscribed: !!latestVersionId,
                latestVersionId,
                usedInWorkingVersion,
            };
        });
    }, [sources, latestBySourceId, t.preferredSourceId, t.workingVersion?.id]);


    const activeLatestVersionId = t.activeSourceId
        ? t.getLatestVersionIdForSource(t.activeSourceId)
        : null;

    const step: 1 | 2 | 3 | 4 =
        !t.activeSourceId ? 1 : !activeLatestVersionId ? 2 : 3;

    const textareaDisabled = step === 1;

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

    return (
        <div className="p-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    {/* Stepper */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <h2 className="text-base font-semibold text-slate-900">Transcription</h2>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-4">
                            <StepItem
                                idx={1}
                                title="Choisir la source"
                                subtitle="Obligatoire (référence / original / numérisation)"
                                active={step === 1}
                                done={step > 1}
                                icon={<Circle className="h-4 w-4" />}
                            />
                            <StepItem
                                idx={2}
                                title="Définir les métadonnées"
                                subtitle="Type de transcription, lecture, confiance…"
                                active={step === 2}
                                done={step > 2}
                                icon={<Pencil className="h-4 w-4" />}
                            />
                            <StepItem
                                idx={3}
                                title="Transcrire l’acte"
                                subtitle="Saisie du texte + repérages"
                                active={step === 3}
                                done={false}
                                icon={<FileText className="h-4 w-4" />}
                            />
                            <StepItem
                                idx={4}
                                title="Interpréter"
                                subtitle="Notes d’analyse / conclusions"
                                active={false}
                                done={false}
                                icon={<Tags className="h-4 w-4" />}
                            />
                        </div>


                        {step === 1 ? (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                Choisis une source à droite pour commencer. Le champ de transcription est désactivé tant que la source n’est pas sélectionnée.
                            </div>
                        ) : null}

                        {step === 2 ? (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                Cette source n’a pas encore de transcription. Clique sur <span className="font-medium">Brouillon</span> pour démarrer.
                            </div>
                        ) : null}
                    </div>

                    {/* Actions à droite (compact) */}
                    <div className="shrink-0 flex items-center gap-2">
                        {step === 2 ? (
                            <Button
                                variant="default"
                                onClick={() => t.startTranscriptionForActiveSource()}
                                disabled={t.loading || !t.activeSourceId}
                                className="gap-2"
                                title="Créer la première version (brouillon) pour cette source"
                            >
                                <Plus className="w-4 h-4" />
                                Brouillon
                            </Button>
                        ) : null}

                        <Button
                            variant="secondary"
                            onClick={() => t.openMetadata()}
                            disabled={t.loading || !t.activeSourceId}
                            className="gap-2"
                            title="Voir / modifier les métadonnées de la transcription"
                        >
                            <Pencil className="w-4 h-4" />
                            Métadonnées
                        </Button>
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

                                {activeSourceRow ? (
                                    <div className="ml-2 flex items-center gap-2 min-w-0">
                                        {activeSourceRow.isPreferred ? <Badge className="bg-amber-600 text-white">Source de référence</Badge> : null}
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Button variant="outline" onClick={t.openAddAnnotation} className="gap-2">
                                    <Plus className="w-4 h-4" /> Annotation
                                </Button>
                                <Button variant="outline" onClick={t.openAddNote} className="gap-2">
                                    <Plus className="w-4 h-4" /> Note
                                </Button>
                                <Button variant="outline" onClick={t.openTagPassage} className="gap-2">
                                    <Tags className="w-4 h-4" />
                                    Tag
                                </Button>
                                <Button variant="outline" onClick={t.insertPageBreak} className="gap-2">
                                    <SeparatorHorizontal className="w-4 h-4" />
                                    Saut de page
                                </Button>
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
                                                d.isTranscribed ? null : "Aucune transcription",
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

                                                                    {d.isTranscribed ? (
                                                                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                                                                            transcrite
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>

                                                            {line ? <div className="mt-1 text-xs text-slate-600">{line}</div> : null}
                                                        </button>

                                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    t.setPreferredSource(d.id);
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
                                    <Button variant="outline" size="sm" onClick={t.setInReview} disabled={!workingVersion || t.loading}>
                                        Marquer en relecture
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => t.openSourceDiffPicker()}
                                        disabled={dashboard.filter((d) => d.isTranscribed).length < 2}
                                    >
                                        Comparer deux sources
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            t.openMetadata();
                                        }}
                                        disabled={!t.activeSourceId}
                                    >
                                        Définir la référence
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

            {/* Sheet */}
            <Sheet open={t.sheetOpen} onOpenChange={t.setSheetOpen}>
                <SheetContent side="right" className="!w-[40vw] !max-w-none p-0">
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
                    <div className="p-4">
                        {t.sheetMode === "metadata" ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-xs font-medium text-slate-700">Type de transcription</div>
                                        <select
                                            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                                            value={(t.metaDraft.transcription_kind ?? "") as any}
                                            onChange={(e) =>
                                                t.setMetaDraft((prev) => ({
                                                    ...prev,
                                                    transcription_kind: (e.target.value || null) as any,
                                                }))
                                            }
                                        >
                                            <option value="">—</option>
                                            <option value="travail">Travail</option>
                                            <option value="diplomatique">Diplomatique</option>
                                            <option value="semi_normalisee">Semi-normalisée</option>
                                        </select>
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-slate-700">Lecture</div>
                                        <select
                                            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                                            value={(t.metaDraft.source_lecture_kind ?? "") as any}
                                            onChange={(e) =>
                                                t.setMetaDraft((prev) => ({
                                                    ...prev,
                                                    source_lecture_kind: (e.target.value || null) as any,
                                                }))
                                            }
                                        >
                                            <option value="">—</option>
                                            <option value="image_originale">Image originale</option>
                                            <option value="microfilm">Microfilm</option>
                                            <option value="transcription_secondaire">Transcription secondaire</option>
                                            <option value="autre">Autre</option>
                                        </select>
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-slate-700">Confiance</div>
                                        <select
                                            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                                            value={(t.metaDraft.confidence ?? "") as any}
                                            onChange={(e) =>
                                                t.setMetaDraft((prev) => ({
                                                    ...prev,
                                                    confidence: (e.target.value || null) as any,
                                                }))
                                            }
                                        >
                                            <option value="">—</option>
                                            <option value="high">Haute</option>
                                            <option value="medium">Moyenne</option>
                                            <option value="low">Basse</option>
                                        </select>
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-slate-700">Langue (vue)</div>
                                        <Input
                                            className="mt-1"
                                            value={(t.metaDraft.langue_vue ?? "") as any}
                                            onChange={(e) => t.setMetaDraft((prev) => ({ ...prev, langue_vue: e.target.value || null }))}
                                            placeholder="fr, la, ..."
                                        />
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-slate-700">Style d’écriture</div>
                                        <Input
                                            className="mt-1"
                                            value={(t.metaDraft.handwriting_style ?? "") as any}
                                            onChange={(e) =>
                                                t.setMetaDraft((prev) => ({ ...prev, handwriting_style: e.target.value || null }))
                                            }
                                            placeholder="ex: cursive, ronde, mixte…"
                                        />
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-slate-700">Lisibilité</div>
                                        <Input
                                            className="mt-1"
                                            value={(t.metaDraft.handwriting_legibility ?? "") as any}
                                            onChange={(e) =>
                                                t.setMetaDraft((prev) => ({ ...prev, handwriting_legibility: e.target.value || null }))
                                            }
                                            placeholder="ex: bonne, moyenne, faible…"
                                        />
                                    </div>


                                    <div className="col-span-2">
                                        <div className="text-xs font-medium text-slate-700">Conventions</div>
                                        <Textarea
                                            className="mt-1 min-h-[120px]"
                                            value={(t.metaDraft.conventions_override_text ?? "") as any}
                                            onChange={(e) =>
                                                t.setMetaDraft((prev) => ({ ...prev, conventions_override_text: e.target.value || null }))
                                            }
                                            placeholder="Règles, tokens, usages…"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-sm font-semibold text-slate-900">Angles morts</div>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                            <div className="text-xs font-medium text-slate-700">Complétude</div>
                                            <select
                                                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                                                value={t.metaDraftCompleteness}
                                                onChange={(e) => t.setMetaDraftCompleteness(e.target.value as any)}
                                            >
                                                <option value="">—</option>
                                                <option value="complete">Complète</option>
                                                <option value="partial">Partielle</option>
                                            </select>
                                        </div>

                                        <div className="col-span-2">
                                            <div className="text-xs font-medium text-slate-700">Raison / réserve</div>
                                            <Textarea
                                                className="mt-1 min-h-[90px]"
                                                value={t.metaDraftReferenceReason}
                                                onChange={(e) => t.setMetaDraftReferenceReason(e.target.value)}
                                                placeholder="Ex: partie illisible, page manquante, mauvaise qualité…"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <Button variant="outline" onClick={() => t.setSheetOpen(false)}>
                                        Fermer
                                    </Button>
                                    <Button onClick={t.saveMetadata} disabled={t.loading}>
                                        Enregistrer les métadonnées
                                    </Button>
                                </div>
                            </div>
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