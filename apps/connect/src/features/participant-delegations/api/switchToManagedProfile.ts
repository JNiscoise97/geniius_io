import { setActiveStoredProfile } from "../../device-profiles/api/setActiveStoredProfile";
import { getManagedProfiles } from "./getManagedProfiles";

export type SwitchToManagedProfileResult = {
  ok: boolean;
  reason?: "no-active-participant" | "not-managed-profile" | "switch-failed";
};

export function switchToManagedProfile(
  slug: string,
  managedParticipantId: string,
): SwitchToManagedProfileResult {
  const normalizedParticipantId = managedParticipantId.trim();

  if (!normalizedParticipantId) {
    return {
      ok: false,
      reason: "not-managed-profile",
    };
  }

  const { activeParticipantId, managedProfiles } = getManagedProfiles(slug);

  if (!activeParticipantId) {
    return {
      ok: false,
      reason: "no-active-participant",
    };
  }

  const target = managedProfiles.find(
    (profile) => profile.participantId === normalizedParticipantId,
  );

  if (!target) {
    return {
      ok: false,
      reason: "not-managed-profile",
    };
  }

  const ok = setActiveStoredProfile(slug, normalizedParticipantId);

  if (!ok) {
    return {
      ok: false,
      reason: "switch-failed",
    };
  }

  return { ok: true };
}