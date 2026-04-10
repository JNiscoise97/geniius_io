type CollectTopBarProps = {
  title: string;
  sectionTitle?: string;
  currentIndex: number;
  totalQuestions: number;
  pendingReviewPoints?: number;
};

export function CollectTopBar({
  title,
  sectionTitle,
  currentIndex,
  totalQuestions,
  pendingReviewPoints,
}: CollectTopBarProps) {
  const progress =
    totalQuestions > 0
      ? Math.round((currentIndex / totalQuestions) * 100)
      : 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-lg font-black text-slate-900">{title}</div>

      {sectionTitle ? (
        <div className="mt-1 text-sm font-bold text-slate-700">
          <span className="text-slate-500">Section</span>{" "}
          <span className="text-slate-900">{sectionTitle}</span>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-extrabold text-slate-700">
        <span>
          Étape {Math.min(currentIndex + 1, totalQuestions)}/{totalQuestions}
        </span>

        <div className="flex items-center gap-2">
          {pendingReviewPoints !== undefined ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
              Validation ultérieure possible
            </span>
          ) : null}
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