import { ChevronDown, ChevronRight, Heart, User, ArrowRight, Leaf } from "lucide-react";
import type { FamilyTreeViaAction } from "../../../../lib/analytics/familyTreeViewTracker";
import { formatYears } from "../../domain/graph/genealogyUi";
import type { PersonSummary } from "../../types/person";

export function TreeRelationSection({
  title,
  subtitle,
  persons,
  isOpen,
  headerClassName,
  onToggle,
  emptyLabel,
  onSelect,
  viaAction,
  showCount = true,
}: {
  title: string;
  subtitle: string;
  persons: PersonSummary[];
  isOpen: boolean;
  headerClassName: string;
  onToggle: () => void;
  emptyLabel: string;
  onSelect: (personId: string, viaAction: FamilyTreeViaAction) => void;
  viaAction: FamilyTreeViaAction;
  showCount?: boolean;
}) {
  const count = persons.length;

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full rounded-[26px] p-4 text-left ${headerClassName}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[20px] font-black">
                {title}
                {showCount ? ` (${count})` : ""}
              </div>
            </div>

            <p className="mt-1 text-sm font-bold leading-6 text-white/90">
              {subtitle}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-white/10 p-2 text-white">
            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
        </div>
      </button>

      {isOpen ? (
        persons.length === 0 ? (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 shadow-sm">
            {emptyLabel}
          </div>
        ) : (
          <div className="space-y-3">
            {persons.map((person) => (
              <TreePersonCard
                key={person.id}
                person={person}
                onClick={() => onSelect(person.id, viaAction)}
              />
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}

function TreePersonCard({
  person,
  onClick,
}: {
  person: PersonSummary;
  onClick: () => void;
}) {
  const lowerSubtitle = person.subtitle?.toLowerCase() ?? "";
  const isSpouse =
    lowerSubtitle.includes("conjoint") ||
    lowerSubtitle.includes("conjointe") ||
    lowerSubtitle.includes("époux") ||
    lowerSubtitle.includes("épouse");

  const years = formatYears(person);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:shadow-none"
    >
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[16px] font-black text-slate-900">
              {person.firstName} {person.lastName}
            </div>
            {person.isSosa ? (
              <span className="inline-flex items-center gap-1 rounded-full  px-2 py-1 text-[10px] font-black text-emerald-900">
                <Leaf size={14} className="fill-emerald-700" />
              </span>
            ) : null}

            {person.subtitle ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
                {person.subtitle}
              </span>
            ) : null}
          </div>

          {isSpouse && person.spouseRoleLabel ? (
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">
              {person.spouseRoleLabel}
            </span>
          ) : null}

          {!isSpouse && person.linkedSpouseLabel ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">
                {person.linkedSpouseLabel}
              </span>
            </div>
          ) : null}

          {years ? (
            <p className="mt-1 text-xs font-bold text-slate-700">{years}</p>
          ) : null}
        </div>

        <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
          <ArrowRight size={18} />
        </div>
      </div>
    </button>
  );
}