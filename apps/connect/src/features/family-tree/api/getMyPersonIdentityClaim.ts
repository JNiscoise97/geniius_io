import { supabase } from "../../../lib/supabase/client";

export type PersonIdentityClaimStatus = "pending" | "approved" | "rejected" | "auto_verified";

export type PersonIdentityClaim = {
  id: string;
  event_slug: string;
  participant_id: string;
  person_id: string;
  claim_status: PersonIdentityClaimStatus;
  moderator_comment: string | null;
  submitted_at: string;
  moderated_at: string | null;
  updated_at: string;
};

export async function getMyPersonIdentityClaim(params: {
  eventSlug: string;
  participantId: string;
  personId?: string;
}): Promise<PersonIdentityClaim | null> {
  const { eventSlug, participantId, personId } = params;

  let query = supabase
    .from("family_person_identity_claims")
    .select(
      `
        id,
        event_slug,
        participant_id,
        person_id,
        claim_status,
        moderator_comment,
        submitted_at,
        moderated_at,
        updated_at
      `,
    )
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId);

  if (personId) {
    query = query.eq("person_id", personId);
  } else {
    query = query.order("updated_at", { ascending: false }).limit(1);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as PersonIdentityClaim | null;
}

export async function getMyPersonIdentityClaims(params: {
  eventSlug: string;
  participantId: string;
}): Promise<PersonIdentityClaim[]> {
  const { eventSlug, participantId } = params;

  const { data, error } = await supabase
    .from("family_person_identity_claims")
    .select(
      `
        id,
        event_slug,
        participant_id,
        person_id,
        claim_status,
        moderator_comment,
        submitted_at,
        moderated_at,
        updated_at
      `,
    )
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as PersonIdentityClaim[];
}