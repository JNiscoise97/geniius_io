import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarClock, Loader2, Sparkles } from "lucide-react";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { listParticipantActivitySessions } from "../api/listParticipantActivitySessions";
import { ActivityHubCard } from "../components/hub/ActivityHubCard";
import { listActivityDefinitions } from "../core/activity/content/queries/listActivityDefinitions";
import type { ActivityDefinition } from "../core/activity/activityTypes";
import {
  resolveActivityHubStatus,
  type ActivitySessionHubSummary,
} from "../core/activity/utils/resolveActivityHubStatus";

type LoadState =
  | {
      kind: "loading";
    }
  | {
      kind: "ready";
      sessionsByActivitySlug: Record<string, ActivitySessionHubSummary>;
    }
  | {
      kind: "error";
      message: string;
    }
  | {
      kind: "missing_participant";
    };

function getModeLabel(mode: ActivityDefinition["mode"]): string {
  switch (mode) {
    case "learn":
      return "Quiz learn";
    case "collect":
      return "Quiz collect";
    case "play":
      return "Jeux play";
    default:
      return mode;
  }
}

function buildActivityHref(
  eventSlug: string,
  activity: ActivityDefinition
): string {
  switch (activity.mode) {
    case "learn":
      return `/e/${eventSlug}/learn/${activity.slug}`;
    case "collect":
      return `/e/${eventSlug}/collect/${activity.slug}`;
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

export function ActivityHubPage() {
  const { eventSlug } = useParams();
  const resolvedEventSlug = eventSlug ?? "";

  const allActivities = useMemo(
    () => orderActivities(listActivityDefinitions().filter(isVisibleInHub)),
    []
  );

  const [loadState, setLoadState] = useState<LoadState>({
    kind: "loading",
  });

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

        const sessionsByActivitySlug: Record<
          string,
          ActivitySessionHubSummary
        > = {};

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

  const groupedActivities = useMemo(() => {
    const groups: Array<{
      mode: ActivityDefinition["mode"];
      title: string;
      activities: ActivityDefinition[];
    }> = [];

    const modes: ActivityDefinition["mode"][] = ["learn", "collect", "play"];

    modes.forEach((mode) => {
      const activities = allActivities.filter(
        (activity) => activity.mode === mode
      );

      if (activities.length > 0) {
        groups.push({
          mode,
          title: getModeLabel(mode),
          activities,
        });
      }
    });

    return groups;
  }, [allActivities]);

  if (loadState.kind === "loading") {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-slate-900">
              <Loader2 className="animate-spin" size={20} />
              <div className="text-lg font-black">
                Chargement des activités...
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loadState.kind === "missing_participant") {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="text-lg font-black text-amber-900">
              Impossible de retrouver ton profil participant
            </div>
            <div className="mt-2 text-sm font-medium leading-6 text-amber-800">
              Recharge l'application depuis ton lien d'accès à l'événement pour
              récupérer ton contexte participant, puis reviens sur le hub.
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loadState.kind === "error") {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <div className="text-lg font-black text-rose-900">
              Le hub d'activités n'a pas pu être chargé
            </div>
            <div className="mt-2 text-sm font-medium leading-6 text-rose-800">
              {loadState.message}
            </div>
          </div>
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

  const scheduledCount = allActivities.filter((activity) => {
    const session = sessionsByActivitySlug[activity.slug];
    return resolveActivityHubStatus(activity, session) === "scheduled";
  }).length;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-blue-200 bg-blue-50 text-blue-700">
                <Sparkles size={24} />
              </div>

              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  Activités de la cousinade
                </h1>

                <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-700 sm:text-[15px]">
                  Retrouve ici toutes les activités disponibles. Tu peux lancer
                  un quiz, reprendre une activité déjà commencée, voir ce que tu
                  as terminé et repérer ce qui sera bientôt débloqué.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                Activités
              </div>
              <div className="mt-3 text-4xl font-black text-slate-900">
                {totalActivities}
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
              <div className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Terminées
              </div>
              <div className="mt-3 text-4xl font-black text-emerald-900">
                {completedCount}
              </div>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
              <div className="text-xs font-black uppercase tracking-wide text-amber-700">
                En cours
              </div>
              <div className="mt-3 text-4xl font-black text-amber-900">
                {inProgressCount}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                <CalendarClock size={14} />
                Bientôt dispo
              </div>
              <div className="mt-3 text-4xl font-black text-slate-900">
                {scheduledCount}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-10">
          {groupedActivities.map((group) => (
            <section key={group.mode} className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {group.title}
                </h2>
                <div className="mt-1 text-sm font-medium text-slate-600">
                  {group.activities.length} activité
                  {group.activities.length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="space-y-4">
                {group.activities.map((activity) => {
                  const session = sessionsByActivitySlug[activity.slug];
                  const status = resolveActivityHubStatus(activity, session);

                  return (
                    <ActivityHubCard
                      key={activity.slug}
                      activity={activity}
                      status={status}
                      session={session}
                      href={buildActivityHref(resolvedEventSlug, activity)}
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