// src/features/player/api/upsertActivityReviewQueueItem.ts

import { supabase } from "../../../lib/supabase/client";

export type ActivityReviewQueueRow = {
  id: string;
  session_id: string;
  answer_id: string;
  event_slug: string;
  activity_slug: string;
  participant_id: string;
  question_id: string;
  review_status: "pending" | "approved" | "rejected";
  moderator_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertActivityReviewQueueItemInput = {
  sessionId: string;
  answerId: string;
  eventSlug: string;
  activitySlug: string;
  participantId: string;
  questionId: string;
};

export async function upsertActivityReviewQueueItem({
  sessionId,
  answerId,
  eventSlug,
  activitySlug,
  participantId,
  questionId,
}: UpsertActivityReviewQueueItemInput): Promise<ActivityReviewQueueRow> {
  const { data, error } = await supabase
    .from("activity_review_queue")
    .upsert(
      {
        session_id: sessionId,
        answer_id: answerId,
        event_slug: eventSlug,
        activity_slug: activitySlug,
        participant_id: participantId,
        question_id: questionId,
        review_status: "pending",
        moderator_comment: null,
        reviewed_at: null,
      },
      {
        onConflict: "answer_id",
      }
    )
    .select("*")
    .single<ActivityReviewQueueRow>();

  if (error || !data) {
    throw new Error(
      `Impossible d'alimenter la file de revue d'activité: ${
        error?.message ?? "erreur inconnue"
      }`
    );
  }

  return data;
}