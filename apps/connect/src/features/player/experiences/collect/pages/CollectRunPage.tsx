// src/features/player/experiences/collect/pages/CollectRunPage.tsx

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getActivityDefinition } from "../../../core/activity/content/queries/getActivityDefinition";
import { LearnTopBar } from "../../learn/components/LearnTopBar";
import { LearnQuestionCard } from "../../learn/components/LearnQuestionCard";
import { LearnCompletionCard } from "../../learn/components/LearnCompletionCard";
import { useCollectActivityPlayer } from "../hooks/useCollectActivityPlayer";

export function CollectRunPage() {
  const { activitySlug, eventSlug } = useParams();
  const slug = activitySlug ?? "famille-collect";
  const resolvedEventSlug = eventSlug ?? "";

  const activity = useMemo(() => getActivityDefinition(slug), [slug]);
  const player = useCollectActivityPlayer(activity, resolvedEventSlug);

  const scoringPolicy = activity.scoring;

  const showLiveScore =
    scoringPolicy.kind === "enabled"
      ? scoringPolicy.showLiveScore !== false
      : false;

  const showFinalScore =
    scoringPolicy.kind === "enabled"
      ? scoringPolicy.showFinalScore !== false
      : false;

  const primaryCtaLabel =
    player.currentQuestion?.type === "info" ? "Continuer" : "Valider";

  if (!player.hasStarted) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pt-6 pb-28">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-2xl font-black text-slate-900">
              {activity.title}
            </div>

            {activity.description ? (
              <div className="mt-2 text-sm font-bold text-slate-700">
                {activity.description}
              </div>
            ) : null}

            {activity.introMarkdown ? (
              <div className="mt-5 whitespace-pre-wrap text-[15px] leading-6 font-medium text-slate-800">
                {activity.introMarkdown}
              </div>
            ) : null}
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
          <div className="c-container">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
              <button
                type="button"
                onClick={player.start}
                disabled={player.isBootstrapping}
                className={[
                  "h-12 w-full rounded-2xl font-black transition",
                  player.isBootstrapping
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : "bg-[color:var(--blue)] text-white",
                ].join(" ")}
              >
                {player.isBootstrapping ? "Chargement..." : "Commencer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (player.isComplete) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pt-6 pb-10">
          <LearnCompletionCard
            title={activity.title}
            totalQuestions={player.totalQuestions}
            onRestart={player.restart}
            mode="collect"
            showScore={showFinalScore}
            score={player.score}
            pendingReviewScore={player.pendingReviewScore}
          />

          {player.pendingReviewScore > 0 ? (
            <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-black text-blue-900">
                +{player.pendingReviewScore} pts possibles après validation
              </div>
              <div className="mt-1 text-sm font-medium text-blue-800">
                Certaines réponses doivent encore être relues avant attribution
                des points.
              </div>
            </div>
          ) : null}
        </main>
      </div>
    );
  }

  if (!player.currentQuestion || !player.currentSection) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pt-6 pb-10">
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
            <div className="font-black text-rose-900">
              Aucune question disponible.
            </div>
          </div>
        </main>
      </div>
    );
  }

  const pendingReviewPoints =
    player.currentPendingReviewPoints > 0
      ? player.currentPendingReviewPoints
      : undefined;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-4 pb-28">
        <LearnTopBar
          title={activity.title}
          sectionTitle={player.currentSection.title}
          currentIndex={player.currentIndex}
          totalQuestions={player.totalQuestions}
          score={player.score}
          showScore={showLiveScore}
          pendingReviewPoints={pendingReviewPoints}
        />

        {player.canGoBack ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={player.goBack}
              disabled={player.currentIndex === 0 || player.isSubmitting}
              className={[
                "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 font-black transition",
                player.currentIndex === 0 || player.isSubmitting
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              ].join(" ")}
            >
              <ArrowLeft size={16} />
              Retour
            </button>
          </div>
        ) : null}

        <div className="mt-4">
          <LearnQuestionCard
            question={player.currentQuestion}
            answer={player.currentAnswer}
            disabled={player.isSubmitting}
            onAnswerChange={player.setAnswer}
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
          <div className="c-container">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={player.submitCurrent}
                  disabled={!player.canSubmitCurrent || player.isSubmitting}
                  className={[
                    "h-12 w-full rounded-2xl font-black transition",
                    player.canSubmitCurrent && !player.isSubmitting
                      ? "bg-[color:var(--blue)] text-white"
                      : "cursor-not-allowed bg-slate-200 text-slate-500",
                  ].join(" ")}
                >
                  {player.isSubmitting
                    ? player.submittingLabel
                    : primaryCtaLabel}
                </button>

                {player.canSkip ? (
                  <button
                    type="button"
                    onClick={player.skipCurrent}
                    disabled={player.isSubmitting}
                    className={[
                      "h-11 w-full rounded-2xl border font-black transition",
                      player.isSubmitting
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : "border-slate-200 bg-white text-slate-700",
                    ].join(" ")}
                  >
                    Passer
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}