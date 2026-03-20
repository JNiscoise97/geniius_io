// src/features/moderation/lib/moderationLabels.ts

import { FAMILY_GRAPH } from "../../family-tree/api/loadGraph";

function compact(value?: string | null): string {
  return value?.trim() ?? "";
}

export function getPersonLabelFromFamilyGraph(personId?: string | null): string {
  if (!personId) return "Personne inconnue";

  const person = FAMILY_GRAPH.people[personId];
  if (!person) return `Personne introuvable (${personId})`;

  const firstName = compact(person.firstName);
  const lastName = compact(person.lastName);
  const nickname = compact(person.nickname);

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (fullName && nickname) {
    return `${fullName} (${nickname})`;
  }

  if (fullName) return fullName;
  if (nickname) return nickname;

  return `Personne sans nom (${personId})`;
}