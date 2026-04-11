import { supabase } from "../../../lib/supabase/client";

export type AdminFamilyDocumentEventItem = {
  id: string;
  participantId: string;
  participantLabel: string;
  participantEmail: string | null;
  documentSlug: string;
  documentTitle: string;
  action: "view" | "download";
  createdAt: string;
};

type DocumentEventRow = {
  id: string;
  participant_id: string;
  document_slug: string;
  action: "view" | "download";
  created_at: string;
};

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  email: string | null;
};

import { getFamilyDocumentBySlug } from "../data/familyDocumentsCatalog";

function getParticipantLabel(participant: ParticipantRow | undefined): string {
  if (!participant) {
    return "Participant inconnu";
  }

  const nickname = participant.nickname?.trim();
  if (nickname) return nickname;

  const fullName = [participant.first_name, participant.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) return fullName;

  return participant.email?.trim() || "Participant inconnu";
}

export async function listFamilyDocumentEventsForAdmin(
  eventSlug: string
): Promise<AdminFamilyDocumentEventItem[]> {
  const { data: rows, error } = await supabase
    .from("participant_document_events")
    .select("id, participant_id, document_slug, action, created_at")
    .eq("event_slug", eventSlug)
    .order("created_at", { ascending: false })
    .returns<DocumentEventRow[]>();

  if (error) {
    throw new Error(
      `Impossible de charger les événements documentaires : ${error.message}`
    );
  }

  const participantIds = Array.from(
    new Set((rows ?? []).map((row) => row.participant_id))
  );

  let participantsById = new Map<string, ParticipantRow>();

  if (participantIds.length > 0) {
    const { data: participants, error: participantsError } = await supabase
      .from("participants")
      .select("id, first_name, last_name, nickname, email")
      .in("id", participantIds)
      .returns<ParticipantRow[]>();

    if (participantsError) {
      throw new Error(
        `Impossible de charger les participants : ${participantsError.message}`
      );
    }

    participantsById = new Map((participants ?? []).map((p) => [p.id, p]));
  }

  return (rows ?? []).map((row) => {
    const doc = getFamilyDocumentBySlug(row.document_slug);

    return {
      id: row.id,
      participantId: row.participant_id,
      participantLabel: getParticipantLabel(participantsById.get(row.participant_id)),
      participantEmail: participantsById.get(row.participant_id)?.email ?? null,
      documentSlug: row.document_slug,
      documentTitle: doc?.title ?? row.document_slug,
      action: row.action,
      createdAt: row.created_at,
    };
  });
}