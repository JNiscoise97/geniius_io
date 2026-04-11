type LearnTopBarProps = {
  title: string;
  sectionTitle?: string;
  currentIndex: number;
  totalQuestions: number;
  score?: number;
  showScore?: boolean;
  remainingQuestionPoints?: number;
  pendingReviewPoints?: number;
  maxAttempts?: number;
  attemptsUsed?: number;
};

export function LearnTopBar({
  title,
  sectionTitle,
  currentIndex,
  totalQuestions,
  score,
  showScore = true,
  remainingQuestionPoints,
  pendingReviewPoints,
  maxAttempts,
  attemptsUsed = 0,
}: LearnTopBarProps) {
  const progress =
    totalQuestions > 0
      ? Math.round((currentIndex / totalQuestions) * 100)
      : 0;

  const showAttemptsBadge = maxAttempts !== undefined && maxAttempts > 1;

  const currentAttempt =
    showAttemptsBadge ? Math.min(attemptsUsed + 1, maxAttempts) : null;

  const attemptsLeft =
    showAttemptsBadge ? Math.max(maxAttempts - attemptsUsed, 0) : undefined;

  const isLastAttempt = showAttemptsBadge && attemptsLeft === 1;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-lg font-black text-slate-900">{title}</div>

      {sectionTitle ? (
        <div className="mt-1 text-sm font-bold text-slate-700">
          <span className="text-slate-500">Section</span>{" "}
          <span className="text-slate-900">{sectionTitle}</span>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-end gap-3 text-xs font-extrabold text-slate-700">
        <div className="flex items-center gap-2">
          {remainingQuestionPoints !== undefined ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
              +{remainingQuestionPoints} pts
            </span>
          ) : null}

          {pendingReviewPoints !== undefined ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
              +{pendingReviewPoints} pts possibles (après validation)
            </span>
          ) : null}

          {showAttemptsBadge && currentAttempt !== null ? (
            <span
              className={[
                "rounded-full px-2.5 py-1 text-[11px] font-black",
                isLastAttempt
                  ? "bg-rose-50 text-rose-700"
                  : "bg-amber-50 text-amber-700",
              ].join(" ")}
            >
              Tentative {currentAttempt} / {maxAttempts}
            </span>
          ) : null}

          {showScore && score !== undefined ? (
            <span className="text-slate-500">
              Score <span className="text-slate-900">{score}</span>
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-extrabold text-slate-700">
          <span>
            Question {Math.min(currentIndex + 1, totalQuestions)}/{totalQuestions}
          </span>
        </div>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div
          className="h-full bg-[color:var(--blue)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}