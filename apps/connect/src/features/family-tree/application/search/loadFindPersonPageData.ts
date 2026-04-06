import { buildFamilySearchIndex } from "../../domain/search/buildFamilySearchIndex";
import { searchPeople } from "../../domain/search/searchPeople";
import { FAMILY_GRAPH } from "../../api/loadGraph";
import { getMyPersonIdentityClaim } from "../../data/identity/getMyPersonIdentityClaim";
import { getParticipantDefaultGedcomPersonId } from "../../data/profiles/getParticipantDefaultGedcomPersonId";
import { getFamilyTreeEffectiveVisibilityMap } from "../../data/visibility/getFamilyTreeEffectiveVisibilityMap";
import { getMergedPersonOverridesMap } from "../../data/profiles/getMergedPersonOverridesMap";
import { getPersonContext } from "../../config/configGenealogy";
import { findRelationshipPath } from "../../domain/graph/findRelationshipPath";
import type { EnrichedPersonSearchResult } from "../../types/search";
import type { PersonSummary } from "../../types/person";

function normalizePersonId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getDisplaySearchPerson(
  person: PersonSummary,
  forceDisplayedPersonIds: string[],
): PersonSummary {
  if (forceDisplayedPersonIds.includes(person.id)) {
    return person;
  }

  if (
    person.canDisplay &&
    person.canDisplayName &&
    person.canDisplayPhoto &&
    person.canDisplayInfo
  ) {
    return person;
  }

  return {
    ...person,
    firstName:
      person.canDisplay && person.canDisplayName ? person.firstName : "Personne",
    lastName:
      person.canDisplay && person.canDisplayName ? person.lastName : "privée",
    nickname:
      person.canDisplay && person.canDisplayName ? person.nickname : undefined,
    photoSrc:
      person.canDisplay && person.canDisplayPhoto ? person.photoSrc : undefined,
    birthYear:
      person.canDisplay && person.canDisplayInfo ? person.birthYear : undefined,
    deathYear:
      person.canDisplay && person.canDisplayInfo ? person.deathYear : undefined,
    birthPlace:
      person.canDisplay && person.canDisplayInfo ? person.birthPlace : undefined,
    deathPlace:
      person.canDisplay && person.canDisplayInfo ? person.deathPlace : undefined,
    linkedSpouseLabel:
      person.canDisplay && person.canDisplayInfo
        ? person.linkedSpouseLabel
        : undefined,
    spouseRoleLabel:
      person.canDisplay && person.canDisplayInfo
        ? person.spouseRoleLabel
        : undefined,
    branch: person.canDisplay ? person.branch : undefined,
  };
}

function summarizeRelationshipPath(
  sourceDisplayName: string,
  pathLength: number | null,
): string | undefined {
  if (pathLength === null) return undefined;
  if (pathLength === 0) return `Tu es actuellement centré sur ${sourceDisplayName}.`;
  if (pathLength === 1) return `Cette personne est directement liée à ${sourceDisplayName}.`;
  return `Voici le chemin familial le plus court depuis ${sourceDisplayName}.`;
}

export async function loadFindPersonPageData(params: {
  eventSlug: string;
  participantId: string | null;
  centerId: string;
  query: string;
  limit?: number;
}) {
  const { eventSlug, participantId, centerId, query, limit = 10 } = params;

  const [
    claim,
    defaultGedcomPersonId,
    visibilityPreferencesByPersonId,
    overridesByPersonId,
  ] = await Promise.all([
    participantId
      ? getMyPersonIdentityClaim({
          eventSlug,
          participantId,
        }).catch(() => null)
      : Promise.resolve(null),
    participantId
      ? getParticipantDefaultGedcomPersonId({
          eventSlug,
          participantId,
        }).catch(() => null)
      : Promise.resolve(null),
    getFamilyTreeEffectiveVisibilityMap({
      eventSlug,
    }).catch(() => ({})),
    getMergedPersonOverridesMap(eventSlug).catch(() => ({})),
  ]);

  const claimedPersonId = normalizePersonId(claim?.person_id ?? null);
  const myIdentityClaimStatus = claim?.claim_status ?? null;

  const forceDisplayedPersonIds =
    claimedPersonId && myIdentityClaimStatus === "approved"
      ? [claimedPersonId]
      : [];

  const canSearchInTree = Boolean(normalizePersonId(defaultGedcomPersonId));
  const sosaReferencePersonId =
    myIdentityClaimStatus === "approved" && claimedPersonId
      ? claimedPersonId
      : normalizePersonId(defaultGedcomPersonId) ?? undefined;

  const searchIndex = buildFamilySearchIndex(
    FAMILY_GRAPH,
    visibilityPreferencesByPersonId,
    overridesByPersonId,
  );

  const rawResults = canSearchInTree
    ? searchPeople({
        query,
        documents: searchIndex,
        graph: FAMILY_GRAPH,
        centerPersonId: centerId,
        limit,
        forceDisplayedPersonIds,
      })
    : [];

  const source = getPersonContext(
    centerId,
    visibilityPreferencesByPersonId,
    sosaReferencePersonId,
    overridesByPersonId,
  ).person;

  const results: EnrichedPersonSearchResult[] = rawResults.map((result) => {
    const rawPerson = getPersonContext(
      result.personId,
      visibilityPreferencesByPersonId,
      sosaReferencePersonId,
      overridesByPersonId,
    ).person;

    const person = getDisplaySearchPerson(rawPerson, forceDisplayedPersonIds);

    const path = findRelationshipPath(FAMILY_GRAPH, centerId, result.personId);

    return {
      person,
      score: result.score,
      matchedOn: result.matchedOn,
      relationshipSummary: summarizeRelationshipPath(
        `${source.firstName} ${source.lastName}`.trim(),
        path ? path.length - 1 : null,
      ),
    };
  });

  return {
    canSearchInTree,
    claimedPersonId,
    myIdentityClaimStatus,
    defaultGedcomPersonId: normalizePersonId(defaultGedcomPersonId),
    visibilityPreferencesByPersonId,
    overridesByPersonId,
    forceDisplayedPersonIds,
    searchIndex,
    results,
  };
}