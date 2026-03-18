import type { FamilyGraphData, FamilySearchDocument } from "../types";
import { PERSON_UI_OVERRIDES } from "./uiOverrides";
import { normalizeSearchText } from "../lib/normalizeSearchText";

function computeIsPossiblyAliveForSearch(
  birthYear?: string,
  deathYear?: string,
): boolean | undefined {
  if (deathYear) return false;
  if (!birthYear) return undefined;

  const birthYearNumber = Number(birthYear);
  if (Number.isNaN(birthYearNumber)) return undefined;

  const currentYear = new Date().getFullYear();
  return currentYear - birthYearNumber <= 110;
}

function computeHiddenForSearch(person: FamilyGraphData["people"][string]) {
  const override = PERSON_UI_OVERRIDES[person.id];
  if (typeof override?.hidden === "boolean") {
    return override.hidden;
  }

  const isPossiblyAlive = computeIsPossiblyAliveForSearch(
    person.birthYear,
    person.deathYear,
  );

  return isPossiblyAlive !== false;
}

export function buildFamilySearchIndex(
  graph: FamilyGraphData,
): FamilySearchDocument[] {
  return Object.values(graph.people)
    .map((person) => {
      const firstNameNormalized = normalizeSearchText(person.firstName);
      const lastNameNormalized = normalizeSearchText(person.lastName);
      const nicknameNormalized = normalizeSearchText(person.nickname);
      const birthPlaceNormalized = normalizeSearchText(person.birthPlace);
      const deathPlaceNormalized = normalizeSearchText(person.deathPlace);

      const fullNameNormalized = [firstNameNormalized, lastNameNormalized]
        .filter(Boolean)
        .join(" ");

      const searchableText = [
        firstNameNormalized,
        lastNameNormalized,
        nicknameNormalized,
        fullNameNormalized,
        birthPlaceNormalized,
        deathPlaceNormalized,
        person.birthYear,
        person.deathYear,
      ]
        .filter(Boolean)
        .join(" ");

      const tokens = Array.from(
        new Set(searchableText.split(" ").map((s) => s.trim()).filter(Boolean)),
      );

      const hidden = computeHiddenForSearch(person);

      return {
        id: person.id,
        personId: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        nickname: person.nickname,
        firstNameNormalized,
        lastNameNormalized,
        nicknameNormalized: nicknameNormalized || undefined,
        fullNameNormalized,
        birthYear: person.birthYear,
        deathYear: person.deathYear,
        birthPlace: person.birthPlace,
        deathPlace: person.deathPlace,
        birthPlaceNormalized: birthPlaceNormalized || undefined,
        deathPlaceNormalized: deathPlaceNormalized || undefined,
        branch: person.branch,
        hidden,
        isPossiblyAlive: computeIsPossiblyAliveForSearch(
          person.birthYear,
          person.deathYear,
        ),
        searchableText,
        tokens,
      } satisfies FamilySearchDocument;
    })
    .filter((doc) => !doc.hidden);
}