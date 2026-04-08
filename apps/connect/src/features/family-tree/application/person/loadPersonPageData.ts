import { getFamilyTreeEffectiveVisibilityMap } from "../../data/visibility/getFamilyTreeEffectiveVisibilityMap";
import { getPersonParticipantProfile } from "../../data/profiles/getPersonParticipantProfile";
import { getMergedPersonOverridesMap } from "../../data/profiles/getMergedPersonOverridesMap";
import { getPersonContext, getPersonHeroConfig } from "../../config/configGenealogy";
import { FAMILY_GRAPH } from "../../api/loadGraph";

export async function loadPersonPageData(params: {
  eventSlug: string;
  personId: string;
}) {
  const { eventSlug, personId } = params;

  const personExists = Boolean(personId && FAMILY_GRAPH.people[personId]);

  if (!personExists) {
    return {
      personExists: false,
      visibilityPreferencesByPersonId: {},
      participantProfile: null,
      overridesByPersonId: {},
      context: null,
      heroConfig: null,
    };
  }

  const [visibilityPreferencesByPersonId, participantProfile, overridesByPersonId] =
    await Promise.all([
      getFamilyTreeEffectiveVisibilityMap({
        eventSlug,
      }).catch(() => ({})),
      getPersonParticipantProfile({
        eventSlug,
        personId,
      }).catch(() => null),
      getMergedPersonOverridesMap(eventSlug).catch(() => ({})),
    ]);

  const context = getPersonContext(
    personId,
    visibilityPreferencesByPersonId,
    undefined,
    overridesByPersonId,
  );

  const heroConfig = getPersonHeroConfig(
    personId,
    visibilityPreferencesByPersonId,
    undefined,
    overridesByPersonId,
  );

  return {
    personExists: true,
    visibilityPreferencesByPersonId,
    participantProfile,
    overridesByPersonId,
    context,
    heroConfig,
  };
}