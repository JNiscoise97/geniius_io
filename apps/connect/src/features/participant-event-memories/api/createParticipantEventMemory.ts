import { supabase } from "../../../lib/supabase/client";
import type {
  CreateParticipantEventMemoryInput,
  ParticipantEventMemoryRow,
} from "../types/participantEventMemoryTypes";

export async function createParticipantEventMemory(
  input: CreateParticipantEventMemoryInput
): Promise<ParticipantEventMemoryRow> {
  const mediaKind = input.mediaKind ?? "text";

  const { data, error } = await supabase
    .from("participant_event_memories")
    .insert({
      event_slug: input.eventSlug,
      participant_id: input.participantId,
      media_kind: mediaKind,
      title: input.title?.trim() || null,
      content: input.content?.trim() || null,
      mood: input.mood ?? null,
      allow_public_display: input.allowPublicDisplay,
      moderation_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single<ParticipantEventMemoryRow>();

  if (error || !data) {
    throw new Error(
      `Impossible d'enregistrer le témoignage : ${
        error?.message ?? "erreur inconnue"
      }`
    );
  }

  return data;
}