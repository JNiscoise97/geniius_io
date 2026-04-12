import type {
  FamilyTreePermission,
  FamilyTreePermissionSet,
  FamilyTreeRole,
} from "../../types/permissions";

const ALL_PERMISSIONS: FamilyTreePermission[] = [
  "family_tree.view_masked_people",
  "family_tree.assist_in_person",
  "family_tree.collect_presence",
  "family_tree.collect_consents",
  "family_tree.add_photo_on_behalf",
  "family_tree.create_participant_on_behalf",
  "family_tree.create_person_override",
  "family_tree.edit_person_override",
  "family_tree.add_person",
  "family_tree.manage_roles",
];

const ROLE_PERMISSIONS: Record<FamilyTreeRole, FamilyTreePermission[]> = {
  viewer: [],
  family_helper: [
    "family_tree.view_masked_people",
    "family_tree.assist_in_person",
    "family_tree.collect_presence",
    "family_tree.collect_consents",
    "family_tree.add_photo_on_behalf",
    "family_tree.create_participant_on_behalf",
  ],
  tree_editor: [
    "family_tree.view_masked_people",
    "family_tree.assist_in_person",
    "family_tree.collect_presence",
    "family_tree.collect_consents",
    "family_tree.add_photo_on_behalf",
    "family_tree.create_participant_on_behalf",
    "family_tree.create_person_override",
    "family_tree.edit_person_override",
    "family_tree.add_person",
  ],
  organizer: [...ALL_PERMISSIONS],
};

export function createEmptyPermissionSet(): FamilyTreePermissionSet {
  return ALL_PERMISSIONS.reduce(
    (acc, permission) => {
      acc[permission] = false;
      return acc;
    },
    {} as FamilyTreePermissionSet,
  );
}

export function resolveFamilyTreePermissions(
  roles: FamilyTreeRole[],
): FamilyTreePermissionSet {
  const permissions = createEmptyPermissionSet();

  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      permissions[permission] = true;
    }
  }

  return permissions;
}

export function hasFamilyTreePermission(
  permissions: FamilyTreePermissionSet,
  permission: FamilyTreePermission,
): boolean {
  return permissions[permission] === true;
}