import { supabase } from "../../../lib/supabase/client";

export async function saveMyPersonVisibilityRequest(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
  hasLegitimateFamilyLink: boolean;
  personCannotRequestByThemself: boolean;
  hasConsent: boolean;
  justification: string;
}): Promise<void> {
  const {
    eventSlug,
    participantId,
    personId,
    hasLegitimateFamilyLink,
    personCannotRequestByThemself,
    hasConsent,
    justification,
  } = params;

  const now = new Date().toISOString();
  const cleanedJustification = justification.trim();

  if (!hasLegitimateFamilyLink) {
    throw new Error("Le lien familial direct doit être confirmé.");
  }

  if (!personCannotRequestByThemself) {
    throw new Error(
      "Tu dois confirmer que la personne ne peut pas faire la demande elle-même.",
    );
  }

  if (!hasConsent) {
    throw new Error("Le consentement de la personne doit être confirmé.");
  }

  if (!cleanedJustification) {
    throw new Error("La justification est obligatoire.");
  }

  const { error } = await supabase
    .from("family_person_visibility_requests")
    .upsert(
      {
        event_slug: eventSlug,
        participant_id: participantId,
        person_id: personId,
        has_legitimate_family_link: hasLegitimateFamilyLink,
        person_cannot_request_by_themself: personCannotRequestByThemself,
        has_consent: hasConsent,
        justification: cleanedJustification,
        request_status: "pending",
        moderator_comment: null,
        moderated_at: null,
        updated_at: now,
        submitted_at: now,
      },
      {
        onConflict: "event_slug,participant_id,person_id",
      },
    );

  if (error) {
    throw error;
  }
}