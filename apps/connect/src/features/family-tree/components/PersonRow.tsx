import { ArrowRight, Baby, Users } from "lucide-react";
import type { TreePersonListItem } from "../api/getSiblings";

type PersonRowProps = {
  person: TreePersonListItem;
  onClick?: () => void;
  compact?: boolean;
};

export function PersonRow({
  person,
  onClick,
  compact = false,
}: PersonRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-[22px] border border-slate-200 bg-white text-left shadow-sm transition-all active:scale-[0.995] active:shadow-none",
        compact ? "p-3" : "p-4",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
          <Users size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[16px] font-black text-slate-900">
                {person.name}
              </div>

              {person.generation ? (
                <div className="mt-1 text-xs font-bold text-slate-600">
                  {person.generation}
                </div>
              ) : null}
            </div>

            <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
              <ArrowRight size={18} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {typeof person.siblingCount === "number" ? (
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
                <Users size={12} />
                fratrie de {person.siblingCount}
              </div>
            ) : null}

            {typeof person.childrenCount === "number" ? (
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
                <Baby size={12} />
                {person.childrenCount} enfant
                {person.childrenCount > 1 ? "s" : ""}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}