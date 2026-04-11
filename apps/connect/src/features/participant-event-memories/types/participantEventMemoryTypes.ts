import type { ParticipantEventMemoryMood } from "../config/participantEventMemoryConfig";

export type ParticipantEventMemoryModerationStatus =
  | "pending"
  | "approved"
  | "rejected";

export type ParticipantEventMemoryMediaKind = "text" | "video";

export type ParticipantEventMemoryRow = {
  id: string;
  event_slug: string;
  participant_id: string;
  media_kind: ParticipantEventMemoryMediaKind;
  title: string | null;
  content: string | null;
  mood: ParticipantEventMemoryMood | null;
  allow_public_display: boolean;
  moderation_status: ParticipantEventMemoryModerationStatus;
  moderator_comment: string | null;
  submitted_at: string;
  moderated_at: string | null;
  updated_at: string;
};

export type CreateParticipantEventMemoryInput = {
  eventSlug: string;
  participantId: string;
  mediaKind?: ParticipantEventMemoryMediaKind;
  title?: string | null;
  content?: string | null;
  mood?: ParticipantEventMemoryMood | null;
  allowPublicDisplay: boolean;
};

export type EventMemoryFeedItem = {
  id: string;
  participantId: string;
  participantLabel: string;
  isMine: boolean;
  mediaKind: ParticipantEventMemoryMediaKind;
  title: string | null;
  content: string | null;
  mood: ParticipantEventMemoryMood | null;
  allowPublicDisplay: boolean;
  moderationStatus: ParticipantEventMemoryModerationStatus;
  moderatorComment: string | null;
  submittedAt: string;
  moderatedAt: string | null;
  updatedAt: string;
};

export type AdminParticipantEventMemoryItem = {
  id: string;
  participantId: string;
  participantLabel: string;
  participantEmail: string | null;
  mediaKind: ParticipantEventMemoryMediaKind;
  title: string | null;
  content: string | null;
  mood: ParticipantEventMemoryMood | null;
  allowPublicDisplay: boolean;
  moderationStatus: ParticipantEventMemoryModerationStatus;
  moderatorComment: string | null;
  submittedAt: string;
  moderatedAt: string | null;
  updatedAt: string;
};