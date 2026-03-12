import { supabase } from "../../../lib/supabase/client";

export type RecoveryParticipantPreview = {
  participantId: string;
  eventSlug: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
};

type ParticipantRow = {
  id: string;
  event_slug: string;
};

type ParticipantIdentityRow = {
  participant_id: string;
  first_name: string | null;
  last_name: string | null;
};

function buildDisplayName(firstName?: string, lastName?: string): string {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Profil familial";
}

export async function getParticipantByRecoveryToken(
  recoveryToken: string,
): Promise<RecoveryParticipantPreview | null> {
  const token = recoveryToken.trim();
  if (!token) return null;

  const participantRes = await supabase
    .from("participants")
    .select("id, event_slug")
    .eq("recovery_token", token)
    .maybeSingle<ParticipantRow>();

  if (participantRes.error) {
    throw new Error(participantRes.error.message);
  }

  if (!participantRes.data) {
    return null;
  }

  const participant = participantRes.data;

  const identityRes = await supabase
    .from("participant_identity")
    .select("participant_id, first_name, last_name")
    .eq("participant_id", participant.id)
    .maybeSingle<ParticipantIdentityRow>();

  if (identityRes.error) {
    throw new Error(identityRes.error.message);
  }

  const firstName = identityRes.data?.first_name ?? undefined;
  const lastName = identityRes.data?.last_name ?? undefined;

  return {
    participantId: participant.id,
    eventSlug: participant.event_slug,
    firstName,
    lastName,
    displayName: buildDisplayName(firstName, lastName),
  };
}