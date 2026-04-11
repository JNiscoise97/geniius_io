import { supabase } from "../../../lib/supabase/client";
import type { AdminParticipantDetails } from "../types/adminParticipantTypes";

type ParticipantRow = {
  id: string;
  event_slug: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  birth_year: number | null;
  email: string | null;
  phone: string | null;
  messenger: string | null;
  has_whatsapp: boolean | null;
  preferred_contact_channels: string[] | null;
};

type ParticipantConsentRow = {
  participant_id: string;
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
  page_seen_at: string | null;
  submitted_at: string | null;
  completed: boolean;
  consent_version: number;
  other_preferences: string | null;
  created_at: string;
  updated_at: string;
};

type ParticipantPreferencesRow = {
  participant_id: string;
  completed: boolean;
  allow_info_in_family_tree: string | null;
  hide_family_knowledge_intro_next_time: boolean;
  hide_family_tree_intro_next_time: boolean;
  created_at: string;
  updated_at: string;
};

export async function getAdminParticipantDetails(params: {
  eventSlug: string;
  participantId: string;
}): Promise<AdminParticipantDetails | null> {
  const [
    { data: participant, error: participantError },
    { data: consent, error: consentError },
    { data: preferences, error: preferencesError },
  ] = await Promise.all([
    supabase
      .from("participants")
      .select(
        "id, event_slug, first_name, last_name, nickname, birth_year, email, phone, messenger, has_whatsapp, preferred_contact_channels"
      )
      .eq("id", params.participantId)
      .eq("event_slug", params.eventSlug)
      .maybeSingle<ParticipantRow>(),
    supabase
      .from("participant_consents")
      .select(
        `
          participant_id,
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
          page_seen_at,
          submitted_at,
          completed,
          consent_version,
          other_preferences,
          created_at,
          updated_at
        `
      )
      .eq("participant_id", params.participantId)
      .eq("event_slug", params.eventSlug)
      .maybeSingle<ParticipantConsentRow>(),
    supabase
      .from("participant_preferences")
      .select(
        `
          participant_id,
          completed,
          allow_info_in_family_tree,
          hide_family_knowledge_intro_next_time,
          hide_family_tree_intro_next_time,
          created_at,
          updated_at
        `
      )
      .eq("participant_id", params.participantId)
      .maybeSingle<ParticipantPreferencesRow>(),
  ]);

  if (participantError) {
    throw new Error(
      `Impossible de charger le participant : ${participantError.message}`
    );
  }

  if (consentError) {
    throw new Error(
      `Impossible de charger les consentements : ${consentError.message}`
    );
  }

  if (preferencesError) {
    throw new Error(
      `Impossible de charger les préférences : ${preferencesError.message}`
    );
  }

  if (!participant) {
    return null;
  }

  return {
    participantId: participant.id,
    eventSlug: participant.event_slug,
    firstName: participant.first_name?.trim() ?? "",
    lastName: participant.last_name?.trim() ?? "",
    nickname: participant.nickname?.trim() || null,
    birthYear: participant.birth_year ?? null,
    email: participant.email?.trim() || null,
    phone: participant.phone?.trim() || null,
    messenger: participant.messenger?.trim() || null,
    hasWhatsapp: participant.has_whatsapp === true,
    preferredContactChannels: participant.preferred_contact_channels ?? [],
    allowNameInFamilyTree: consent?.allow_name_in_family_tree === true,
    hasConnectedIdentity: Boolean(
      participant.first_name?.trim() || participant.last_name?.trim()
    ),

    preferences: preferences
      ? {
          completed: preferences.completed,
          allowInfoInFamilyTreeMode: preferences.allow_info_in_family_tree,
          hideFamilyKnowledgeIntroNextTime:
            preferences.hide_family_knowledge_intro_next_time,
          hideFamilyTreeIntroNextTime:
            preferences.hide_family_tree_intro_next_time,
          createdAt: preferences.created_at,
          updatedAt: preferences.updated_at,
        }
      : null,

    consents: consent
      ? {
          completed: consent.completed,
          consentVersion: consent.consent_version,
          allowNameInFamilyTree: consent.allow_name_in_family_tree,
          allowPhotoInFamilyTree: consent.allow_photo_in_family_tree,
          allowInfoInFamilyTree: consent.allow_info_in_family_tree,
          allowFamilyPhotoSharing: consent.allow_family_photo_sharing,
          allowPhotoDisplayInApp: consent.allow_photo_display_in_app,
          allowEventPhotoMemory: consent.allow_event_photo_memory,
          allowContactDetailsWithFamily:
            consent.allow_contact_details_with_family,
          allowFutureFamilyContact: consent.allow_future_family_contact,
          allowGenealogyEnrichment: consent.allow_genealogy_enrichment,
          allowGenealogyContributionStorage:
            consent.allow_genealogy_contribution_storage,
          allowNameInEventActivities: consent.allow_name_in_event_activities,
          allowParticipationInGames: consent.allow_participation_in_games,
          otherPreferences: consent.other_preferences,
          pageSeenAt: consent.page_seen_at,
          submittedAt: consent.submitted_at,
          createdAt: consent.created_at,
          updatedAt: consent.updated_at,
        }
      : null,
  };
}