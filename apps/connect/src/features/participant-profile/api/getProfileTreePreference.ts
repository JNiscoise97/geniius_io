import { supabase } from "../../../lib/supabase/client";
import type { ProfileTreePreference } from "../types/profileTreePreference";

type GetProfileTreePreferenceInput = {
  participantId: string;
};

type ParticipantPreferencesRow = {
  allow_info_in_family_tree: ProfileTreePreference;
};

export async function getProfileTreePreference({
  participantId,
}: GetProfileTreePreferenceInput): Promise<ProfileTreePreference> {
  const res = await supabase
    .from("participant_preferences")
    .select("allow_info_in_family_tree")
    .eq("participant_id", participantId)
    .maybeSingle<ParticipantPreferencesRow>();

  if (res.error) {
    throw new Error(res.error.message);
  }

  const value = res.data?.allow_info_in_family_tree;

  if (value === "yes" || value === "no") {
    return value;
  }

  return null;
}