// components/tree-contribute/ContributeGroupHeader.tsx

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Users } from "lucide-react";

type ContributeGroupHeaderProps = {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  progressLabel?: string;
  onBack?: () => void;
};

export function ContributeGroupHeader({
  title,
  subtitle,
  icon: Icon = Users,
  progressLabel,
  onBack,
}: ContributeGroupHeaderProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
          <Icon size={14} />
          Contribution à l’arbre
        </div>

        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft size={14} />
              Retour
            </span>
          </button>
        ) : null}
      </div>

      <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
        {title}
      </h1>

      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
        {subtitle}
      </p>

      {progressLabel ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[12px] font-black text-emerald-700">
          <CheckCircle2 size={15} />
          {progressLabel}
        </div>
      ) : null}
    </section>
  );
}