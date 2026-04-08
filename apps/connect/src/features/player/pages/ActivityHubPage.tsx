import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Gamepad2Icon,
  Loader2,
  PlayCircle,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { listParticipantActivitySessions } from "../api/listParticipantActivitySessions";
import { listActivityDefinitions } from "../core/activity/content/queries/listActivityDefinitions";
import type { ActivityDefinition } from "../core/activity/activityTypes";
import { getActivityMaxScore } from "../core/activity/utils/getActivityMaxScore";
import {
  resolveActivityHubStatus,
  type ActivityHubStatus,
  type ActivitySessionHubSummary,
} from "../core/activity/utils/resolveActivityHubStatus";

type LoadState =
  | { kind: "loading" }
  | {
      kind: "ready";
      sessionsByActivitySlug: Record<string, ActivitySessionHubSummary>;
    }
  | { kind: "error"; message: string }
  | { kind: "missing_participant" };

type ActivityHubGroup = {
  key: ActivityDefinition["mode"];
  title: string;
  subtitle: string;
  activities: ActivityDefinition[];
};

type ActivityMetric = {
  key: string;
  label: string;
  value: string;
};

function buildActivityHref(
  eventSlug: string,
  activity: ActivityDefinition,
): string {
  switch (activity.mode) {
    case "learn":
      return `/e/${eventSlug}/activities/learn/${activity.slug}`;
    case "collect":
      return `/e/${eventSlug}/activities/collect/${activity.slug}`;
    case "play":
      return `/e/${eventSlug}/activities/play/${activity.slug}`;
    default:
      return `/e/${eventSlug}/activities`;
  }
}

function isVisibleInHub(activity: ActivityDefinition): boolean {
  return activity.availability?.kind !== "hidden";
}

function orderActivities(activities: ActivityDefinition[]): ActivityDefinition[] {
  const modeOrder: Record<ActivityDefinition["mode"], number> = {
    learn: 1,
    collect: 2,
    play: 3,
  };

  return [...activities].sort((a, b) => {
    const modeDiff = modeOrder[a.mode] - modeOrder[b.mode];
    if (modeDiff !== 0) return modeDiff;
    return a.title.localeCompare(b.title, "fr");
  });
}

function getModeMeta(mode: ActivityDefinition["mode"]): {
  title: string;
  subtitle: string;
} {
  switch (mode) {
    case "learn":
      return {
        title: "Quiz",
        subtitle: "Découvrir, apprendre et tester ses connaissances.",
      };
    case "collect":
      return {
        title: "Collectes",
        subtitle: "Partager des souvenirs, infos ou documents utiles.",
      };
    case "play":
      return {
        title: "Jeux",
        subtitle: "Participer à des activités plus ludiques.",
      };
    default:
      return {
        title: mode,
        subtitle: "",
      };
  }
}

function getStatusMeta(status: ActivityHubStatus): {
  label: string;
  badgeClassName: string;
  helper?: string;
  icon: LucideIcon;
  iconWrapClassName: string;
} {
  switch (status) {
    case "completed":
      return {
        label: "Terminée",
        badgeClassName: "bg-emerald-50 text-emerald-700",
        helper: "Déjà complétée",
        icon: CheckCircle2,
        iconWrapClassName: "bg-emerald-50 text-emerald-700",
      };
    case "in_progress":
      return {
        label: "En cours",
        badgeClassName: "bg-amber-50 text-amber-700",
        helper: "Tu peux reprendre",
        icon: PlayCircle,
        iconWrapClassName: "bg-amber-50 text-amber-700",
      };
    case "scheduled":
      return {
        label: "Bientôt",
        badgeClassName: "bg-slate-100 text-slate-600",
        helper: "Pas encore disponible",
        icon: CalendarClock,
        iconWrapClassName: "bg-slate-100 text-slate-600",
      };
    case "available":
    default:
      return {
        label: "Disponible",
        badgeClassName: "bg-blue-50 text-blue-700",
        helper: "Prêt à commencer",
        icon: Clock3,
        iconWrapClassName: "bg-slate-100 text-slate-900",
      };
  }
}

function getCtaLabel(status: ActivityHubStatus): string {
  switch (status) {
    case "available":
      return "Commencer";
    case "in_progress":
      return "Reprendre";
    case "completed":
      return "Revoir";
    case "scheduled":
      return "Bientôt disponible";
    default:
      return "Ouvrir";
  }
}

function getQuestionCount(activity: ActivityDefinition): number {
  return activity.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0,
  );
}

function getProgressLabel(
  activity: ActivityDefinition,
  session: ActivitySessionHubSummary | undefined,
  status: ActivityHubStatus,
): string {
  const totalQuestions = getQuestionCount(activity);

  if (status === "completed") {
    return `${totalQuestions}/${totalQuestions} questions`;
  }

  const currentIndex = session?.currentIndex ?? 0;
  return `${Math.min(currentIndex, totalQuestions)}/${totalQuestions} questions`;
}

function formatScheduledLabel(activity: ActivityDefinition): string | null {
  const availability = activity.availability as
    | { kind: "scheduled"; opensAt: string; label?: string }
    | undefined;

  if (!availability || availability.kind !== "scheduled") {
    return null;
  }

  if (availability.label) {
    return availability.label;
  }

  const date = new Date(availability.opensAt);

  if (Number.isNaN(date.getTime())) {
    return "Disponible prochainement";
  }

  return `Disponible le ${date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getActivityEarnedScore(
  session: ActivitySessionHubSummary | undefined,
): number {
  return session?.score ?? 0;
}

export function ActivityHubPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const resolvedEventSlug = eventSlug ?? "";

  const allActivities = useMemo(
    () => orderActivities(listActivityDefinitions().filter(isVisibleInHub)),
    [],
  );

  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadState({ kind: "loading" });

        if (!resolvedEventSlug) {
          if (!cancelled) {
            setLoadState({
              kind: "error",
              message: "Aucun événement n'a été trouvé dans l'URL.",
            });
          }
          return;
        }

        const participantSession = getParticipantSession(resolvedEventSlug);

        if (!participantSession?.participantId) {
          if (!cancelled) {
            setLoadState({ kind: "missing_participant" });
          }
          return;
        }

        const rows = await listParticipantActivitySessions({
          eventSlug: resolvedEventSlug,
          participantId: participantSession.participantId,
        });

        if (cancelled) return;

        const sessionsByActivitySlug: Record<string, ActivitySessionHubSummary> =
          {};

        rows.forEach((row) => {
          sessionsByActivitySlug[row.activitySlug] = {
            activitySlug: row.activitySlug,
            sessionId: row.sessionId,
            status: row.status,
            currentIndex: row.currentIndex,
            score: row.score,
            pendingReviewScore: row.pendingReviewScore,
            startedAt: row.startedAt,
            completedAt: row.completedAt,
          };
        });

        setLoadState({
          kind: "ready",
          sessionsByActivitySlug,
        });
      } catch (error) {
        if (!cancelled) {
          setLoadState({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Impossible de charger le hub d'activités.",
          });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [resolvedEventSlug]);

  const groupedActivities = useMemo<ActivityHubGroup[]>(() => {
    const modes: ActivityDefinition["mode"][] = ["learn", "collect", "play"];

    return modes
      .map((mode) => {
        const activities = allActivities.filter((activity) => activity.mode === mode);
        if (activities.length === 0) return null;

        const meta = getModeMeta(mode);

        return {
          key: mode,
          title: meta.title,
          subtitle: meta.subtitle,
          activities,
        };
      })
      .filter((group): group is ActivityHubGroup => group !== null);
  }, [allActivities]);

  if (loadState.kind === "loading") {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-24 pt-4">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-slate-900">
              <Loader2 className="animate-spin" size={20} />
              <div className="text-lg font-black">
                Chargement des activités...
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (loadState.kind === "missing_participant") {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-24 pt-4">
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="text-lg font-black text-amber-900">
              Impossible de retrouver ton profil participant
            </div>
            <p className="mt-2 text-sm font-medium leading-6 text-amber-800">
              Recharge l’application depuis ton lien d’accès à l’événement pour
              récupérer ton contexte participant, puis reviens ici.
            </p>
          </section>
        </main>
      </div>
    );
  }

  if (loadState.kind === "error") {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-24 pt-4">
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <div className="text-lg font-black text-rose-900">
              Le hub d’activités n’a pas pu être chargé
            </div>
            <p className="mt-2 text-sm font-medium leading-6 text-rose-800">
              {loadState.message}
            </p>
          </section>
        </main>
      </div>
    );
  }

  const sessionsByActivitySlug = loadState.sessionsByActivitySlug;

  const totalActivities = allActivities.length;
  const completedCount = allActivities.filter((activity) => {
    const session = sessionsByActivitySlug[activity.slug];
    return resolveActivityHubStatus(activity, session) === "completed";
  }).length;

  const inProgressCount = allActivities.filter((activity) => {
    const session = sessionsByActivitySlug[activity.slug];
    return resolveActivityHubStatus(activity, session) === "in_progress";
  }).length;

  const totalEarnedScore = allActivities.reduce((sum, activity) => {
    const session = sessionsByActivitySlug[activity.slug];
    return sum + getActivityEarnedScore(session);
  }, 0);

  const totalMaxScore = allActivities.reduce((sum, activity) => {
    return sum + getActivityMaxScore(activity);
  }, 0);

  const metrics: ActivityMetric[] = [
    {
      key: "activities",
      label: "Activités",
      value: String(totalActivities),
    },
    {
      key: "completed",
      label: "Terminées",
      value: String(completedCount),
    },
    {
      key: "in_progress",
      label: "En cours",
      value: String(inProgressCount),
    },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-[28px] font-black tracking-tight text-slate-900">
              Activités
            </h1>
          </div>

          <button
            type="button"
            onClick={() => nav(`/e/${resolvedEventSlug}/home`)}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft size={14} />
            Retour
          </button>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold text-blue-700">
            <Gamepad2Icon size={14} />
            Hub d’activités
          </div>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Retrouve ici les quiz, collectes et jeux de la cousinade. Tu peux
            commencer une activité, reprendre là où tu t’étais arrêté, ou revoir
            ce que tu as déjà terminé.
          </p>

          <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 p-4">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-blue-700">
              Score total
            </div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-[34px] leading-none font-black text-slate-900">
                {totalEarnedScore}
              </div>
              <div className="pb-1 text-sm font-black text-slate-500">
                / {totalMaxScore} pts
              </div>
            </div>
            <div className="mt-2 text-xs font-bold leading-5 text-slate-700">
              Tous les points déjà gagnés sur l’ensemble des activités.
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.key}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-3"
              >
                <div className="text-[22px] leading-none font-black text-slate-900">
                  {metric.value}
                </div>
                <div className="mt-1 text-[11px] font-extrabold leading-4 text-slate-600">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 space-y-6">
          {groupedActivities.map((group) => (
            <section key={group.key}>
              <div className="mb-3">
                <h2 className="text-[18px] font-black text-slate-900">
                  {group.title}
                </h2>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                  {group.subtitle}
                </p>
              </div>

              <div className="grid gap-3">
                {group.activities.map((activity) => {
                  const session = sessionsByActivitySlug[activity.slug];
                  const status = resolveActivityHubStatus(activity, session);

                  return (
                    <ActivityActionCard
                      key={activity.slug}
                      activity={activity}
                      session={session}
                      status={status}
                      onClick={() => {
                        if (status === "scheduled") return;
                        nav(buildActivityHref(resolvedEventSlug, activity));
                      }}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function ActivityActionCard({
  activity,
  session,
  status,
  onClick,
}: {
  activity: ActivityDefinition;
  session?: ActivitySessionHubSummary;
  status: ActivityHubStatus;
  onClick: () => void;
}) {
  const disabled = status === "scheduled";
  const statusMeta = getStatusMeta(status);
  const Icon = statusMeta.icon;
  const questionCount = getQuestionCount(activity);
  const progressLabel = getProgressLabel(activity, session, status);
  const scheduledLabel = formatScheduledLabel(activity);
  const maxScore = getActivityMaxScore(activity);
  const showLearnPotentialPoints =
    activity.mode === "learn" && status === "available" && maxScore > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full rounded-[24px] border p-4 text-left shadow-sm transition-all",
        disabled
          ? "border-slate-200 bg-slate-50 opacity-80"
          : "border-slate-200 bg-white active:scale-[0.99] active:shadow-none",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 rounded-2xl p-3",
            disabled ? "bg-slate-200 text-slate-500" : statusMeta.iconWrapClassName,
          ].join(" ")}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={[
                "text-[15px] font-black",
                disabled ? "text-slate-500" : "text-slate-900",
              ].join(" ")}
            >
              {activity.title}
            </div>

            <span
              className={[
                "rounded-full px-2 py-1 text-[10px] font-black",
                statusMeta.badgeClassName,
              ].join(" ")}
            >
              {statusMeta.label}
            </span>
          </div>

          {activity.description ? (
            <p
              className={[
                "mt-1 text-xs font-bold leading-5",
                disabled ? "text-slate-500" : "text-slate-700",
              ].join(" ")}
            >
              {activity.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
              {progressLabel}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
              {questionCount} question{questionCount > 1 ? "s" : ""}
            </span>

            {typeof session?.score === "number" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
                <Trophy size={12} />
                {session.score} pts
              </span>
            ) : null}

            {showLearnPotentialPoints ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                {maxScore} pts à gagner
              </span>
            ) : null}

            {session?.pendingReviewScore ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                +{session.pendingReviewScore} en attente
              </span>
            ) : null}
          </div>

          {scheduledLabel ? (
            <div className="mt-3 text-[11px] font-extrabold text-slate-500">
              {scheduledLabel}
            </div>
          ) : null}
        </div>

        <div
          className={[
            "shrink-0 rounded-2xl p-2",
            disabled
              ? "bg-slate-200 text-slate-500"
              : "bg-slate-100 text-slate-900",
          ].join(" ")}
        >
          <ArrowRight size={18} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] font-extrabold">
          {disabled ? (
            <span className="text-slate-500">Bientôt disponible</span>
          ) : null}
        </div>

        {!disabled ? (
          <div className="text-[11px] font-extrabold text-slate-500">
            {getCtaLabel(status)}
          </div>
        ) : null}
      </div>
    </button>
  );
}