import { supabase } from "../../../../lib/supabase/client";

export type TouchedParticipantItem = {
  participantId: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
};

export async function getTouchedParticipants(params: {
  eventSlug: string;
  personId: string;
}): Promise<TouchedParticipantItem[]> {
  const { eventSlug, personId } = params;

  const { data, error } = await supabase
    .from("family_person_reactions")
    .select(`
      participant_id,
      participants:participant_id (
        first_name,
        last_name,
        nickname
      )
    `)
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .eq("reaction_type", "touched_by_person")
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  const unique = new Map<string, TouchedParticipantItem>();

  for (const row of data ?? []) {
    const participantId = row.participant_id as string;
    const participant = Array.isArray(row.participants)
      ? row.participants[0]
      : row.participants;

    if (!unique.has(participantId)) {
      unique.set(participantId, {
        participantId,
        firstName: participant?.first_name ?? null,
        lastName: participant?.last_name ?? null,
        nickname: participant?.nickname ?? null,
      });
    }
  }

  return Array.from(unique.values());
}