import {
  type RelationshipEdgeType,
  type RelationshipPathNode,
} from "../graph/findRelationshipPath";
import { formatPlaceTransition } from "../graph/genealogyUi";
import type { PersonSummary } from "../../types/person";

export function anonymizeBrowsePerson(person: PersonSummary): PersonSummary {
  if (
    person.canDisplay &&
    person.canDisplayName &&
    person.canDisplayPhoto &&
    person.canDisplayInfo
  ) {
    return person;
  }

  return {
    ...person,
    firstName:
      person.canDisplay && person.canDisplayName
        ? person.firstName
        : "Personne",
    lastName:
      person.canDisplay && person.canDisplayName ? person.lastName : "privée",
    nickname:
      person.canDisplay && person.canDisplayName ? person.nickname : undefined,
    photoSrc:
      person.canDisplay && person.canDisplayPhoto ? person.photoSrc : undefined,
    birthYear:
      person.canDisplay && person.canDisplayInfo ? person.birthYear : undefined,
    deathYear:
      person.canDisplay && person.canDisplayInfo ? person.deathYear : undefined,
    birthPlace:
      person.canDisplay && person.canDisplayInfo
        ? person.birthPlace
        : undefined,
    currentPlace:
      person.canDisplay && person.canDisplayInfo
        ? person.currentPlace
        : undefined,
    deathPlace:
      person.canDisplay && person.canDisplayInfo
        ? person.deathPlace
        : undefined,
    linkedSpouseLabel:
      person.canDisplay && person.canDisplayInfo
        ? person.linkedSpouseLabel
        : undefined,
    spouseRoleLabel:
      person.canDisplay && person.canDisplayInfo
        ? person.spouseRoleLabel
        : undefined,
    branch: person.canDisplay ? person.branch : undefined,
  };
}

export function getBrowseDisplayPerson(
  person: PersonSummary,
  forceDisplayedPersonIds: Set<string>,
  canViewMaskedPeople: boolean,
): PersonSummary {
  if (forceDisplayedPersonIds.has(person.id) || canViewMaskedPeople) {
    return person;
  }

  return anonymizeBrowsePerson(person);
}

export function formatBrowseYears(person: PersonSummary): string | null {
  const { birthYear, deathYear, isPossiblyAlive } = person;

  if (!birthYear && !deathYear) return null;
  if (birthYear && deathYear) return `${birthYear} - ${deathYear}`;
  if (!isPossiblyAlive) return `${birthYear ?? "?"} - ?`;

  return birthYear ?? "?";
}

export function formatBrowseLifePath(person: PersonSummary): string | null {
  return formatPlaceTransition(
    person.birthPlace,
    person.currentPlace,
    person.deathPlace,
  );
}

export function getPluralLabel(
  count: number,
  singular: string,
  plural: string,
): string {
  return count > 1 ? plural : singular;
}

export function parseBirthYear(value?: string | number | null): number | null {
  if (value === undefined || value === null || value === "") return null;

  const year =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  return Number.isNaN(year) ? null : year;
}

export function sortPersonsByBirthYear(
  persons: PersonSummary[],
): PersonSummary[] {
  return persons.reduce<PersonSummary[]>((ordered, person) => {
    const personYear = parseBirthYear(person.birthYear);

    if (personYear === null) {
      ordered.push(person);
      return ordered;
    }

    const insertAt = ordered.findIndex((candidate) => {
      const candidateYear = parseBirthYear(candidate.birthYear);
      return candidateYear !== null && candidateYear > personYear;
    });

    if (insertAt === -1) {
      ordered.push(person);
    } else {
      ordered.splice(insertAt, 0, person);
    }

    return ordered;
  }, []);
}

export function removeUniformLinkedSpouseLabel(
  persons: PersonSummary[],
): PersonSummary[] {
  const distinctLabels = Array.from(
    new Set(
      persons
        .map((person) => person.linkedSpouseLabel?.trim())
        .filter((label): label is string => Boolean(label)),
    ),
  );

  if (distinctLabels.length !== 1) {
    return persons;
  }

  return persons.map((person) => ({
    ...person,
    linkedSpouseLabel: undefined,
  }));
}

function getAncestorLabel(level: number, sex?: string) {
  const isFemale = sex === "F";
  const isMale = sex === "M";

  if (level <= 0) return "de la famille";

  if (level === 1) {
    if (isFemale) return "la mère";
    if (isMale) return "le père";
    return "un parent";
  }

  if (level === 2) {
    if (isFemale) return "la grand-mère";
    if (isMale) return "le grand-père";
    return "un grand-parent";
  }

  if (level === 3) {
    if (isFemale) return "l’arrière-grand-mère";
    if (isMale) return "l’arrière-grand-père";
    return "un arrière-grand-parent";
  }

  if (isFemale) return `l’${"arrière-".repeat(level - 2)}grand-mère`;
  if (isMale) return `l’${"arrière-".repeat(level - 2)}grand-père`;

  return `un ${"arrière-".repeat(level - 2)}grand-parent`;
}

function getDescendantLabel(level: number, sex?: string) {
  const isFemale = sex === "F";
  const isMale = sex === "M";

  if (level <= 0) return "de la famille";

  if (level === 1) {
    if (isFemale) return "la fille";
    if (isMale) return "le fils";
    return "un enfant";
  }

  if (level === 2) {
    if (isFemale) return "la petite-fille";
    if (isMale) return "le petit-fils";
    return "un petit-enfant";
  }

  if (level === 3) {
    if (isFemale) return "l’arrière-petite-fille";
    if (isMale) return "l’arrière-petit-fils";
    return "un arrière-petit-enfant";
  }

  if (isFemale) return `l’${"arrière-".repeat(level - 2)}petite-fille`;
  if (isMale) return `l’${"arrière-".repeat(level - 2)}petit-fils`;

  return `un ${"arrière-".repeat(level - 2)}petit-enfant`;
}

function getSiblingDescendantLabel(level: number, sex?: string) {
  const isFemale = sex === "F";
  const isMale = sex === "M";

  if (level <= 0) {
    if (isFemale) return "la sœur";
    if (isMale) return "le frère";
    return "un frère ou une sœur";
  }

  if (level === 1) {
    if (isFemale) return "la nièce";
    if (isMale) return "le neveu";
    return "un neveu ou une nièce";
  }

  if (level === 2) {
    if (isFemale) return "la petite-nièce";
    if (isMale) return "le petit-neveu";
    return "un petit-neveu ou une petite-nièce";
  }

  if (level === 3) {
    if (isFemale) return "l’arrière-petite-nièce";
    if (isMale) return "l’arrière-petit-neveu";
    return "un arrière-petit-neveu ou une arrière-petite-nièce";
  }

  if (isFemale) return `l’${"arrière-".repeat(level - 2)}petite-nièce`;
  if (isMale) return `l’${"arrière-".repeat(level - 2)}petit-neveu`;

  return `un ${"arrière-".repeat(level - 2)}petit-neveu ou une ${"arrière-".repeat(level - 2)}petite-nièce`;
}

function isSiblingLinePattern(moves: RelationshipEdgeType[]): boolean {
  if (moves.length < 2) return false;
  if (moves[0] !== "parent") return false;
  if (moves[1] !== "child") return false;
  return moves.slice(2).every((via) => via === "child");
}

export function summarizeRelationshipToRoot(
  path: RelationshipPathNode[] | null,
  rootDisplayName: string,
  isCenteredOnMe: boolean,
  targetSex?: string,
): string {
  if (!path) return "Aucun chemin trouvé.";

  if (path.length === 1) {
    return isCenteredOnMe
      ? "Tu es actuellement centré sur toi."
      : `Tu es actuellement centré sur ${rootDisplayName}.`;
  }

  const moves = path
    .slice(1)
    .map((node) => node.via)
    .filter((via): via is RelationshipEdgeType => Boolean(via));

  const upCount = moves.filter((via) => via === "parent").length;
  const downCount = moves.filter((via) => via === "child").length;
  const spouseCount = moves.filter((via) => via === "spouse").length;

  if (spouseCount === 0 && upCount > 0 && downCount === 0) {
    return isCenteredOnMe
      ? `Tu es ${getAncestorLabel(upCount, targetSex)} de ${rootDisplayName}.`
      : `Cette personne est ${getAncestorLabel(upCount, targetSex)} de ${rootDisplayName}.`;
  }

  if (spouseCount === 0 && downCount > 0 && upCount === 0) {
    return isCenteredOnMe
      ? `Tu es ${getDescendantLabel(downCount, targetSex)} de ${rootDisplayName}.`
      : `Cette personne est ${getDescendantLabel(downCount, targetSex)} de ${rootDisplayName}.`;
  }

  if (spouseCount === 0 && isSiblingLinePattern(moves)) {
    const level = moves.length - 2;
    return isCenteredOnMe
      ? `Tu es ${getSiblingDescendantLabel(level, targetSex)} de ${rootDisplayName}.`
      : `Cette personne est ${getSiblingDescendantLabel(level, targetSex)} de ${rootDisplayName}.`;
  }

  if (spouseCount > 0) {
    return isCenteredOnMe
      ? `Ton lien avec ${rootDisplayName} passe par une alliance.`
      : `Le lien avec ${rootDisplayName} passe par une alliance.`;
  }

  return isCenteredOnMe
    ? `Voici ton chemin familial le plus court depuis ${rootDisplayName}.`
    : `Voici le chemin familial le plus court depuis ${rootDisplayName}.`;
}