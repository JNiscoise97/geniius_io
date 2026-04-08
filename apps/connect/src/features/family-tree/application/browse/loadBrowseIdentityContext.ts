import { getMyPersonIdentityClaim } from "../../data/identity/getMyPersonIdentityClaim";
import { getParticipantDefaultGedcomPersonId } from "../../data/profiles/getParticipantDefaultGedcomPersonId";
import { getFamilyTreeEffectiveVisibilityMap } from "../../data/visibility/getFamilyTreeEffectiveVisibilityMap";
import { getMergedPersonOverridesMap } from "../../data/profiles/getMergedPersonOverridesMap";
import type { PersonUiOverride } from "../../data/profiles/uiOverrides";
import type { PersonVisibilityPreferenceMap } from "../../types/visibility";

function normalizePersonId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export type BrowseIdentityContext = {
  claimedPersonId: string | null;
  myIdentityClaimStatus: "pending" | "approved" | "rejected" | null;
  defaultGedcomPersonId: string | null;
  sourcePersonId: string | null;
  sosaReferencePersonId: string | null;
  visibilityPreferencesByPersonId: PersonVisibilityPreferenceMap;
  overridesByPersonId: Record<string, PersonUiOverride>;
};

export async function loadBrowseIdentityContext(params: {
  eventSlug: string;
  participantId: string | null;
}): Promise<BrowseIdentityContext> {
  const { eventSlug, participantId } = params;

  if (!participantId) {
    const [visibilityPreferencesByPersonId, overridesByPersonId] =
      await Promise.all([
        getFamilyTreeEffectiveVisibilityMap({
          eventSlug,
        }).catch(() => ({})),
        getMergedPersonOverridesMap(eventSlug).catch(() => ({})),
      ]);

    return {
      claimedPersonId: null,
      myIdentityClaimStatus: null,
      defaultGedcomPersonId: null,
      sourcePersonId: null,
      sosaReferencePersonId: null,
      visibilityPreferencesByPersonId,
      overridesByPersonId,
    };
  }

  const [
    claim,
    defaultGedcomPersonId,
    visibilityPreferencesByPersonId,
    overridesByPersonId,
  ] = await Promise.all([
    getMyPersonIdentityClaim({
      eventSlug,
      participantId,
    }).catch(() => null),
    getParticipantDefaultGedcomPersonId({
      eventSlug,
      participantId,
    }).catch(() => null),
    getFamilyTreeEffectiveVisibilityMap({
      eventSlug,
    }).catch(() => ({})),
    getMergedPersonOverridesMap(eventSlug).catch(() => ({})),
  ]);

  const claimedPersonId = normalizePersonId(claim?.person_id ?? null);
  const myIdentityClaimStatus = claim?.claim_status ?? null;

  const sourcePersonId =
    myIdentityClaimStatus === "approved" && claimedPersonId
      ? claimedPersonId
      : null;

  const sosaReferencePersonId =
    sourcePersonId ?? normalizePersonId(defaultGedcomPersonId) ?? null;

  return {
    claimedPersonId,
    myIdentityClaimStatus,
    defaultGedcomPersonId: normalizePersonId(defaultGedcomPersonId),
    sourcePersonId,
    sosaReferencePersonId,
    visibilityPreferencesByPersonId,
    overridesByPersonId,
  };
}