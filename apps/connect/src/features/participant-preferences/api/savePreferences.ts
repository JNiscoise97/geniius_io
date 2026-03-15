import { supabase } from "../../../lib/supabase/client";
import type { PreferencesFormValues } from "../components/PreferencesForm";

type SavePreferencesInput = {
  participantId: string;
  eventSlug: string;
  values: PreferencesFormValues;
};

function cleanText(value: string): string | null {
  const s = value.trim();
  return s ? s : null;
}

export async function savePreferences({
  participantId,
  eventSlug,
  values,
}: SavePreferencesInput): Promise<void> {
  const now = new Date().toISOString();

  const res = await supabase.from("participant_consents").upsert(
    {
      participant_id: participantId,
      event_slug: eventSlug,

      allow_family_photo_sharing: values.allowFamilyPhotoSharing,
      allow_photo_display_in_app: values.allowPhotoDisplayInApp,
      allow_event_photo_memory: values.allowEventPhotoMemory,

      allow_name_in_family_tree: values.allowNameInFamilyTree,
      allow_photo_in_family_tree: values.allowPhotoInFamilyTree,
      allow_info_in_family_tree: values.allowInfoInFamilyTree,

      allow_contact_details_with_family: values.allowContactDetailsWithFamily,
      allow_future_family_contact: values.allowFutureFamilyContact,

      allow_genealogy_enrichment: values.allowGenealogyEnrichment,
      allow_genealogy_contribution_storage:
        values.allowGenealogyContributionStorage,

      allow_name_in_event_activities: values.allowNameInEventActivities,
      allow_participation_in_games: values.allowParticipationInGames,

      other_preferences: cleanText(values.otherPreferences),

      submitted_at: now,
      completed: true,
      updated_at: now,
    },
    { onConflict: "event_slug,participant_id" },
  );

  if (res.error) {
    throw new Error(res.error.message);
  }
}