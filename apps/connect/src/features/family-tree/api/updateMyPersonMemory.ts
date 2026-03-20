import { supabase } from "../../../lib/supabase/client";

export async function updateMyPersonMemory(params: {
  memoryId: string;
  participantId: string;
  content: string;
}): Promise<void> {
  const { memoryId, participantId, content } = params;

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
}