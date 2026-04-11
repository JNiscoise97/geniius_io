import { supabase } from "../../../lib/supabase/client";
import type {
  ParticipantEventMemoryModerationStatus,
  ParticipantEventMemoryRow,
} from "../types/participantEventMemoryTypes";

export async function moderateParticipantEventMemory(params: {
  memoryId: string;
  moderationStatus: Exclude<
    ParticipantEventMemoryModerationStatus,
    "pending"
  >;
  moderatorComment?: string | null;
}): Promise<ParticipantEventMemoryRow> {
  const { data, error } = await supabase
    .from("participant_event_memories")
    .update({
      moderation_status: params.moderationStatus,
      moderator_comment: params.moderatorComment?.trim() || null,
      moderated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.memoryId)
    .select("*")
    .single<ParticipantEventMemoryRow>();

  if (error || !data) {
    throw new Error(
      `Impossible de modérer le témoignage : ${
        error?.message ?? "erreur inconnue"
      }`
    );
  }

  return data;
}