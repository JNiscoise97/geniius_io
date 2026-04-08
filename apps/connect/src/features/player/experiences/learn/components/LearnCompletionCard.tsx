import {
  CheckCircle2,
  Clock3,
  Info,
  MinusCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { SimpleFormattedText } from "../../../../../lib/content/useSimpleFormattedText";
import type { QuestionSummaryStatus } from "../../../core/activity/utils/getQuestionStatus";

type CompletionQuestionSummary = {
  id: string;
  prompt: string;
  type: string;
  scoreDelta?: number;
  maxPoints?: number;
  isInfo?: boolean;
  infoContent?: string;
  status?: QuestionSummaryStatus;
  attemptsUsed?: number;
};

type LearnCompletionCardProps = {
  title: string;
  score?: number;
  pendingReviewScore?: number;
  totalQuestions: number;
  onBackToHub: () => void;
  showScore?: boolean;
  mode?: "learn" | "collect";
  maxScore?: number;
  questionSummaries?: CompletionQuestionSummary[];
};

function getDisplayedPoints(scoreDelta?: number): number {
  return typeof scoreDelta === "number" ? scoreDelta : 0;
}

function getSummaryIcon(status?: CompletionQuestionSummary["status"]) {
  switch (status) {
    case "correct":
      return <CheckCircle2 size={18} className="text-emerald-600" />;
    case "correct_after_retry":
      return <RotateCcw size={18} className="text-amber-600" />;
    case "incorrect":
      return <XCircle size={18} className="text-rose-600" />;
    case "skipped":
      return <MinusCircle size={18} className="text-slate-400" />;
    case "pending":
      return <Clock3 size={18} className="text-blue-600" />;
    case "info":
      return <Info size={18} className="text-indigo-600" />;
    case "submitted":
    default:
      return <Clock3 size={18} className="text-slate-500" />;
  }
}

function getStatusLabel(
  status?: CompletionQuestionSummary["status"],
  attemptsUsed = 0
) {
  switch (status) {
    case "correct":
      return "Bonne réponse";
    case "correct_after_retry":
      return attemptsUsed > 1
        ? `Bonne réponse après ${attemptsUsed} tentatives`
        : "Bonne réponse";
    case "incorrect":
      return "Réponse incorrecte";
    case "skipped":
      return "Question passée";
    case "pending":
      return "En attente de validation";
    case "info":
      return "Information";
    case "submitted":
    default:
      return "Réponse enregistrée";
  }
}

function getStatusTextClass(status?: CompletionQuestionSummary["status"]) {
  switch (status) {
    case "correct":
      return "text-emerald-700";
    case "correct_after_retry":
      return "text-amber-700";
    case "incorrect":
      return "text-rose-700";
    case "pending":
      return "text-blue-700";
    case "info":
      return "text-indigo-700";
    case "skipped":
    case "submitted":
    default:
      return "text-slate-500";
  }
}

export function LearnCompletionCard({
  title,
  score,
  pendingReviewScore = 0,
  totalQuestions,
  onBackToHub,
  showScore = true,
  mode = "learn",
  maxScore,
  questionSummaries = [],
}: LearnCompletionCardProps) {
  const isCollect = mode === "collect";

  const infoQuestions = questionSummaries.filter((item) => item.isInfo);
  const scoredQuestions = questionSummaries.filter((item) => !item.isInfo);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-2xl font-black text-slate-900">
        {isCollect ? "Merci pour ta contribution 🙌" : "Activité terminée 🎉"}
      </div>

      <div className="mt-2 text-sm font-bold text-slate-700">
        {isCollect
          ? "Tes réponses ont bien été enregistrées."
          : `Tu as terminé : ${title}`}
      </div>

      {isCollect ? (
        <div className="mt-6 grid gap-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-700">
              Contribution enregistrée
            </div>
            <div className="mt-2 text-sm font-bold text-slate-600">
              {totalQuestions} questions parcourues
            </div>
          </div>

          {showScore && score !== undefined ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-700">
                Points obtenus immédiatement
              </div>
              <div className="mt-2 text-3xl font-black text-slate-900">
                {score}
                {typeof maxScore === "number" ? (
                  <span className="text-xl text-slate-500"> / {maxScore}</span>
                ) : null}
              </div>
            </div>
          ) : null}

          {pendingReviewScore > 0 ? (
            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-bold text-blue-800">
                Points en attente de validation
              </div>
              <div className="mt-2 text-3xl font-black text-blue-900">
                {pendingReviewScore}
              </div>
              <div className="mt-1 text-sm font-bold text-blue-700">
                Ils seront ajoutés après modération.
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {showScore && score !== undefined ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-700">Résultat</div>
              <div className="mt-2 text-3xl font-black text-slate-900">
                {score}
                {typeof maxScore === "number" ? (
                  <span className="text-xl text-slate-500"> / {maxScore}</span>
                ) : null}
              </div>
              <div className="text-sm font-bold text-slate-600">
                points • {totalQuestions} questions
              </div>
            </div>
          ) : null}

          {scoredQuestions.length > 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-700">
                Détail par question
              </div>

              <div className="mt-4 grid gap-3">
                {scoredQuestions.map((item, index) => {
                  const earned = getDisplayedPoints(item.scoreDelta);
                  const max =
                    typeof item.maxPoints === "number"
                      ? item.maxPoints
                      : undefined;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {getSummaryIcon(item.status)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                            Question {index + 1}
                          </div>

                          <div className="mt-1 text-sm font-black text-slate-900">
                            {item.prompt}
                          </div>

                          <div className="mt-2 text-sm font-bold text-slate-700">
                            {max !== undefined ? (
                              <>
                                Points :{" "}
                                <span className="text-slate-900">
                                  {earned} / {max}
                                </span>
                              </>
                            ) : (
                              <>
                                Points :{" "}
                                <span className="text-slate-900">{earned}</span>
                              </>
                            )}
                          </div>

                          <div
                            className={[
                              "mt-1 text-xs font-extrabold",
                              getStatusTextClass(item.status),
                            ].join(" ")}
                          >
                            {getStatusLabel(item.status, item.attemptsUsed ?? 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {infoQuestions.length > 0 ? (
            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-bold text-blue-900">
                Revoir les infos du parcours
              </div>

              <div className="mt-4 grid gap-3">
                {infoQuestions.map((item, index) => (
                  <details
                    key={item.id}
                    className="rounded-2xl border border-blue-200 bg-white p-4"
                  >
                    <summary className="cursor-pointer text-sm font-black text-slate-900">
                      Info {index + 1} — {item.prompt}
                    </summary>

                    {item.infoContent ? (
                      <div className="mt-3 text-sm font-medium leading-6 text-slate-700">
                        <SimpleFormattedText text={item.infoContent} />
                      </div>
                    ) : null}
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={onBackToHub}
          className="h-12 rounded-2xl bg-[color:var(--blue)] px-5 font-black text-white"
        >
          Voir les autres activités
        </button>
      </div>
    </div>
  );
}