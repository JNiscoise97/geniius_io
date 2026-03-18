// src/features/family-knowledge/components/RelationshipStoryProgress.tsx

type RelationshipStoryProgressProps = {
  currentIndex: number;
  total: number;
};

export function RelationshipStoryProgress({
  currentIndex,
  total,
}: RelationshipStoryProgressProps) {
  const current = Math.min(currentIndex + 1, total);
  const width = total > 0 ? `${(current / total) * 100}%` : "0%";

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
          Étape {current} sur {total}
        </div>
        <div className="text-xs font-black text-slate-700">
          Génération {currentIndex + 1}
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[color:var(--blue)] transition-all"
          style={{ width }}
        />
      </div>
    </div>
  );
}