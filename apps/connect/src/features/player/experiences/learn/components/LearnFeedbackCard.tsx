// src/features/player/experiences/learn/components/LearnFeedbackCard.tsx

import {
  ArrowRight,
  CheckCircle2,
  Info,
  RotateCcw,
  SkipForward,
  XCircle,
} from "lucide-react";
import type { LearnQuestionResult } from "../hooks/useLearnActivityPlayer";

type LearnFeedbackCardProps = {
  result: LearnQuestionResult;
  onNext: () => void;
  isLastQuestion: boolean;
  totalScore?: number;
  showScore?: boolean;
  showExplanation?: boolean;
  showExpectedAnswer?: boolean;
};

export function LearnFeedbackCard({
  result,
  onNext,
  isLastQuestion,
  totalScore,
  showScore = true,
  showExplanation = true,
  showExpectedAnswer = true,
}: LearnFeedbackCardProps) {
  const isSkipped = result.isSkipped === true;
  const isSuccess = result.isCorrect === true;
  const isFailure = result.isCorrect === false;
  const isRetry = result.retryAllowed === true;
  const isManualReview = result.isManualReview === true;

  const isNeutralSubmission =
    result.isCorrect === null &&
    !isSkipped &&
    !isManualReview &&
    !isRetry;

  const tone = isSuccess
    ? {
        cardBorder: "border-emerald-200",
        iconWrap: "border-emerald-200 bg-emerald-50",
        icon: "text-emerald-700",
        title: "text-emerald-700",
        delta: "text-emerald-700",
        infoCard: "border-slate-200 bg-slate-50",
      }
    : isManualReview
      ? {
          cardBorder: "border-blue-200",
          iconWrap: "border-blue-200 bg-blue-50",
          icon: "text-blue-700",
          title: "text-blue-700",
          delta: "text-blue-700",
          infoCard: "border-blue-200 bg-blue-50",
        }
      : isRetry
        ? {
            cardBorder: "border-amber-200",
            iconWrap: "border-amber-200 bg-amber-50",
            icon: "text-amber-700",
            title: "text-amber-700",
            delta: "text-amber-700",
            infoCard: "border-amber-200 bg-amber-50",
          }
        : isSkipped
          ? {
              cardBorder: "border-slate-200",
              iconWrap: "border-slate-200 bg-slate-50",
              icon: "text-slate-700",
              title: "text-slate-700",
              delta: "text-slate-700",
              infoCard: "border-slate-200 bg-slate-50",
            }
          : isNeutralSubmission
            ? {
                cardBorder: "border-blue-200",
                iconWrap: "border-blue-200 bg-blue-50",
                icon: "text-blue-700",
                title: "text-blue-700",
                delta: "text-blue-700",
                infoCard: "border-blue-200 bg-blue-50",
              }
            : {
                cardBorder: "border-rose-200",
                iconWrap: "border-rose-200 bg-rose-50",
                icon: "text-rose-700",
                title: "text-rose-700",
                delta: "text-rose-700",
                infoCard: "border-rose-200 bg-rose-50",
              };

  const title = isSkipped
    ? "Question passée"
    : isManualReview
      ? "Réponse enregistrée"
      : isNeutralSubmission
        ? result.submittedTitle || "Information lue"
        : isSuccess
          ? "Bonne réponse"
          : isRetry
            ? "Tu peux réessayer"
            : isFailure
              ? "Réponse incorrecte"
              : "Réponse enregistrée";

  const retrySubtitle =
    typeof result.attemptsLeft === "number"
      ? result.attemptsLeft === 1
        ? "Il te reste 1 essai."
        : `Il te reste ${result.attemptsLeft} essais.`
      : "Tu peux réessayer.";

  const subtitle = isSkipped
    ? "Tu pourras passer à la suivante."
    : isRetry
      ? retrySubtitle
      : isManualReview
        ? "Ta réponse a bien été envoyée. Les points seront attribués après modération."
        : isNeutralSubmission
          ? "Merci, on passe à la suite."
          : isSuccess
            ? "Bien joué."
            : isFailure
              ? "On t’explique."
              : "Merci, on passe à la suite.";

  const ctaLabel = isRetry
    ? "Réessayer"
    : isLastQuestion
      ? "Terminer"
      : "Question suivante";

  const Icon = isSkipped
    ? SkipForward
    : isManualReview
      ? Info
      : isNeutralSubmission
        ? Info
        : isSuccess
          ? CheckCircle2
          : isRetry
            ? RotateCcw
            : XCircle;

  const canShowExpectedAnswer =
    showExpectedAnswer && isFailure && Boolean(result.expectedAnswerLabel);

  const canShowExplanation = showExplanation && Boolean(result.explanation);

  const showInfoCard =
    !isRetry &&
    !isSkipped &&
    (canShowExplanation || canShowExpectedAnswer);

  const showDelta =
    showScore &&
    !isRetry &&
    !isSkipped &&
    !isManualReview &&
    !isNeutralSubmission &&
    result.isCorrect !== null &&
    result.scoreDelta !== 0;

  const deltaPrefix = result.scoreDelta > 0 ? "+" : "";

  const basePoints = isSuccess ? result.scoreDelta : undefined;
  const totalPenaltyApplied =
    isSuccess &&
    result.cumulativeScoreDelta !== undefined &&
    basePoints !== undefined
      ? Math.max(0, basePoints - result.cumulativeScoreDelta)
      : 0;

  const showSuccessBreakdown =
    showScore &&
    isSuccess &&
    basePoints !== undefined &&
    totalPenaltyApplied > 0 &&
    typeof result.attemptsUsed === "number" &&
    result.attemptsUsed > 1;

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      <div className="flex min-h-full flex-col justify-center px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="mx-auto w-full max-w-[520px]">
          <div
            className={[
              "overflow-hidden rounded-[30px] border-2 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.10)]",
              tone.cardBorder,
            ].join(" ")}
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "mt-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2",
                    tone.iconWrap,
                  ].join(" ")}
                >
                  <Icon size={30} className={tone.icon} />
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={[
                      "text-2xl font-black tracking-tight",
                      tone.title,
                    ].join(" ")}
                  >
                    {title}
                  </div>

                  <div className="mt-1 text-sm font-bold text-slate-700">
                    {subtitle}
                  </div>

                  {isRetry &&
                  result.appliedPenalty &&
                  result.appliedPenalty > 0 ? (
                    <div className="mt-3 text-lg font-black text-amber-700">
                      -{result.appliedPenalty} point
                      {result.appliedPenalty > 1 ? "s" : ""}
                    </div>
                  ) : null}

                  {showDelta ? (
                    <div className="mt-4">
                      <div
                        className={[
                          "text-5xl font-black leading-none motion-safe:animate-[learn-score-pop_420ms_ease-out]",
                          tone.delta,
                        ].join(" ")}
                      >
                        {deltaPrefix}
                        {result.cumulativeScoreDelta ?? result.scoreDelta}
                      </div>

                      {showSuccessBreakdown ? (
                        <div className="mt-2 text-sm font-bold text-slate-600">
                          {basePoints} points au départ • -{totalPenaltyApplied} de
                          pénalités • {result.attemptsUsed} tentatives
                        </div>
                      ) : null}

                      {showScore && totalScore !== undefined ? (
                        <div className="mt-2 text-sm font-bold text-slate-500">
                          Score total : {totalScore}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {showInfoCard ? (
                <div
                  className={[
                    "mt-5 rounded-3xl border p-4",
                    isFailure || isManualReview || isNeutralSubmission
                      ? tone.infoCard
                      : "border-slate-200 bg-slate-50",
                  ].join(" ")}
                >
                  {canShowExpectedAnswer ? (
                    <>
                      <div className="text-xs font-black uppercase tracking-wide text-slate-600">
                        Bonne réponse attendue
                      </div>
                      <div className="mt-2 text-base font-black text-slate-900">
                        {result.expectedAnswerLabel}
                      </div>
                    </>
                  ) : null}

                  {canShowExplanation ? (
                    <div
                      className={[
                        "whitespace-pre-wrap text-[15px] leading-6 font-medium text-slate-800",
                        canShowExpectedAnswer ? "mt-4" : "",
                      ].join(" ")}
                    >
                      {result.explanation}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)]">
            <button
              type="button"
              onClick={onNext}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--blue)] px-5 text-base font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.24)] transition hover:translate-y-[-1px] active:translate-y-[1px]"
            >
              {ctaLabel}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes learn-score-pop {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          60% {
            opacity: 1;
            transform: translateY(-2px) scale(1.04);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}