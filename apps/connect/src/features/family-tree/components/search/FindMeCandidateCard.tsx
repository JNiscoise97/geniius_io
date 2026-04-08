import { ArrowRight, Heart, MapPin } from "lucide-react";
import { useMemo } from "react";
import { getPersonHeroConfig } from "../../config/configGenealogy";
import { PersonSpotlightCard } from "../shared/person/PersonSpotlightCard";
import type { FindMeCandidate } from "../../types/findMe";

function joinNames(values: Array<{ firstName: string; lastName: string }>) {
  return values.map((p) => `${p.firstName} ${p.lastName}`.trim()).join(" · ");
}

export function FindMeCandidateCard({
  candidate,
  onOpenInTree,
}: {
  candidate: FindMeCandidate;
  onOpenInTree: (personId: string) => void;
}) {
  const { person, context, reasons, score, confidenceLabel } = candidate;
  const heroConfig = useMemo(() => getPersonHeroConfig(person.id), [person.id]);

  const positiveReasons = reasons.filter((reason) => reason.matched);
  const parentsText = joinNames(context.parents);
  const grandparentsText = joinNames(context.grandparents.slice(0, 4));

  return (
    <PersonSpotlightCard
      person={person}
      heroClassName={heroConfig.heroClassName}
      topBadges={
        <>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold">
            Score {score}
          </span>
          <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] font-extrabold">
            Match {confidenceLabel}
          </span>
        </>
      }
      meta={
        person.birthPlace ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[11px] font-extrabold text-white/90">
            <MapPin size={12} />
            {person.birthPlace}
          </div>
        ) : null
      }
      details={
        <div className="space-y-3">
          {parentsText ? (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Parents
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900">{parentsText}</div>
            </div>
          ) : null}

          {grandparentsText ? (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Grands-parents
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900">
                {grandparentsText}
              </div>
            </div>
          ) : null}

          {positiveReasons.length > 0 ? (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Points de rapprochement
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {positiveReasons.map((reason) => (
                  <span
                    key={reason.label}
                    className="rounded-full bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-700"
                  >
                    {reason.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenInTree(person.id)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
          >
            Je pense être ici
            <ArrowRight size={16} />
          </button>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
            <Heart size={16} />
            Vérification humaine
          </div>
        </div>
      }
    />
  );
}