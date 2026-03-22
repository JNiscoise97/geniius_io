import { findRelationshipPath } from "./findRelationshipPath";
import {
  normalizeSearchText,
  tokenizeSearchText,
} from "../lib/normalizeSearchText";
import type {
  FamilyGraphData,
  FamilySearchDocument,
  PersonSearchMatchKey,
  PersonSearchResult,
} from "../types";

export type SearchPeopleInput = {
  query: string;
  documents: FamilySearchDocument[];
  graph: FamilyGraphData;
  centerPersonId?: string;
  limit?: number;
  forceDisplayedPersonIds?: string[];
};

function addMatch(
  matches: Set<PersonSearchMatchKey>,
  key: PersonSearchMatchKey,
): void {
  matches.add(key);
}

function splitNormalizedWords(value?: string): string[] {
  if (!value) return [];
  return value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
}

function toSearchableString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getRelationshipDistanceBonus(
  graph: FamilyGraphData,
  centerPersonId: string | undefined,
  candidatePersonId: string,
): number {
  if (!centerPersonId) return 0;
  if (centerPersonId === candidatePersonId) return 12;

  const path = findRelationshipPath(graph, centerPersonId, candidatePersonId);
  if (!path) return 0;

  const distance = path.length - 1;

  if (distance === 1) return 10;
  if (distance === 2) return 6;
  if (distance === 3) return 3;
  return 0;
}

function hasAnyNameMatch(matches: Set<PersonSearchMatchKey>): boolean {
  return (
    matches.has("full_name_exact") ||
    matches.has("first_name_exact") ||
    matches.has("last_name_exact") ||
    matches.has("nickname_exact") ||
    matches.has("first_name_prefix") ||
    matches.has("last_name_prefix") ||
    matches.has("nickname_partial")
  );
}

function hasAnyDateOrPlaceMatch(matches: Set<PersonSearchMatchKey>): boolean {
  return (
    matches.has("birth_year") ||
    matches.has("death_year") ||
    matches.has("birth_place") ||
    matches.has("death_place")
  );
}

export function searchPeople({
  query,
  documents,
  graph,
  centerPersonId,
  limit = 20,
  forceDisplayedPersonIds = [],
}: SearchPeopleInput): PersonSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const queryTokens = tokenizeSearchText(query);
  if (queryTokens.length === 0) return [];

  const forceDisplayedPersonIdsSet = new Set(forceDisplayedPersonIds);
  const results: PersonSearchResult[] = [];

  for (const doc of documents) {
    const canForceDisplay = forceDisplayedPersonIdsSet.has(doc.personId);

    if (!doc.canDisplay && !canForceDisplay) continue;

    let score = 0;
    const matches = new Set<PersonSearchMatchKey>();
    let matchedPrimaryTokenCount = 0;

    const firstNameWords = splitNormalizedWords(doc.firstNameNormalized);
    const lastNameWords = splitNormalizedWords(doc.lastNameNormalized);
    const nicknameWords = splitNormalizedWords(doc.nicknameNormalized);

    const birthYear = toSearchableString(doc.birthYear);
    const deathYear = toSearchableString(doc.deathYear);

    if (doc.fullNameNormalized === normalizedQuery) {
      score += 240;
      addMatch(matches, "full_name_exact");
      matchedPrimaryTokenCount = queryTokens.length;
    }

    if (
      doc.firstNameNormalized === normalizedQuery ||
      firstNameWords.includes(normalizedQuery)
    ) {
      score += 140;
      addMatch(matches, "first_name_exact");
      matchedPrimaryTokenCount = Math.max(matchedPrimaryTokenCount, 1);
    }

    if (
      doc.lastNameNormalized === normalizedQuery ||
      lastNameWords.includes(normalizedQuery)
    ) {
      score += 140;
      addMatch(matches, "last_name_exact");
      matchedPrimaryTokenCount = Math.max(matchedPrimaryTokenCount, 1);
    }

    if (
      doc.nicknameNormalized &&
      (doc.nicknameNormalized === normalizedQuery ||
        nicknameWords.includes(normalizedQuery))
    ) {
      score += 120;
      addMatch(matches, "nickname_exact");
      matchedPrimaryTokenCount = Math.max(matchedPrimaryTokenCount, 1);
    }

    for (const token of queryTokens) {
      let tokenMatched = false;

      if (
        doc.firstNameNormalized === token ||
        firstNameWords.includes(token)
      ) {
        score += 100;
        addMatch(matches, "first_name_exact");
        tokenMatched = true;
      } else if (
        token.length >= 2 &&
        (doc.firstNameNormalized.startsWith(token) ||
          firstNameWords.some((word) => word.startsWith(token)))
      ) {
        score += 50;
        addMatch(matches, "first_name_prefix");
        tokenMatched = true;
      }

      if (
        doc.lastNameNormalized === token ||
        lastNameWords.includes(token)
      ) {
        score += 100;
        addMatch(matches, "last_name_exact");
        tokenMatched = true;
      } else if (
        token.length >= 2 &&
        (doc.lastNameNormalized.startsWith(token) ||
          lastNameWords.some((word) => word.startsWith(token)))
      ) {
        score += 50;
        addMatch(matches, "last_name_prefix");
        tokenMatched = true;
      }

      if (
        doc.nicknameNormalized &&
        (doc.nicknameNormalized === token || nicknameWords.includes(token))
      ) {
        score += 80;
        addMatch(matches, "nickname_exact");
        tokenMatched = true;
      } else if (
        token.length >= 2 &&
        (doc.nicknameNormalized?.includes(token) ||
          nicknameWords.some((word) => word.startsWith(token)))
      ) {
        score += 50;
        addMatch(matches, "nickname_partial");
        tokenMatched = true;
      }

      if (birthYear === token) {
        score += 45;
        addMatch(matches, "birth_year");
        tokenMatched = true;
      } else if (token.length >= 3 && birthYear.startsWith(token)) {
        score += 20;
        addMatch(matches, "birth_year");
        tokenMatched = true;
      }

      if (deathYear === token) {
        score += 45;
        addMatch(matches, "death_year");
        tokenMatched = true;
      } else if (token.length >= 3 && deathYear.startsWith(token)) {
        score += 20;
        addMatch(matches, "death_year");
        tokenMatched = true;
      }

      if (token.length >= 2 && doc.birthPlaceNormalized?.includes(token)) {
        score += 35;
        addMatch(matches, "birth_place");
        tokenMatched = true;
      }

      if (token.length >= 2 && doc.deathPlaceNormalized?.includes(token)) {
        score += 35;
        addMatch(matches, "death_place");
        tokenMatched = true;
      }

      if (tokenMatched) {
        matchedPrimaryTokenCount += 1;
      }
    }

    const strongNameMatch =
      matches.has("full_name_exact") ||
      matches.has("first_name_exact") ||
      matches.has("last_name_exact") ||
      matches.has("nickname_exact");

    const anyNameMatch = hasAnyNameMatch(matches);
    const anyDateOrPlaceMatch = hasAnyDateOrPlaceMatch(matches);

    const requiredTokenCoverage =
      queryTokens.length <= 1
        ? 1
        : queryTokens.length === 2
          ? 2
          : Math.max(2, Math.ceil(queryTokens.length * 0.6));

    const isSingleTokenQuery = queryTokens.length === 1;
    const isMultiTokenQuery = queryTokens.length >= 2;

    if (isSingleTokenQuery) {
      if (!anyNameMatch && !anyDateOrPlaceMatch) {
        continue;
      }
    }

    if (isMultiTokenQuery) {
      if (!strongNameMatch && matchedPrimaryTokenCount < requiredTokenCoverage) {
        continue;
      }
    }

    const relationshipBonus = getRelationshipDistanceBonus(
      graph,
      centerPersonId,
      doc.personId,
    );

    if (relationshipBonus > 0) {
      score += relationshipBonus;
      addMatch(matches, "relationship_bonus");
    }

    score += 3;
    addMatch(matches, "visibility_bonus");

    const minScore = queryTokens.length <= 1 ? 30 : 70;
    if (score < minScore) {
      continue;
    }

    results.push({
      personId: doc.personId,
      score,
      matchedOn: Array.from(matches),
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}