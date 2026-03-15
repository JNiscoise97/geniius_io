import { supabase } from "../../../lib/supabase/client";
import type { FamilyKnowledgeIntroPrefs } from "./getFamilyKnowledgeIntroPrefs";

type SaveFamilyKnowledgeIntroPrefsInput = {
  participantId: string;
  values: FamilyKnowledgeIntroPrefs;
};

export async function saveFamilyKnowledgeIntroPrefs({
  participantId,
  values,
}: SaveFamilyKnowledgeIntroPrefsInput): Promise<void> {
  const res = await supabase
    .from("participant_preferences")
    .upsert(
      {
        participant_id: participantId,
        hide_family_knowledge_intro_next_time: values.hideNextTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "participant_id" },
    );

  if (res.error) {
    throw new Error(res.error.message);
  }
}