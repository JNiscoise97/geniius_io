import { supabase } from "../../../lib/supabase/client";
import {
  booleanLabel,
  formatParticipantLabel,
  getPersonLabelFromFamilyGraph,
} from "../lib/moderationLabels";
import type {
  ModerationEntityRecord,
  SupportedModerationEntityType,
} from "../types";

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  default_gedcom_person_id?: string | null;
};

async function getParticipantLabel(
  participantId?: string | null,
): Promise<string | null> {
  if (!participantId) return null;

  const { data, error } = await supabase
    .from("participants")
    .select(`
      id,
      first_name,
      last_name,
      default_gedcom_person_id
    `)
    .eq("id", participantId)
    .single();

  if (error || !data) {
    return `Participant ${participantId}`;
  }

  return formatParticipantLabel(data as ParticipantRow);
}

export async function getModerationEntity({
  eventSlug,
  entityType,
  entityId,
}: {
  eventSlug: string;
  entityType: SupportedModerationEntityType;
  entityId: string;
}): Promise<ModerationEntityRecord> {
  if (entityType === "memory") {
    const { data, error } = await supabase
      .from("family_person_memories")
      .select("*")
      .eq("event_slug", eventSlug)
      .eq("id", entityId)
      .single();

    if (error || !data) throw new Error("Souvenir introuvable");

    const personLabel = getPersonLabelFromFamilyGraph(data.person_id);
    const participantLabel = await getParticipantLabel(data.participant_id);

    return {
      id: data.id,
      type: "memory",
      title: "Souvenir proposé",
      subtitle: personLabel,
      content: data.content,
      moderationStatus: data.moderation_status,
      moderatorComment: data.moderator_comment,
      submittedAt: data.submitted_at,
      moderatedAt: data.moderated_at,
      participantId: data.participant_id,
      participantLabel,
      personId: data.person_id,
      personLabel,
      meta: [
        {
          label: "Proposé par",
          value: participantLabel ?? "Participant inconnu",
        },
        {
          label: "Pour",
          value: personLabel,
        },
      ],
      actionMode: "approve_reject",
    };
  }

  if (entityType === "photo") {
    const { data, error } = await supabase
      .from("family_person_photos")
      .select("*")
      .eq("event_slug", eventSlug)
      .eq("id", entityId)
      .single();

    if (error || !data) throw new Error("Photo introuvable");

    const { data: signed } = await supabase.storage
      .from("family-person-photos")
      .createSignedUrl(data.storage_path, 3600);

    const personLabel = getPersonLabelFromFamilyGraph(data.person_id);
    const participantLabel = await getParticipantLabel(data.participant_id);

    return {
      id: data.id,
      type: "photo",
      title: "Photo proposée",
      subtitle: personLabel,
      content: data.caption,
      imageUrl: signed?.signedUrl ?? null,
      moderationStatus: data.moderation_status,
      moderatorComment: data.moderator_comment,
      submittedAt: data.submitted_at,
      moderatedAt: data.moderated_at,
      participantId: data.participant_id,
      participantLabel,
      personId: data.person_id,
      personLabel,
      meta: [
        {
          label: "Proposé par",
          value: participantLabel ?? "Participant inconnu",
        },
        {
          label: "Pour",
          value: personLabel,
        },
        {
          label: "Fichier",
          value: data.storage_path,
        },
      ],
      actionMode: "approve_reject",
    };
  }

  if (entityType === "visibility_request") {
    const { data, error } = await supabase
      .from("family_person_visibility_requests")
      .select("*")
      .eq("event_slug", eventSlug)
      .eq("id", entityId)
      .single();

    if (error || !data) {
      throw new Error("Demande de visibilité introuvable");
    }

    const personLabel = getPersonLabelFromFamilyGraph(data.person_id);
    const participantLabel = await getParticipantLabel(data.participant_id);

    return {
      id: data.id,
      type: "visibility_request",
      title: "Demande d’accès à la fiche",
      subtitle: personLabel,
      content: data.justification,
      moderationStatus: data.request_status,
      moderatorComment: data.moderator_comment,
      submittedAt: data.submitted_at,
      moderatedAt: data.moderated_at,
      participantId: data.participant_id,
      participantLabel,
      personId: data.person_id,
      personLabel,
      meta: [
        {
          label: "Demandeur",
          value: participantLabel ?? "Participant inconnu",
        },
        {
          label: "Personne ciblée",
          value: personLabel,
        },
        {
          label: "Lien familial légitime",
          value: booleanLabel(data.has_legitimate_family_link),
        },
        {
          label: "La personne ne peut pas faire la demande elle-même",
          value: booleanLabel(data.person_cannot_request_by_themself),
        },
        {
          label: "Consentement",
          value: booleanLabel(data.has_consent),
        },
      ],
      actionMode: "approve_reject",
    };
  }

  if (entityType === "identity_claim") {
    const { data, error } = await supabase
      .from("family_person_identity_claims")
      .select("*")
      .eq("event_slug", eventSlug)
      .eq("id", entityId)
      .single();

    if (error || !data) {
      throw new Error("Demande d’identification introuvable");
    }

    const personLabel = getPersonLabelFromFamilyGraph(data.person_id);
    const participantLabel = await getParticipantLabel(data.participant_id);

    const { data: participantData } = await supabase
      .from("participants")
      .select(`
        id,
        first_name,
        last_name,
        default_gedcom_person_id
      `)
      .eq("id", data.participant_id)
      .single();

    return {
      id: data.id,
      type: "identity_claim",
      title: "Demande d’identification",
      subtitle: personLabel,
      content:
        "Cette demande nécessite une validation manuelle du GEDCOM person id attendu.",
      moderationStatus: data.claim_status,
      moderatorComment: data.moderator_comment,
      submittedAt: data.submitted_at,
      moderatedAt: data.moderated_at,
      participantId: data.participant_id,
      participantLabel,
      personId: data.person_id,
      personLabel,
      expectedGedcomPersonId:
        participantData?.default_gedcom_person_id ?? data.person_id ?? "",
      meta: [
        {
          label: "Demandeur",
          value: participantLabel ?? "Participant inconnu",
        },
        {
          label: "Personne actuellement ciblée",
          value: personLabel,
        },
        {
          label: "Person ID actuel sur la demande",
          value: data.person_id,
        },
        {
          label: "default_gedcom_person_id actuel du participant",
          value:
            participantData?.default_gedcom_person_id?.trim() ||
            "Non renseigné",
        },
      ],
      actionMode: "approve_only",
    };
  }

  throw new Error("Type non supporté");
}