import { supabase } from "../../../../lib/supabase/client";

export type GetParticipantDefaultGedcomPersonIdParams = {
  eventSlug: string;
  participantId: string;
};

export async function getParticipantDefaultGedcomPersonId({
  eventSlug,
  participantId,
}: GetParticipantDefaultGedcomPersonIdParams): Promise<string | null> {
  const { data, error } = await supabase
    .from("participants")
    .select("default_gedcom_person_id")
    .eq("id", participantId)
    .eq("event_slug", eventSlug)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Impossible de charger le profil participant : ${error.message}`,
    );
  }

  return data?.default_gedcom_person_id ?? null;
}