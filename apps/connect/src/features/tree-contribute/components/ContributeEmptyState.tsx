// components/tree-contribute/ContributeEmptyState.tsx

import { ArrowRight, Inbox } from "lucide-react";

type ContributeEmptyStateProps = {
  title?: string;
  text: string;
  ctaLabel?: string;
  onClick?: () => void;
};

export function ContributeEmptyState({
  title = "Rien à afficher pour le moment",
  text,
  ctaLabel,
  onClick,
}: ContributeEmptyStateProps) {
  return (
    <section className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-white p-3 text-slate-700 border border-slate-200">
          <Inbox size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-black text-slate-900">{title}</div>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            {text}
          </p>

          {ctaLabel && onClick ? (
            <button
              type="button"
              onClick={onClick}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 border border-slate-200"
            >
              {ctaLabel}
              <ArrowRight size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}