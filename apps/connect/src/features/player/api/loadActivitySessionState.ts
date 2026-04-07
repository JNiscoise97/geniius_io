// src/features/player/api/loadActivitySessionState.ts

import { supabase } from "../../../lib/supabase/client";
import type { ActivitySessionRow } from "./getOrCreateActivitySession";

export type ActivityAnswerRow = {
  id: string;
  session_id: string;
  event_slug: string;
  activity_slug: string;
  participant_id: string;
  question_id: string;
  section_id: string | null;
  question_type: string;
  answer_json: unknown;
  answer_text: string | null;
  is_answered: boolean;
  is_skipped: boolean;
  attempts_used: number;
  is_correct: boolean | null;
  is_manual_review: boolean;
  score_delta: number;
  pending_review_score: number;
  created_at: string;
  updated_at: string;
};

export type LoadedActivitySessionState = {
  session: ActivitySessionRow;
  answers: ActivityAnswerRow[];
};

export async function loadActivitySessionState(
  sessionId: string
): Promise<LoadedActivitySessionState> {
  const [{ data: session, error: sessionError }, { data: answers, error: answersError }] =
    await Promise.all([
      supabase
        .from("activity_sessions")
        .select("*")
        .eq("id", sessionId)
        .single<ActivitySessionRow>(),
      supabase
        .from("activity_answers")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .returns<ActivityAnswerRow[]>(),
    ]);

  if (sessionError || !session) {
    throw new Error(
      `Impossible de charger la session d'activité: ${
        sessionError?.message ?? "introuvable"
      }`
    );
  }

  if (answersError) {
    throw new Error(
      `Impossible de charger les réponses d'activité: ${answersError.message}`
    );
  }

  return {
    session,
    answers: answers ?? [],
  };
}