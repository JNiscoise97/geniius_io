import { supabase } from "../../../lib/supabase/client";

export type MyPersonMemoryToBeApproved = {
  id: string;
  event_slug: string;
  participant_id: string;
  person_id: string;
  content: string;
  moderation_status: "pending" | "approved" | "rejected";
  moderator_comment: string | null;
  submitted_at: string;
  moderated_at: string | null;
  updated_at: string;
};

export async function getMyPersonMemoryToBeApproved(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
}): Promise<MyPersonMemoryToBeApproved | null> {
  const { eventSlug, participantId, personId } = params;

  const { data, error } = await supabase
    .from("family_person_memories")
    .select(
      "id, event_slug, participant_id, person_id, content, moderation_status, moderator_comment, submitted_at, moderated_at, updated_at",
    )
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .eq("person_id", personId)
    .maybeSingle();

  if (error) throw error;

  return (data ?? null) as MyPersonMemoryToBeApproved | null;
}