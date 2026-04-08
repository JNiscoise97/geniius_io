import { User, ArrowRight } from "lucide-react";
import type { PersonSummary } from "../../types";
import { SmartImage } from "../../../../lib/media/useSmartImage";

type PersonCardProps = {
  person: PersonSummary;
  subtitle?: string;
  rightContent?: React.ReactNode;
  onClick?: () => void;
};

export function PersonCard({
  person,
  subtitle,
  rightContent,
  onClick,
}: PersonCardProps) {
  const displayName = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[20px] border border-slate-200 bg-white p-3 text-left shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        {/* Photo */}
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[14px] bg-slate-100">
          {person.photoSrc ? (
            <SmartImage src={person.photoSrc} alt={displayName} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              <User size={18} />
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-slate-900">
            {displayName || "Personne"}
          </div>

          {subtitle ? (
            <div className="mt-0.5 text-xs font-bold text-slate-600">
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Right */}
        <div className="shrink-0 flex items-center gap-2">
          {rightContent ?? (
            <div className="rounded-xl bg-slate-100 p-2 text-slate-900">
              <ArrowRight size={16} />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}