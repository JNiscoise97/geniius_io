import { supabase } from "../../../lib/supabase/client";
import type { FamilyReactionType } from "../types/types-reactions";

export async function togglePersonReaction(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
  reactionType: FamilyReactionType;
  isActive: boolean;
}): Promise<void> {
  const { eventSlug, participantId, personId, reactionType, isActive } = params;

  const { error } = await supabase
    .from("family_person_reactions")
    .upsert(
      {
        event_slug: eventSlug,
        participant_id: participantId,
        person_id: personId,
        reaction_type: reactionType,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "event_slug,participant_id,person_id,reaction_type",
      },
    );

  if (error) throw error;
}