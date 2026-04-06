import type { ParticipantToPersonMap } from "../data/identity/getApprovedPersonIdsByParticipantId";
import type { ParticipantVisibilityPreferenceMap, PersonVisibilityPreferenceMap } from "../types/visibility";


type BuildPersonVisibilityPreferenceMapInput = {
  participantToPersonMap: ParticipantToPersonMap;
  preferencesByParticipantId: ParticipantVisibilityPreferenceMap;
};

export function buildPersonVisibilityPreferenceMap({
  participantToPersonMap,
  preferencesByParticipantId,
}: BuildPersonVisibilityPreferenceMapInput): PersonVisibilityPreferenceMap {
  const result: PersonVisibilityPreferenceMap = {};

  for (const [participantId, personId] of Object.entries(
    participantToPersonMap,
  )) {
    if (!personId) continue;

    result[personId] = preferencesByParticipantId[participantId];
  }

  return result;
}