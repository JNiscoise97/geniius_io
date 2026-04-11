import { supabase } from "../../../lib/supabase/client";
import type {
  ParticipantEventFeedbackRow,
  UpsertParticipantEventFeedbackInput,
} from "../types/participantFeedbackTypes";

export async function upsertParticipantEventFeedback(
  input: UpsertParticipantEventFeedbackInput
): Promise<ParticipantEventFeedbackRow> {
  const nowIso = new Date().toISOString();

  const payload = {
    event_slug: input.eventSlug,
    participant_id: input.participantId,
    global_rating: input.globalRating,
    public_comment: input.publicComment ?? null,
    allow_public_display: input.allowPublicDisplay,
    answers_json: input.answersJson,
    submitted_at: nowIso,
    updated_at: nowIso,
  };

  const { data, error } = await supabase
    .from("participant_event_feedback")
    .upsert(payload, {
      onConflict: "event_slug,participant_id",
    })
    .select("*")
    .single<ParticipantEventFeedbackRow>();

  if (error || !data) {
    throw new Error(
      `Impossible d'enregistrer l'avis : ${
        error?.message ?? "erreur inconnue"
      }`
    );
  }

  return data;
}