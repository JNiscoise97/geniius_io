import { supabase } from "../../../lib/supabase/client";

export type ConfirmParticipantRecoveryByParticipantIdInput = {
  participantId: string;
  birthYear: string;
};

export type ConfirmParticipantRecoveryByParticipantIdResult = {
  participantId: string;
  eventSlug: string;
  firstName?: string;
  lastName?: string;
  birthYear: string;
  email?: string;
  recoveryToken?: string;
};

type ParticipantRow = {
  id: string;
  event_slug: string;
  first_name: string | null;
  last_name: string | null;
  birth_year: number | null;
  email: string | null;
  recovery_token: string | null;
};

export async function confirmParticipantRecoveryByParticipantId({
  participantId,
  birthYear,
}: ConfirmParticipantRecoveryByParticipantIdInput): Promise<ConfirmParticipantRecoveryByParticipantIdResult | null> {
  const normalizedParticipantId = participantId.trim();
  const normalizedBirthYear = birthYear.trim();

  if (!normalizedParticipantId || !/^\d{4}$/.test(normalizedBirthYear)) {
    return null;
  }

  const participantRes = await supabase
    .from("participants")
    .select(
      "id, event_slug, first_name, last_name, birth_year, email, recovery_token",
    )
    .eq("id", normalizedParticipantId)
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

  return {
    participantId: participant.id,
    eventSlug: participant.event_slug,
    firstName: participant.first_name ?? undefined,
    lastName: participant.last_name ?? undefined,
    birthYear: normalizedBirthYear,
    email: participant.email ?? undefined,
    recoveryToken: participant.recovery_token ?? undefined,
  };
}