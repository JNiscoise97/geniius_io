import { supabase } from "../../../lib/supabase/client";
import type { PreferencesFormValues } from "../components/PreferencesForm";

type GetPreferencesInput = {
  participantId: string;
  eventSlug: string;
};

export async function getPreferences({
  participantId,
  eventSlug,
}: GetPreferencesInput): Promise<PreferencesFormValues | null> {
  const res = await supabase
    .from("participant_consents")
    .select(`
      allow_family_photo_sharing,
      allow_photo_display_in_app,
      allow_event_photo_memory,
      allow_name_in_family_tree,
      allow_photo_in_family_tree,
      allow_info_in_family_tree,
      allow_contact_details_with_family,
      allow_future_family_contact,
      allow_genealogy_enrichment,
      allow_genealogy_contribution_storage,
      allow_name_in_event_activities,
      allow_participation_in_games,
      other_preferences,
      submitted_at,
      completed
    `)
    .eq("participant_id", participantId)
    .eq("event_slug", eventSlug)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data) return null;

  return {
  allowFamilyPhotoSharing: res.data.allow_family_photo_sharing,
  allowPhotoDisplayInApp: res.data.allow_photo_display_in_app,
  allowEventPhotoMemory: res.data.allow_event_photo_memory,

  allowNameInFamilyTree: res.data.allow_name_in_family_tree,
  allowPhotoInFamilyTree: res.data.allow_photo_in_family_tree,
  allowInfoInFamilyTree: res.data.allow_info_in_family_tree,

  allowContactDetailsWithFamily: res.data.allow_contact_details_with_family,
  allowFutureFamilyContact: res.data.allow_future_family_contact,

  allowGenealogyEnrichment: res.data.allow_genealogy_enrichment,
  allowGenealogyContributionStorage:
    res.data.allow_genealogy_contribution_storage,

  allowNameInEventActivities: res.data.allow_name_in_event_activities,
  allowParticipationInGames: res.data.allow_participation_in_games,

  otherPreferences: res.data.other_preferences ?? "",
};
}