import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import type { PersonSummary } from "../../../types/person";
import { PersonIdentityBlock } from "./PersonIdentityBlock";

export type PersonCardProps = {
  person: PersonSummary;
  onClick?: () => void;
  relationshipSummary?: string;
  showSubtitleBadge?: boolean;
  showRelationshipSummary?: boolean;
  rightSlot?: ReactNode;
  className?: string;
};

export function PersonCard({
  person,
  onClick,
  relationshipSummary,
  showSubtitleBadge = true,
  showRelationshipSummary = false,
  rightSlot,
  className = "",
}: PersonCardProps) {
  const displayName = `${person.firstName} ${person.lastName}`.trim();

  const content = (
    <PersonIdentityBlock
      person={person}
      relationshipSummary={relationshipSummary}
      showSubtitleBadge={showSubtitleBadge}
      showRelationshipSummary={showRelationshipSummary}
      rightSlot={
        rightSlot ?? (
          <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
            <ArrowRight size={18} />
          </div>
        )
      }
    />
  );

  if (!onClick) {
    return (
      <div className={`rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:shadow-none ${className}`}
      aria-label={`Ouvrir ${displayName || "cette personne"}`}
    >
      {content}
    </button>
  );
}