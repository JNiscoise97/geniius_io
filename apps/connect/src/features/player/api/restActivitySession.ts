// src/features/player/api/resetActivitySession.ts

import { supabase } from "../../../lib/supabase/client";
import type { ActivitySessionRow } from "./getOrCreateActivitySession";

export type ResetActivitySessionInput = {
  sessionId: string;
};

export async function resetActivitySession({
  sessionId,
}: ResetActivitySessionInput): Promise<ActivitySessionRow> {
  const [{ error: answersError }, { error: reviewError }, { data, error }] =
    await Promise.all([
      supabase.from("activity_answers").delete().eq("session_id", sessionId),
      supabase.from("activity_review_queue").delete().eq("session_id", sessionId),
      supabase
        .from("activity_sessions")
        .update({
          status: "in_progress",
          current_question_id: null,
          current_section_id: null,
          current_index: 0,
          score: 0,
          pending_review_score: 0,
          completed_at: null,
          last_answered_at: null,
          has_started: false,
        })
        .eq("id", sessionId)
        .select("*")
        .single<ActivitySessionRow>(),
    ]);

  if (answersError) {
    throw new Error(
      `Impossible de réinitialiser les réponses d'activité: ${answersError.message}`
    );
  }

  if (reviewError) {
    throw new Error(
      `Impossible de réinitialiser la file de revue d'activité: ${reviewError.message}`
    );
  }

  if (error || !data) {
    throw new Error(
      `Impossible de réinitialiser la session d'activité: ${
        error?.message ?? "erreur inconnue"
      }`
    );
  }

  return data;
}