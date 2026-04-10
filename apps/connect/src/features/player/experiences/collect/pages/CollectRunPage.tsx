import { ArrowLeft, Loader2, MessageCircleHeart } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SimpleFormattedText } from "../../../../../lib/content/useSimpleFormattedText";
import { getActivityDefinition } from "../../../core/activity/content/queries/getActivityDefinition";
import { LearnQuestionCard } from "../../learn/components/LearnQuestionCard";
import { CollectCompletionCard } from "../components/CollectCompletionCard";
import { CollectTopBar } from "../components/CollectTopBar";
import { useCollectActivityPlayer } from "../hooks/useCollectActivityPlayer";

export function CollectRunPage() {
  const { activitySlug, eventSlug } = useParams();
  const slug = activitySlug ?? "collect-lien-participant-inde";
  const resolvedEventSlug = eventSlug ?? "";
  const navigate = useNavigate();

  const activity = useMemo(() => getActivityDefinition(slug), [slug]);
  const player = useCollectActivityPlayer(activity, resolvedEventSlug);

  const pendingReviewPoints =
    player.currentPendingReviewPoints > 0
      ? player.currentPendingReviewPoints
      : undefined;

  const nextStepLabel =
    player.currentQuestion?.type === "info"
      ? "Continuer"
      : "Enregistrer et continuer";

  if (player.isBootstrapping) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-10 pt-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-slate-900">
              <Loader2 className="animate-spin" size={20} />
              <div className="text-lg font-black">Chargement de l’activité...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (player.isComplete) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-10 pt-6">
          <CollectCompletionCard
            title={activity.title}
            onBackToHub={() => navigate(`/e/${resolvedEventSlug}/activities`)}
            onEditAnswers={player.editAnswers}
          />

          {player.pendingReviewScore > 0 ? (
            <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-black text-blue-900">
                Certaines contributions nécessitent une validation
              </div>
              <div className="mt-1 text-sm font-medium leading-6 text-blue-800">
                Les photos ou contenus soumis à relecture pourront être examinés
                ultérieurement.
              </div>
            </div>
          ) : null}
        </main>
      </div>
    );
  }

  if (!player.hasStarted) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-28 pt-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-2xl font-black text-slate-900">
              {activity.title}
            </div>

            {activity.description ? (
              <div className="mt-2 text-sm font-bold text-slate-700">
                {activity.description}
              </div>
            ) : null}

            <div className="mt-5 rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-white text-indigo-700">
                  <MessageCircleHeart size={18} />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900">
                    Ce n’est pas un quiz
                  </div>
                  <div className="mt-1 text-sm font-medium leading-6 text-slate-700">
                    Il n’y a pas de bonnes ou mauvaises réponses. Tu peux répondre
                    librement, même si tu n’es pas sûr de tout.
                  </div>
                </div>
              </div>
            </div>

            {activity.introMarkdown ? (
              <div className="mt-5 text-[15px] font-medium leading-6 text-slate-800">
                <SimpleFormattedText text={activity.introMarkdown} />
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
                className="h-12 w-full rounded-2xl bg-[color:var(--blue)] font-black text-white transition"
              >
                Commencer la collecte
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!player.currentQuestion || !player.currentSection) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-10 pt-6">
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
            <div className="font-black text-rose-900">
              Aucune question disponible.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-32 pt-4">
        <CollectTopBar
          title={activity.title}
          sectionTitle={player.currentSection.title}
          currentIndex={player.currentIndex}
          totalQuestions={player.totalQuestions}
          pendingReviewPoints={pendingReviewPoints}
        />

        <div className="mt-3">
          <button
            type="button"
            onClick={player.goBack}
            disabled={player.currentIndex === 0 || player.isSubmitting}
            className={[
              "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-black transition",
              player.currentIndex === 0 || player.isSubmitting
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            ].join(" ")}
          >
            <ArrowLeft size={14} />
            Étape précédente
          </button>
        </div>

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
                  {player.isSubmitting ? player.submittingLabel : nextStepLabel}
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
                    Passer cette question
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