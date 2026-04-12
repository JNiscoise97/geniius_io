import { ArrowRight, Heart, MapPin, User, Users } from "lucide-react";
import type { RelationshipStoryStep } from "../../domain/story/buildRelationshipStory";
import {
  formatLifePath,
  formatPersonName,
  formatYears,
} from "../../domain/graph/genealogyUi";

type RelationshipStoryTvStepViewProps = {
  step: RelationshipStoryStep;
  heroClassName: string;
};

function PersonVisual({
  name,
  photoSrc,
  fallbackIcon = <User size={32} />,
}: {
  name: string;
  photoSrc?: string;
  fallbackIcon?: React.ReactNode;
}) {
  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt={name}
        className="h-32 w-32 rounded-[26px] object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-32 w-32 items-center justify-center rounded-[26px] bg-slate-100 text-slate-600">
      {fallbackIcon}
    </div>
  );
}

export function RelationshipStoryTvStepView({
  step,
  heroClassName,
}: RelationshipStoryTvStepViewProps) {
  const personName = formatPersonName(step.person);
  const spouseName = step.spouse ? formatPersonName(step.spouse) : null;
  const nextName = step.nextPerson ? formatPersonName(step.nextPerson) : null;

  const years = formatYears(step.person);
  const path = formatLifePath(step.person);

  return (
    <section className="space-y-6">
      <div
        className={[
          "rounded-[32px] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)]",
          heroClassName,
        ].join(" ")}
      >
        <div className="text-[13px] font-black uppercase tracking-[0.18em] text-white/70">
          Génération {step.generationNumber}
        </div>

        <div className="mt-4 flex items-start gap-5">
          <PersonVisual name={personName} photoSrc={step.person.photoSrc} />

          <div className="min-w-0 flex-1">
            <div className="text-[42px] font-black leading-[0.95] tracking-tight">
              {personName}
            </div>

            {years ? (
              <div className="mt-3 text-[20px] font-extrabold text-white/90">
                {years}
              </div>
            ) : null}

            {path ? (
              <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-3 text-base font-extrabold text-white/90">
                <MapPin size={16} />
                {path}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {(step.spouse || step.nextPerson) && (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">
            La transmission familiale
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="rounded-[22px] bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">Personne</div>
              <div className="mt-2 text-[22px] font-black text-slate-900">
                {personName}
              </div>
            </div>

            <div className="text-slate-400">
              <ArrowRight size={24} />
            </div>

            <div className="rounded-[22px] bg-indigo-50 p-4">
              <div className="text-sm font-bold text-indigo-700">
                Branche suivie
              </div>
              <div className="mt-2 text-[22px] font-black text-slate-900">
                {nextName ?? "Fin du chemin"}
              </div>
              {step.nextChildLabel ? (
                <div className="mt-2 text-sm font-bold text-slate-600">
                  {step.nextChildLabel}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {spouseName ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
                <Heart size={16} />
                Avec {spouseName}
              </div>
            ) : null}

            {typeof step.childrenCount === "number" ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
                <Users size={16} />
                {step.childrenCount} enfant{step.childrenCount > 1 ? "s" : ""}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">
          Le récit
        </div>

        <p className="mt-4 text-[24px] font-bold leading-10 text-slate-900">
          {step.intro}
        </p>

        {step.facts.length > 0 ? (
          <div className="mt-5 space-y-3">
            {step.facts.map((fact, index) => (
              <div
                key={`${step.person.id}-fact-${index}`}
                className="rounded-[20px] bg-slate-50 px-4 py-4 text-lg font-bold leading-8 text-slate-700"
              >
                {fact}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}