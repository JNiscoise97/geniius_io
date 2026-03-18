// src/features/family-knowledge/components/FindMeModeCard.tsx

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function FindMeModeCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:shadow-none"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-black text-slate-900">{title}</div>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
          <ArrowRight size={18} />
        </div>
      </div>
    </button>
  );
}