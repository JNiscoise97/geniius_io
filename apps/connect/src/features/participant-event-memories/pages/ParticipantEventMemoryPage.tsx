import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    MessageCircle,
    Plus,
    Send,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import {
    PARTICIPANT_EVENT_MEMORY_MOODS,
    type ParticipantEventMemoryMood,
} from "../config/participantEventMemoryConfig";
import { createParticipantEventMemory } from "../api/createParticipantEventMemory";
import { listEventMemoriesFeed } from "../api/listEventMemoriesFeed";
import type { EventMemoryFeedItem } from "../types/participantEventMemoryTypes";

type LoadState =
    | { kind: "loading" }
    | { kind: "ready"; items: EventMemoryFeedItem[] }
    | { kind: "error"; message: string };

function formatDateTime(value: string | null | undefined): string {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getStatusLabel(item: EventMemoryFeedItem): string | null {
    if (!item.isMine) {
        return null;
    }

    switch (item.moderationStatus) {
        case "approved":
            return item.allowPublicDisplay ? "Publié" : "Approuvé non publié";
        case "rejected":
            return "Refusé";
        case "pending":
        default:
            return "En attente de modération";
    }
}

function getStatusClasses(item: EventMemoryFeedItem): string {
    if (!item.isMine) {
        return "bg-slate-100 text-slate-600";
    }

    switch (item.moderationStatus) {
        case "approved":
            return item.allowPublicDisplay
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-700";
        case "rejected":
            return "bg-rose-50 text-rose-700";
        case "pending":
        default:
            return "bg-amber-50 text-amber-700";
    }
}

export function ParticipantEventMemoryPage() {
    const navigate = useNavigate();
    const { eventSlug } = useParams();
    const slug = eventSlug ?? "demo";

    const participantSession = getParticipantSession(slug);
    const participantId = participantSession?.participantId ?? null;

    const [state, setState] = useState<LoadState>({ kind: "loading" });
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedNotice, setSavedNotice] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [mood, setMood] = useState<ParticipantEventMemoryMood | "">("");
    const [allowPublicDisplay, setAllowPublicDisplay] = useState(true);

    useEffect(() => {
        if (!participantId) return;

        const tracker = createPageTimeTracker({
            participantId,
            eventSlug: slug,
            pageKey: `/e/${slug}/temoignage`,
        });

        tracker.start();

        return () => {
            void tracker.stop();
        };
    }, [participantId, slug]);

    async function reload() {
        try {
            const items = await listEventMemoriesFeed(slug, participantId);

            setState({
                kind: "ready",
                items,
            });
        } catch (error) {
            setState({
                kind: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Impossible de charger les témoignages.",
            });
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                setState({ kind: "loading" });
                const items = await listEventMemoriesFeed(slug, participantId);

                if (!cancelled) {
                    setState({ kind: "ready", items });
                }
            } catch (error) {
                if (!cancelled) {
                    setState({
                        kind: "error",
                        message:
                            error instanceof Error
                                ? error.message
                                : "Impossible de charger les témoignages.",
                    });
                }
            }
        }

        void run();

        return () => {
            cancelled = true;
        };
    }, [participantId, slug]);

    const canSubmit = participantId !== null && content.trim().length >= 5;

    async function handleSubmit() {
        if (!participantId || !canSubmit) {
            return;
        }

        try {
            setIsSaving(true);
            setSavedNotice(false);

            await createParticipantEventMemory({
                eventSlug: slug,
                participantId,
                mediaKind: "text",
                title: title.trim() || null,
                content: content.trim(),
                mood: mood || null,
                allowPublicDisplay,
            });

            setTitle("");
            setContent("");
            setMood("");
            setAllowPublicDisplay(true);
            setIsComposerOpen(false);
            setSavedNotice(true);

            await reload();
        } catch (error) {
            console.error("Impossible d'envoyer le témoignage", error);
            window.alert("Impossible d'envoyer ton témoignage.");
        } finally {
            setIsSaving(false);
        }
    }

    const myPendingCount = useMemo(() => {
        if (state.kind !== "ready") return 0;

        return state.items.filter(
            (item) => item.isMine && item.moderationStatus === "pending"
        ).length;
    }, [state]);

    return (
        <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
            <main className="c-container pb-28 pt-6">

                <header className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h1 className="mt-1 text-[28px] font-black tracking-tight text-slate-900">
                            Les témoignages de la cousinade
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate(`/e/${slug}/home`)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
                    >
                        <ArrowLeft size={14} />
                        Retour
                    </button>
                </header>

                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
                        <MessageCircle size={14} />
                        Témoignages écrits et vidéos
                    </div>

                    <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                        Revis la cousinade à travers les témoignages de ceux qui y étaient. Tu peux
                        lire les souvenirs déjà publiés, suivre ceux que tu as envoyés, et ajouter
                        autant de témoignages que tu le souhaites.
                    </p>

                    <div className="mt-5 rounded-[24px] border border-indigo-200 bg-indigo-50 p-4">
                        <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-indigo-700">
                            À savoir
                        </div>
                        <div className="mt-2 text-sm font-bold leading-6 text-slate-800">
                            Chaque nouveau témoignage est relu avant publication.
                        </div>
                        <div className="mt-1 text-xs font-bold leading-5 text-slate-700">
                            Tu peux envoyer plusieurs témoignages. Les tiens apparaissent aussi ici,
                            même lorsqu’ils sont encore en attente de modération.
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3">
                            <div className="text-[22px] leading-none font-black text-slate-900">
                                {state.kind === "ready" ? state.items.length : "—"}
                            </div>
                            <div className="mt-1 text-[11px] font-extrabold leading-4 text-slate-600">
                                Témoignages visibles
                            </div>
                        </div>

                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3">
                            <div className="text-[22px] leading-none font-black text-slate-900">
                                {myPendingCount}
                            </div>
                            <div className="mt-1 text-[11px] font-extrabold leading-4 text-slate-600">
                                En attente de modération
                            </div>
                        </div>

                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3">
                            <div className="text-[22px] leading-none font-black text-slate-900">
                                {state.kind === "ready"
                                    ? state.items.filter((item) => item.isMine).length
                                    : "—"}
                            </div>
                            <div className="mt-1 text-[11px] font-extrabold leading-4 text-slate-600">
                                Tes témoignages
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setSavedNotice(false);
                                setIsComposerOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white"
                        >
                            <Plus size={16} />
                            Ajouter un témoignage
                        </button>

                        {myPendingCount > 0 ? (
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">
                                {myPendingCount} en attente
                            </div>
                        ) : null}
                    </div>
                </section>

                {savedNotice ? (
                    <section className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 text-emerald-700" size={18} />
                            <div>
                                <div className="text-sm font-black text-emerald-900">
                                    Ton témoignage a bien été envoyé
                                </div>
                                <div className="mt-1 text-sm font-medium leading-6 text-emerald-800">
                                    Il sera relu avant d’être partagé avec la famille.
                                </div>
                            </div>
                        </div>
                    </section>
                ) : null}

                {isComposerOpen ? (
                    <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-lg font-black text-slate-900">
                                Nouveau témoignage
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsComposerOpen(false)}
                                className="rounded-2xl bg-slate-100 p-2 text-slate-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-4">
                            <label className="text-sm font-black text-slate-900">
                                Titre
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex : Le moment qui m’a le plus marqué"
                                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="text-sm font-black text-slate-900">
                                Ton témoignage
                            </label>
                            <textarea
                                rows={7}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Qu’est-ce qui t’a marqué ? Une rencontre ? Une anecdote ? Une émotion ?"
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                            />
                        </div>

                        <div className="mt-4">
                            <div className="text-sm font-black text-slate-900">
                                Ton ressenti
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {PARTICIPANT_EVENT_MEMORY_MOODS.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setMood(item.value)}
                                        className={[
                                            "rounded-2xl px-4 py-3 text-sm font-black transition",
                                            mood === item.value
                                                ? "bg-[color:var(--blue)] text-white"
                                                : "bg-slate-100 text-slate-700",
                                        ].join(" ")}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <input
                                type="checkbox"
                                checked={allowPublicDisplay}
                                onChange={(e) => setAllowPublicDisplay(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="min-w-0">
                                <div className="text-sm font-black text-slate-900">
                                    J’accepte que ce témoignage soit partagé avec la famille
                                </div>
                                <div className="mt-1 text-sm font-medium leading-6 text-slate-700">
                                    Même avec cet accord, il sera relu avant publication.
                                </div>
                            </div>
                        </label>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!canSubmit || isSaving}
                                className={[
                                    "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition",
                                    canSubmit && !isSaving
                                        ? "bg-[color:var(--blue)] text-white"
                                        : "cursor-not-allowed bg-slate-200 text-slate-500",
                                ].join(" ")}
                            >
                                <Send size={16} />
                                {isSaving ? "Envoi..." : "Envoyer"}
                            </button>
                        </div>
                    </section>
                ) : null}

                <section className="mt-5">
                    {state.kind === "loading" ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3 text-slate-900">
                                <Loader2 className="animate-spin" size={20} />
                                <div className="text-lg font-black">Chargement des témoignages...</div>
                            </div>
                        </div>
                    ) : state.kind === "error" ? (
                        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                            <div className="font-black text-rose-900">{state.message}</div>
                        </div>
                    ) : state.items.length === 0 ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="text-lg font-black text-slate-900">
                                Aucun témoignage visible pour le moment
                            </div>
                            <div className="mt-1 text-sm font-medium leading-6 text-slate-700">
                                Sois le premier à partager un souvenir de la cousinade.
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {state.items.map((item) => {
                                const statusLabel = getStatusLabel(item);

                                return (
                                    <article
                                        key={item.id}
                                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="text-lg font-black text-slate-900">
                                                        {item.title || "Témoignage"}
                                                    </div>

                                                    {item.isMine ? (
                                                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                                                            Ton témoignage
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="mt-1 text-xs font-bold text-slate-500">
                                                    {item.participantLabel} • {formatDateTime(item.submittedAt)}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {item.mood ? (
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                                        {item.mood}
                                                    </span>
                                                ) : null}

                                                {statusLabel ? (
                                                    <span
                                                        className={[
                                                            "rounded-full px-3 py-1 text-xs font-black",
                                                            getStatusClasses(item),
                                                        ].join(" ")}
                                                    >
                                                        {statusLabel}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>

                                        {item.content ? (
                                            <div className="mt-4 text-sm font-medium leading-7 text-slate-800">
                                                {item.content}
                                            </div>
                                        ) : null}

                                        {item.isMine && item.moderatorComment ? (
                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                                                    Commentaire de modération
                                                </div>
                                                <div className="mt-2 text-sm font-medium leading-6 text-slate-800">
                                                    {item.moderatorComment}
                                                </div>
                                            </div>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}