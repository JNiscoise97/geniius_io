export type AnnouncementRecipient = {
  participantId: string;
  eventSlug: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  displayName: string;
};

export type AnnouncementRecipientSelectionMode = "all" | "manual";

export type AnnouncementComposerFormValues = {
  subject: string;
  message: string;
  selectionMode: AnnouncementRecipientSelectionMode;
  selectedParticipantIds: string[];
  replyTo?: string;
};

export type SendAnnouncementCampaignInput = {
  eventSlug: string;
  subject: string;
  message: string;
  selectionMode: AnnouncementRecipientSelectionMode;
  participantIds?: string[];
  replyTo?: string;
};

export type SendAnnouncementCampaignResult = {
  ok: boolean;
  message: string;
  totalRecipients: number;
  totalSent: number;
  totalFailed: number;
  failures: Array<{
    participantId?: string;
    email?: string;
    error: string;
  }>;
};

export type EdgeAnnouncementRecipient = {
  participantId: string;
  participantEmail: string;
  participantFirstName?: string;
  participantLastName?: string;
  participantNickname?: string;
  participantDisplayName?: string;
};

export type SendParticipantAnnouncementInput = {
  eventSlug: string;
  subject: string;
  message: string;
  recipients: EdgeAnnouncementRecipient[];
  replyTo?: string;
};