import type { FamilyTreeRole } from "../../family-tree/types/permissions";

export type AdminParticipantListItem = {
  participantId: string;
  eventSlug: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  birthYear: number | null;
  email: string | null;
  phone: string | null;
  allowNameInFamilyTree: boolean | null;
  hasConnectedIdentity: boolean;
};

export type AdminParticipantConsents = {
  completed: boolean;
  consentVersion: number | null;
  pageSeenAt: string | null;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  allowNameInFamilyTree: boolean | null;
  allowPhotoInFamilyTree: boolean | null;
  allowInfoInFamilyTree: boolean | null;

  allowFamilyPhotoSharing: boolean | null;
  allowPhotoDisplayInApp: boolean | null;
  allowEventPhotoMemory: boolean | null;

  allowContactDetailsWithFamily: boolean | null;
  allowFutureFamilyContact: boolean | null;

  allowGenealogyEnrichment: boolean | null;
  allowGenealogyContributionStorage: boolean | null;

  allowNameInEventActivities: boolean | null;
  allowParticipationInGames: boolean | null;

  otherPreferences: string | null;
};

export type AdminParticipantTrackingPageItem = {
  pageKey: string;
  sessions: number;
  visibleMs: number;
  engagedMs: number;
  eventCount: number;
  lastLeftAt: string | null;
};

export type AdminParticipantTrackingTreeItem = {
  personId: string;
  personLabel: string;
  views: number;
  visibleMs: number;
  engagedMs: number;
  eventCount: number;
  lastLeftAt: string | null;
};

export type AdminParticipantTrackingSummary = {
  pageSessionsCount: number;
  pageDistinctCount: number;
  totalPageVisibleMs: number;
  totalPageEngagedMs: number;
  totalPageEventCount: number;
  lastPageActivityAt: string | null;

  treeViewsCount: number;
  treeDistinctPeopleCount: number;
  totalTreeVisibleMs: number;
  totalTreeEngagedMs: number;
  totalTreeEventCount: number;
  lastTreeActivityAt: string | null;

  topPages: AdminParticipantTrackingPageItem[];
  topTreePeople: AdminParticipantTrackingTreeItem[];
};

export type AdminParticipantDetails = {
  participantId: string;
  eventSlug: string;

  firstName: string;
  lastName: string;
  nickname: string;
  birthYear: number | null;

  email: string;
  phone: string;
  messenger: string;
  hasWhatsapp: boolean;

  preferredContactChannels: string[];

  allowNameInFamilyTree: boolean | null;

  consents: AdminParticipantConsents | null;

  tracking: AdminParticipantTrackingSummary;

  roles: FamilyTreeRole[];
};