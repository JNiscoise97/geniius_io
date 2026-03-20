import { supabase } from "../../../lib/supabase/client";
import type { PersonIdentityClaim } from "./getMyPersonIdentityClaim";

export async function saveMyPersonIdentityClaim(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
}): Promise<PersonIdentityClaim> {
  const { eventSlug, participantId, personId } = params;

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

  const { data: existing, error: existingError } = await supabase
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
    .eq("person_id", personId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

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
      .single();

    if (error) {
      throw error;
    }

    return data as PersonIdentityClaim;
  }

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
    .single();

  if (error) {
    throw error;
  }

  return data as PersonIdentityClaim;
}