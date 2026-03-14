import { supabase } from "../../../lib/supabase/client";

type SaveProfileTreePreferenceInput = {
  participantId: string;
  allowInfoInFamilyTree: boolean;
};

export async function saveProfileTreePreference({
  participantId,
  allowInfoInFamilyTree,
}: SaveProfileTreePreferenceInput): Promise<void> {
  const res = await supabase.from("participant_preferences").upsert(
    {
      participant_id: participantId,
      allow_info_in_family_tree: allowInfoInFamilyTree,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id" },
  );

  if (res.error) {
    throw new Error(res.error.message);
  }
}