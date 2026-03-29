import { supabase } from "../../../lib/supabase/client";

export type ParticipantContactChannel = "sms" | "whatsapp" | "messenger";

export type ParticipantAccessCreateValues = {
  firstName: string;
  lastName: string;
  birthYear: string;
  email: string;
  phone?: string;
  hasWhatsapp: boolean;
  messenger?: string;
  preferredContactChannels: ParticipantContactChannel[];
};

type ParticipantRow = {
  id: string;
  event_slug: string;
  first_name: string;
  last_name: string;
  birth_year: number | null;
  email: string | null;
  phone: string | null;
  has_whatsapp: boolean | null;
  messenger: string | null;
  preferred_contact_channels: string[] | null;
};

type ParticipantEmailLookupRow = {
  id: string;
  event_slug: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type SaveParticipantAccessProfileResult = {
  participantId: string;
  eventSlug: string;
  firstName: string;
  lastName: string;
  birthYear?: string;
  email?: string;
  phone?: string;
  hasWhatsapp: boolean;
  messenger?: string;
  preferredContactChannels: ParticipantContactChannel[];
};

export class ExistingParticipantEmailError extends Error {
  participantId: string;
  eventSlug: string;
  email: string;
  maskedDisplayName: string;

  constructor(input: {
    participantId: string;
    eventSlug: string;
    email: string;
    maskedDisplayName: string;
  }) {
    super("Cette adresse email est déjà utilisée pour un profil existant.");
    this.name = "ExistingParticipantEmailError";
    this.participantId = input.participantId;
    this.eventSlug = input.eventSlug;
    this.email = input.email;
    this.maskedDisplayName = input.maskedDisplayName;
  }
}

function normalizeText(value?: string): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

function normalizeEmail(value?: string): string | undefined {
  const v = value?.trim().toLowerCase();
  return v ? v : undefined;
}

function normalizeBirthYear(value?: string): number | null {
  const v = value?.trim();
  if (!v || !/^\d{4}$/.test(v)) return null;
  return Number(v);
}

function uniqueChannels(values: string[]): ParticipantContactChannel[] {
  const allowed: ParticipantContactChannel[] = ["sms", "whatsapp", "messenger"];
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].filter(
    (v): v is ParticipantContactChannel =>
      allowed.includes(v as ParticipantContactChannel),
  );
}

function maskNamePart(value?: string): string {
  const v = value?.trim();
  if (!v) return "";
  if (v.length === 1) return "*";
  return `${v[0]}${"*".repeat(Math.max(4, v.length - 1))}`;
}

function buildMaskedDisplayName(firstName?: string, lastName?: string): string {
  const parts = [maskNamePart(firstName), maskNamePart(lastName)].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Profil familial";
}

function toResult(row: ParticipantRow): SaveParticipantAccessProfileResult {
  return {
    participantId: row.id,
    eventSlug: row.event_slug,
    firstName: row.first_name,
    lastName: row.last_name,
    birthYear: row.birth_year ? String(row.birth_year) : undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    hasWhatsapp: row.has_whatsapp === true,
    messenger: row.messenger ?? undefined,
    preferredContactChannels: uniqueChannels(
      row.preferred_contact_channels ?? [],
    ),
  };
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
  const email = normalizeEmail(values.email);
  const phone = normalizeText(values.phone);
  const hasWhatsapp = values.hasWhatsapp === true;
  const messenger = normalizeText(values.messenger);
  const preferredContactChannels = uniqueChannels(values.preferredContactChannels);

  if (!normalizedEventSlug) {
    throw new Error("eventSlug requis.");
  }

  if (!firstName || !lastName) {
    throw new Error("Le prénom et le nom sont requis.");
  }

  if (birthYear === null) {
    throw new Error("L’année de naissance est requise.");
  }

  if (!email) {
    throw new Error(
      "Une adresse email est requise pour envoyer le lien personnel.",
    );
  }

  const participantLookup = await supabase
    .from("participants")
    .select(`
      id,
      event_slug,
      first_name,
      last_name,
      birth_year,
      email,
      phone,
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

  const existingByIdentity = participantLookup.data ?? null;

  const emailLookup = await supabase
    .from("participants")
    .select("id, event_slug, first_name, last_name, email")
    .eq("event_slug", normalizedEventSlug)
    .eq("email", email)
    .maybeSingle<ParticipantEmailLookupRow>();

  if (emailLookup.error) {
    throw new Error(emailLookup.error.message);
  }

  const existingByEmail = emailLookup.data ?? null;

  if (
    existingByEmail &&
    (!existingByIdentity || existingByEmail.id !== existingByIdentity.id)
  ) {
    throw new ExistingParticipantEmailError({
      participantId: existingByEmail.id,
      eventSlug: existingByEmail.event_slug,
      email: existingByEmail.email ?? email,
      maskedDisplayName: buildMaskedDisplayName(
        existingByEmail.first_name ?? undefined,
        existingByEmail.last_name ?? undefined,
      ),
    });
  }

  if (existingByIdentity) {
    const updateRes = await supabase
      .from("participants")
      .update({
        email,
        phone: phone ?? existingByIdentity.phone,
        has_whatsapp: hasWhatsapp || existingByIdentity.has_whatsapp === true,
        messenger: messenger ?? existingByIdentity.messenger,
        preferred_contact_channels:
          preferredContactChannels.length > 0
            ? preferredContactChannels
            : existingByIdentity.preferred_contact_channels ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingByIdentity.id)
      .select(`
        id,
        event_slug,
        first_name,
        last_name,
        birth_year,
        email,
        phone,
        has_whatsapp,
        messenger,
        preferred_contact_channels
      `)
      .single<ParticipantRow>();

    if (updateRes.error) {
      throw new Error(updateRes.error.message);
    }

    return toResult(updateRes.data);
  }

  const insertRes = await supabase
    .from("participants")
    .insert({
      event_slug: normalizedEventSlug,
      first_name: firstName,
      last_name: lastName,
      birth_year: birthYear,
      email,
      phone: phone ?? null,
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
      email,
      phone,
      has_whatsapp,
      messenger,
      preferred_contact_channels
    `)
    .single<ParticipantRow>();

  if (insertRes.error) {
    throw new Error(insertRes.error.message);
  }
  return toResult(insertRes.data);
}