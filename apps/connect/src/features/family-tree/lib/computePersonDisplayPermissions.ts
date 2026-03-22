import type {
  FamilyGraphPerson,
  ParticipantTreeVisibilityPreferences,
} from "../types";

export type PersonDisplayPermissions = {
  canDisplay: boolean;
  canDisplayName: boolean;
  canDisplayPhoto: boolean;
  canDisplayInfo: boolean;
};

export function computeIsPossiblyAlive(
  person: FamilyGraphPerson | undefined,
): boolean | undefined {
  if (!person) return undefined;

  if (person.deathYear) return false;
  if (!person.birthYear) return undefined;

  const birthYearNumber = Number(person.birthYear);
  if (Number.isNaN(birthYearNumber)) return undefined;

  const currentYear = new Date().getFullYear();
  return currentYear - birthYearNumber <= 110;
}

function hasAnyExplicitTreeConsent(
  preferences?: ParticipantTreeVisibilityPreferences,
): boolean {
  return Boolean(
    preferences?.allowNameInFamilyTree ||
      preferences?.allowPhotoInFamilyTree ||
      preferences?.allowInfoInFamilyTree,
  );
}

function computeBaseCanDisplay(
  person: FamilyGraphPerson | undefined,
  preferences?: ParticipantTreeVisibilityPreferences,
): boolean {
  if (!person) return false;

  const isPossiblyAlive = computeIsPossiblyAlive(person);

  // Décédé => affiché par défaut
  if (isPossiblyAlive === false) {
    return true;
  }

  // Vivant ou statut incertain => affiché seulement si consentement explicite
  return hasAnyExplicitTreeConsent(preferences);
}

export function computePersonDisplayPermissions(
  person: FamilyGraphPerson | undefined,
  preferences?: ParticipantTreeVisibilityPreferences,
  overridesByPersonId?: Record<string, any>,
): PersonDisplayPermissions {
  if (!person) {
    return {
      canDisplay: false,
      canDisplayName: false,
      canDisplayPhoto: false,
      canDisplayInfo: false,
    };
  }

  const override = overridesByPersonId?.[person.id];

  const canDisplay =
    typeof override?.canDisplay === "boolean"
      ? override.canDisplay
      : computeBaseCanDisplay(person, preferences);

  if (!canDisplay) {
    return {
      canDisplay: false,
      canDisplayName: false,
      canDisplayPhoto: false,
      canDisplayInfo: false,
    };
  }

  const isPossiblyAlive = computeIsPossiblyAlive(person);

  if (isPossiblyAlive === false) {
    return {
      canDisplay: true,
      canDisplayName:
        typeof override?.canDisplayName === "boolean"
          ? override.canDisplayName
          : true,
      canDisplayPhoto:
        typeof override?.canDisplayPhoto === "boolean"
          ? override.canDisplayPhoto
          : true,
      canDisplayInfo:
        typeof override?.canDisplayInfo === "boolean"
          ? override.canDisplayInfo
          : true,
    };
  }

  return {
    canDisplay: true,
    canDisplayName:
      typeof override?.canDisplayName === "boolean"
        ? override.canDisplayName
        : preferences?.allowNameInFamilyTree ?? false,
    canDisplayPhoto:
      typeof override?.canDisplayPhoto === "boolean"
        ? override.canDisplayPhoto
        : preferences?.allowPhotoInFamilyTree ?? false,
    canDisplayInfo:
      typeof override?.canDisplayInfo === "boolean"
        ? override.canDisplayInfo
        : preferences?.allowInfoInFamilyTree ?? false,
  };
}