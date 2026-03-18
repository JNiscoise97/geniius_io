import { supabase } from "../../../lib/supabase/client";
import type { FamilyTreeIntroPrefs } from "./getFamilyTreeIntroPrefs";

type SaveFamilyTreeIntroPrefsInput = {
  participantId: string;
  values: FamilyTreeIntroPrefs;
};

export async function saveFamilyTreeIntroPrefs({
  participantId,
  values,
}: SaveFamilyTreeIntroPrefsInput): Promise<void> {
  const res = await supabase
    .from("participant_preferences")
    .upsert(
      {
        participant_id: participantId,
        hide_family_tree_intro_next_time: values.hideNextTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "participant_id" },
    );

  if (res.error) {
    throw new Error(res.error.message);
  }
}