import { supabase } from "../../../lib/supabase/client";
import type { PersonVisibilityPreferenceMap } from "../types";

function toBooleanAllowInfo(value: "yes" | "no" | null | undefined): boolean {
  return value === "yes";
}

export async function getFamilyTreeVisibilityPreferencesMap({
  eventSlug,
}: {
  eventSlug: string;
}): Promise<PersonVisibilityPreferenceMap> {
  const { data: claims, error: claimsError } = await supabase
    .from("family_person_identity_claims")
    .select("participant_id, person_id")
    .eq("event_slug", eventSlug)
    .in("claim_status", ["approved", "auto_verified"]);

  if (claimsError) {
    throw claimsError;
  }

  const validatedClaims = claims ?? [];
  if (validatedClaims.length === 0) {
    return {};
  }

  const participantIds = [
    ...new Set(validatedClaims.map((claim) => claim.participant_id)),
  ];

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
        allowInfoInFamilyTree: toBooleanAllowInfo(
          pref.allow_info_in_family_tree,
        ),
      },
    ]),
  );

  const result: PersonVisibilityPreferenceMap = {};

  for (const claim of validatedClaims) {
    const personId = claim.person_id?.trim();
    if (!personId) continue;

    const prefs = consentsByParticipantId.get(claim.participant_id);
    if (!prefs) continue;

    result[personId] = prefs;
  }

  return result;
}