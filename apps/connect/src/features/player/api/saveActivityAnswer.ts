// src/features/player/api/saveActivityAnswer.ts

import { supabase } from "../../../lib/supabase/client";

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
  updated_at: string;
};

export type SaveActivityAnswerInput = {
  sessionId: string;
  eventSlug: string;
  activitySlug: string;
  participantId: string;
  questionId: string;
  sectionId?: string | null;
  questionType: string;
  answerJson: unknown;
  answerText?: string | null;
  isAnswered: boolean;
  isSkipped: boolean;
  attemptsUsed: number;
  isCorrect: boolean | null;
  isManualReview: boolean;
  scoreDelta: number;
  pendingReviewScore: number;
};

export async function saveActivityAnswer(
  input: SaveActivityAnswerInput
): Promise<ActivityAnswerRow> {
  const payload = {
    session_id: input.sessionId,
    event_slug: input.eventSlug,
    activity_slug: input.activitySlug,
    participant_id: input.participantId,
    question_id: input.questionId,
    section_id: input.sectionId ?? null,
    question_type: input.questionType,
    answer_json: input.answerJson,
    answer_text: input.answerText ?? null,
    is_answered: input.isAnswered,
    is_skipped: input.isSkipped,
    attempts_used: input.attemptsUsed,
    is_correct: input.isCorrect,
    is_manual_review: input.isManualReview,
    score_delta: input.scoreDelta,
    pending_review_score: input.pendingReviewScore,
  };

  const { data, error } = await supabase
    .from("activity_answers")
    .upsert(payload, {
      onConflict: "session_id,question_id",
    })
    .select("*")
    .single<ActivityAnswerRow>();

  if (error || !data) {
    throw new Error(
      `Impossible d'enregistrer la réponse d'activité: ${
        error?.message ?? "erreur inconnue"
      }`
    );
  }

  return data;
}