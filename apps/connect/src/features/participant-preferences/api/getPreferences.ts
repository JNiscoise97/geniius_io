import { supabase } from "../../../lib/supabase/client";
import type { PreferencesFormValues } from "../components/PreferencesForm";

type GetPreferencesInput = {
  participantId: string;
};

export async function getPreferences({
  participantId,
}: GetPreferencesInput): Promise<PreferencesFormValues | null> {
  const res = await supabase
    .from("participant_preferences")
    .select(
      `
      allow_family_photo_sharing,
      allow_name_in_family_tree,
      allow_photo_in_family_tree,
      allow_info_in_family_tree,
      allow_cousins_contact,
      allow_family_news,
      allow_event_photos_receive,
      allow_future_events,
      other_preferences
      `,
    )
    .eq("participant_id", participantId)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data) return null;

  return {
    allowFamilyPhotoSharing: res.data.allow_family_photo_sharing ?? false,
    allowNameInFamilyTree: res.data.allow_name_in_family_tree ?? true,
    allowPhotoInFamilyTree: res.data.allow_photo_in_family_tree ?? false,
    allowInfoInFamilyTree: res.data.allow_info_in_family_tree ?? false,
    allowCousinsContact: res.data.allow_cousins_contact ?? false,
    allowFamilyNews: res.data.allow_family_news ?? false,
    allowEventPhotosReceive: res.data.allow_event_photos_receive ?? false,
    allowFutureEvents: res.data.allow_future_events ?? false,
    otherPreferences: res.data.other_preferences ?? "",
  };
}