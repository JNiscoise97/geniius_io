import type { FeedbackAnswers } from "../config/feedbackFormConfig";

export type ParticipantEventFeedbackRow = {
  id: string;
  event_slug: string;
  participant_id: string;
  global_rating: number;
  public_comment: string | null;
  allow_public_display: boolean;
  answers_json: FeedbackAnswers;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type UpsertParticipantEventFeedbackInput = {
  eventSlug: string;
  participantId: string;
  globalRating: number;
  publicComment?: string | null;
  allowPublicDisplay: boolean;
  answersJson: FeedbackAnswers;
};

export type PublicParticipantFeedbackItem = {
  id: string;
  participantId: string;
  participantLabel: string;
  globalRating: number;
  publicComment: string | null;
  submittedAt: string;
};