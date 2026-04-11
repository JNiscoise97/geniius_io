import {
  CheckCircle2,
  Loader2,
  MessageSquareText,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listParticipantEventMemoriesForAdmin } from "../api/listParticipantEventMemoriesForAdmin";
import { moderateParticipantEventMemory } from "../api/moderateParticipantEventMemory";
import type { AdminParticipantEventMemoryItem } from "../types/participantEventMemoryTypes";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; items: AdminParticipantEventMemoryItem[] }
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

function getStatusClasses(status: AdminParticipantEventMemoryItem["moderationStatus"]) {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-rose-50 text-rose-700";
    case "pending":
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export function AdminEventMemoriesPage() {
  const { eventSlug } = useParams();
  const resolvedEventSlug = eventSlug ?? "";

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isSubmittingId, setIsSubmittingId] = useState<string | null>(null);
  const [commentsById, setCommentsById] = useState<Record<string, string>>({});

  async function reload() {
    const items = await listParticipantEventMemoriesForAdmin(resolvedEventSlug);
    setState({ kind: "ready", items });
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setState({ kind: "loading" });
        const items = await listParticipantEventMemoriesForAdmin(resolvedEventSlug);

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
  }, [resolvedEventSlug]);

  async function handleModerate(
    memoryId: string,
    moderationStatus: "approved" | "rejected"
  ) {
    try {
      setIsSubmittingId(memoryId);

      await moderateParticipantEventMemory({
        memoryId,
        moderationStatus,
        moderatorComment: commentsById[memoryId] ?? "",
      });

      await reload();
    } catch (error) {
      console.error("Impossible de modérer le témoignage", error);
      window.alert("Impossible de modérer le témoignage.");
    } finally {
      setIsSubmittingId(null);
    }
  }

  if (state.kind === "loading") {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-900">
            <Loader2 className="animate-spin" size={20} />
            <div className="text-lg font-black">Chargement des témoignages...</div>
          </div>
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
        <div className="font-black text-rose-900">{state.message}</div>
      </div>
    );
  }

  const pendingCount = state.items.filter(
    (item) => item.moderationStatus === "pending"
  ).length;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
            <MessageSquareText size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Témoignages de la cousinade
            </h1>
            <div className="mt-1 text-sm font-medium text-slate-700">
              Événement : <span className="font-black">{resolvedEventSlug}</span>
            </div>
            <div className="mt-1 text-sm font-bold text-slate-600">
              {pendingCount} en attente de modération
            </div>
          </div>
        </div>
      </section>

      {state.items.length === 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-lg font-black text-slate-900">
            Aucun témoignage envoyé
          </div>
        </section>
      ) : (
        <section className="grid gap-4">
          {state.items.map((item) => {
            const isPending = item.moderationStatus === "pending";
            const isSubmitting = isSubmittingId === item.id;

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-slate-900">
                      {item.title || "Témoignage sans titre"}
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-500">
                      {item.participantLabel}
                      {item.participantEmail ? ` • ${item.participantEmail}` : ""}
                      {" • "}
                      {formatDateTime(item.submittedAt)}
                    </div>
                  </div>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-black",
                      getStatusClasses(item.moderationStatus),
                    ].join(" ")}
                  >
                    {item.moderationStatus}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Type : {item.mediaKind}
                  </span>
                  {item.mood ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Mood : {item.mood}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Partage public : {item.allowPublicDisplay ? "oui" : "non"}
                  </span>
                </div>

                {item.content ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-7 text-slate-800">
                    {item.content}
                  </div>
                ) : null}

                <div className="mt-4">
                  <label className="text-sm font-black text-slate-900">
                    Commentaire de modération
                  </label>
                  <textarea
                    rows={3}
                    value={commentsById[item.id] ?? item.moderatorComment ?? ""}
                    onChange={(e) =>
                      setCommentsById((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {isPending ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleModerate(item.id, "approved")}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"
                    >
                      <CheckCircle2 size={16} />
                      {isSubmitting ? "..." : "Approuver"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleModerate(item.id, "rejected")}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white"
                    >
                      <XCircle size={16} />
                      {isSubmitting ? "..." : "Rejeter"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 text-xs font-bold text-slate-500">
                    Modéré le {formatDateTime(item.moderatedAt)}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}