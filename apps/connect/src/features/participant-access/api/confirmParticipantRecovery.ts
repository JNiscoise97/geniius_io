import { supabase } from "../../../lib/supabase/client";

export type ConfirmParticipantRecoveryInput = {
  recoveryToken: string;
  birthYear: string;
};

export type ConfirmParticipantRecoveryResult = {
  participantId: string;
  eventSlug: string;
  firstName?: string;
  lastName?: string;
  birthYear: string;
  displayName: string;
};

type ParticipantRow = {
  id: string;
  event_slug: string;
  birth_year: number | null;
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

export async function confirmParticipantRecovery({
  recoveryToken,
  birthYear,
}: ConfirmParticipantRecoveryInput): Promise<ConfirmParticipantRecoveryResult | null> {
  const token = recoveryToken.trim();
  const normalizedBirthYear = birthYear.trim();

  if (!token || !/^\d{4}$/.test(normalizedBirthYear)) {
    return null;
  }

  const participantRes = await supabase
    .from("participants")
    .select("id, event_slug, birth_year")
    .eq("recovery_token", token)
    .maybeSingle<ParticipantRow>();

  if (participantRes.error) {
    throw new Error(participantRes.error.message);
  }

  if (!participantRes.data) {
    return null;
  }

  const participant = participantRes.data;

  if (!participant.birth_year) {
    return null;
  }

  if (String(participant.birth_year) !== normalizedBirthYear) {
    return null;
  }

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
    birthYear: normalizedBirthYear,
    displayName: buildDisplayName(firstName, lastName),
  };
}