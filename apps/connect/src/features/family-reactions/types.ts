import type { LucideIcon } from "lucide-react";

export type FamilyReactionKind =
  | "photo"
  | "memory"
  | "touched_by_person"
  | "heard_of_person"
  | "knew_person";

export type FamilyReactionAudience = "mine" | "all";

export type FamilyReactionFeedItem = {
  id: string;
  eventSlug: string;
  personId: string;
  personLabel: string;
  participantId: string;
  participantLabel: string;
  kind: FamilyReactionKind;
  createdAt: string;
  updatedAt?: string | null;
  text: string;
  subtext?: string | null;
  isMine: boolean;

  storagePath?: string | null;
  publicUrl?: string | null;
};

export type FamilyReactionSectionKey =
  | "today"
  | "yesterday"
  | "week"
  | "older";

export type FamilyReactionSection = {
  key: FamilyReactionSectionKey;
  title: string;
  items: FamilyReactionFeedItem[];
};

export type FamilyReactionMeta = {
  label: string;
  icon: LucideIcon;
};

export type FamilyReactionTypeFilter = "all" | FamilyReactionKind;