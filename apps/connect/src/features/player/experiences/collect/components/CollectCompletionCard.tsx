type CollectCompletionCardProps = {
  title: string;
  onBackToHub: () => void;
  onEditAnswers?: () => void;
};

export function CollectCompletionCard({
  title,
  onBackToHub,
  onEditAnswers,
}: CollectCompletionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-2xl font-black text-slate-900">
        Tes réponses ont bien été enregistrées
      </div>

      <div className="mt-2 text-sm font-bold text-slate-700">
        Ta contribution pour “{title}” est sauvegardée.
      </div>

      <div className="mt-3 text-sm font-medium leading-6 text-slate-700">
        Tu peux revenir dessus à tout moment pour compléter ou modifier tes réponses.
      </div>

      <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-4">
        <div className="text-sm font-bold text-blue-900">
          Tu pourras encore ajuster ta contribution
        </div>
        <div className="mt-1 text-sm font-medium text-blue-800">
          Un souvenir partiel, une date approximative ou un détail ajouté plus tard peut aussi être utile.
        </div>
      </div>

      <div className="mt-6 grid gap-2">
        {onEditAnswers ? (
          <button
            type="button"
            onClick={onEditAnswers}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-5 font-black text-slate-800"
          >
            Modifier mes réponses
          </button>
        ) : null}

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