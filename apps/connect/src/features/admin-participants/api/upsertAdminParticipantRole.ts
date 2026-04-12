import { supabase } from "../../../lib/supabase/client";
import type { FamilyTreeRole } from "../../family-tree/types/permissions";

type UpsertAdminParticipantRoleParams = {
  eventSlug: string;
  participantId: string;
  role: FamilyTreeRole;
};

export async function upsertAdminParticipantRole({
  eventSlug,
  participantId,
  role,
}: UpsertAdminParticipantRoleParams): Promise<void> {
  const { error } = await supabase.from("participant_roles").upsert(
    {
      event_slug: eventSlug,
      participant_id: participantId,
      role,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "event_slug,participant_id,role",
    }
  );

  if (error) {
    throw new Error(`Impossible d'ajouter le rôle : ${error.message}`);
  }
}