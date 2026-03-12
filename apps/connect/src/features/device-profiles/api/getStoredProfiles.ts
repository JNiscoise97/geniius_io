import {
  getStoredParticipantProfiles,
  type StoredParticipantProfile,
  type StoredParticipantProfilesState,
} from "../../../lib/participant-session/getStoredParticipantProfiles";

export type DeviceStoredProfile = StoredParticipantProfile;
export type DeviceStoredProfilesState = StoredParticipantProfilesState;

export function getStoredProfiles(slug: string): DeviceStoredProfilesState {
  return getStoredParticipantProfiles(slug);
}