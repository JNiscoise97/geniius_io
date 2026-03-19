import { supabase } from "../../../lib/supabase/client";

export async function saveMyPersonMemory(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
  content: string;
}): Promise<void> {
  const { eventSlug, participantId, personId, content } = params;

  const { error } = await supabase
    .from("family_person_memories")
    .upsert(
      {
        event_slug: eventSlug,
        participant_id: participantId,
        person_id: personId,
        content,
        moderation_status: "pending",
        moderator_comment: null,
        moderated_at: null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "event_slug,participant_id,person_id",
      },
    );

  if (error) throw error;
}