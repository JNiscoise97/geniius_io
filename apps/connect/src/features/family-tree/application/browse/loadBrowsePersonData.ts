import { getPersonContext, getPersonHeroConfig } from "../../config/configGenealogy";
import { getPersonReactionState } from "../../data/reactions/getPersonReactionState";
import { getPersonContributionStats } from "../../data/reactions/getPersonContributionStats";
import { getVisiblePersonMemories } from "../../data/memories/getVisiblePersonMemories";
import { getVisiblePersonPhotos } from "../../data/photos/getVisiblePersonPhotos";
import { getMyPersonVisibilityRequest } from "../../data/visibility/getMyPersonVisibilityRequest";
import { getMyPersonMemoryModerationCounts } from "../../data/memories/getMyPersonMemoryModerationCounts";
import { getMyPersonPhotoModerationCounts } from "../../data/photos/getMyPersonPhotoModerationCounts";
import { getTouchedParticipants } from "../../data/reactions/getTouchedParticipants";
import type { PersonUiOverride } from "../../data/profiles/uiOverrides";
import type { PersonVisibilityPreferenceMap } from "../../types/visibility";

export async function loadBrowsePersonData(params: {
  eventSlug: string;
  participantId: string | null;
  personId: string;
  visibilityPreferencesByPersonId: PersonVisibilityPreferenceMap;
  sosaReferencePersonId?: string | null;
  overridesByPersonId?: Record<string, PersonUiOverride>;
}) {
  const {
    eventSlug,
    participantId,
    personId,
    visibilityPreferencesByPersonId,
    sosaReferencePersonId,
    overridesByPersonId,
  } = params;

  const context = getPersonContext(
    personId,
    visibilityPreferencesByPersonId,
    sosaReferencePersonId,
    overridesByPersonId,
  );

  const heroConfig = getPersonHeroConfig(
    personId,
    visibilityPreferencesByPersonId,
    sosaReferencePersonId,
    overridesByPersonId,
  );

  if (!participantId) {
    return {
      context,
      heroConfig,
      reactionState: {
        knewPerson: false,
        heardOfPerson: false,
        touchedByPerson: false,
        reactionsCount: 0,
      },
      stats: {
        memoriesCount: 0,
        photosCount: 0,
        reactionsCount: 0,
        knownCount: 0,
        heardCount: 0,
      },
      visibleMemories: [],
      visiblePhotos: [],
      visibilityRequest: null,
      memoryCounts: {
        pending: 0,
        approved: 0,
        rejected: 0,
      },
      photoCounts: {
        pending: 0,
        approved: 0,
        rejected: 0,
      },
      touchedParticipants: [],
    };
  }

  const [
    reactionState,
    stats,
    visibleMemories,
    visiblePhotos,
    visibilityRequest,
    memoryCounts,
    photoCounts,
    touchedParticipants,
  ] = await Promise.all([
    getPersonReactionState({
      eventSlug,
      participantId,
      personId,
    }).catch(() => ({
      knewPerson: false,
      heardOfPerson: false,
      touchedByPerson: false,
      reactionsCount: 0,
    })),
    getPersonContributionStats({
      eventSlug,
      personId,
    }).catch(() => ({
      memoriesCount: 0,
      photosCount: 0,
      reactionsCount: 0,
      knownCount: 0,
      heardCount: 0,
    })),
    getVisiblePersonMemories({
      eventSlug,
      personId,
      currentParticipantId: participantId,
    }).catch(() => []),
    getVisiblePersonPhotos({
      eventSlug,
      personId,
      currentParticipantId: participantId,
    }).catch(() => []),
    getMyPersonVisibilityRequest({
      eventSlug,
      participantId,
      personId,
    }).catch(() => null),
    getMyPersonMemoryModerationCounts({
      eventSlug,
      participantId,
      personId,
    }).catch(() => ({
      pending: 0,
      approved: 0,
      rejected: 0,
    })),
    getMyPersonPhotoModerationCounts({
      eventSlug,
      participantId,
      personId,
    }).catch(() => ({
      pending: 0,
      approved: 0,
      rejected: 0,
    })),
    getTouchedParticipants({
      eventSlug,
      personId,
    }).catch(() => []),
  ]);

  return {
    context,
    heroConfig,
    reactionState,
    stats,
    visibleMemories,
    visiblePhotos,
    visibilityRequest,
    memoryCounts,
    photoCounts,
    touchedParticipants,
  };
}