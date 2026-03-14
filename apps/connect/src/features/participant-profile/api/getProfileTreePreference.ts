import { supabase } from "../../../lib/supabase/client";

type GetProfileTreePreferenceInput = {
  participantId: string;
};

type ParticipantPreferencesRow = {
  allow_info_in_family_tree: boolean | null;
};

export async function getProfileTreePreference({
  participantId,
}: GetProfileTreePreferenceInput): Promise<boolean> {
  const res = await supabase
    .from("participant_preferences")
    .select("allow_info_in_family_tree")
    .eq("participant_id", participantId)
    .maybeSingle<ParticipantPreferencesRow>();

  if (res.error) {
    throw new Error(res.error.message);
  }

  return res.data?.allow_info_in_family_tree === true;
}