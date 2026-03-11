import { ArrowRight, Users } from "lucide-react";
import type { TreeId, TreePersonSummary } from "../api/getPerson";

type PersonRelationsCardProps = {
  title: string;
  people: TreePersonSummary[];
  emptyLabel?: string;
  onPersonClick?: (personId: TreeId) => void;
};

export function PersonRelationsCard({
  title,
  people,
  emptyLabel = "Aucune information disponible.",
  onPersonClick,
}: PersonRelationsCardProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[15px] font-black text-slate-900">{title}</div>

      {people.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-600">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {people.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => onPersonClick?.(person.id)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition-all active:scale-[0.995] active:shadow-none"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-slate-100 p-2.5 text-slate-900">
                  <Users size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-slate-900">
                        {person.name}
                      </div>
                      {person.generation ? (
                        <div className="mt-1 text-[11px] font-bold text-slate-600">
                          {person.generation}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 rounded-xl bg-slate-100 p-2 text-slate-900">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}