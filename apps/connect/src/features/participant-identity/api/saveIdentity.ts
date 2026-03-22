import { supabase } from "../../../lib/supabase/client";
import type { IdentityFormValues } from "../components/IdentityForm";

type SaveIdentityInput = {
  eventSlug: string;
  participantId?: string | null;
  values: IdentityFormValues;
  hasVerifiedClaim?: boolean;
  claimedPersonId?: string | null;
};

type SaveIdentityResult = {
  participantId: string;
  recoveryToken: string | null;
};

function getNowIso() {
  return new Date().toISOString();
}

function toBirthYearOrNull(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (!/^\d{4}$/.test(s)) return null;

  const year = Number(s);
  const currentYear = new Date().getFullYear();

  if (!Number.isFinite(year) || year < 1900 || year > currentYear) return null;
  return year;
}

function cleanText(value: string): string | null {
  const s = value.trim();
  return s ? s : null;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function generateRecoveryToken(length = 48): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function upsertProfileNamingAndBirthYearOverride(params: {
  eventSlug: string;
  personId: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  birthYear?: string | null;
}) {
  const { eventSlug, personId, firstName, lastName, nickname, birthYear } =
    params;

  const { data: existingOverrideRow, error: overrideReadError } = await supabase
    .from("person_overrides")
    .select(
      `
        id,
        overrides
      `,
    )
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .maybeSingle();

  if (overrideReadError) {
    throw overrideReadError;
  }

  const nextOverrides: Record<string, unknown> = {
    ...((existingOverrideRow?.overrides as Record<string, unknown> | null) ??
      {}),
  };

  if (firstName === null || firstName === undefined) {
    delete nextOverrides.firstName;
  } else {
    nextOverrides.firstName = firstName;
  }

  if (lastName === null || lastName === undefined) {
    delete nextOverrides.lastName;
  } else {
    nextOverrides.lastName = lastName;
  }

  if (nickname === null || nickname === undefined) {
    nextOverrides.nickname = "";
  } else {
    nextOverrides.nickname = nickname;
  }

  if (birthYear === null || birthYear === undefined) {
    nextOverrides.birthYear = "";
  } else {
    nextOverrides.birthYear = birthYear;
  }

  if (existingOverrideRow?.id) {
    const { error: overrideUpdateError } = await supabase
      .from("person_overrides")
      .update({
        overrides: nextOverrides,
        updated_at: getNowIso(),
      })
      .eq("id", existingOverrideRow.id);

    if (overrideUpdateError) {
      throw overrideUpdateError;
    }

    return;
  }

  const { error: overrideInsertError } = await supabase
    .from("person_overrides")
    .insert({
      event_slug: eventSlug,
      person_id: personId,
      overrides: nextOverrides,
      updated_at: getNowIso(),
    });

  if (overrideInsertError) {
    throw overrideInsertError;
  }
}

export async function saveIdentity({
  eventSlug,
  participantId,
  values,
  hasVerifiedClaim = false,
  claimedPersonId = null,
}: SaveIdentityInput): Promise<SaveIdentityResult> {
  let finalParticipantId = participantId ?? null;
  let recoveryToken: string | null = null;

  const payload = {
    first_name: values.firstName.trim(),
    last_name: values.lastName.trim(),
    nickname: cleanText(values.nickname),
    birth_year: toBirthYearOrNull(values.birthYear),
    phone: cleanText(values.phone),
    email: cleanText(values.email),
    has_whatsapp: values.hasWhatsapp === true,
    messenger: cleanText(values.messenger),
    preferred_contact_channels: uniqueStrings(values.preferredContactChannels),
    updated_at: getNowIso(),
  };

  if (finalParticipantId) {
    const updateParticipant = await supabase
      .from("participants")
      .update(payload)
      .eq("id", finalParticipantId)
      .select("id, recovery_token")
      .single();

    if (updateParticipant.error) {
      throw new Error(updateParticipant.error.message);
    }

    finalParticipantId = updateParticipant.data.id as string;
    recoveryToken =
      (updateParticipant.data.recovery_token as string | null) ?? null;
  } else {
    const newRecoveryToken = generateRecoveryToken(48);

    const insertParticipant = await supabase
      .from("participants")
      .insert({
        event_slug: eventSlug,
        ...payload,
        recovery_token: newRecoveryToken,
        recovery_token_created_at: getNowIso(),
      })
      .select("id, recovery_token")
      .single();

    if (insertParticipant.error) {
      throw new Error(insertParticipant.error.message);
    }

    finalParticipantId = insertParticipant.data.id as string;
    recoveryToken =
      (insertParticipant.data.recovery_token as string | null) ?? null;
  }

  if (hasVerifiedClaim && claimedPersonId) {
    await upsertProfileNamingAndBirthYearOverride({
      eventSlug,
      personId: claimedPersonId,
      firstName: values.firstName.trim() || null,
      lastName: values.lastName.trim() || null,
      nickname: cleanText(values.nickname),
      birthYear: values.birthYear.trim() || null,
    });
  }

  return {
    participantId: finalParticipantId,
    recoveryToken,
  };
}