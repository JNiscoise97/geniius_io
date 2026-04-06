import {
  getMyPersonIdentityClaims,
  type PersonIdentityClaim,
} from "../../data/identity/getMyPersonIdentityClaim";
import { getParticipantDefaultGedcomPersonId } from "../../data/profiles/getParticipantDefaultGedcomPersonId";

function normalizePersonId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export type FindMePageData = {
  claims: PersonIdentityClaim[];
  defaultGedcomPersonId: string | null;
  hasDefaultTreeEntry: boolean;
  hasApprovedClaim: boolean;
};

export async function loadFindMePageData(params: {
  eventSlug: string;
  participantId: string | null;
}): Promise<FindMePageData> {
  const { eventSlug, participantId } = params;

  if (!participantId) {
    return {
      claims: [],
      defaultGedcomPersonId: null,
      hasDefaultTreeEntry: false,
      hasApprovedClaim: false,
    };
  }

  const [claims, defaultGedcomPersonId] = await Promise.all([
    getMyPersonIdentityClaims({
      eventSlug,
      participantId,
    }).catch(() => []),
    getParticipantDefaultGedcomPersonId({
      eventSlug,
      participantId,
    }).catch(() => null),
  ]);

  const hasApprovedClaim = claims.some(
    (claim) =>
      claim.claim_status === "approved" && Boolean(normalizePersonId(claim.person_id)),
  );

  const normalizedDefaultGedcomPersonId = normalizePersonId(defaultGedcomPersonId);

  return {
    claims,
    defaultGedcomPersonId: normalizedDefaultGedcomPersonId,
    hasDefaultTreeEntry: Boolean(normalizedDefaultGedcomPersonId),
    hasApprovedClaim,
  };
}