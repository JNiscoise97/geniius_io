import { supabase } from "../../../lib/supabase/client";

export type RecoveryParticipantPreview = {
  participantId: string;
  eventSlug: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  defaultGedcomPersonId?: string;
};

type ParticipantRow = {
  id: string;
  event_slug: string;
  first_name: string | null;
  last_name: string | null;
  default_gedcom_person_id: string | null;
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
    .select("id, event_slug, first_name, last_name, default_gedcom_person_id")
    .eq("recovery_token", token)
    .maybeSingle<ParticipantRow>();

  if (participantRes.error) {
    throw new Error(participantRes.error.message);
  }

  if (!participantRes.data) {
    return null;
  }

  const participant = participantRes.data;
  const firstName = participant.first_name ?? undefined;
  const lastName = participant.last_name ?? undefined;
  const defaultGedcomPersonId = participant.default_gedcom_person_id ?? undefined;

  return {
    participantId: participant.id,
    eventSlug: participant.event_slug,
    firstName,
    lastName,
    displayName: buildDisplayName(firstName, lastName),
    defaultGedcomPersonId
  };
}