import { supabase } from "../../../lib/supabase/client";
import type { ProfileFormValues } from "../components/ProfileForm";

type GetProfileInput = {
  participantId: string;
};

export async function getProfile({
  participantId,
}: GetProfileInput): Promise<ProfileFormValues | null> {
  const res = await supabase
    .from("participant_profile")
    .select(
      "city, occupation, interests, free_share",
    )
    .eq("participant_id", participantId)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data) return null;

  return {
    city: res.data.city ?? "",
    occupation: res.data.occupation ?? "",
    interests: res.data.interests ?? "",
    freeShare: res.data.free_share ?? "",
  };
}