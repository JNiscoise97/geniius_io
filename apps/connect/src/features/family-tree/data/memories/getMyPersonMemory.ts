import { supabase } from "../../../../lib/supabase/client";
import type { FamilyPersonMemory } from "../../types/reactions";

export async function getMyPersonMemory(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
}): Promise<FamilyPersonMemory | null> {
  const { eventSlug, participantId, personId } = params;

  const { data, error } = await supabase
    .from("family_person_memories")
    .select("*")
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .eq("person_id", personId)
    .maybeSingle();

  if (error) throw error;
  return data;
}