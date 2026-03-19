import { supabase } from "../../../lib/supabase/client";
import type { FamilyPersonReactionSummary } from "../types/types-reactions";

export async function getPersonReactionState(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
}): Promise<FamilyPersonReactionSummary> {
  const { eventSlug, participantId, personId } = params;

  const { data, error } = await supabase
    .from("family_person_reactions")
    .select("reaction_type, is_active")
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .eq("person_id", personId);

  if (error) throw error;

  const active = new Set(
    (data ?? [])
      .filter((row) => row.is_active)
      .map((row) => row.reaction_type),
  );

  return {
    knewPerson: active.has("knew_person"),
    heardOfPerson: active.has("heard_of_person"),
    touchedByPerson: active.has("touched_by_person"),
    reactionsCount: active.size,
  };
}