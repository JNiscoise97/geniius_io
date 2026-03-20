// deleteMyPersonPhoto.ts
import { supabase } from "../../../lib/supabase/client";

export async function deleteMyPersonPhoto(params: {
  photoId: string;
  participantId: string;
}): Promise<void> {
  const { photoId, participantId } = params;

  const { error } = await supabase
    .from("family_person_photos")
    .update({
      moderation_status: "deleted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", photoId)
    .eq("participant_id", participantId)
    .neq("moderation_status", "deleted");

  if (error) throw error;
}