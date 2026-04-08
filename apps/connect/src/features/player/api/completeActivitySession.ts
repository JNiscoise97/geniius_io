// src/features/player/api/completeActivitySession.ts

import { supabase } from "../../../lib/supabase/client";
import type { ActivitySessionRow } from "./getOrCreateActivitySession";

export type CompleteActivitySessionInput = {
  sessionId: string;
  score?: number;
  pendingReviewScore?: number;
};

export async function completeActivitySession({
  sessionId,
  score,
  pendingReviewScore,
}: CompleteActivitySessionInput): Promise<ActivitySessionRow> {
  const nowIso = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    status: "completed",
    completed_at: nowIso,
    last_answered_at: nowIso,
    current_question_id: null,
    current_section_id: null,
  };

  if (typeof score === "number") {
    updatePayload.score = score;
  }

  if (typeof pendingReviewScore === "number") {
    updatePayload.pending_review_score = pendingReviewScore;
  }

  const { data, error } = await supabase
    .from("activity_sessions")
    .update(updatePayload)
    .eq("id", sessionId)
    .select("*")
    .single<ActivitySessionRow>();

  if (error || !data) {
    throw new Error(
      `Impossible de terminer la session d'activité: ${
        error?.message ?? "erreur inconnue"
      }`
    );
  }

  return data;
}