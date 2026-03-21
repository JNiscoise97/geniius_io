
import { computePersonDisplayPermissions, computeIsPossiblyAlive } from "../lib/computePersonDisplayPermissions";
import { normalizeSearchText } from "../lib/normalizeSearchText";
import type {
  FamilyGraphData,
  FamilySearchDocument,
  PersonVisibilityPreferenceMap,
} from "../types";

export function buildFamilySearchIndex(
  graph: FamilyGraphData,
  visibilityPreferencesByPersonId?: PersonVisibilityPreferenceMap,
): FamilySearchDocument[] {
  return Object.values(graph.people).map((person): FamilySearchDocument => {
    const displayPermissions = computePersonDisplayPermissions(
      person,
      visibilityPreferencesByPersonId?.[person.id],
    );

    const firstNameNormalized = displayPermissions.canDisplayName
      ? normalizeSearchText(person.firstName)
      : "";

    const lastNameNormalized = displayPermissions.canDisplayName
      ? normalizeSearchText(person.lastName)
      : "";

    const nicknameNormalized = displayPermissions.canDisplayName
      ? normalizeSearchText(person.nickname)
      : "";

    const birthPlaceNormalized = displayPermissions.canDisplayInfo
      ? normalizeSearchText(person.birthPlace)
      : "";

    const deathPlaceNormalized = displayPermissions.canDisplayInfo
      ? normalizeSearchText(person.deathPlace)
      : "";

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
      displayPermissions.canDisplayInfo ? person.birthYear : undefined,
      displayPermissions.canDisplayInfo ? person.deathYear : undefined,
    ]
      .filter(Boolean)
      .join(" ");

    const tokens = Array.from(
      new Set(searchableText.split(" ").map((s) => s.trim()).filter(Boolean)),
    );

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
      birthYear: displayPermissions.canDisplayInfo ? person.birthYear : undefined,
      deathYear: displayPermissions.canDisplayInfo ? person.deathYear : undefined,
      birthPlace: displayPermissions.canDisplayInfo
        ? person.birthPlace
        : undefined,
      deathPlace: displayPermissions.canDisplayInfo
        ? person.deathPlace
        : undefined,
      birthPlaceNormalized: birthPlaceNormalized || undefined,
      deathPlaceNormalized: deathPlaceNormalized || undefined,
      branch: person.branch,
      canDisplay: displayPermissions.canDisplay,
      canDisplayName: displayPermissions.canDisplayName,
      canDisplayPhoto: displayPermissions.canDisplayPhoto,
      canDisplayInfo: displayPermissions.canDisplayInfo,
      isPossiblyAlive: computeIsPossiblyAlive(person),
      searchableText,
      tokens,
    };
  });
}