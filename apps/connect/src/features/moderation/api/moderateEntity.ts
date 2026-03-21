import { supabase } from "../../../lib/supabase/client";
import { FAMILY_GRAPH } from "../../family-tree/api/loadGraph";
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

function normalizeText(value?: string | null): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

function buildDisplayName(
  firstName?: string | null,
  lastName?: string | null,
): string | undefined {
  const parts = [normalizeText(firstName), normalizeText(lastName)].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function getParticipantDisplayName(
  participant:
    | {
        first_name?: string | null;
        last_name?: string | null;
      }
    | null
    | undefined,
) {
  return buildDisplayName(participant?.first_name, participant?.last_name);
}

function getPersonIdentityFromGraph(personId?: string | null): {
  personFirstName?: string;
  personLastName?: string;
  personDisplayName?: string;
} {
  if (!personId) {
    return {};
  }

  const person = FAMILY_GRAPH.people[personId];

  if (!person) {
    return {
      personDisplayName: `Personne ${personId}`,
    };
  }

  const personFirstName = normalizeText(person.firstName);
  const personLastName = normalizeText(person.lastName);
  const personDisplayName =
    buildDisplayName(personFirstName, personLastName) ??
    `Personne ${personId}`;

  return {
    personFirstName,
    personLastName,
    personDisplayName,
  };
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

    const { data: visibilityRequest, error: visibilityReadError } =
      await supabase
        .from("family_person_visibility_requests")
        .select(
          `
            id,
            participant_id,
            person_id
          `,
        )
        .eq("event_slug", eventSlug)
        .eq("id", entityId)
        .single();

    if (visibilityReadError || !visibilityRequest) {
      throw new Error("Demande de visibilité introuvable.");
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

    const { data: participant, error: participantReadError } = await supabase
      .from("participants")
      .select(
        `
          id,
          email,
          first_name,
          last_name
        `,
      )
      .eq("id", visibilityRequest.participant_id)
      .maybeSingle();

    if (participantReadError) {
      console.error(
        "Impossible de relire le participant après modération visibility_request",
        participantReadError,
      );
      return;
    }

    const participantEmail = normalizeText(participant?.email);
    if (!participantEmail) {
      return;
    }

    const participantDisplayName = getParticipantDisplayName(participant);
    const personIdentity = getPersonIdentityFromGraph(
      visibilityRequest.person_id,
    );

    const functionName =
      status === "approved"
        ? "send-visibility-request-approved-notification"
        : "send-visibility-request-rejected-notification";

    const { error: notificationError } = await supabase.functions.invoke(
      functionName,
      {
        body: {
          eventSlug,
          participantId: visibilityRequest.participant_id,
          participantEmail,
          participantFirstName: participant?.first_name ?? undefined,
          participantLastName: participant?.last_name ?? undefined,
          participantDisplayName,
          personId: visibilityRequest.person_id,
          personFirstName: personIdentity.personFirstName,
          personLastName: personIdentity.personLastName,
          personDisplayName: personIdentity.personDisplayName,
          moderatorComment: moderatorComment ?? undefined,
        },
      },
    );

    if (notificationError) {
      console.error(
        `Échec d’envoi de la notification visibility_request ${status}`,
        notificationError,
      );
    }

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
      .select(
        `
          id,
          participant_id,
          person_id,
          claim_status
        `,
      )
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

    const { data: participant, error: participantReadError } = await supabase
      .from("participants")
      .select(
        `
          id,
          email,
          first_name,
          last_name
        `,
      )
      .eq("id", claim.participant_id)
      .maybeSingle();

    if (participantReadError) {
      console.error(
        "Impossible de relire le participant après modération identity_claim",
        participantReadError,
      );
      return;
    }

    const participantEmail = normalizeText(participant?.email);
    if (!participantEmail) {
      return;
    }

    const participantDisplayName = getParticipantDisplayName(participant);
    const personIdentity = getPersonIdentityFromGraph(nextGedcomPersonId);

    const { error: notificationError } = await supabase.functions.invoke(
      "send-identity-claim-approved-notification",
      {
        body: {
          eventSlug,
          participantId: claim.participant_id,
          participantEmail,
          participantFirstName: participant?.first_name ?? undefined,
          participantLastName: participant?.last_name ?? undefined,
          participantDisplayName,
          personId: nextGedcomPersonId,
          personFirstName: personIdentity.personFirstName,
          personLastName: personIdentity.personLastName,
          personDisplayName: personIdentity.personDisplayName,
        },
      },
    );

    if (notificationError) {
      console.error(
        "Échec d’envoi de la notification identity_claim approved",
        notificationError,
      );
    }

    return;
  }

  throw new Error("Type de modération non supporté.");
}

/**
 * Alias de compatibilité pour éviter de casser l’existant.
 */
export const moderateEntity = processModerationEntity;