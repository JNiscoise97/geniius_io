import { supabase } from "../../../lib/supabase/client";

export type FamilyKnowledgeIntroPrefs = {
  hideNextTime: boolean;
};

type GetFamilyKnowledgeIntroPrefsInput = {
  participantId: string;
};

type ParticipantPreferencesRow = {
  hide_family_knowledge_intro_next_time: boolean | null;
};

export function getDefaultFamilyKnowledgeIntroPrefs(): FamilyKnowledgeIntroPrefs {
  return {
    hideNextTime: false,
  };
}

export async function getFamilyKnowledgeIntroPrefs({
  participantId,
}: GetFamilyKnowledgeIntroPrefsInput): Promise<FamilyKnowledgeIntroPrefs> {
  const res = await supabase
    .from("participant_preferences")
    .select("hide_family_knowledge_intro_next_time")
    .eq("participant_id", participantId)
    .maybeSingle<ParticipantPreferencesRow>();

  if (res.error) {
    throw new Error(res.error.message);
  }

  return {
    hideNextTime: res.data?.hide_family_knowledge_intro_next_time ?? false,
  };
}