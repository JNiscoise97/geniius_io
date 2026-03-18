// src/features/family-knowledge/components/RelationshipStorySummaryView.tsx

import { CheckCircle2, MapPin, User } from "lucide-react";
import type { RelationshipStory } from "../api/buildRelationshipStory";
import {
  formatLifePath,
  formatPersonName,
  formatYears,
} from "../lib/genealogyUi";

type RelationshipStorySummaryViewProps = {
  story: RelationshipStory;
  heroClassName: string;
  onSelectStep: (index: number) => void;
};

export function RelationshipStorySummaryView({
  story,
  heroClassName,
  onSelectStep,
}: RelationshipStorySummaryViewProps) {
  return (
    <section className="space-y-4">
      <div
        className={[
          "rounded-[26px] p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)]",
          heroClassName,
        ].join(" ")}
      >
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-white/70">
          Synthèse
        </div>

        <div className="mt-2 text-[24px] font-black leading-[1.05] tracking-tight">
          De {formatPersonName(story.source)} à {formatPersonName(story.target)}
        </div>

        <div className="mt-3 rounded-[18px] bg-white/10 px-3 py-3 text-sm font-bold leading-6 text-white/90">
          {story.summaryLine}
        </div>
      </div>

      <div className="space-y-3">
        {story.steps.map((step, index) => {
          const years = formatYears(step.person);
          const lifePath = formatLifePath(step.person);

          return (
            <button
              key={step.person.id}
              type="button"
              onClick={() => onSelectStep(index)}
              className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                {step.person.photoSrc ? (
                  <img
                    src={step.person.photoSrc}
                    alt={formatPersonName(step.person)}
                    className="h-14 w-14 shrink-0 rounded-[18px] object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-slate-100 text-slate-600">
                    <User size={22} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        Génération {step.generationNumber}
                      </div>
                      <div className="mt-1 text-[16px] font-black text-slate-900">
                        {formatPersonName(step.person)}
                      </div>
                    </div>

                    <div className="shrink-0 text-indigo-600">
                      <CheckCircle2 size={18} />
                    </div>
                  </div>

                  {years ? (
                    <div className="mt-1 text-xs font-bold text-slate-700">
                      {years}
                    </div>
                  ) : null}

                  {lifePath ? (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[11px] font-extrabold text-slate-700">
                      <MapPin size={12} />
                      {lifePath}
                    </div>
                  ) : null}

                  <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                    {step.intro}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}