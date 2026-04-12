import { CheckCircle2, MapPin, User } from "lucide-react";
import type { RelationshipStory } from "../../domain/story/buildRelationshipStory";
import {
  formatLifePath,
  formatPersonName,
  formatYears,
} from "../../domain/graph/genealogyUi";

type RelationshipStoryTvSummaryViewProps = {
  story: RelationshipStory;
  heroClassName: string;
  currentIndex?: number;
  onSelectStep?: (index: number) => void;
};

export function RelationshipStoryTvSummaryView({
  story,
  heroClassName,
  currentIndex,
  onSelectStep,
}: RelationshipStoryTvSummaryViewProps) {
  return (
    <section className="space-y-6">
      <div
        className={[
          "rounded-[32px] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)]",
          heroClassName,
        ].join(" ")}
      >
        <div className="text-[13px] font-black uppercase tracking-[0.18em] text-white/70">
          Synthèse
        </div>

        <div className="mt-3 text-[38px] font-black leading-[0.96] tracking-tight">
          De {formatPersonName(story.source)} à {formatPersonName(story.target)}
        </div>

        <div className="mt-5 rounded-[22px] bg-white/10 px-4 py-4 text-lg font-bold leading-8 text-white/90">
          {story.summaryLine}
        </div>
      </div>

      <div className="space-y-4">
        {story.steps.map((step, index) => {
          const years = formatYears(step.person);
          const lifePath = formatLifePath(step.person);
          const isClickable = typeof onSelectStep === "function";
          const isActive = currentIndex === index;

          function handleSelectStep() {
            if (!onSelectStep) return;
            onSelectStep(index);
          }

          return (
            <button
              key={step.person.id}
              type="button"
              onClick={isClickable ? handleSelectStep : undefined}
              disabled={!isClickable}
              className={[
                "w-full rounded-[28px] border bg-white p-5 text-left shadow-sm transition",
                isClickable ? "active:scale-[0.99]" : "",
                isActive ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                {step.person.photoSrc ? (
                  <img
                    src={step.person.photoSrc}
                    alt={formatPersonName(step.person)}
                    className="h-20 w-20 shrink-0 rounded-[22px] object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] bg-slate-100 text-slate-600">
                    <User size={28} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Génération {step.generationNumber}
                      </div>
                      <div className="mt-1 text-[24px] font-black text-slate-900">
                        {formatPersonName(step.person)}
                      </div>
                    </div>

                    {isClickable ? (
                      <div className="shrink-0 text-indigo-600">
                        <CheckCircle2 size={22} />
                      </div>
                    ) : null}
                  </div>

                  {years ? (
                    <div className="mt-2 text-base font-bold text-slate-700">
                      {years}
                    </div>
                  ) : null}

                  {lifePath ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-700">
                      <MapPin size={14} />
                      {lifePath}
                    </div>
                  ) : null}

                  <p className="mt-4 text-lg font-bold leading-8 text-slate-700">
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