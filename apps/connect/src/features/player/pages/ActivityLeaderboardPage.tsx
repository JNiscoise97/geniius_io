import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Medal, Trophy, Users } from "lucide-react";
import {
  getActivityLeaderboardData,
  type ActivityLeaderboardData,
  type CollectLeaderboardEntry,
  type LearnLeaderboardEntry,
} from "../api/getActivityLeaderboardData";

type TabKey = "learn" | "collect";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: ActivityLeaderboardData }
  | { kind: "error"; message: string };

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

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

function getRankStyle(rank: number): string {
  if (rank === 1) {
    return "border-yellow-200 bg-yellow-50";
  }

  if (rank === 2) {
    return "border-slate-300 bg-slate-50";
  }

  if (rank === 3) {
    return "border-amber-200 bg-amber-50";
  }

  return "border-slate-200 bg-white";
}

function TopThreeLearn({
  entries,
}: {
  entries: LearnLeaderboardEntry[];
}) {
  const topThree = entries.slice(0, 3);

  if (topThree.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-700">
          Aucun quiz terminé pour le moment.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {topThree.map((entry, index) => {
        const rank = index + 1;

        return (
          <div
            key={entry.participantId}
            className={[
              "rounded-3xl border p-5 shadow-sm",
              getRankStyle(rank),
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <Medal size={18} className="text-slate-700" />
              <div className="text-sm font-black text-slate-700">
                #{rank}
              </div>
            </div>

            <div className="mt-3 text-xl font-black text-slate-900">
              {entry.participantLabel}
            </div>

            <div className="mt-2 text-3xl font-black text-slate-900">
              {entry.totalScore} pts
            </div>

            <div className="mt-1 text-sm font-bold text-slate-600">
              {entry.completedQuizCount} quiz terminé
              {entry.completedQuizCount > 1 ? "s" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LearnLeaderboardTable({
  entries,
}: {
  entries: LearnLeaderboardEntry[];
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4">
      {entries.map((entry, index) => (
        <article
          key={entry.participantId}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                Rang #{index + 1}
              </div>
              <div className="mt-1 text-xl font-black text-slate-900">
                {entry.participantLabel}
              </div>
              <div className="mt-2 text-sm font-bold text-slate-600">
                {entry.completedQuizCount} quiz terminé
                {entry.completedQuizCount > 1 ? "s" : ""}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                Cumul
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900">
                {entry.totalScore} pts
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-black">Quiz</th>
                  <th className="py-2 pr-4 font-black">Réalisé le</th>
                  <th className="py-2 pr-0 font-black">Score</th>
                </tr>
              </thead>
              <tbody>
                {entry.quizScores.map((quiz) => (
                  <tr
                    key={`${entry.participantId}-${quiz.activitySlug}-${quiz.completedAt ?? quiz.startedAt ?? "na"}`}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-3 pr-4 font-bold text-slate-900">
                      {quiz.activityTitle}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-700">
                      {formatDateTime(quiz.completedAt ?? quiz.startedAt)}
                    </td>
                    <td className="py-3 pr-0 font-black text-slate-900">
                      {quiz.score} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}

function CollectLeaderboardList({
  entries,
}: {
  entries: CollectLeaderboardEntry[];
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-700">
          Aucune collecte commencée pour le moment.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {entries.map((entry) => (
        <article
          key={entry.participantId}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xl font-black text-slate-900">
                {entry.participantLabel}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  {entry.completedCount} terminée
                  {entry.completedCount > 1 ? "s" : ""}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  {entry.startedCount} en cours
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                Total collectes
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900">
                {entry.completedCount + entry.startedCount}
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-black">Collecte</th>
                  <th className="py-2 pr-4 font-black">Statut</th>
                  <th className="py-2 pr-4 font-black">Commencée le</th>
                  <th className="py-2 pr-0 font-black">Terminée le</th>
                </tr>
              </thead>
              <tbody>
                {entry.contributions.map((item) => (
                  <tr
                    key={`${entry.participantId}-${item.activitySlug}-${item.completedAt ?? item.updatedAt}`}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-3 pr-4 font-bold text-slate-900">
                      {item.activityTitle}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-black",
                          item.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700",
                        ].join(" ")}
                      >
                        {item.status === "completed" ? "Terminée" : "En cours"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-700">
                      {formatDateTime(item.startedAt)}
                    </td>
                    <td className="py-3 pr-0 font-medium text-slate-700">
                      {formatDateTime(
                        item.completedAt ?? (item.status === "completed" ? item.updatedAt : null)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ActivityLeaderboardPage() {
  const { eventSlug } = useParams();
  const resolvedEventSlug = eventSlug ?? "";
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabKey>("learn");
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setState({ kind: "loading" });

        const data = await getActivityLeaderboardData({
          eventSlug: resolvedEventSlug,
        });

        if (!cancelled) {
          setState({ kind: "ready", data });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Impossible de charger le classement.",
          });
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [resolvedEventSlug]);

  const readyData = state.kind === "ready" ? state.data : null;

  const learnCount = readyData?.learn.length ?? 0;
  const collectCount = readyData?.collect.length ?? 0;

  const learnTotalCompleted = useMemo(() => {
    return readyData?.learn.reduce(
      (sum, entry) => sum + entry.completedQuizCount,
      0
    ) ?? 0;
  }, [readyData]);

  const collectTotalContributions = useMemo(() => {
    return readyData?.collect.reduce(
      (sum, entry) => sum + entry.completedCount + entry.startedCount,
      0
    ) ?? 0;
  }, [readyData]);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-10 pt-6">
        <button
          type="button"
          onClick={() => navigate(`/e/${resolvedEventSlug}/activities`)}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 font-black text-slate-700"
        >
          <ArrowLeft size={16} />
          Retour aux activités
        </button>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Trophy size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Classement des activités
              </h1>
              <div className="mt-1 text-sm font-medium text-slate-700">
                Vue learn et collect pour l’événement.
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTab("learn")}
              className={[
                "rounded-2xl border px-4 py-4 text-left transition",
                tab === "learn"
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="text-sm font-black text-slate-900">Learn</div>
              <div className="mt-1 text-sm font-medium text-slate-700">
                {learnCount} participant
                {learnCount > 1 ? "s" : ""} classé
                {learnTotalCompleted > 0 ? ` • ${learnTotalCompleted} quiz terminés` : ""}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTab("collect")}
              className={[
                "rounded-2xl border px-4 py-4 text-left transition",
                tab === "collect"
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="text-sm font-black text-slate-900">Collect</div>
              <div className="mt-1 text-sm font-medium text-slate-700">
                {collectCount} participant
                {collectCount > 1 ? "s" : ""} • {collectTotalContributions} collecte
                {collectTotalContributions > 1 ? "s" : ""}
              </div>
            </button>
          </div>
        </div>

        {state.kind === "loading" ? (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-slate-900">
              <Loader2 className="animate-spin" size={20} />
              <div className="text-lg font-black">Chargement du classement...</div>
            </div>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4">
            <div className="font-black text-rose-900">{state.message}</div>
          </div>
        ) : null}

        {state.kind === "ready" && tab === "learn" ? (
          <div className="mt-4 grid gap-4">
            <TopThreeLearn entries={state.data.learn} />
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Users size={16} />
                <div className="text-sm font-black">Classement complet</div>
              </div>
            </div>
            <LearnLeaderboardTable entries={state.data.learn} />
          </div>
        ) : null}

        {state.kind === "ready" && tab === "collect" ? (
          <div className="mt-4">
            <CollectLeaderboardList entries={state.data.collect} />
          </div>
        ) : null}
      </main>
    </div>
  );
}