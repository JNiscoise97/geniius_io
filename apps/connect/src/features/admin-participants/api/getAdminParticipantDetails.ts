import { supabase } from "../../../lib/supabase/client";
import { getAdminParticipantTracking } from "./getAdminParticipantTracking";
import type {
  AdminParticipantConsents,
  AdminParticipantDetails,
} from "../types/adminParticipantTypes";

type ParticipantRow = {
  id: string;
  event_slug: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  birth_year: number | null;
  phone: string | null;
  email: string | null;
  has_whatsapp: boolean | null;
  messenger: string | null;
  preferred_contact_channels: string[] | null;
};

type ParticipantConsentsRow = {
  completed: boolean;
  consent_version: number | null;
  page_seen_at: string | null;
  submitted_at: string | null;
  created_at: string | null;
  updated_at: string | null;

  allow_name_in_family_tree: boolean | null;
  allow_photo_in_family_tree: boolean | null;
  allow_info_in_family_tree: boolean | null;

  allow_family_photo_sharing: boolean | null;
  allow_photo_display_in_app: boolean | null;
  allow_event_photo_memory: boolean | null;

  allow_contact_details_with_family: boolean | null;
  allow_future_family_contact: boolean | null;

  allow_genealogy_enrichment: boolean | null;
  allow_genealogy_contribution_storage: boolean | null;

  allow_name_in_event_activities: boolean | null;
  allow_participation_in_games: boolean | null;

  other_preferences: string | null;
};

type GetAdminParticipantDetailsParams = {
  eventSlug: string;
  participantId: string;
};

function mapConsents(
  row: ParticipantConsentsRow | null | undefined
): AdminParticipantConsents | null {
  if (!row) return null;

  return {
    completed: row.completed,
    consentVersion: row.consent_version,
    pageSeenAt: row.page_seen_at,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    allowNameInFamilyTree: row.allow_name_in_family_tree,
    allowPhotoInFamilyTree: row.allow_photo_in_family_tree,
    allowInfoInFamilyTree: row.allow_info_in_family_tree,

    allowFamilyPhotoSharing: row.allow_family_photo_sharing,
    allowPhotoDisplayInApp: row.allow_photo_display_in_app,
    allowEventPhotoMemory: row.allow_event_photo_memory,

    allowContactDetailsWithFamily: row.allow_contact_details_with_family,
    allowFutureFamilyContact: row.allow_future_family_contact,

    allowGenealogyEnrichment: row.allow_genealogy_enrichment,
    allowGenealogyContributionStorage: row.allow_genealogy_contribution_storage,

    allowNameInEventActivities: row.allow_name_in_event_activities,
    allowParticipationInGames: row.allow_participation_in_games,

    otherPreferences: row.other_preferences,
  };
}

export async function getAdminParticipantDetails({
  eventSlug,
  participantId,
}: GetAdminParticipantDetailsParams): Promise<AdminParticipantDetails | null> {
  const [participantRes, consentsRes, tracking] = await Promise.all([
    supabase
      .from("participants")
      .select(
        "id, event_slug, first_name, last_name, nickname, birth_year, phone, email, has_whatsapp, messenger, preferred_contact_channels"
      )
      .eq("id", participantId)
      .eq("event_slug", eventSlug)
      .maybeSingle<ParticipantRow>(),

    supabase
      .from("participant_consents")
      .select(
        `
          completed,
          consent_version,
          page_seen_at,
          submitted_at,
          created_at,
          updated_at,
          allow_name_in_family_tree,
          allow_photo_in_family_tree,
          allow_info_in_family_tree,
          allow_family_photo_sharing,
          allow_photo_display_in_app,
          allow_event_photo_memory,
          allow_contact_details_with_family,
          allow_future_family_contact,
          allow_genealogy_enrichment,
          allow_genealogy_contribution_storage,
          allow_name_in_event_activities,
          allow_participation_in_games,
          other_preferences
        `
      )
      .eq("participant_id", participantId)
      .eq("event_slug", eventSlug)
      .maybeSingle<ParticipantConsentsRow>(),

    getAdminParticipantTracking({
      eventSlug,
      participantId,
    }),
  ]);

  if (participantRes.error) {
    throw new Error(
      `Impossible de charger le participant : ${participantRes.error.message}`
    );
  }

  if (consentsRes.error) {
    throw new Error(
      `Impossible de charger les consentements : ${consentsRes.error.message}`
    );
  }

  const participant = participantRes.data;
  if (!participant) return null;

  const consents = mapConsents(consentsRes.data);

  return {
    participantId: participant.id,
    eventSlug: participant.event_slug,

    firstName: participant.first_name ?? "",
    lastName: participant.last_name ?? "",
    nickname: participant.nickname ?? "",
    birthYear: participant.birth_year,

    email: participant.email ?? "",
    phone: participant.phone ?? "",
    messenger: participant.messenger ?? "",
    hasWhatsapp: participant.has_whatsapp === true,

    preferredContactChannels: participant.preferred_contact_channels ?? [],

    allowNameInFamilyTree: consents?.allowNameInFamilyTree ?? null,

    consents,
    tracking,
  };
}