
import { PERSON_UI_OVERRIDES } from "../api/uiOverrides";
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

function computeBaseCanDisplay(person: FamilyGraphPerson | undefined): boolean {
  if (!person) return false;
  return computeIsPossiblyAlive(person) === false;
}

export function computePersonDisplayPermissions(
  person: FamilyGraphPerson | undefined,
  preferences?: ParticipantTreeVisibilityPreferences,
): PersonDisplayPermissions {
  if (!person) {
    return {
      canDisplay: false,
      canDisplayName: false,
      canDisplayPhoto: false,
      canDisplayInfo: false,
    };
  }

  const override = PERSON_UI_OVERRIDES[person.id];

  const canDisplay =
    typeof override?.canDisplay === "boolean"
      ? override.canDisplay
      : computeBaseCanDisplay(person);

  if (!canDisplay) {
    return {
      canDisplay: false,
      canDisplayName: false,
      canDisplayPhoto: false,
      canDisplayInfo: false,
    };
  }

  return {
    canDisplay: true,
    canDisplayName: preferences?.allowNameInFamilyTree ?? true,
    canDisplayPhoto: preferences?.allowPhotoInFamilyTree ?? true,
    canDisplayInfo: preferences?.allowInfoInFamilyTree ?? true,
  };
}