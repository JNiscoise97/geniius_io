// src/features/moderation/types.ts

export type ModerationEntityType =
  | "memory"
  | "photo"
  | "relation"
  | "profile";

export type SupportedModerationEntityType = "memory" | "photo";

export type ModerationStatus = "pending" | "approved" | "rejected";

export type ModerationQueueItem = {
  id: string;
  type: ModerationEntityType;
  title: string;
  subtitle?: string;
  preview?: string;
  submittedAt: string;

  participantId?: string;
  participantLabel?: string;

  personId?: string;
  personLabel?: string;
};

export type ModerationMetaItem = {
  label: string;
  value: string;
};

export type ModerationEntityRecord = {
  id: string;
  type: ModerationEntityType;
  title: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  meta?: ModerationMetaItem[];
  moderationStatus: ModerationStatus;
  moderatorComment?: string | null;
  submittedAt?: string;
  moderatedAt?: string | null;
};

export type GetModerationEntityParams = {
  eventSlug: string;
  entityType: SupportedModerationEntityType;
  entityId: string;
};

export type ModerateEntityInput = {
  eventSlug: string;
  entityType: SupportedModerationEntityType;
  entityId: string;
  status: Exclude<ModerationStatus, "pending">;
  moderatorComment?: string;
};

export function isModerationEntityType(
  value: string | undefined,
): value is ModerationEntityType {
  return (
    value === "memory" ||
    value === "photo" ||
    value === "relation" ||
    value === "profile"
  );
}

export function isSupportedModerationEntityType(
  value: string | undefined,
): value is SupportedModerationEntityType {
  return value === "memory" || value === "photo";
}