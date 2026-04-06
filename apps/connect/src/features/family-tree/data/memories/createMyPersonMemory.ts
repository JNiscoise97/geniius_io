import { supabase } from "../../../../lib/supabase/client";

export async function createMyPersonMemory(params: {
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

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("family_person_memories")
    .insert({
      event_slug: eventSlug,
      participant_id: participantId,
      person_id: personId,
      content,
      moderation_status: "pending",
      moderator_comment: null,
      moderated_at: null,
      submitted_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) throw error;

  const memoryId = data.id as string;

  const { error: fnError } = await supabase.functions.invoke(
    "send-memory-moderation-notification",
    {
      body: {
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
      },
    },
  );

  if (fnError) {
    console.error(
      "[createMyPersonMemory] notification moderation non envoyée",
      fnError,
    );
  }
}