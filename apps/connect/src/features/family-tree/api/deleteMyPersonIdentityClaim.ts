import { supabase } from "../../../lib/supabase/client";

export async function deleteMyPersonIdentityClaim(params: {
  eventSlug: string;
  participantId: string;
  personId?: string;
}): Promise<void> {
  const { eventSlug, participantId, personId } = params;

  let query = supabase
    .from("family_person_identity_claims")
    .delete()
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId);

  if (personId) {
    query = query.eq("person_id", personId);
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
}