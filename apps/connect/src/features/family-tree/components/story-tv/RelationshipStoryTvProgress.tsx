type RelationshipStoryTvProgressProps = {
  currentIndex: number;
  total: number;
};

export function RelationshipStoryTvProgress({
  currentIndex,
  total,
}: RelationshipStoryTvProgressProps) {
  const current = Math.min(currentIndex + 1, total);
  const width = total > 0 ? `${(current / total) * 100}%` : "0%";

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">
          Étape {current} sur {total}
        </div>
        <div className="text-lg font-black text-slate-800">
          Génération {currentIndex + 1}
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[color:var(--blue)] transition-all"
          style={{ width }}
        />
      </div>
    </div>
  );
}