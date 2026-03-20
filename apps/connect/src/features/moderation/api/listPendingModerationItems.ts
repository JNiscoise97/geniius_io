// src/features/moderation/api/listPendingModerationItems.ts

import { supabase } from "../../../lib/supabase/client";
import { getPersonLabelFromFamilyGraph } from "../lib/moderationLabels";
import type { ModerationQueueItem } from "../types";

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

function formatParticipantLabel(row?: ParticipantRow): string {
  if (!row) return "Participant inconnu";

  const firstName = row.first_name?.trim() ?? "";
  const lastName = row.last_name?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return fullName || `Participant sans nom (${row.id})`;
}

export async function listPendingModerationItems(
  eventSlug: string,
): Promise<ModerationQueueItem[]> {
  const [memoriesResult, photosResult] = await Promise.all([
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
  ]);

  if (memoriesResult.error) {
    throw new Error("Impossible de charger les souvenirs en attente.");
  }

  if (photosResult.error) {
    throw new Error("Impossible de charger les photos en attente.");
  }

  const memoryRows = memoriesResult.data ?? [];
  const photoRows = photosResult.data ?? [];

  const participantIds = Array.from(
    new Set(
      [...memoryRows, ...photoRows]
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
      throw new Error("Impossible de charger les participants liés à la modération.");
    }

    participantsById = new Map(
      (participantsResult.data ?? []).map((row) => [row.id, row]),
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
      preview: row.content,
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

  return [...memoryItems, ...photoItems].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}