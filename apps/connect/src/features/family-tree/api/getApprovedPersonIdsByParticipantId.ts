import { supabase } from "../../../lib/supabase/client";

export type PersonIdentityClaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "auto_verified";

export type ParticipantToPersonMap = Record<string, string | undefined>;

export async function getApprovedPersonIdsByParticipantId(params: {
  eventSlug: string;
  participantIds: string[];
}): Promise<ParticipantToPersonMap> {
  const { eventSlug, participantIds } = params;

  if (!participantIds.length) return {};

  const { data, error } = await supabase
    .from("family_person_identity_claims")
    .select(`
      participant_id,
      person_id,
      claim_status,
      updated_at
    `)
    .eq("event_slug", eventSlug)
    .in("participant_id", participantIds)
    .in("claim_status", ["approved", "auto_verified"])
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const result: ParticipantToPersonMap = {};

  for (const row of data ?? []) {
    if (!result[row.participant_id]) {
      result[row.participant_id] = row.person_id;
    }
  }

  return result;
}