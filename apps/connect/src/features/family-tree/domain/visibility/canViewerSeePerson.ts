import type { PersonSummary } from "../../types/person";
import type { FamilyTreePermissionSet } from "../../types/permissions";

export function canViewerSeePerson(
  person: PersonSummary,
  permissions?: FamilyTreePermissionSet,
): boolean {
  if (person.canDisplay) {
    return true;
  }

  return Boolean(permissions?.["family_tree.view_masked_people"]);
}