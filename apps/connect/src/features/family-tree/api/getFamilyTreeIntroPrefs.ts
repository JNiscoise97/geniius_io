import { supabase } from "../../../lib/supabase/client";

export type FamilyTreeIntroPrefs = {
  hideNextTime: boolean;
};

type GetFamilyTreeIntroPrefsInput = {
  participantId: string;
};

type ParticipantPreferencesRow = {
  hide_family_tree_intro_next_time: boolean | null;
};

export function getDefaultFamilyTreeIntroPrefs(): FamilyTreeIntroPrefs {
  return {
    hideNextTime: false,
  };
}

export async function getFamilyTreeIntroPrefs({
  participantId,
}: GetFamilyTreeIntroPrefsInput): Promise<FamilyTreeIntroPrefs> {
  const res = await supabase
    .from("participant_preferences")
    .select("hide_family_tree_intro_next_time")
    .eq("participant_id", participantId)
    .maybeSingle<ParticipantPreferencesRow>();

  if (res.error) {
    throw new Error(res.error.message);
  }

  return {
    hideNextTime: res.data?.hide_family_tree_intro_next_time ?? false,
  };
}