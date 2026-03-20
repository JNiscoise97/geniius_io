// src/features/moderation/pages/ModerationQueuePage.tsx

import {
  AlertTriangle,
  Camera,
  ChevronRight,
  Clock3,
  Loader2,
  MessageSquareText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { listPendingModerationItems } from "../api/listPendingModerationItems";
import type { ModerationQueueItem } from "../types";

function QueueItemIcon({ type }: { type: ModerationQueueItem["type"] }) {
  if (type === "photo") return <Camera size={18} />;
  return <MessageSquareText size={18} />;
}

export function ModerationQueuePage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();

  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!eventSlug) {
      setError("Paramètre eventSlug manquant.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await listPendingModerationItems(eventSlug);
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger la file de modération.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [eventSlug]);

  function handleOpenItem(item: ModerationQueueItem) {
    if (!eventSlug) return;

    navigate(`/e/${eventSlug}/moderation/${item.type}/${item.id}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
          <Loader2 size={18} className="animate-spin text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">
            Chargement de la file de modération…
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-rose-600">
              <AlertTriangle size={18} />
            </div>

            <div>
              <div className="text-base font-black text-rose-900">
                Impossible de charger la file de modération
              </div>
              <div className="mt-1 text-sm font-medium text-rose-700">
                {error}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-800 ring-1 ring-slate-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Modération
            </div>
            <div className="mt-1 text-xl font-black text-slate-900">
              Éléments en attente
            </div>
            <div className="mt-1 text-sm font-medium text-slate-500">
              {items.length} élément{items.length > 1 ? "s" : ""} à traiter
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            <Clock3 size={14} />
            Pending
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-base font-black text-slate-900">
            Aucun élément en attente
          </div>
          <div className="mt-2 text-sm font-medium text-slate-500">
            Tous les souvenirs et toutes les photos ont déjà été traités.
          </div>
        </section>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => handleOpenItem(item)}
              className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <QueueItemIcon type={item.type} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-black text-slate-900">
                        {item.title}
                      </div>

                      {item.participantLabel ? (
                      <span>Proposé par {item.participantLabel}</span>
                    ) : item.participantId ? (
                      <span>Participant {item.participantId}</span>
                    ) : null}

                    {item.personLabel ? (
                      <span> • Pour {item.personLabel}</span>
                    ) : item.personId ? (
                      <span> • Personne {item.personId}</span>
                    ) : null}
                    </div>

                    <div className="shrink-0 text-slate-400">
                      <ChevronRight size={18} />
                    </div>
                  </div>

                  {item.preview ? (
                    <div className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {item.preview}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                    <span>
                      Soumis le {new Date(item.submittedAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}