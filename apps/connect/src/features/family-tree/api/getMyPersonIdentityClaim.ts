import { supabase } from "../../../lib/supabase/client";

export type PersonIdentityClaimStatus = "pending" | "approved" | "rejected";

export type PersonIdentityClaim = {
  id: string;
  event_slug: string;
  participant_id: string;
  person_id: string; // peut être ""
  claim_status: PersonIdentityClaimStatus;
  moderator_comment: string | null;
  submitted_at: string;
  moderated_at: string | null;
  updated_at: string;
};

const CLAIM_SELECT = `
  id,
  event_slug,
  participant_id,
  person_id,
  claim_status,
  moderator_comment,
  submitted_at,
  moderated_at,
  updated_at
`;

function normalizeClaim(
  claim: PersonIdentityClaim | null,
): PersonIdentityClaim | null {
  if (!claim) return null;

  return {
    ...claim,
    person_id: claim.person_id?.trim() ?? "",
  };
}

/**
 * Nouveau modèle :
 * - une seule claim par participant/event
 * - person_id peut être vide
 *
 * Le paramètre personId est conservé pour compatibilité.
 * S'il est fourni et ne correspond pas à la claim unique, on renvoie null.
 */
export async function getMyPersonIdentityClaim(params: {
  eventSlug: string;
  participantId: string;
  personId?: string;
}): Promise<PersonIdentityClaim | null> {
  const { eventSlug, participantId, personId } = params;

  const { data, error } = await supabase
    .from("family_person_identity_claims")
    .select(CLAIM_SELECT)
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const claim = normalizeClaim((data ?? null) as PersonIdentityClaim | null);

  if (!claim) {
    return null;
  }

  if (personId !== undefined) {
    const normalizedExpectedPersonId = personId.trim();
    const normalizedActualPersonId = claim.person_id.trim();

    if (normalizedExpectedPersonId !== normalizedActualPersonId) {
      return null;
    }
  }

  return claim;
}

/**
 * Alias de compatibilité temporaire :
 * l'ancien code pouvait s'attendre à un tableau.
 * Désormais, il n'existe au plus qu'une seule claim par participant/event.
 */
export async function getMyPersonIdentityClaims(params: {
  eventSlug: string;
  participantId: string;
}): Promise<PersonIdentityClaim[]> {
  const claim = await getMyPersonIdentityClaim(params);
  return claim ? [claim] : [];
}