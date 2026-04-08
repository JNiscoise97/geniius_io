// src/features/family-knowledge/components/RelationshipStoryStepView.tsx

import { ArrowRight, Heart, MapPin, User, Users } from "lucide-react";
import type { RelationshipStoryStep } from "../../domain/story/buildRelationshipStory";
import {
  formatLifePath,
  formatPersonName,
  formatYears,
} from "../../domain/graph/genealogyUi";

type RelationshipStoryStepViewProps = {
  step: RelationshipStoryStep;
  heroClassName: string;
};

function PersonVisual({
  name,
  photoSrc,
  fallbackIcon = <User size={24} />,
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
        className="h-24 w-24 rounded-[22px] object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-[22px] bg-slate-100 text-slate-600">
      {fallbackIcon}
    </div>
  );
}

export function RelationshipStoryStepView({
  step,
  heroClassName,
}: RelationshipStoryStepViewProps) {
  const personName = formatPersonName(step.person);
  const spouseName = step.spouse ? formatPersonName(step.spouse) : null;
  const nextName = step.nextPerson ? formatPersonName(step.nextPerson) : null;

  const years = formatYears(step.person);
  const path = formatLifePath(step.person);

  return (
    <section className="space-y-4">
      <div
        className={[
          "rounded-[26px] p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)]",
          heroClassName,
        ].join(" ")}
      >
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-white/70">
          Génération {step.generationNumber}
        </div>

        <div className="mt-2 flex items-start gap-4">
          <PersonVisual name={personName} photoSrc={step.person.photoSrc} />

          <div className="min-w-0 flex-1">
            <div className="text-[26px] font-black leading-[1.02] tracking-tight">
              {personName}
            </div>

            {years ? (
              <div className="mt-2 text-[13px] font-extrabold text-white/90">
                {years}
              </div>
            ) : null}

            {path ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[11px] font-extrabold text-white/90">
                <MapPin size={12} />
                {path}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {(step.spouse || step.nextPerson) && (
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            La transmission familiale
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="rounded-[20px] bg-slate-50 p-3">
              <div className="text-xs font-bold text-slate-500">Personne</div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {personName}
              </div>
            </div>

            <div className="text-slate-400">
              <ArrowRight size={18} />
            </div>

            <div className="rounded-[20px] bg-indigo-50 p-3">
              <div className="text-xs font-bold text-indigo-700">
                Branche suivie
              </div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {nextName ?? "Fin du chemin"}
              </div>
              {step.nextChildLabel ? (
                <div className="mt-1 text-xs font-bold text-slate-600">
                  {step.nextChildLabel}
                </div>
              ) : null}
            </div>
          </div>

          {spouseName ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
              <Heart size={14} />
              Avec {spouseName}
            </div>
          ) : null}

          {typeof step.childrenCount === "number" ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
              <Users size={14} />
              {step.childrenCount} enfant{step.childrenCount > 1 ? "s" : ""}
            </div>
          ) : null}
        </div>
      )}

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
          Le récit
        </div>

        <p className="mt-3 text-[15px] font-bold leading-7 text-slate-900">
          {step.intro}
        </p>

        {step.facts.length > 0 ? (
          <div className="mt-4 space-y-2">
            {step.facts.map((fact, index) => (
              <div
                key={`${step.person.id}-fact-${index}`}
                className="rounded-[18px] bg-slate-50 px-3 py-3 text-sm font-bold leading-6 text-slate-700"
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