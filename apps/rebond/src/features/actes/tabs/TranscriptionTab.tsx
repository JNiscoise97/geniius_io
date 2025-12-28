// TranscriptionTab.tsx
// Orchestration / composition only (UI + hook).
// ✅ Pilotage par sources (MVP):
// - Dashboard “Sources” en premier : transcrite / préférée
// - 1 transcription “active” par source = dernière version liée à cette source
// - Diff Source A ↔ Source B (piloté depuis le dashboard)
// - Save = nouvelle version (historique conservé, non exposé)
// - Report annotations/notes/tags sur nouvelle version (best effort) -> géré dans logic/service

import React, { useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    AlertTriangle,
    CheckCircle2,
    FileText,
    GitCompare,
    Plus,
    Save,
    Settings2,
    Tags,
    Workflow,
    SeparatorHorizontal,
    Eye,
    Pencil,
    Trash2,
    GripVertical,
    Star,
} from "lucide-react";

import { anchorBadge, statusBadge, tagBadge, typeLabel } from "./transcriptionTab.ui";

import {
    PAGE_BREAK_TOKEN,
    normalizeSpaces,
    formatSourceLabel,
    splitIntoReadableBlocks,
    detectActeReperages,
    parseMetaFromNotes,
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
    const sources = t.acteSources;
    const versions = t.versions;
    const annotations = t.annotations;
    const notes = t.notes;
    const tags = t.tags;

    const onMouseDownDivider = (e: React.MouseEvent) => t.split.onMouseDownDivider(e);

    // Read/repérages
    const readableBlocks = useMemo(() => splitIntoReadableBlocks(t.editorValue), [t.editorValue]);
    const rep = useMemo(() => detectActeReperages(t.editorValue), [t.editorValue]);

    // META
    const meta = useMemo(() => parseMetaFromNotes(notes), [notes]);

    // Anchor issues
    const hasAnchorIssues = useMemo(
        () => annotations.some((a) => (t.anchorStatusOverrides[a.id] ?? a.status) !== "ok"),
        [annotations, t.anchorStatusOverrides]
    );

    // Build “latest version per source” map (source-first)
    const latestBySourceId = useMemo(() => {
        const sorted = [...versions].sort((a, b) => {
            const av = Number(a.version ?? 0);
            const bv = Number(b.version ?? 0);
            if (bv !== av) return bv - av;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        const map = new Map<string, string>(); // sourceId -> latestVersionId
        for (const v of sorted) {
            const sids = (t.versionSources[v.id] ?? []) as string[];
            for (const sid of sids) {
                if (!map.has(sid)) map.set(sid, v.id);
            }
        }
        return map;
    }, [versions, t.versionSources]);

    // Dashboard rows
    const dashboard = useMemo<SourceDashboardRow[]>(() => {
        // MVP: la notion “préférée” est stockée dans META côté logic (on implémente après)
        const preferredSourceId = (t.preferredSourceId as string | null) ?? null;

        const workingVersionSourceIds = t.workingVersion?.id ? (t.versionSources[t.workingVersion.id] ?? []) : [];

        return (sources ?? []).map((s: any) => {
            const label = formatSourceLabel(s);
            const latestVersionId = latestBySourceId.get(s.id) ?? null;
            const isTranscribed = !!latestVersionId;

            return {
                id: s.id,
                label,
                isPreferred: !!preferredSourceId && preferredSourceId === s.id,
                isTranscribed,
                latestVersionId,
                usedInWorkingVersion: workingVersionSourceIds.includes(s.id),
            };
        });
    }, [sources, latestBySourceId, t.preferredSourceId, t.versionSources, t.workingVersion?.id]);

    const counts = useMemo(() => {
        const transcribed = dashboard.filter((d) => d.isTranscribed).length;
        const preferred = dashboard.find((d) => d.isPreferred)?.id ?? null;
        return { transcribed, preferred };
    }, [dashboard]);

    // Default active source
    useEffect(() => {
        if (t.activeSourceId) return;
        if (!dashboard.length) return;

        const preferred = dashboard.find((d) => d.isPreferred);
        const transcribed = dashboard.find((d) => d.isTranscribed);
        const first = dashboard[0];

        t.setActiveSource(preferred?.id ?? transcribed?.id ?? first.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dashboard.length]);

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

    // When active source changes, switch working version + load children (logic will do it)
    useEffect(() => {
        if (!activeSourceRow) return;
        t.onActiveSourceChanged(activeSourceRow.id, activeSourceRow.latestVersionId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSourceRow?.id]);

    // Loading
    if (t.loading && !workingVersion && versions.length === 0) {
        return <div className="p-4 text-sm text-slate-600">Chargement…</div>;
    }

    return (
        <div className="p-4 space-y-4">
            {/* ✅ Sources-first header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <h2 className="text-base font-semibold text-slate-900">Transcription — pilotage par sources</h2>
                            {workingVersion ? statusBadge(workingVersion.status) : null}
                            {hasAnchorIssues && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                        </div>

                        <p className="text-sm text-slate-600">
                            Tu pilotes par <span className="font-medium">sources</span>. Une source = une transcription active (la dernière version liée). Le save crée une nouvelle version
                            (historique conservé).
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                                <Tags className="h-3.5 w-3.5" />
                                Sources : <span className="font-medium">{dashboard.length}</span> (transcrites {counts.transcribed})
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                                <Workflow className="h-3.5 w-3.5" />
                                Complétude :{" "}
                                <span className="font-medium">
                                    {meta.completeness ? (meta.completeness === "complete" ? "complète" : "partielle") : "non précisée"}
                                </span>
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Référence : <span className="font-medium">{counts.preferred ? "définie" : "non définie"}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Active source selector */}
                        <select
                            value={t.activeSourceId ?? ""}
                            onChange={(e) => t.setActiveSource(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none"
                            disabled={!dashboard.length}
                        >
                            {dashboard.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.isPreferred ? "⭐ " : ""}
                                    {s.isTranscribed ? "✅ " : "⬜ "}
                                    {s.label.slice(0, 90)}
                                </option>
                            ))}
                        </select>

                        <Button
                            variant="outline"
                            onClick={() => {
                                t.openMetadata();
                                // best effort: quand on ouvre metadata, on coche la source active
                                t.ensureActiveSourceSelectedInMetadata();
                            }}
                            className="gap-2"
                            disabled={!t.activeSourceId}
                        >
                            <Settings2 className="w-4 h-4" />
                            Métadonnées
                        </Button>

                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => t.openSourceDiffPicker()}
                            disabled={dashboard.filter((d) => d.isTranscribed).length < 2}
                            title="Comparer deux sources (leurs transcriptions actives)"
                        >
                            <GitCompare className="w-4 h-4" />
                            Diff sources
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => t.createDraftForActiveSourceFromTemplateIfAny()}
                            disabled={t.loading || !t.activeSourceId}
                            className="gap-2"
                            title="Créer un brouillon pour la source active (si pas encore de transcription)"
                        >
                            <Plus className="w-4 h-4" />
                            Brouillon
                        </Button>

                        <Button
                            onClick={() => t.saveNewVersionForActiveSource()}
                            disabled={t.loading || !t.activeSourceId}
                            className="gap-2"
                            title="Save = nouvelle version liée à la source active + report best effort (annotations/notes/tags)"
                        >
                            <Save className="w-4 h-4" />
                            Enregistrer
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
                                        <Badge variant="secondary">Source active</Badge>
                                        <div className="text-xs text-slate-600 truncate max-w-[520px]" title={activeSourceRow.label}>
                                            {activeSourceRow.label}
                                        </div>
                                        {activeSourceRow.isPreferred ? <Badge className="bg-amber-600 text-white">Référence</Badge> : null}
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
                                        ref={t.textareaRef}
                                        value={t.editorValue}
                                        onChange={(e) => t.onChangeEditor(e.target.value)}
                                        onMouseUp={t.captureSelection}
                                        onKeyUp={t.captureSelection}
                                        placeholder={`Transcrivez ici le texte… (ex : [illisible], [barré], [lacune], [ajout en marge], ${PAGE_BREAK_TOKEN} = saut de page)`}
                                        className="min-h-[520px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-900 shadow-sm outline-none focus:border-slate-400"
                                    />
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
                                        dashboard.map((s) => {
                                            const isActive = s.id === t.activeSourceId;

                                            // Version active liée (si tu veux encore l’info, sinon tu peux supprimer)
                                            const linkedVersion = s.latestVersionId
                                                ? versions.find((v) => v.id === s.latestVersionId) ?? null
                                                : null;

                                            // “online” (adapte selon tes champs réels)
                                            // si tu n’as pas ce champ, laisse une logique simple :
                                            const online = (s as any).acces_mode === "en_ligne" || !!(s as any).url_site;

                                            // champs "à la gabarit" (fallback sur label)
                                            const uniteTitre =
                                                (s as any).registre_titre ||
                                                (s as any).unite_titre ||
                                                s.label ||
                                                "Source";

                                            const institutionSigle = (s as any).depot_type || (s as any).institution_sigle || null;
                                            const institutionNom = (s as any).depot_nom || (s as any).institution_nom || null;
                                            const depotNom = (s as any).depot_nom || (s as any).depot_nom || null;
                                            const uniteCote = (s as any).cote || (s as any).unite_cote || null;

                                            // ligne (commune, année, type, vues/pages) : adapte si tu as déjà un champ
                                            const line =
                                                (s as any).metaLine ||
                                                (s as any).pagesLabel ||
                                                (s as any).vues_label ||
                                                ""; // sinon vide

                                            // options “Original / Numérisation” : adapte si tu as une struct similaire
                                            // Si tu n’as pas ces deux objets, tu peux mapper vers tes champs existants.
                                            const original = (s as any).original ?? null;
                                            const numerisation = (s as any).numerisation ?? null;

                                            // Pick : ici on “active la source” (tu peux remplacer par open url, etc.)
                                            const pick = (payload: any) => {
                                                // comportement minimal : on passe source active
                                                t.setActiveSource(s.id);
                                                // si tu veux aussi stocker un choix original/numerisation, fais-le ici
                                                // ex: t.setActiveView(payload)...
                                            };

                                            return (
                                                <div
                                                    key={s.id}
                                                    className={[
                                                        "w-full rounded-xl border p-3 text-left transition",
                                                        isActive
                                                            ? "border-slate-900/20 bg-slate-50 shadow-sm ring-2 ring-slate-900/10"
                                                            : "border-slate-200 bg-white hover:bg-slate-50",
                                                    ].join(" ")}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        {/* zone clickable */}
                                                        <button
                                                            type="button"
                                                            onClick={() => t.setActiveSource(s.id)}
                                                            className="min-w-0 flex-1 text-left"
                                                            title={s.label}
                                                        >
                                                            {/* Ligne "registre" */}
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-sm font-semibold text-slate-900">
                                                                    {uniteTitre}
                                                                </span>

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

                                                                {(s as any).pagination_type ? (
                                                                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                                                                        pagination: {(s as any).pagination_type}
                                                                    </span>
                                                                ) : null}
                                                            </div>

                                                            <div className="mt-1 text-xs text-slate-600">
                                                                {institutionNom ? institutionNom : "—"}
                                                                {depotNom ? ` · ${depotNom}` : ""}
                                                                {uniteCote ? ` · ${uniteCote}` : ""}
                                                            </div>

                                                            {line ? (
                                                                <div className="mt-1 text-xs text-slate-600">{line}</div>
                                                            ) : null}

                                                            {/* 2 options sous le registre (optionnel) */}
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <button
                                                                    type="button"
                                                                    disabled={!original}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (original) pick(original);
                                                                    }}
                                                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Original
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    disabled={!numerisation}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (numerisation) pick(numerisation);
                                                                    }}
                                                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Numérisation
                                                                </button>

                                                                {numerisation?.url_base ? (
                                                                    <span className="self-center text-[11px] text-slate-500">
                                                                        URL: <span className="font-mono">{numerisation.url_base}</span>
                                                                    </span>
                                                                ) : null}
                                                            </div>

                                                            {/* (optionnel) Info version active */}
                                                            {linkedVersion ? (
                                                                <div className="mt-2 text-xs text-slate-600">
                                                                    Active : <span className="font-medium">v{linkedVersion.version}</span> · {linkedVersion.status} ·{" "}
                                                                    {new Date(linkedVersion.created_at).toLocaleDateString()}
                                                                </div>
                                                            ) : null}
                                                        </button>

                                                        {/* Actions à droite */}
                                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                                            <div className="flex gap-2">
                                                                {/* STAR (lucide) : jaune si preferred, gris sinon, disabled si une autre est preferred */}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        t.setPreferredSource(s.id);
                                                                    }}
                                                                    title={
                                                                        s.isPreferred
                                                                            ? "Source de référence"
                                                                            : "Définir cette source comme référence"
                                                                    }
                                                                    className="px-2"
                                                                >
                                                                    <Star
                                                                        className={[
                                                                            "h-4 w-4 transition-colors",
                                                                            s.isPreferred
                                                                                ? "text-amber-500 fill-amber-500"
                                                                                : "text-slate-400 hover:text-amber-500",
                                                                        ].join(" ")}
                                                                    />
                                                                </Button>

                                                            </div>
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
                                            t.ensureActiveSourceSelectedInMetadata();
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
                    <div className="p-4 text-sm text-slate-600">
                        (Contenu du panneau géré par <code>transcriptionTab.logic.ts</code> — on le modifie juste après.)
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