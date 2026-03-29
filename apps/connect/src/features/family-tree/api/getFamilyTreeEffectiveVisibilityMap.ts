import { supabase } from "../../../lib/supabase/client";
import type { PersonVisibilityPreferenceMap } from "../types";

const FULL_VISIBILITY = {
  allowNameInFamilyTree: true,
  allowPhotoInFamilyTree: true,
  allowInfoInFamilyTree: true,
};

export async function getFamilyTreeEffectiveVisibilityMap({
  eventSlug,
}: {
  eventSlug: string;
}): Promise<PersonVisibilityPreferenceMap> {
  const [claimsResult, approvedVisibilityRequestsResult] = await Promise.all([
    supabase
      .from("family_person_identity_claims")
      .select("participant_id, person_id")
      .eq("event_slug", eventSlug)
      .eq("claim_status", "approved"),

    supabase
      .from("family_person_visibility_requests")
      .select("participant_id, person_id")
      .eq("event_slug", eventSlug)
      .eq("request_status", "approved"),
  ]);

  if (claimsResult.error) {
    throw claimsResult.error;
  }

  if (approvedVisibilityRequestsResult.error) {
    throw approvedVisibilityRequestsResult.error;
  }

  const validatedClaims = claimsResult.data ?? [];
  const approvedVisibilityRequests =
    approvedVisibilityRequestsResult.data ?? [];

  const participantIds = [
    ...new Set(
      validatedClaims
        .map((claim) => claim.participant_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const result: PersonVisibilityPreferenceMap = {};

  if (participantIds.length > 0) {
    const { data: consents, error: consentsError } = await supabase
      .from("participant_consents")
      .select(`
        participant_id,
        allow_name_in_family_tree,
        allow_photo_in_family_tree,
        allow_info_in_family_tree,
        completed
      `)
      .in("participant_id", participantIds);

    if (consentsError) {
      throw consentsError;
    }

    const consentsByParticipantId = new Map(
      (consents ?? []).map((pref) => [
        pref.participant_id,
        {
          allowNameInFamilyTree: pref.allow_name_in_family_tree,
          allowPhotoInFamilyTree: pref.allow_photo_in_family_tree,
          allowInfoInFamilyTree: pref.allow_info_in_family_tree,
        },
      ]),
    );

    for (const claim of validatedClaims) {
      const personId = claim.person_id?.trim();
      if (!personId) continue;

      const prefs = consentsByParticipantId.get(claim.participant_id);
      if (!prefs) continue;

      result[personId] = prefs;
    }
  }

  for (const request of approvedVisibilityRequests) {
    const personId = request.person_id?.trim();
    if (!personId) continue;

    result[personId] = FULL_VISIBILITY;
  }

  return result;
}

/**
 * Alias de compatibilité temporaire pour éviter de casser l’existant.
 */
export const getFamilyTreeVisibilityPreferencesMap =
  getFamilyTreeEffectiveVisibilityMap;