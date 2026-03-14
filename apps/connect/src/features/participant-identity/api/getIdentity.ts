import { supabase } from "../../../lib/supabase/client";
import type { IdentityFormValues } from "../components/IdentityForm";
import type { ContactChannel } from "../../participant-access/components/ContactChannelCheckboxGroup";

type ParticipantRow = {
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  birth_year: number | null;
  phone: string | null;
  email: string | null;
  has_whatsapp: boolean | null;
  messenger: string | null;
  preferred_contact_channels: string[] | null;
};

type IdentityRow = {
  branch_keys: string[] | null;
  attended_edition_keys: string[] | null;
};

function normalizeChannels(values: string[] | null | undefined): ContactChannel[] {
  const allowed = new Set<ContactChannel>([
    "sms",
    "email",
    "whatsapp",
    "messenger",
  ]);

  return (values ?? []).filter(
    (value): value is ContactChannel => allowed.has(value as ContactChannel),
  );
}

type GetIdentityInput = {
  participantId: string;
};

export async function getIdentity({
  participantId,
}: GetIdentityInput): Promise<IdentityFormValues | null> {
  const [participantRes, identityRes] = await Promise.all([
    supabase
      .from("participants")
      .select(
        "first_name, last_name, nickname, birth_year, phone, email, has_whatsapp, messenger, preferred_contact_channels",
      )
      .eq("id", participantId)
      .maybeSingle<ParticipantRow>(),

    supabase
      .from("participant_identity")
      .select("branch_keys, attended_edition_keys")
      .eq("participant_id", participantId)
      .maybeSingle<IdentityRow>(),
  ]);

  if (participantRes.error) {
    throw new Error(participantRes.error.message);
  }

  if (identityRes.error) {
    throw new Error(identityRes.error.message);
  }

  if (!participantRes.data) return null;

  return {
    firstName: participantRes.data.first_name ?? "",
    lastName: participantRes.data.last_name ?? "",
    nickname: participantRes.data.nickname ?? "",
    birthYear: participantRes.data.birth_year
      ? String(participantRes.data.birth_year)
      : "",
    phone: participantRes.data.phone ?? "",
    email: participantRes.data.email ?? "",
    hasWhatsapp: participantRes.data.has_whatsapp === true,
    messenger: participantRes.data.messenger ?? "",
    preferredContactChannels: normalizeChannels(
      participantRes.data.preferred_contact_channels,
    ),
    branchKeys: identityRes.data?.branch_keys ?? [],
    previousEditionKeys: identityRes.data?.attended_edition_keys ?? [],
  };
}