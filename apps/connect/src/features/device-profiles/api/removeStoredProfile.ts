import {
  getStoredParticipantProfiles,
  type StoredParticipantProfilesState,
} from "../../../lib/participant-session/getStoredParticipantProfiles";
import { notifyParticipantSessionChanged } from "../../../lib/participant-session/sessionEvents";

function getStorageKey(slug: string): string {
  return `connect:${slug}:device-profiles`;
}

function saveState(slug: string, state: StoredParticipantProfilesState) {
  localStorage.setItem(getStorageKey(slug), JSON.stringify(state));
}

export function removeStoredProfile(
  slug: string,
  participantId: string,
): StoredParticipantProfilesState {
  const normalizedParticipantId = participantId.trim();
  const state = getStoredParticipantProfiles(slug);

  if (!normalizedParticipantId) {
    return state;
  }

  const profiles = state.profiles.filter(
    (profile) => profile.participantId !== normalizedParticipantId,
  );

  const activeParticipantId =
    state.activeParticipantId === normalizedParticipantId
      ? profiles[0]?.participantId ?? null
      : state.activeParticipantId;

  const nextState: StoredParticipantProfilesState = {
    activeParticipantId,
    profiles,
  };

  saveState(slug, nextState);

  if (activeParticipantId) {
    const activeProfile =
      profiles.find((profile) => profile.participantId === activeParticipantId) ??
      null;

    if (activeProfile) {
      localStorage.setItem(
        `connect:${slug}:participant`,
        JSON.stringify({
          participantId: activeProfile.participantId,
          firstName: activeProfile.firstName,
          lastName: activeProfile.lastName,
          birthYear: activeProfile.birthYear,
          recoveryToken: activeProfile.recoveryToken,
          allowTest: activeProfile.allowTest
        }),
      );
    }
  } else {
    localStorage.removeItem(`connect:${slug}:participant`);
  }
notifyParticipantSessionChanged();
  return nextState;
}