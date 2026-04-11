import { supabase } from "../../../lib/supabase/client";
import type { PublicParticipantFeedbackItem } from "../types/participantFeedbackTypes";

type FeedbackRow = {
  id: string;
  participant_id: string;
  global_rating: number;
  public_comment: string | null;
  submitted_at: string;
};

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  email: string | null;
};

function getParticipantLabel(participant: ParticipantRow | undefined): string {
  if (!participant) {
    return "Participant";
  }

  const nickname = participant.nickname?.trim();
  if (nickname) {
    return nickname;
  }

  const fullName = [participant.first_name, participant.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  return participant.email?.trim() || "Participant";
}

export async function listPublicParticipantEventFeedback(
  eventSlug: string
): Promise<PublicParticipantFeedbackItem[]> {
  const { data: feedbackRows, error: feedbackError } = await supabase
    .from("participant_event_feedback")
    .select("id, participant_id, global_rating, public_comment, submitted_at")
    .eq("event_slug", eventSlug)
    .eq("allow_public_display", true)
    .order("submitted_at", { ascending: false })
    .returns<FeedbackRow[]>();

  if (feedbackError) {
    throw new Error(
      `Impossible de charger les avis partagés : ${feedbackError.message}`
    );
  }

  const participantIds = Array.from(
    new Set((feedbackRows ?? []).map((row) => row.participant_id))
  );

  let participantsById = new Map<string, ParticipantRow>();

  if (participantIds.length > 0) {
    const { data: participants, error: participantsError } = await supabase
      .from("participants")
      .select("id, first_name, last_name, nickname, email")
      .in("id", participantIds)
      .returns<ParticipantRow[]>();

    if (participantsError) {
      throw new Error(
        `Impossible de charger les participants des avis : ${participantsError.message}`
      );
    }

    participantsById = new Map((participants ?? []).map((row) => [row.id, row]));
  }

  return (feedbackRows ?? []).map((row) => ({
    id: row.id,
    participantId: row.participant_id,
    participantLabel: getParticipantLabel(participantsById.get(row.participant_id)),
    globalRating: row.global_rating,
    publicComment: row.public_comment,
    submittedAt: row.submitted_at,
  }));
}