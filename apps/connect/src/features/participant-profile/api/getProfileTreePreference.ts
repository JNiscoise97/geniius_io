import { supabase } from "../../../lib/supabase/client";
import type { ProfileTreePreference } from "../types/profileTreePreference";

type GetProfileTreePreferenceInput = {
  participantId: string;
  eventSlug: string;
};

type ParticipantConsentsRow = {
  allow_info_in_family_tree: boolean | null;
};

export async function getProfileTreePreference({
  participantId,
  eventSlug,
}: GetProfileTreePreferenceInput): Promise<ProfileTreePreference> {
  const res = await supabase
    .from("participant_consents")
    .select("allow_info_in_family_tree")
    .eq("participant_id", participantId)
    .eq("event_slug", eventSlug)
    .maybeSingle<ParticipantConsentsRow>();

  if (res.error) {
    throw new Error(res.error.message);
  }

  return res.data?.allow_info_in_family_tree ?? null;
}