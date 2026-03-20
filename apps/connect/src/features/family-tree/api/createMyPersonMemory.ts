import { supabase } from "../../../lib/supabase/client";

export async function createMyPersonMemory(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
  content: string;
}): Promise<void> {
  const { eventSlug, participantId, personId, content } = params;

  const { error } = await supabase.from("family_person_memories").insert({
    event_slug: eventSlug,
    participant_id: participantId,
    person_id: personId,
    content,
    moderation_status: "pending",
    moderator_comment: null,
    moderated_at: null,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}