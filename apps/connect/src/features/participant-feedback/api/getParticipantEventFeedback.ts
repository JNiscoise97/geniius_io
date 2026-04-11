import { supabase } from "../../../lib/supabase/client";
import type { ParticipantEventFeedbackRow } from "../types/participantFeedbackTypes";

export async function getParticipantEventFeedback(
  eventSlug: string,
  participantId: string
): Promise<ParticipantEventFeedbackRow | null> {
  const { data, error } = await supabase
    .from("participant_event_feedback")
    .select("*")
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .maybeSingle<ParticipantEventFeedbackRow>();

  if (error) {
    throw new Error(
      `Impossible de charger l'avis du participant : ${error.message}`
    );
  }

  return data;
}