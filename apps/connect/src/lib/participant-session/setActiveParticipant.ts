import {
  getStoredParticipantProfiles,
  type StoredParticipantProfilesState,
} from "./getStoredParticipantProfiles";

function getStorageKey(slug: string): string {
  return `connect:${slug}:device-profiles`;
}

function saveState(slug: string, state: StoredParticipantProfilesState) {
  localStorage.setItem(getStorageKey(slug), JSON.stringify(state));
}

export function setActiveParticipant(
  slug: string,
  participantId: string,
): boolean {
  const normalizedParticipantId = participantId.trim();
  if (!normalizedParticipantId) return false;

  const state = getStoredParticipantProfiles(slug);
  const exists = state.profiles.some(
    (profile) => profile.participantId === normalizedParticipantId,
  );

  if (!exists) return false;

  saveState(slug, {
    ...state,
    activeParticipantId: normalizedParticipantId,
  });

  return true;
}