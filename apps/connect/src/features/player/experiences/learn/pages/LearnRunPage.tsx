import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLearnActivityPlayer } from "../hooks/useLearnActivityPlayer";
import { LearnTopBar } from "../components/LearnTopBar";
import { LearnQuestionCard } from "../components/LearnQuestionCard";
import { LearnFeedbackCard } from "../components/LearnFeedbackCard";
import { LearnCompletionCard } from "../components/LearnCompletionCard";
import { getActivityDefinition } from "../../../core/activity/content/queries/getActivityDefinition";
import { getPenaltyForAttempt } from "../../../core/activity/utils/getPenaltyForAttempt";

export function LearnRunPage() {
  const { activitySlug, eventSlug } = useParams();
  const slug = activitySlug ?? "famille-quiz";
  const resolvedEventSlug = eventSlug ?? "";

  const activity = useMemo(() => getActivityDefinition(slug), [slug]);
  const player = useLearnActivityPlayer(activity, resolvedEventSlug);

  const primaryCtaLabel =
    player.currentQuestion?.type === "info" ? "Continuer" : "Valider";

  const scoringPolicy = activity.scoring;
  const scoringEnabled = scoringPolicy.kind === "enabled";

  const showLiveScore =
    scoringPolicy.kind === "enabled"
      ? scoringPolicy.showLiveScore !== false
      : false;

  const showFinalScore =
    scoringPolicy.kind === "enabled"
      ? scoringPolicy.showFinalScore !== false
      : false;

  const showExplanation =
    activity.feedback.kind === "immediate"
      ? activity.feedback.showExplanation !== false
      : true;

  const showExpectedAnswer =
    activity.feedback.kind === "immediate"
      ? activity.feedback.showExpectedAnswer !== false
      : true;

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
            score={player.score}
            totalQuestions={player.totalQuestions}
            onRestart={player.restart}
            showScore={showFinalScore}
          />
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

  const isLastQuestion = player.currentIndex === player.totalQuestions - 1;
  const evaluation = player.currentQuestion.evaluation;

  const remainingQuestionPoints =
    scoringEnabled &&
    showLiveScore &&
    (evaluation.kind === "auto_correct" || evaluation.kind === "submit_only")
      ? (() => {
          const basePoints = evaluation.points ?? 0;

          if (evaluation.kind !== "auto_correct") {
            return basePoints;
          }

          let penaltiesAlreadyApplied = 0;

          for (let attempt = 1; attempt <= player.currentAttemptsUsed; attempt += 1) {
            penaltiesAlreadyApplied += getPenaltyForAttempt(evaluation, attempt);
          }

          return Math.max(0, basePoints - penaltiesAlreadyApplied);
        })()
      : undefined;

  const pendingReviewPoints =
    scoringEnabled && showLiveScore && evaluation.kind === "manual_review"
      ? (() => {
          if (
            player.currentQuestion.type === "photo" &&
            player.currentQuestion.tier?.options?.length
          ) {
            return Math.max(
              ...player.currentQuestion.tier.options.map((option) => option.points)
            );
          }

          return evaluation.points ?? 0;
        })()
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
          remainingQuestionPoints={remainingQuestionPoints}
          pendingReviewPoints={pendingReviewPoints}
          maxAttempts={player.currentMaxAttempts}
          attemptsUsed={player.currentAttemptsUsed}
        />

        {player.canGoBack && !player.isFeedbackVisible ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={player.goBack}
              disabled={player.currentIndex === 0}
              className={[
                "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 font-black transition",
                player.currentIndex === 0
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
            disabled={player.isFeedbackVisible}
            onAnswerChange={player.setAnswer}
            maxAttempts={player.currentMaxAttempts}
            attemptsUsed={player.currentAttemptsUsed}
          />
        </div>

        {player.immediateFeedbackEnabled &&
        player.isFeedbackVisible &&
        player.currentResult ? (
          <div className="mt-4">
            <LearnFeedbackCard
              result={player.currentResult}
              onNext={player.next}
              isLastQuestion={isLastQuestion}
              totalScore={player.score}
              showScore={showLiveScore}
              showExplanation={showExplanation}
              showExpectedAnswer={showExpectedAnswer}
            />
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
            <div className="c-container">
              <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={player.submitCurrent}
                    disabled={!player.canSubmitCurrent}
                    className={[
                      "h-12 w-full rounded-2xl font-black transition",
                      player.canSubmitCurrent
                        ? "bg-[color:var(--blue)] text-white"
                        : "cursor-not-allowed bg-slate-200 text-slate-500",
                    ].join(" ")}
                  >
                    {primaryCtaLabel}
                  </button>

                  {player.canSkip ? (
                    <button
                      type="button"
                      onClick={player.skipCurrent}
                      disabled={player.isFeedbackVisible}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white font-black text-slate-700"
                    >
                      Je ne sais pas
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}