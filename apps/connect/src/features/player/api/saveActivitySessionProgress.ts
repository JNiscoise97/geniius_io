// src/features/player/api/saveActivitySessionProgress.ts

import { supabase } from "../../../lib/supabase/client";
import type { ActivitySessionRow } from "./getOrCreateActivitySession";

export type SaveActivitySessionProgressInput = {
  sessionId: string;
  currentQuestionId: string | null;
  currentSectionId: string | null;
  currentIndex: number;
  score: number;
  pendingReviewScore: number;
  hasStarted?: boolean;
};

export async function saveActivitySessionProgress({
  sessionId,
  currentQuestionId,
  currentSectionId,
  currentIndex,
  score,
  pendingReviewScore,
  hasStarted,
}: SaveActivitySessionProgressInput): Promise<ActivitySessionRow> {
  const updatePayload: Record<string, unknown> = {
    current_question_id: currentQuestionId,
    current_section_id: currentSectionId,
    current_index: currentIndex,
    score,
    pending_review_score: pendingReviewScore,
    last_answered_at: new Date().toISOString(),
    status: "in_progress",
  };

  if (typeof hasStarted === "boolean") {
    updatePayload.has_started = hasStarted;
  }

  const { data, error } = await supabase
    .from("activity_sessions")
    .update(updatePayload)
    .eq("id", sessionId)
    .select("*")
    .single<ActivitySessionRow>();

  if (error || !data) {
    throw new Error(
      `Impossible de sauvegarder la progression d'activité: ${
        error?.message ?? "erreur inconnue"
      }`
    );
  }

  return data;
}