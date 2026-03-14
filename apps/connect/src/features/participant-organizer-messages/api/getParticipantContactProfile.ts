import { supabase } from "../../../lib/supabase/client";
import type { ContactChannel } from "../../participant-access/components/ContactChannelCheckboxGroup";

type ParticipantRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  has_whatsapp: boolean;
  messenger: string | null;
  preferred_contact_channels: string[] | null;
};

export type ParticipantContactProfile = {
  participantId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  hasWhatsapp: boolean;
  messenger?: string;
  preferredContactChannels: ContactChannel[];
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

export async function getParticipantContactProfile(
  participantId: string,
): Promise<ParticipantContactProfile | null> {
  const normalizedParticipantId = participantId.trim();
  if (!normalizedParticipantId) return null;

  const { data, error } = await supabase
    .from("participants")
    .select(`
      id,
      first_name,
      last_name,
      phone,
      email,
      has_whatsapp,
      messenger,
      preferred_contact_channels
    `)
    .eq("id", normalizedParticipantId)
    .maybeSingle<ParticipantRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    participantId: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    hasWhatsapp: data.has_whatsapp === true,
    messenger: data.messenger ?? undefined,
    preferredContactChannels: normalizeChannels(data.preferred_contact_channels),
  };
}