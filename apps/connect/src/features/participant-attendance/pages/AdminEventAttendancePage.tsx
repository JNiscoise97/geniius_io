import { CalendarCheck, Loader2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  listAttendanceForAdmin,
  type AdminAttendanceItem,
} from "../api/listAttendanceForAdmin";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; items: AdminAttendanceItem[] }
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

function getStatusLabel(status: AdminAttendanceItem["attendanceStatus"]): string {
  switch (status) {
    case "yes":
      return "Oui";
    case "no":
      return "Non";
    case "maybe":
      return "Peut-être";
    case "definitive-no":
      return "Ne veut pas venir";
    default:
      return status;
  }
}

function getStatusClasses(status: AdminAttendanceItem["attendanceStatus"]): string {
  switch (status) {
    case "yes":
      return "bg-emerald-50 text-emerald-700";
    case "maybe":
      return "bg-amber-50 text-amber-700";
    case "no":
      return "bg-slate-100 text-slate-700";
    case "definitive-no":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
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

export function AdminEventAttendancePage() {
  const { eventSlug } = useParams();
  const resolvedEventSlug = eventSlug ?? "";
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setState({ kind: "loading" });
        const items = await listAttendanceForAdmin(resolvedEventSlug);

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
                : "Impossible de charger les présences.",
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
    const yesItems = items.filter((item) => item.attendanceStatus === "yes");
    const maybeItems = items.filter((item) => item.attendanceStatus === "maybe");
    const noItems = items.filter((item) => item.attendanceStatus === "no");
    const definitiveNoItems = items.filter(
      (item) => item.attendanceStatus === "definitive-no"
    );
    const helpers = items.filter((item) => item.canHelp);
    const completed = items.filter((item) => item.completed);

    const totalPartySizeYes = yesItems.reduce(
      (sum, item) => sum + (item.partySize ?? 0),
      0
    );

    const totalPartySizeMaybe = maybeItems.reduce(
      (sum, item) => sum + (item.partySize ?? 0),
      0
    );

    const helpTypeCounts = items.reduce<Record<string, number>>((acc, item) => {
      for (const helpType of item.helpTypes) {
        acc[helpType] = (acc[helpType] ?? 0) + 1;
      }
      return acc;
    }, {});

    const topHelpTypes = Object.entries(helpTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      totalResponses: items.length,
      completedCount: completed.length,
      yesCount: yesItems.length,
      maybeCount: maybeItems.length,
      noCount: noItems.length,
      definitiveNoCount: definitiveNoItems.length,
      totalPartySizeYes,
      totalPartySizeMaybe,
      helpersCount: helpers.length,
      topHelpTypes,
    };
  }, [items]);

  if (state.kind === "loading") {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-900">
            <Loader2 className="animate-spin" size={20} />
            <div className="text-lg font-black">Chargement des présences...</div>
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
            <CalendarCheck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Participation à la cousinade
            </h1>
            <div className="mt-1 text-sm font-medium text-slate-700">
              Événement : <span className="font-black">{resolvedEventSlug}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Réponses reçues"
          value={metrics.totalResponses}
          subtitle="Participants ayant répondu"
        />
        <MetricCard
          title="Oui"
          value={metrics.yesCount}
          subtitle={`${metrics.totalPartySizeYes} personnes annoncées`}
        />
        <MetricCard
          title="Peut-être"
          value={metrics.maybeCount}
          subtitle={`${metrics.totalPartySizeMaybe} personnes potentielles`}
        />
        <MetricCard
          title="Peuvent aider"
          value={metrics.helpersCount}
          subtitle="Participants volontaires"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Non" value={metrics.noCount} />
        <MetricCard title="Ne veut pas venir" value={metrics.definitiveNoCount} />
        <MetricCard title="Réponses complètes" value={metrics.completedCount} />
        <MetricCard
          title="Total présentiel estimé"
          value={metrics.totalPartySizeYes + metrics.totalPartySizeMaybe}
          subtitle="Oui + peut-être"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-lg font-black text-slate-900">
          Aides proposées
        </div>

        {metrics.topHelpTypes.length === 0 ? (
          <div className="mt-3 text-sm font-medium text-slate-700">
            Aucune aide proposée pour le moment.
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {metrics.topHelpTypes.map(([key, count]) => (
              <span
                key={key}
                className="rounded-full bg-blue-50 px-3 py-2 text-sm font-black text-blue-700"
              >
                {key} · {count}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-slate-900" />
          <div className="text-lg font-black text-slate-900">
            Détail des réponses
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 text-sm font-medium text-slate-700">
            Aucune réponse pour le moment.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {items.map((item) => (
              <article
                key={item.participantId}
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
                      getStatusClasses(item.attendanceStatus),
                    ].join(" ")}
                  >
                    {getStatusLabel(item.attendanceStatus)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-white p-3">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Nombre
                    </div>
                    <div className="mt-1 text-sm font-black text-slate-900">
                      {item.partySize ?? "—"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Aide
                    </div>
                    <div className="mt-1 text-sm font-black text-slate-900">
                      {item.canHelp ? "Oui" : "Non"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-3 sm:col-span-2">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Types d’aide
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900">
                      {item.helpTypes.length > 0
                        ? item.helpTypes.join(", ")
                        : "—"}
                    </div>
                  </div>
                </div>

                {item.note ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Note
                    </div>
                    <div className="mt-1 text-sm font-medium leading-6 text-slate-800">
                      {item.note}
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 text-xs font-bold text-slate-500">
                  Mis à jour le {formatDateTime(item.updatedAt)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}