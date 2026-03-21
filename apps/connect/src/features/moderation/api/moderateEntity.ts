import { supabase } from "../../../lib/supabase/client";
import type { SupportedModerationEntityType } from "../types";

type ProcessModerationEntityParams = {
  eventSlug: string;
  entityType: SupportedModerationEntityType;
  entityId: string;
  status?: "approved" | "rejected";
  moderatorComment?: string;
  expectedGedcomPersonId?: string;
};

function getNowIso() {
  return new Date().toISOString();
}

export async function processModerationEntity({
  eventSlug,
  entityType,
  entityId,
  status,
  moderatorComment,
  expectedGedcomPersonId,
}: ProcessModerationEntityParams) {
  if (entityType === "memory") {
    if (!status) {
      throw new Error("Le statut est requis pour modérer un souvenir.");
    }

    const { error } = await supabase
      .from("family_person_memories")
      .update({
        moderation_status: status,
        moderator_comment: moderatorComment ?? null,
        moderated_at: getNowIso(),
      })
      .eq("event_slug", eventSlug)
      .eq("id", entityId);

    if (error) throw error;
    return;
  }

  if (entityType === "photo") {
    if (!status) {
      throw new Error("Le statut est requis pour modérer une photo.");
    }

    const { error } = await supabase
      .from("family_person_photos")
      .update({
        moderation_status: status,
        moderator_comment: moderatorComment ?? null,
        moderated_at: getNowIso(),
      })
      .eq("event_slug", eventSlug)
      .eq("id", entityId);

    if (error) throw error;
    return;
  }

  if (entityType === "visibility_request") {
    if (!status) {
      throw new Error(
        "Le statut est requis pour modérer une demande de visibilité.",
      );
    }

    const { error } = await supabase
      .from("family_person_visibility_requests")
      .update({
        request_status: status,
        moderator_comment: moderatorComment ?? null,
        moderated_at: getNowIso(),
      })
      .eq("event_slug", eventSlug)
      .eq("id", entityId);

    if (error) throw error;
    return;
  }

  if (entityType === "identity_claim") {
    const nextGedcomPersonId = expectedGedcomPersonId?.trim();

    if (!nextGedcomPersonId) {
      throw new Error(
        "Le GEDCOM person id attendu est requis pour confirmer l’identification.",
      );
    }

    const { data: claim, error: claimReadError } = await supabase
      .from("family_person_identity_claims")
      .select(`
        id,
        participant_id,
        person_id,
        claim_status
      `)
      .eq("event_slug", eventSlug)
      .eq("id", entityId)
      .single();

    if (claimReadError || !claim) {
      throw new Error("Demande d’identification introuvable.");
    }

    if (!claim.participant_id) {
      throw new Error("Participant introuvable pour cette demande.");
    }

    const { error: participantUpdateError } = await supabase
      .from("participants")
      .update({
        default_gedcom_person_id: nextGedcomPersonId,
      })
      .eq("id", claim.participant_id);

    if (participantUpdateError) {
      throw participantUpdateError;
    }

    const { error: claimUpdateError } = await supabase
      .from("family_person_identity_claims")
      .update({
        person_id: nextGedcomPersonId,
        claim_status: "approved",
        moderator_comment: moderatorComment ?? null,
        moderated_at: getNowIso(),
      })
      .eq("event_slug", eventSlug)
      .eq("id", entityId);

    if (claimUpdateError) {
      throw claimUpdateError;
    }

    return;
  }

  throw new Error("Type de modération non supporté.");
}

/**
 * Alias de compatibilité pour éviter de casser l’existant.
 */
export const moderateEntity = processModerationEntity;