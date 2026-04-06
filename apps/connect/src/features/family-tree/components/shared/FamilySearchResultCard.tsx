import type { PersonSummary } from "../../types/person";
import { PersonCard } from "../shared/person/PersonCard";

export function FamilySearchResultCard({
  person,
  relationshipSummary,
  onCenter,
}: {
  person: PersonSummary;
  relationshipSummary?: string;
  onCenter: () => void;
}) {
  return (
    <PersonCard
      person={person}
      onClick={onCenter}
      relationshipSummary={relationshipSummary}
      showSubtitleBadge={false}
      showRelationshipSummary
    />
  );
}