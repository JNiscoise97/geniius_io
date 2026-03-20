// src/features/moderation/types.ts

export type ModerationEntityType =
  | "memory"
  | "photo"
  | "relation"
  | "profile";

export type ModerationStatus = "pending" | "approved" | "rejected";

export type ModerationEntityRecord = {
  id: string;
  type: ModerationEntityType;
  title: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  meta?: Array<{ label: string; value: string }>;
  moderationStatus: ModerationStatus;
  moderatorComment?: string | null;
  submittedAt?: string;
  moderatedAt?: string | null;
};

export type ModerateEntityInput = {
  entityType: ModerationEntityType;
  entityId: string;
  status: Exclude<ModerationStatus, "pending">;
  moderatorComment?: string;
};