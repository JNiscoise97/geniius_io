import { getActiveParticipant } from "../../../lib/participant-session/getActiveParticipant";
import {
  getStoredParticipantProfiles,
  type StoredParticipantProfile,
} from "../../../lib/participant-session/getStoredParticipantProfiles";

export type ManagedProfile = StoredParticipantProfile & {
  isManagedByActiveParticipant: true;
};

export type GetManagedProfilesResult = {
  activeParticipantId: string | null;
  managedProfiles: ManagedProfile[];
};

export function getManagedProfiles(slug: string): GetManagedProfilesResult {
  const activeParticipant = getActiveParticipant(slug);
  const state = getStoredParticipantProfiles(slug);

  const activeParticipantId = activeParticipant?.participantId ?? null;

  if (!activeParticipantId) {
    return {
      activeParticipantId: null,
      managedProfiles: [],
    };
  }

  const managedProfiles = state.profiles
    .filter(
      (profile) =>
        profile.participantId !== activeParticipantId &&
        profile.managedByParticipantId === activeParticipantId,
    )
    .map(
      (profile): ManagedProfile => ({
        ...profile,
        isManagedByActiveParticipant: true,
      }),
    );

  return {
    activeParticipantId,
    managedProfiles,
  };
}