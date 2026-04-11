import { supabase } from "../../../lib/supabase/client";
import type {
  AdminParticipantEventMemoryItem,
  ParticipantEventMemoryRow,
} from "../types/participantEventMemoryTypes";

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  email: string | null;
};

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

export async function listParticipantEventMemoriesForAdmin(
  eventSlug: string
): Promise<AdminParticipantEventMemoryItem[]> {
  const { data: rows, error } = await supabase
    .from("participant_event_memories")
    .select("*")
    .eq("event_slug", eventSlug)
    .order("submitted_at", { ascending: false })
    .returns<ParticipantEventMemoryRow[]>();

  if (error) {
    throw new Error(
      `Impossible de charger les témoignages à modérer : ${error.message}`
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

    participantsById = new Map((participants ?? []).map((row) => [row.id, row]));
  }

  return (rows ?? []).map((row) => {
    const participant = participantsById.get(row.participant_id);

    return {
      id: row.id,
      participantId: row.participant_id,
      participantLabel: getParticipantLabel(participant),
      participantEmail: participant?.email ?? null,
      mediaKind: row.media_kind,
      title: row.title,
      content: row.content,
      mood: row.mood,
      allowPublicDisplay: row.allow_public_display,
      moderationStatus: row.moderation_status,
      moderatorComment: row.moderator_comment,
      submittedAt: row.submitted_at,
      moderatedAt: row.moderated_at,
      updatedAt: row.updated_at,
    };
  });
}