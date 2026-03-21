import { supabase } from "../../../lib/supabase/client";

export type PersonParticipantProfile = {
  participantId: string;
  city: string;
  occupation: string;
  interests: string;
  freeShare: string;
};

type GetPersonParticipantProfileInput = {
  eventSlug: string;
  personId: string;
};

export async function getPersonParticipantProfile({
  eventSlug,
  personId,
}: GetPersonParticipantProfileInput): Promise<PersonParticipantProfile | null> {
  const claimRes = await supabase
    .from("family_person_identity_claims")
    .select("participant_id")
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .in("claim_status", ["approved", "auto_verified"])
    .maybeSingle();

  if (claimRes.error) {
    throw new Error(claimRes.error.message);
  }

  const participantId = claimRes.data?.participant_id;
  if (!participantId) return null;

  const consentRes = await supabase
    .from("participant_consents")
    .select("allow_info_in_family_tree")
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .maybeSingle();

  if (consentRes.error) {
    throw new Error(consentRes.error.message);
  }

  if (consentRes.data?.allow_info_in_family_tree !== true) {
    return null;
  }

  const profileRes = await supabase
    .from("participant_profile")
    .select("city, occupation, interests, free_share")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (profileRes.error) {
    throw new Error(profileRes.error.message);
  }

  if (!profileRes.data) return null;

  const city = profileRes.data.city?.trim() ?? "";
  const occupation = profileRes.data.occupation?.trim() ?? "";
  const interests = profileRes.data.interests?.trim() ?? "";
  const freeShare = profileRes.data.free_share?.trim() ?? "";

  if (!city && !occupation && !interests && !freeShare) {
    return null;
  }

  return {
    participantId,
    city,
    occupation,
    interests,
    freeShare,
  };
}