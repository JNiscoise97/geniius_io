export type SupportedModerationEntityType =
  | "memory"
  | "photo"
  | "visibility_request"
  | "identity_claim";

export type ModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "auto_verified";

export type ModerationQueueItem = {
  id: string;
  type: SupportedModerationEntityType;
  title: string;
  subtitle?: string;
  preview?: string;
  submittedAt: string;
  participantId?: string | null;
  participantLabel?: string | null;
  personId?: string | null;
  personLabel?: string | null;
};

export type ModerationMetaItem = {
  label: string;
  value: string;
};

export type ModerationActionMode = "approve_reject" | "approve_only";

export type ModerationEntityRecord = {
  id: string;
  type: SupportedModerationEntityType;
  title: string;
  subtitle?: string;
  content?: string | null;
  imageUrl?: string | null;
  moderationStatus: ModerationStatus;
  moderatorComment?: string | null;
  submittedAt?: string | null;
  moderatedAt?: string | null;
  participantId?: string | null;
  participantLabel?: string | null;
  personId?: string | null;
  personLabel?: string | null;
  meta?: ModerationMetaItem[];
  actionMode: ModerationActionMode;
  expectedGedcomPersonId?: string | null;
};

export function isSupportedModerationEntityType(
  value?: string | null,
): value is SupportedModerationEntityType {
  return (
    value === "memory" ||
    value === "photo" ||
    value === "visibility_request" ||
    value === "identity_claim"
  );
}