import { supabase } from "../../../lib/supabase/client";
import type { PersonIdentityClaim } from "./getMyPersonIdentityClaim";

export async function saveMyPersonIdentityClaim(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
  participantFirstName?: string;
  participantLastName?: string;
  participantDisplayName?: string;
  personFirstName?: string;
  personLastName?: string;
  personDisplayName?: string;
}): Promise<PersonIdentityClaim> {
  const {
    eventSlug,
    participantId,
    personId,
    participantFirstName,
    participantLastName,
    participantDisplayName,
    personFirstName,
    personLastName,
    personDisplayName,
  } = params;

  const now = new Date().toISOString();

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("default_gedcom_person_id")
    .eq("id", participantId)
    .single();

  if (participantError) {
    throw participantError;
  }

  const defaultGedcomPersonId =
    participant?.default_gedcom_person_id?.trim() || null;

  const nextStatus =
    defaultGedcomPersonId === personId ? "auto_verified" : "pending";

  const moderatedAt = nextStatus === "auto_verified" ? now : null;

  const claimSelect = `
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

  const { data: existing, error: existingError } = await supabase
    .from("family_person_identity_claims")
    .select(claimSelect)
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .eq("person_id", personId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let savedClaim: PersonIdentityClaim;

  if (existing) {
    const { data, error } = await supabase
      .from("family_person_identity_claims")
      .update({
        claim_status: nextStatus,
        moderator_comment: null,
        moderated_at: moderatedAt,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select(claimSelect)
      .single();

    if (error) {
      throw error;
    }

    savedClaim = data as PersonIdentityClaim;
  } else {
    const { data, error } = await supabase
      .from("family_person_identity_claims")
      .insert({
        event_slug: eventSlug,
        participant_id: participantId,
        person_id: personId,
        claim_status: nextStatus,
        moderator_comment: null,
        moderated_at: moderatedAt,
        updated_at: now,
      })
      .select(claimSelect)
      .single();

    if (error) {
      throw error;
    }

    savedClaim = data as PersonIdentityClaim;
  }

  const notificationType =
    nextStatus === "auto_verified" ? "auto_verified" : "submitted";

  const { error: fnError } = await supabase.functions.invoke(
    "send-identity-claim-notification",
    {
      body: {
        notificationType,
        claimId: savedClaim.id,
        eventSlug,
        participantId,
        participantFirstName,
        participantLastName,
        participantDisplayName,
        personId,
        personFirstName,
        personLastName,
        personDisplayName,
      },
    },
  );

  if (fnError) {
    console.error(
      "[saveMyPersonIdentityClaim] notification non envoyée",
      fnError,
    );
  }

  return savedClaim;
}