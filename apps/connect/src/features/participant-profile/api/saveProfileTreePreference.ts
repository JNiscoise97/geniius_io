import { supabase } from "../../../lib/supabase/client";
import type { ProfileTreePreference } from "../types/profileTreePreference";

type SaveProfileTreePreferenceInput = {
  participantId: string;
  eventSlug: string;
  allowInfoInFamilyTree: ProfileTreePreference;
};

export async function saveProfileTreePreference({
  participantId,
  eventSlug,
  allowInfoInFamilyTree,
}: SaveProfileTreePreferenceInput): Promise<void> {
  const now = new Date().toISOString();

  const res = await supabase.from("participant_consents").upsert(
    {
      participant_id: participantId,
      event_slug: eventSlug,
      allow_info_in_family_tree: allowInfoInFamilyTree,
      updated_at: now,
    },
    { onConflict: "event_slug,participant_id" },
  );

  if (res.error) {
    throw new Error(res.error.message);
  }
}