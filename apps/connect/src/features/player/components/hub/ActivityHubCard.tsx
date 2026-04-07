import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ActivityDefinition } from "../../core/activity/activityTypes";
import type {
  ActivityHubStatus,
  ActivitySessionHubSummary,
} from "../../core/activity/utils/resolveActivityHubStatus";
import {
  getActivityProgressPercent,
  getActivityQuestionCount,
} from "../../core/activity/utils/resolveActivityHubStatus";

type ActivityHubCardProps = {
  activity: ActivityDefinition;
  status: ActivityHubStatus;
  session?: ActivitySessionHubSummary;
  href: string;
};

function getModeLabel(mode: ActivityDefinition["mode"]): string {
  switch (mode) {
    case "learn":
      return "Learn";
    case "collect":
      return "Collect";
    case "play":
      return "Play";
    default:
      return mode;
  }
}

function getStatusLabel(status: ActivityHubStatus): string {
  switch (status) {
    case "available":
      return "Disponible";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminée";
    case "scheduled":
      return "Bientôt disponible";
    default:
      return status;
  }
}

function getStatusClasses(status: ActivityHubStatus): string {
  switch (status) {
    case "available":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "scheduled":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
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

export function ActivityHubCard({
  activity,
  status,
  session,
  href,
}: ActivityHubCardProps) {
  const totalQuestions = getActivityQuestionCount(activity);
  const currentIndex = session?.currentIndex ?? 0;
  const progressPercent = getActivityProgressPercent(
    currentIndex,
    totalQuestions,
    status
  );
  const isDisabled = status === "scheduled";
  const scheduledLabel = formatScheduledLabel(activity);

  return (
    <article
      className={[
        "w-full rounded-[32px] border bg-white p-6 shadow-sm transition sm:p-7",
        isDisabled ? "border-slate-200 opacity-80" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-slate-700">
              {getModeLabel(activity.mode)}
            </span>

            <span
              className={[
                "rounded-full border px-3 py-1.5 text-[11px] font-black",
                getStatusClasses(status),
              ].join(" ")}
            >
              {getStatusLabel(status)}
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
            {activity.title}
          </h3>

          {activity.description ? (
            <p className="mt-3 max-w-4xl text-sm font-medium leading-7 text-slate-700 sm:text-[15px]">
              {activity.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center">
          {status === "completed" ? (
            <CheckCircle2 className="text-emerald-600" size={26} />
          ) : status === "in_progress" ? (
            <PlayCircle className="text-amber-600" size={26} />
          ) : status === "scheduled" ? (
            <CalendarClock className="text-slate-500" size={26} />
          ) : (
            <Clock3 className="text-blue-600" size={26} />
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1.5">
          {status === "completed"
            ? `${totalQuestions}/${totalQuestions} questions`
            : `${Math.min(currentIndex, totalQuestions)}/${totalQuestions} questions`}
        </span>

        {typeof session?.score === "number" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
            <Trophy size={14} />
            {session.score} pts
          </span>
        ) : null}

        {session?.pendingReviewScore ? (
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[13px] font-black text-blue-700">
            +{session.pendingReviewScore} en attente
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
          <span>Progression</span>
          <span>{progressPercent}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          <div
            className={[
              "h-full transition-all duration-300",
              status === "completed"
                ? "bg-emerald-500"
                : status === "in_progress"
                  ? "bg-amber-500"
                  : "bg-[color:var(--blue)]",
            ].join(" ")}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {scheduledLabel ? (
        <div className="mt-4 text-sm font-bold text-slate-600">
          {scheduledLabel}
        </div>
      ) : null}

      <div className="mt-6">
        {isDisabled ? (
          <button
            type="button"
            disabled
            className="h-13 w-full cursor-not-allowed rounded-2xl bg-slate-200 px-5 font-black text-slate-500"
          >
            {getCtaLabel(status)}
          </button>
        ) : (
          <Link
            to={href}
            className="inline-flex h-13 w-full items-center justify-center rounded-2xl bg-[color:var(--blue)] px-5 font-black text-white"
          >
            {getCtaLabel(status)}
          </Link>
        )}
      </div>
    </article>
  );
}