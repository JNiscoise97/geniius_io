import { ArrowRight, Heart, Leaf, User } from "lucide-react";
import type { PersonSummary } from "../types";

function formatYears(person: PersonSummary) {
  const { birthYear, deathYear, isPossiblyAlive } = person;

  if (!birthYear && !deathYear) return null;
  if (birthYear && deathYear) return `${birthYear} - ${deathYear}`;
  if (!isPossiblyAlive) return `${birthYear ?? "?"} - ?`;

  return birthYear ?? "?";
}

export function FamilySearchResultCard({
  person,
  relationshipSummary,
  onCenter,
}: {
  person: PersonSummary;
  relationshipSummary?: string;
  onCenter: () => void;
}) {
  const years = formatYears(person);

  const lowerSubtitle = person.subtitle?.toLowerCase() ?? "";
  const isSpouse =
    lowerSubtitle.includes("conjoint") ||
    lowerSubtitle.includes("conjointe") ||
    lowerSubtitle.includes("époux") ||
    lowerSubtitle.includes("épouse");

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {person.photoSrc ? (
          <img
            src={person.photoSrc}
            alt={`${person.firstName} ${person.lastName}`}
            className="h-12 w-12 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            {isSpouse ? <Heart size={20} /> : <User size={20} />}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onCenter}
            className="w-full text-left"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[16px] font-black text-slate-900">
                {person.firstName} {person.lastName}
              </div>

              {person.isSosa ? (
                <span className="inline-flex items-center rounded-full px-1 py-1 text-emerald-900">
                  <Leaf size={14} className="fill-emerald-700" />
                </span>
              ) : null}
            </div>

            {person.nickname ? (
              <div className="mt-1 text-xs font-bold text-slate-600">
                {person.sex === "F" ? "appelée" : "appelé"} {person.nickname}
              </div>
            ) : null}

            {isSpouse && person.spouseRoleLabel ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">
                  {person.spouseRoleLabel}
                </span>
              </div>
            ) : null}

            {!isSpouse && person.linkedSpouseLabel ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">
                  {person.linkedSpouseLabel}
                </span>
              </div>
            ) : null}

            {years ? (
              <p className="mt-1 text-xs font-bold text-slate-700">{years}</p>
            ) : null}

            {relationshipSummary ? (
              <div className="mt-2 inline-flex items-start gap-2 rounded-2xl bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-800">
                <Heart size={12} className="mt-[1px] shrink-0" />
                <span>{relationshipSummary}</span>
              </div>
            ) : null}
          </button>
        </div>

        <button
          type="button"
          onClick={onCenter}
          className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900 transition active:scale-[0.99]"
          aria-label="Ouvrir dans l'exporeur"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}