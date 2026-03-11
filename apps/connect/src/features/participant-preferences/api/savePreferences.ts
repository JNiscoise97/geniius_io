import { supabase } from "../../../lib/supabase/client";
import type { PreferencesFormValues } from "../components/PreferencesForm";

type SavePreferencesInput = {
  participantId: string;
  values: PreferencesFormValues;
};

function cleanText(value: string): string | null {
  const s = value.trim();
  return s ? s : null;
}

export async function savePreferences({
  participantId,
  values,
}: SavePreferencesInput): Promise<void> {
  const res = await supabase.from("participant_preferences").upsert(
    {
      participant_id: participantId,
      allow_family_photo_sharing: values.allowFamilyPhotoSharing,
      allow_name_in_family_tree: values.allowNameInFamilyTree,
      allow_photo_in_family_tree: values.allowPhotoInFamilyTree,
      allow_info_in_family_tree: values.allowInfoInFamilyTree,
      allow_cousins_contact: values.allowCousinsContact,
      allow_family_news: values.allowFamilyNews,
      allow_event_photos_receive: values.allowEventPhotosReceive,
      allow_future_events: values.allowFutureEvents,
      other_preferences: cleanText(values.otherPreferences),
      completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id" },
  );

  if (res.error) {
    throw new Error(res.error.message);
  }
}