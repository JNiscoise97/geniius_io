import { BookOpen, Download, Eye, Loader2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  listFamilyDocumentEventsForAdmin,
  type AdminFamilyDocumentEventItem,
} from "../api/listFamilyDocumentEventsForAdmin";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; items: AdminFamilyDocumentEventItem[] }
  | { kind: "error"; message: string };

function formatDateTime(value: string): string {
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

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
      {subtitle ? (
        <div className="mt-1 text-sm font-medium text-slate-600">{subtitle}</div>
      ) : null}
    </div>
  );
}

export function AdminFamilyDocumentAnalyticsPage() {
  const { eventSlug } = useParams();
  const resolvedEventSlug = eventSlug ?? "";
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setState({ kind: "loading" });
        const items = await listFamilyDocumentEventsForAdmin(resolvedEventSlug);

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
                : "Impossible de charger les statistiques documentaires.",
          });
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [resolvedEventSlug]);

  const items = state.kind === "ready" ? state.items : [];

  const metrics = useMemo(() => {
    const views = items.filter((item) => item.action === "view");
    const downloads = items.filter((item) => item.action === "download");

    const uniqueParticipants = new Set(items.map((item) => item.participantId)).size;
    const uniqueViewedDocs = new Set(
      views.map((item) => item.documentSlug)
    ).size;
    const uniqueDownloadedDocs = new Set(
      downloads.map((item) => item.documentSlug)
    ).size;

    const topDocuments = Object.values(
      items.reduce<Record<string, {
        documentSlug: string;
        documentTitle: string;
        views: number;
        downloads: number;
      }>>((acc, item) => {
        if (!acc[item.documentSlug]) {
          acc[item.documentSlug] = {
            documentSlug: item.documentSlug,
            documentTitle: item.documentTitle,
            views: 0,
            downloads: 0,
          };
        }

        if (item.action === "view") {
          acc[item.documentSlug].views += 1;
        }

        if (item.action === "download") {
          acc[item.documentSlug].downloads += 1;
        }

        return acc;
      }, {})
    ).sort((a, b) => {
      const totalA = a.views + a.downloads;
      const totalB = b.views + b.downloads;
      return totalB - totalA;
    });

    const topParticipants = Object.values(
      items.reduce<Record<string, {
        participantId: string;
        participantLabel: string;
        total: number;
      }>>((acc, item) => {
        if (!acc[item.participantId]) {
          acc[item.participantId] = {
            participantId: item.participantId,
            participantLabel: item.participantLabel,
            total: 0,
          };
        }

        acc[item.participantId].total += 1;
        return acc;
      }, {})
    ).sort((a, b) => b.total - a.total);

    return {
      totalEvents: items.length,
      totalViews: views.length,
      totalDownloads: downloads.length,
      uniqueParticipants,
      uniqueViewedDocs,
      uniqueDownloadedDocs,
      topDocuments: topDocuments.slice(0, 8),
      topParticipants: topParticipants.slice(0, 8),
    };
  }, [items]);

  if (state.kind === "loading") {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-900">
            <Loader2 className="animate-spin" size={20} />
            <div className="text-lg font-black">Chargement des consultations...</div>
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

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Consultations des documents
            </h1>
            <div className="mt-1 text-sm font-medium text-slate-700">
              Événement : <span className="font-black">{resolvedEventSlug}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Événements" value={metrics.totalEvents} />
        <MetricCard title="Consultations" value={metrics.totalViews} />
        <MetricCard title="Téléchargements" value={metrics.totalDownloads} />
        <MetricCard title="Participants actifs" value={metrics.uniqueParticipants} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Docs consultés" value={metrics.uniqueViewedDocs} />
        <MetricCard title="Docs téléchargés" value={metrics.uniqueDownloadedDocs} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-lg font-black text-slate-900">
          Documents les plus consultés
        </div>

        {metrics.topDocuments.length === 0 ? (
          <div className="mt-3 text-sm font-medium text-slate-700">
            Aucun événement pour le moment.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {metrics.topDocuments.map((doc) => (
              <div
                key={doc.documentSlug}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-sm font-black text-slate-900">
                  {doc.documentTitle}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    <Eye size={12} />
                    {doc.views}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    <Download size={12} />
                    {doc.downloads}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-slate-900" />
          <div className="text-lg font-black text-slate-900">
            Participants les plus actifs
          </div>
        </div>

        {metrics.topParticipants.length === 0 ? (
          <div className="mt-3 text-sm font-medium text-slate-700">
            Aucun participant actif pour le moment.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {metrics.topParticipants.map((participant) => (
              <div
                key={participant.participantId}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-sm font-black text-slate-900">
                  {participant.participantLabel}
                </div>
                <div className="mt-1 text-xs font-bold text-slate-500">
                  {participant.total} actions
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-lg font-black text-slate-900">
          Historique détaillé
        </div>

        {items.length === 0 ? (
          <div className="mt-3 text-sm font-medium text-slate-700">
            Aucun événement enregistré.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-slate-900">
                      {item.participantLabel}
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-500">
                      {item.participantEmail ?? "—"}
                    </div>
                  </div>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-black",
                      item.action === "view"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-emerald-50 text-emerald-700",
                    ].join(" ")}
                  >
                    {item.action === "view" ? "Consultation" : "Téléchargement"}
                  </span>
                </div>

                <div className="mt-3 rounded-2xl bg-white p-3">
                  <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Document
                  </div>
                  <div className="mt-1 text-sm font-black text-slate-900">
                    {item.documentTitle}
                  </div>
                </div>

                <div className="mt-3 text-xs font-bold text-slate-500">
                  {formatDateTime(item.createdAt)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}