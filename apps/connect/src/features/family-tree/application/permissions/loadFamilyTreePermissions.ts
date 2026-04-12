import { getParticipantRoles } from "../../data/permissions/getParticipantRoles";
import {
  createEmptyPermissionSet,
  resolveFamilyTreePermissions,
} from "../../domain/permissions/resolveFamilyTreePermissions";
import type {
  FamilyTreePermission,
  FamilyTreePermissionSet,
  FamilyTreeRole,
} from "../../types/permissions";

export type LoadFamilyTreePermissionsResult = {
  roles: FamilyTreeRole[];
  permissions: FamilyTreePermissionSet;
};

export async function loadFamilyTreePermissions(params: {
  eventSlug: string;
  participantId: string | null | undefined;
}): Promise<LoadFamilyTreePermissionsResult> {
  const { eventSlug, participantId } = params;

  if (!participantId) {
    return {
      roles: ["viewer"],
      permissions: createEmptyPermissionSet(),
    };
  }

  const roles = await getParticipantRoles({
    eventSlug,
    participantId,
  });

  return {
    roles,
    permissions: resolveFamilyTreePermissions(roles),
  };
}

export function requireFamilyTreePermission(
  permissions: FamilyTreePermissionSet,
  permission: FamilyTreePermission,
  errorMessage = "Action non autorisée.",
): void {
  if (permissions[permission] !== true) {
    throw new Error(errorMessage);
  }
}