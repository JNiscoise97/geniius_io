import { ArrowRight, Heart, User } from "lucide-react";
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
  onOpenProfile,
}: {
  person: PersonSummary;
  relationshipSummary?: string;
  onCenter: () => void;
  onOpenProfile: () => void;
}) {
  const years = formatYears(person);

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
            <User size={20} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[16px] font-black text-slate-900">
              {person.firstName} {person.lastName}
            </div>
          </div>

          {person.nickname ? (
            <div className="mt-1 text-xs font-bold text-slate-600">
              {person.sex === "F" ? "appelée" : "appelé"} {person.nickname}
            </div>
          ) : null}

          {years ? (
            <div className="mt-1 text-xs font-bold text-slate-700">{years}</div>
          ) : null}

          {relationshipSummary ? (
            <div className="mt-2 inline-flex items-start gap-2 rounded-2xl bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-800">
              <Heart size={12} className="mt-[1px] shrink-0" />
              <span>{relationshipSummary}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onCenter}
          className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
        >
          Afficher dans l’arbre
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900 transition active:scale-[0.99]"
        >
          Voir la fiche
        </button>
      </div>
    </div>
  );
}