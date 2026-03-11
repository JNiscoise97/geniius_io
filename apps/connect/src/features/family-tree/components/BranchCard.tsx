import { ArrowRight, GitBranch, House, Users } from "lucide-react";
import type { TreeBranchSummary } from "../api/getBranches";

type BranchCardProps = {
  branch: TreeBranchSummary;
  onClick?: () => void;
};

export function BranchCard({ branch, onClick }: BranchCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.995] active:shadow-none"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
          <GitBranch size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[17px] font-black text-slate-900">
                Branche {branch.name}
              </div>

              {branch.rootPersonName ? (
                <div className="mt-1 text-xs font-bold text-slate-600">
                  Descendance de {branch.rootPersonName}
                </div>
              ) : null}
            </div>

            <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
              <ArrowRight size={18} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Users size={15} />
                <span className="text-[11px] font-black uppercase tracking-wide">
                  Personnes
                </span>
              </div>
              <div className="mt-1 text-base font-black text-slate-900">
                {branch.peopleCount}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-slate-700">
                <House size={15} />
                <span className="text-[11px] font-black uppercase tracking-wide">
                  Foyers
                </span>
              </div>
              <div className="mt-1 text-base font-black text-slate-900">
                {branch.familiesCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}