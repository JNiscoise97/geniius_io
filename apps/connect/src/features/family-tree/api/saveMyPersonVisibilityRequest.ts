import { supabase } from "../../../lib/supabase/client";

export async function saveMyPersonVisibilityRequest(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
}): Promise<void> {
  const { eventSlug, participantId, personId } = params;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("family_person_visibility_requests")
    .upsert(
      {
        event_slug: eventSlug,
        participant_id: participantId,
        person_id: personId,
        request_status: "pending",
        moderator_comment: null,
        moderated_at: null,
        updated_at: now,
        submitted_at: now,
      },
      {
        onConflict: "event_slug,participant_id,person_id",
      },
    );

  if (error) {
    throw error;
  }
}