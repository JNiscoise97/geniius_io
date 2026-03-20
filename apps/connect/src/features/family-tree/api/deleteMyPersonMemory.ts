import { supabase } from "../../../lib/supabase/client";

export async function deleteMyPersonMemory(params: {
  memoryId: string;
  participantId: string;
}): Promise<void> {
  const { memoryId, participantId } = params;

  const { error } = await supabase
    .from("family_person_memories")
    .update({
      moderation_status: "deleted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", memoryId)
    .eq("participant_id", participantId)
    .neq("moderation_status", "deleted");

  if (error) throw error;
}