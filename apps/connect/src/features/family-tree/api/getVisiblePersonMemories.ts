import { supabase } from "../../../lib/supabase/client";

export type PersonMemoryItem = {
  id: string;
  event_slug: string;
  participant_id: string;
  person_id: string;
  content: string;
  moderation_status: "pending" | "approved" | "rejected";
  moderator_comment?: string | null;
  submitted_at: string;
  updated_at: string;
  authorDisplayName?: string | null;
  isMine: boolean;
};

type ParticipantProfile = {
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
};

function buildDisplayName(
  profile: ParticipantProfile | null,
  participantId: string,
  currentParticipantId?: string | null,
): string | null {
  if (!profile) return null;

  if (currentParticipantId && participantId === currentParticipantId) {
    return "Moi";
  }

  const firstName = profile.first_name?.trim() ?? "";
  const lastName = profile.last_name?.trim() ?? "";
  const nickname = profile.nickname?.trim();

  if (nickname) {
    return `${firstName} "${nickname}" ${lastName}`.trim();
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || null;
}

export async function getVisiblePersonMemories(params: {
  eventSlug: string;
  personId: string;
  currentParticipantId: string;
}): Promise<PersonMemoryItem[]> {
  const { eventSlug, personId, currentParticipantId } = params;

  const { data, error } = await supabase
    .from("family_person_memories")
    .select(`
      id,
      event_slug,
      participant_id,
      person_id,
      content,
      moderation_status,
      moderator_comment,
      submitted_at,
      updated_at,
      participant:participant_id (
        first_name,
        last_name,
        nickname
      )
    `)
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .neq("moderation_status", "deleted")
    .or(
      `moderation_status.eq.approved,and(participant_id.eq.${currentParticipantId},moderation_status.in.(pending,rejected))`,
    )
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    event_slug: row.event_slug,
    participant_id: row.participant_id,
    person_id: row.person_id,
    content: row.content,
    moderation_status: row.moderation_status,
    moderator_comment: row.moderator_comment,
    submitted_at: row.submitted_at,
    updated_at: row.updated_at,
    authorDisplayName: buildDisplayName(
      row.participant,
      row.participant_id,
      currentParticipantId,
    ),
    isMine: row.participant_id === currentParticipantId,
  }));
}