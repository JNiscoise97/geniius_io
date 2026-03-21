import { supabase } from "../../../lib/supabase/client";
import {
  formatParticipantLabel,
  getPersonLabelFromFamilyGraph,
} from "../lib/moderationLabels";
import type { ModerationQueueItem } from "../types";

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

type MemoryRow = {
  id: string;
  participant_id: string;
  person_id: string;
  content: string | null;
  submitted_at: string;
};

type PhotoRow = {
  id: string;
  participant_id: string;
  person_id: string;
  caption: string | null;
  storage_path: string;
  submitted_at: string;
};

type VisibilityRequestRow = {
  id: string;
  participant_id: string;
  person_id: string;
  justification: string;
  has_legitimate_family_link: boolean;
  person_cannot_request_by_themself: boolean | null;
  has_consent: boolean | null;
  submitted_at: string;
};

type IdentityClaimRow = {
  id: string;
  participant_id: string;
  person_id: string;
  submitted_at: string;
};

export async function listPendingModerationItems(
  eventSlug: string,
): Promise<ModerationQueueItem[]> {
  const [
    memoriesResult,
    photosResult,
    visibilityRequestsResult,
    identityClaimsResult,
  ] = await Promise.all([
    supabase
      .from("family_person_memories")
      .select(`
        id,
        participant_id,
        person_id,
        content,
        submitted_at
      `)
      .eq("event_slug", eventSlug)
      .eq("moderation_status", "pending"),

    supabase
      .from("family_person_photos")
      .select(`
        id,
        participant_id,
        person_id,
        caption,
        storage_path,
        submitted_at
      `)
      .eq("event_slug", eventSlug)
      .eq("moderation_status", "pending"),

    supabase
      .from("family_person_visibility_requests")
      .select(`
        id,
        participant_id,
        person_id,
        justification,
        has_legitimate_family_link,
        person_cannot_request_by_themself,
        has_consent,
        submitted_at
      `)
      .eq("event_slug", eventSlug)
      .eq("request_status", "pending"),

    supabase
      .from("family_person_identity_claims")
      .select(`
        id,
        participant_id,
        person_id,
        submitted_at
      `)
      .eq("event_slug", eventSlug)
      .eq("claim_status", "pending"),
  ]);

  if (memoriesResult.error) {
    throw new Error("Impossible de charger les souvenirs en attente.");
  }

  if (photosResult.error) {
    throw new Error("Impossible de charger les photos en attente.");
  }

  if (visibilityRequestsResult.error) {
    throw new Error("Impossible de charger les demandes de visibilité en attente.");
  }

  if (identityClaimsResult.error) {
    throw new Error("Impossible de charger les demandes d’identification en attente.");
  }

  const memoryRows = (memoriesResult.data ?? []) as MemoryRow[];
  const photoRows = (photosResult.data ?? []) as PhotoRow[];
  const visibilityRows = (visibilityRequestsResult.data ??
    []) as VisibilityRequestRow[];
  const claimRows = (identityClaimsResult.data ?? []) as IdentityClaimRow[];

  const participantIds = Array.from(
    new Set(
      [...memoryRows, ...photoRows, ...visibilityRows, ...claimRows]
        .map((row) => row.participant_id)
        .filter(Boolean),
    ),
  );

  let participantsById = new Map<string, ParticipantRow>();

  if (participantIds.length > 0) {
    const participantsResult = await supabase
      .from("participants")
      .select(`
        id,
        first_name,
        last_name
      `)
      .in("id", participantIds);

    if (participantsResult.error) {
      throw new Error(
        "Impossible de charger les participants liés à la modération.",
      );
    }

    participantsById = new Map(
      ((participantsResult.data ?? []) as ParticipantRow[]).map((row) => [
        row.id,
        row,
      ]),
    );
  }

  const memoryItems: ModerationQueueItem[] = memoryRows.map((row) => {
    const participant = participantsById.get(row.participant_id);
    const personLabel = getPersonLabelFromFamilyGraph(row.person_id);

    return {
      id: row.id,
      type: "memory",
      title: "Souvenir à modérer",
      subtitle: personLabel,
      preview: row.content ?? "",
      submittedAt: row.submitted_at,
      participantId: row.participant_id,
      participantLabel: formatParticipantLabel(participant),
      personId: row.person_id,
      personLabel,
    };
  });

  const photoItems: ModerationQueueItem[] = photoRows.map((row) => {
    const participant = participantsById.get(row.participant_id);
    const personLabel = getPersonLabelFromFamilyGraph(row.person_id);

    return {
      id: row.id,
      type: "photo",
      title: "Photo à modérer",
      subtitle: personLabel,
      preview: row.caption || row.storage_path,
      submittedAt: row.submitted_at,
      participantId: row.participant_id,
      participantLabel: formatParticipantLabel(participant),
      personId: row.person_id,
      personLabel,
    };
  });

  const visibilityItems: ModerationQueueItem[] = visibilityRows.map((row) => {
    const participant = participantsById.get(row.participant_id);
    const personLabel = getPersonLabelFromFamilyGraph(row.person_id);

    return {
      id: row.id,
      type: "visibility_request",
      title: "Demande d’accès à la fiche",
      subtitle: personLabel,
      preview: row.justification,
      submittedAt: row.submitted_at,
      participantId: row.participant_id,
      participantLabel: formatParticipantLabel(participant),
      personId: row.person_id,
      personLabel,
    };
  });

  const claimItems: ModerationQueueItem[] = claimRows.map((row) => {
    const participant = participantsById.get(row.participant_id);
    const personLabel = getPersonLabelFromFamilyGraph(row.person_id);

    return {
      id: row.id,
      type: "identity_claim",
      title: "Demande d’identification",
      subtitle: personLabel,
      preview: "Rattachement manuel à confirmer",
      submittedAt: row.submitted_at,
      participantId: row.participant_id,
      participantLabel: formatParticipantLabel(participant),
      personId: row.person_id,
      personLabel,
    };
  });

  return [...memoryItems, ...photoItems, ...visibilityItems, ...claimItems].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}