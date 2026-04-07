// src/features/player/experiences/learn/components/LearnCompletionCard.tsx

type LearnCompletionCardProps = {
  title: string;
  score?: number;
  pendingReviewScore?: number;
  totalQuestions: number;
  onRestart: () => void;
  showScore?: boolean;
  mode?: "learn" | "collect";
};

export function LearnCompletionCard({
  title,
  score,
  pendingReviewScore = 0,
  totalQuestions,
  onRestart,
  showScore = true,
  mode = "learn",
}: LearnCompletionCardProps) {
  const isCollect = mode === "collect";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-2xl font-black text-slate-900">
        {isCollect ? "Merci pour ta contribution 🙌" : "Activité terminée 🎉"}
      </div>

      <div className="mt-2 text-sm font-bold text-slate-700">
        {isCollect ? "Tes réponses ont bien été enregistrées." : title}
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
              <div className="text-sm font-bold text-blue-700">
                Ils seront ajoutés après modération.
              </div>
            </div>
          ) : null}
        </div>
      ) : showScore && score !== undefined ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-700">Résultat</div>
          <div className="mt-2 text-3xl font-black text-slate-900">
            {score}
          </div>
          <div className="text-sm font-bold text-slate-600">
            points • {totalQuestions} questions
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-700">
            Activité complétée • {totalQuestions} questions
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={onRestart}
          className="h-12 rounded-2xl bg-[color:var(--blue)] px-5 font-black text-white"
        >
          {isCollect ? "Recommencer le formulaire" : "Recommencer"}
        </button>
      </div>
    </div>
  );
}