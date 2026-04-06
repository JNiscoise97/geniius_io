// src/features/family-tree/api/buildFamilySearchIndex.ts

import {
  computePersonDisplayPermissions,
  computeIsPossiblyAlive,
} from "../visibility/computePersonDisplayPermissions";
import { normalizeSearchText } from "./normalizeSearchText";

import type { PersonUiOverride } from "../../data/profiles/uiOverrides";
import type { FamilyGraphData } from "../../types/graph";
import type { PersonVisibilityPreferenceMap } from "../../types/visibility";
import type { FamilySearchDocument } from "../../types/search";

type PersonUiOverrideMap = Record<string, PersonUiOverride>;

export function buildFamilySearchIndex(
  graph: FamilyGraphData,
  visibilityPreferencesByPersonId?: PersonVisibilityPreferenceMap,
  overridesByPersonId?: PersonUiOverrideMap,
): FamilySearchDocument[] {
  return Object.values(graph.people).map((person): FamilySearchDocument => {
    const displayPermissions = computePersonDisplayPermissions(
      person,
      visibilityPreferencesByPersonId?.[person.id],
      overridesByPersonId,
    );

    const override = overridesByPersonId?.[person.id] ?? {};

    const effectiveFirstName = override.firstName ?? person.firstName;
    const effectiveLastName = override.lastName ?? person.lastName;
    const effectiveNickname = override.nickname ?? person.nickname;
    const effectiveBirthPlace = override.birthPlace ?? person.birthPlace;
    const effectiveCurrentPlace = override.currentPlace ?? person.currentPlace;
    const effectiveDeathPlace = override.deathPlace ?? person.deathPlace;
    const effectiveBirthYear = override.birthYear ?? person.birthYear;
    const effectiveDeathYear = override.deathYear ?? person.deathYear;
    const effectiveIsPossiblyAlive =
      override.isPossiblyAlive ?? computeIsPossiblyAlive(person);

    const firstNameNormalized = displayPermissions.canDisplayName
      ? normalizeSearchText(effectiveFirstName)
      : "";

    const lastNameNormalized = displayPermissions.canDisplayName
      ? normalizeSearchText(effectiveLastName)
      : "";

    const nicknameNormalized = displayPermissions.canDisplayName
      ? normalizeSearchText(effectiveNickname)
      : "";

    const birthPlaceNormalized = displayPermissions.canDisplayInfo
      ? normalizeSearchText(effectiveBirthPlace)
      : "";

    const deathPlaceNormalized = displayPermissions.canDisplayInfo
      ? normalizeSearchText(effectiveDeathPlace)
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
      displayPermissions.canDisplayInfo ? effectiveBirthYear : undefined,
      displayPermissions.canDisplayInfo ? effectiveDeathYear : undefined,
    ]
      .filter(Boolean)
      .join(" ");

    const tokens = Array.from(
      new Set(searchableText.split(" ").map((s) => s.trim()).filter(Boolean)),
    );

    return {
      id: person.id,
      personId: person.id,
      firstName: effectiveFirstName,
      lastName: effectiveLastName,
      nickname: effectiveNickname,
      firstNameNormalized,
      lastNameNormalized,
      nicknameNormalized: nicknameNormalized || undefined,
      fullNameNormalized,
      birthYear: displayPermissions.canDisplayInfo ? effectiveBirthYear : undefined,
      deathYear: displayPermissions.canDisplayInfo ? effectiveDeathYear : undefined,
      birthPlace: displayPermissions.canDisplayInfo
        ? effectiveBirthPlace
        : undefined,
      currentPlace: displayPermissions.canDisplayInfo
        ? effectiveCurrentPlace
        : undefined,
      deathPlace: displayPermissions.canDisplayInfo
        ? effectiveDeathPlace
        : undefined,
      birthPlaceNormalized: birthPlaceNormalized || undefined,
      deathPlaceNormalized: deathPlaceNormalized || undefined,
      branch: person.branch,
      canDisplay: displayPermissions.canDisplay,
      canDisplayName: displayPermissions.canDisplayName,
      canDisplayPhoto: displayPermissions.canDisplayPhoto,
      canDisplayInfo: displayPermissions.canDisplayInfo,
      isPossiblyAlive: effectiveIsPossiblyAlive,
      searchableText,
      tokens,
    };
  });
}