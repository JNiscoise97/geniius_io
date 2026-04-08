import { supabase } from "../../../../lib/supabase/client";

export async function deleteMyPersonVisibilityRequest(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
}): Promise<void> {
  const { eventSlug, participantId, personId } = params;

  const { error } = await supabase
    .from("family_person_visibility_requests")
    .delete()
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .eq("person_id", personId);

  if (error) {
    throw error;
  }
}