import { supabase } from "../../../../lib/supabase/client";
import type { FamilyTreeRole } from "../../types/permissions";

export async function getParticipantRoles(params: {
  eventSlug: string;
  participantId: string;
}): Promise<FamilyTreeRole[]> {
  const { eventSlug, participantId } = params;

  const { data, error } = await supabase
    .from("participant_roles")
    .select("role")
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => row.role)
    .filter((role): role is FamilyTreeRole => Boolean(role));
}