export type AdminParticipantListItem = {
  participantId: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  birthYear: number | null;
  email: string | null;
  phone: string | null;
  allowNameInFamilyTree: boolean;
  hasConnectedIdentity: boolean;
};

export type AdminParticipantDetails = {
  participantId: string;
  eventSlug: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  birthYear: number | null;
  email: string | null;
  phone: string | null;
  messenger: string | null;
  hasWhatsapp: boolean;
  preferredContactChannels: string[];
  allowNameInFamilyTree: boolean;
  hasConnectedIdentity: boolean;

  preferences: {
    completed: boolean;
    allowInfoInFamilyTreeMode: string | null;
    hideFamilyKnowledgeIntroNextTime: boolean;
    hideFamilyTreeIntroNextTime: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;

  consents: {
    completed: boolean;
    consentVersion: number | null;
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
    pageSeenAt: string | null;
    submittedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
};