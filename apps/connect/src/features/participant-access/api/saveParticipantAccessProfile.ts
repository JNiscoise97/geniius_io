import { supabase } from "../../../lib/supabase/client";

export type ParticipantAccessCreateValues = {
  firstName: string;
  lastName: string;
  birthYear: string;
  phone?: string;
  email?: string;
  hasWhatsapp: boolean;
  messenger?: string;
  preferredContactChannels: Array<"sms" | "email" | "whatsapp" | "messenger">;
};

type ParticipantRow = {
  id: string;
  event_slug: string;
  first_name: string;
  last_name: string;
  birth_year: number | null;
  phone: string | null;
  email: string | null;
  has_whatsapp: boolean | null;
  messenger: string | null;
  preferred_contact_channels: string[] | null;
};

export type SaveParticipantAccessProfileResult = {
  participantId: string;
  eventSlug: string;
  firstName: string;
  lastName: string;
  birthYear?: string;
  phone?: string;
  email?: string;
  hasWhatsapp: boolean;
  messenger?: string;
  preferredContactChannels: string[];
};

function normalizeText(value?: string): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

function normalizeBirthYear(value?: string): number | null {
  const v = value?.trim();
  if (!v || !/^\d{4}$/.test(v)) return null;
  return Number(v);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export async function saveParticipantAccessProfile({
  eventSlug,
  values,
}: {
  eventSlug: string;
  values: ParticipantAccessCreateValues;
}): Promise<SaveParticipantAccessProfileResult> {
  const normalizedEventSlug = eventSlug.trim();
  const firstName = normalizeText(values.firstName);
  const lastName = normalizeText(values.lastName);
  const birthYear = normalizeBirthYear(values.birthYear);
  const phone = normalizeText(values.phone);
  const email = normalizeText(values.email);
  const hasWhatsapp = values.hasWhatsapp === true;
  const messenger = normalizeText(values.messenger);
  const preferredContactChannels = uniqueStrings(values.preferredContactChannels);

  if (!normalizedEventSlug) {
    throw new Error("eventSlug requis.");
  }

  if (!firstName || !lastName) {
    throw new Error("Le prénom et le nom sont requis.");
  }

  const participantLookup = await supabase
    .from("participants")
    .select(`
      id,
      event_slug,
      first_name,
      last_name,
      birth_year,
      phone,
      email,
      has_whatsapp,
      messenger,
      preferred_contact_channels
    `)
    .eq("event_slug", normalizedEventSlug)
    .eq("first_name", firstName)
    .eq("last_name", lastName)
    .eq("birth_year", birthYear)
    .maybeSingle<ParticipantRow>();

  if (participantLookup.error) {
    throw new Error(participantLookup.error.message);
  }

  if (participantLookup.data) {
    const existing = participantLookup.data;

    const updateRes = await supabase
      .from("participants")
      .update({
        phone: phone ?? existing.phone,
        email: email ?? existing.email,
        has_whatsapp: hasWhatsapp || existing.has_whatsapp === true,
        messenger: messenger ?? existing.messenger,
        preferred_contact_channels:
          preferredContactChannels.length > 0
            ? preferredContactChannels
            : existing.preferred_contact_channels ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select(`
        id,
        event_slug,
        first_name,
        last_name,
        birth_year,
        phone,
        email,
        has_whatsapp,
        messenger,
        preferred_contact_channels
      `)
      .single<ParticipantRow>();

    if (updateRes.error) {
      throw new Error(updateRes.error.message);
    }

    const row = updateRes.data;

    return {
      participantId: row.id,
      eventSlug: row.event_slug,
      firstName: row.first_name,
      lastName: row.last_name,
      birthYear: row.birth_year ? String(row.birth_year) : undefined,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      hasWhatsapp: row.has_whatsapp === true,
      messenger: row.messenger ?? undefined,
      preferredContactChannels: row.preferred_contact_channels ?? [],
    };
  }

  const insertRes = await supabase
    .from("participants")
    .insert({
      event_slug: normalizedEventSlug,
      first_name: firstName,
      last_name: lastName,
      birth_year: birthYear,
      phone: phone ?? null,
      email: email ?? null,
      has_whatsapp: hasWhatsapp,
      messenger: messenger ?? null,
      preferred_contact_channels: preferredContactChannels,
    })
    .select(`
      id,
      event_slug,
      first_name,
      last_name,
      birth_year,
      phone,
      email,
      has_whatsapp,
      messenger,
      preferred_contact_channels
    `)
    .single<ParticipantRow>();

  if (insertRes.error) {
    throw new Error(insertRes.error.message);
  }

  const row = insertRes.data;

  return {
    participantId: row.id,
    eventSlug: row.event_slug,
    firstName: row.first_name,
    lastName: row.last_name,
    birthYear: row.birth_year ? String(row.birth_year) : undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    hasWhatsapp: row.has_whatsapp === true,
    messenger: row.messenger ?? undefined,
    preferredContactChannels: row.preferred_contact_channels ?? [],
  };
}