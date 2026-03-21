import { FAMILY_GRAPH } from "../../family-tree/api/loadGraph";

type ParticipantRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
};

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

export function formatParticipantLabel(row?: ParticipantRow | null): string {
  if (!row) return "Participant inconnu";

  const firstName = compact(row.first_name);
  const lastName = compact(row.last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return fullName || `Participant sans nom (${row.id})`;
}

export function booleanLabel(
  value: boolean | null | undefined,
  options?: {
    trueLabel?: string;
    falseLabel?: string;
    nullLabel?: string;
  },
): string {
  const trueLabel = options?.trueLabel ?? "Oui";
  const falseLabel = options?.falseLabel ?? "Non";
  const nullLabel = options?.nullLabel ?? "Non renseigné";

  if (value === true) return trueLabel;
  if (value === false) return falseLabel;
  return nullLabel;
}