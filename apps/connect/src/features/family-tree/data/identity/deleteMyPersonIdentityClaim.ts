import { supabase } from "../../../../lib/supabase/client";

function getNowIso() {
  return new Date().toISOString();
}

/**
 * Dans le nouveau modèle, on ne supprime plus la claim.
 * On la réinitialise pour revenir à l'état placeholder :
 * - person_id = ""
 * - claim_status = "pending"
 * - moderator_comment = null
 * - moderated_at = null
 */
export async function deleteMyPersonIdentityClaim(params: {
  eventSlug: string;
  participantId: string;
}): Promise<void> {
  const { eventSlug, participantId } = params;

  const { error } = await supabase
    .from("family_person_identity_claims")
    .update({
      person_id: "",
      claim_status: "pending",
      moderator_comment: null,
      moderated_at: null,
      updated_at: getNowIso(),
    })
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId);

  if (error) {
    throw error;
  }
}