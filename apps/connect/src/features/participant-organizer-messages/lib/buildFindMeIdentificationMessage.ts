import type { FamilyKnowledgeCloseFamilyValues } from "../../family-knowledge/api/getFamilyKnowledgeCloseFamily";
import type { FamilyKnowledgeGrandparentsValues } from "../../family-knowledge/api/getFamilyKnowledgeGrandparents";
import type { FindMeAnswers } from "../../family-tree/lib/findMeMatching";

export type FindMeContactContext = {
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  father?: string;
  mother?: string;
  paternalGrandfather?: string;
  paternalGrandmother?: string;
  maternalGrandfather?: string;
  maternalGrandmother?: string;
};

function clean(value: string | null | undefined): string | undefined {
  const s = value?.trim();
  return s ? s : undefined;
}

function buildFullName(input?: {
  known?: boolean;
  firstName?: string;
  lastName?: string;
  nickname?: string;
} | null): string | undefined {
  if (!input || input.known !== true) return undefined;

  const firstName = clean(input.firstName);
  const lastName = clean(input.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (fullName) return fullName;
  return clean(input.nickname);
}

type BuildFindMeContactContextInput = {
  participantFirstName?: string;
  participantLastName?: string;
  closeFamily?: FamilyKnowledgeCloseFamilyValues | null;
  grandparents?: FamilyKnowledgeGrandparentsValues | null;
  answers?: Partial<FindMeAnswers> | null;
};

export function buildFindMeContactContext({
  participantFirstName,
  participantLastName,
  closeFamily,
  grandparents,
  answers,
}: BuildFindMeContactContextInput): FindMeContactContext {
  return {
    firstName: clean(answers?.firstName) ?? clean(participantFirstName),
    lastName: clean(answers?.lastName) ?? clean(participantLastName),
    birthYear: clean(answers?.birthYear),

    father:
      buildFullName(closeFamily?.parent1) ??
      clean(answers?.fatherQuery),

    mother:
      buildFullName(closeFamily?.parent2) ??
      clean(answers?.motherQuery),

    paternalGrandfather:
      buildFullName(grandparents?.paternalGrandfather) ??
      clean(answers?.grandparentQuery1),

    paternalGrandmother:
      buildFullName(grandparents?.paternalGrandmother) ??
      clean(answers?.grandparentQuery2),

    maternalGrandfather:
      buildFullName(grandparents?.maternalGrandfather) ??
      clean(answers?.grandparentQuery3),

    maternalGrandmother:
      buildFullName(grandparents?.maternalGrandmother) ??
      clean(answers?.grandparentQuery4),
  };
}

export function buildFindMeIdentificationMessage(
  context: FindMeContactContext,
): string {
  return `Bonjour,

Je n’arrive pas à me retrouver dans l’arbre familial.

Voici les informations dont je dispose :
- Prénom : ${context.firstName ?? "..."}
- Nom : ${context.lastName ?? "..."}
- Année de naissance : ${context.birthYear ?? "..."}
- Père : ${context.father ?? "..."}
- Mère : ${context.mother ?? "..."}
- Grand-père paternel : ${context.paternalGrandfather ?? "..."}
- Grand-mère paternelle : ${context.paternalGrandmother ?? "..."}
- Grand-père maternel : ${context.maternalGrandfather ?? "..."}
- Grand-mère maternelle : ${context.maternalGrandmother ?? "..."}

Pourrais-tu m’aider à m’identifier dans l’arbre s'il te plait ?

Bonne journée.`;
}