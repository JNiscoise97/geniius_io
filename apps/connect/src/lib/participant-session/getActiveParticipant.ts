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

export function getParticipantSession(slug: string): StoredParticipantProfile | null {
    const raw = localStorage.getItem(`connect:${slug}:participant`);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as StoredParticipantProfile;
    } catch {
      return null;
    }
  }