import { ArrowRight, Baby, House, Users } from "lucide-react";
import type { TreeFamilySummary } from "../api/getFamilies";

type FamilyCardProps = {
  family: TreeFamilySummary;
  onClick?: () => void;
};

export function FamilyCard({ family, onClick }: FamilyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.995] active:shadow-none"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
          <House size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[17px] font-black text-slate-900">
                {family.label}
              </div>

              <div className="mt-1 text-xs font-bold text-slate-600">
                {family.parentsLabel}
              </div>
            </div>

            <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
              <ArrowRight size={18} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Baby size={15} />
                <span className="text-[11px] font-black uppercase tracking-wide">
                  Enfants
                </span>
              </div>
              <div className="mt-1 text-base font-black text-slate-900">
                {family.childrenCount}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Users size={15} />
                <span className="text-[11px] font-black uppercase tracking-wide">
                  Descendants
                </span>
              </div>
              <div className="mt-1 text-base font-black text-slate-900">
                {family.descendantsCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}