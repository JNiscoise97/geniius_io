import {
  getStoredParticipantProfiles,
  type StoredParticipantProfile,
} from "./getStoredParticipantProfiles";

export function getActiveParticipant(
  slug: string,
): StoredParticipantProfile | null {
  const state = getStoredParticipantProfiles(slug);

  if (!state.activeParticipantId) return null;

  return (
    state.profiles.find(
      (profile) => profile.participantId === state.activeParticipantId,
    ) ?? null
  );
}