import { supabase } from "../../../lib/supabase/client";
import type { FamilyTreeRole } from "../../family-tree/types/permissions";

type DeleteAdminParticipantRoleParams = {
  eventSlug: string;
  participantId: string;
  role: FamilyTreeRole;
};

export async function deleteAdminParticipantRole({
  eventSlug,
  participantId,
  role,
}: DeleteAdminParticipantRoleParams): Promise<void> {
  const { error } = await supabase
    .from("participant_roles")
    .delete()
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .eq("role", role);

  if (error) {
    throw new Error(`Impossible de retirer le rôle : ${error.message}`);
  }
}