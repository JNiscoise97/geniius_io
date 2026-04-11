import { supabase } from "../../../lib/supabase/client";
import type { AdminParticipantListItem } from "../types/adminParticipantTypes";

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  birth_year: number | null;
  email: string | null;
  phone: string | null;
};

type ParticipantConsentRow = {
  participant_id: string;
  allow_name_in_family_tree: boolean | null;
};

export async function listAdminParticipants(
  eventSlug: string
): Promise<AdminParticipantListItem[]> {
  const [{ data: participants, error: participantsError }, { data: consents, error: consentsError }] =
    await Promise.all([
      supabase
        .from("participants")
        .select("id, first_name, last_name, nickname, birth_year, email, phone")
        .eq("event_slug", eventSlug)
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true })
        .returns<ParticipantRow[]>(),
      supabase
        .from("participant_consents")
        .select("participant_id, allow_name_in_family_tree")
        .returns<ParticipantConsentRow[]>(),
    ]);

  if (participantsError) {
    throw new Error(
      `Impossible de charger les participants : ${participantsError.message}`
    );
  }

  if (consentsError) {
    throw new Error(
      `Impossible de charger les consentements : ${consentsError.message}`
    );
  }

  const consentsByParticipantId = new Map(
    (consents ?? []).map((row) => [row.participant_id, row])
  );

  return (participants ?? []).map((participant) => {
    const consent = consentsByParticipantId.get(participant.id);

    return {
      participantId: participant.id,
      firstName: participant.first_name?.trim() ?? "",
      lastName: participant.last_name?.trim() ?? "",
      nickname: participant.nickname?.trim() || null,
      birthYear: participant.birth_year ?? null,
      email: participant.email?.trim() || null,
      phone: participant.phone?.trim() || null,
      allowNameInFamilyTree: consent?.allow_name_in_family_tree === true,
      hasConnectedIdentity: Boolean(
        participant.first_name?.trim() || participant.last_name?.trim()
      ),
    };
  });
}