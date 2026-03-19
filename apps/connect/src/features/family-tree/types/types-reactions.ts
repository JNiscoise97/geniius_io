export type FamilyReactionType =
  | "knew_person"
  | "heard_of_person"
  | "touched_by_person";

export type FamilyPersonReactionSummary = {
  knewPerson: boolean;
  heardOfPerson: boolean;
  touchedByPerson: boolean;
  reactionsCount: number;
};

export type FamilyPersonMemory = {
  id: string;
  eventSlug: string;
  participantId: string;
  personId: string;
  content: string;
  moderationStatus: "pending" | "approved" | "rejected";
  submittedAt: string;
  updatedAt: string;
};

export type FamilyPersonPhoto = {
  id: string;
  eventSlug: string;
  participantId: string;
  personId: string;
  storagePath: string;
  caption?: string | null;
  moderationStatus: "pending" | "approved" | "rejected";
  submittedAt: string;
};

export type FamilyPersonContributionStats = {
  memoriesCount: number;
  photosCount: number;
  reactionsCount: number;
};