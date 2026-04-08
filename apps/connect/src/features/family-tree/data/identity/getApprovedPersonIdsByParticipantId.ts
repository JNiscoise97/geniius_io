import { supabase } from "../../../../lib/supabase/client";

export type PersonIdentityClaimStatus = "pending" | "approved" | "rejected";

export type ParticipantToPersonMap = Record<string, string | undefined>;

export async function getApprovedPersonIdsByParticipantId(params: {
  eventSlug: string;
  participantIds: string[];
}): Promise<ParticipantToPersonMap> {
  const { eventSlug, participantIds } = params;

  if (!participantIds.length) {
    return {};
  }

  const { data, error } = await supabase
    .from("family_person_identity_claims")
    .select(`
      participant_id,
      person_id,
      claim_status
    `)
    .eq("event_slug", eventSlug)
    .in("participant_id", participantIds)
    .eq("claim_status", "approved");

  if (error) {
    throw error;
  }

  const result: ParticipantToPersonMap = {};

  for (const row of data ?? []) {
    const personId = row.person_id?.trim();
    if (!personId) continue;

    result[row.participant_id] = personId;
  }

  return result;
}