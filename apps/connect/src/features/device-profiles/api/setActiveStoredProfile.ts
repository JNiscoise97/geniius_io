import { setActiveParticipant } from "../../../lib/participant-session/setActiveParticipant";
import { getStoredParticipantProfiles } from "../../../lib/participant-session/getStoredParticipantProfiles";

export function setActiveStoredProfile(
  slug: string,
  participantId: string,
): boolean {
  const ok = setActiveParticipant(slug, participantId);

  if (!ok) return false;

  const state = getStoredParticipantProfiles(slug);
  const activeProfile =
    state.profiles.find((profile) => profile.participantId === participantId) ??
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

  return true;
}