import { addStoredParticipantProfile } from "../../../lib/participant-session/addStoredParticipantProfile";
import type { StoredParticipantProfilesState } from "../../../lib/participant-session/getStoredParticipantProfiles";

export type SaveStoredProfileInput = {
  participantId: string;
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  label?: string;
  recoveryToken?: string;
  allowTest?: boolean;
  managedByParticipantId?: string;
  defaultGedcomPersonId?: string;
  setAsActive?: boolean;
};

export function saveStoredProfile(
  slug: string,
  input: SaveStoredProfileInput,
): StoredParticipantProfilesState {
  return addStoredParticipantProfile(slug, input);
}