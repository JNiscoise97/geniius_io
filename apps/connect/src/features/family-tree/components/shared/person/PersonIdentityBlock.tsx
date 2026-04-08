import { Heart, Leaf, User } from "lucide-react";
import type { ReactNode } from "react";
import type { PersonSummary } from "../../../types/person";

function formatYears(person: PersonSummary) {
  const { birthYear, deathYear, isPossiblyAlive } = person;

  if (!birthYear && !deathYear) return null;
  if (birthYear && deathYear) return `${birthYear} - ${deathYear}`;
  if (!isPossiblyAlive) return `${birthYear ?? "?"} - ?`;

  return birthYear ?? "?";
}

function isSpousePerson(person: PersonSummary) {
  const lowerSubtitle = person.subtitle?.toLowerCase() ?? "";

  return (
    lowerSubtitle.includes("conjoint") ||
    lowerSubtitle.includes("conjointe") ||
    lowerSubtitle.includes("époux") ||
    lowerSubtitle.includes("épouse")
  );
}

export type PersonIdentityBlockProps = {
  person: PersonSummary;
  rightSlot?: ReactNode;
  relationshipSummary?: string;
  showSubtitleBadge?: boolean;
  showRelationshipSummary?: boolean;
  showSosaBadge?: boolean;
  imageClassName?: string;
  nameClassName?: string;
  yearsClassName?: string;
  nicknameClassName?: string;
};

export function PersonIdentityBlock({
  person,
  rightSlot,
  relationshipSummary,
  showSubtitleBadge = true,
  showRelationshipSummary = false,
  showSosaBadge = true,
  imageClassName = "h-12 w-12 rounded-2xl",
  nameClassName = "text-[16px] font-black text-slate-900",
  yearsClassName = "mt-1 text-xs font-bold text-slate-700",
  nicknameClassName = "mt-1 text-xs font-bold text-slate-600",
}: PersonIdentityBlockProps) {
  const years = formatYears(person);
  const isSpouse = isSpousePerson(person);
  const displayName = `${person.firstName} ${person.lastName}`.trim();

  return (
    <div className="flex items-start gap-3">
      {person.photoSrc ? (
        <img
          src={person.photoSrc}
          alt={displayName}
          className={`${imageClassName} shrink-0 object-cover`}
        />
      ) : (
        <div
          className={`flex shrink-0 items-center justify-center bg-indigo-50 text-indigo-700 ${imageClassName}`}
        >
          {isSpouse ? <Heart size={20} /> : <User size={20} />}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className={nameClassName}>{displayName}</div>

          {showSosaBadge && person.isSosa ? (
            <span className="inline-flex items-center rounded-full px-1 py-1 text-emerald-900">
              <Leaf size={14} className="fill-emerald-700" />
            </span>
          ) : null}

          {showSubtitleBadge && person.subtitle ? (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
              {person.subtitle}
            </span>
          ) : null}
        </div>

        {person.nickname ? (
          <div className={nicknameClassName}>
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

        {years ? <p className={yearsClassName}>{years}</p> : null}

        {showRelationshipSummary && relationshipSummary ? (
          <div className="mt-2 inline-flex items-start gap-2 rounded-2xl bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-800">
            <Heart size={12} className="mt-[1px] shrink-0" />
            <span>{relationshipSummary}</span>
          </div>
        ) : null}
      </div>

      {rightSlot}
    </div>
  );
}