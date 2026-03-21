import { supabase } from "../../../lib/supabase/client";

export async function updateMyPersonMemory(params: {
  memoryId: string;
  eventSlug: string;
  participantId: string;
  personId: string;
  content: string;
  participantFirstName?: string;
  participantLastName?: string;
  participantDisplayName?: string;
  personFirstName?: string;
  personLastName?: string;
  personDisplayName?: string;
}): Promise<void> {
  const {
    memoryId,
    eventSlug,
    participantId,
    personId,
    content,
    participantFirstName,
    participantLastName,
    participantDisplayName,
    personFirstName,
    personLastName,
    personDisplayName,
  } = params;

  const { error } = await supabase
    .from("family_person_memories")
    .update({
      content,
      moderation_status: "pending",
      moderator_comment: null,
      moderated_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memoryId)
    .eq("participant_id", participantId)
    .neq("moderation_status", "deleted");

  if (error) throw error;

  const { error: fnError } = await supabase.functions.invoke(
    "send-memory-moderation-notification",
    {
      body: {
        memoryId,
        eventSlug,
        participantId,
        personId,
        content,
        notificationType: "updated",
        participantFirstName,
        participantLastName,
        participantDisplayName,
        personFirstName,
        personLastName,
        personDisplayName,
      },
    },
  );

  if (fnError) {
    console.error(
      "[updateMyPersonMemory] notification moderation non envoyée",
      fnError,
    );
  }
}