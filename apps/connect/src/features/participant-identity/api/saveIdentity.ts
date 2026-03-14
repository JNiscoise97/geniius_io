import { supabase } from "../../../lib/supabase/client";
import type { IdentityFormValues } from "../components/IdentityForm";

type SaveIdentityInput = {
  eventSlug: string;
  participantId?: string | null;
  values: IdentityFormValues;
};

type SaveIdentityResult = {
  participantId: string;
  recoveryToken: string | null;
};

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

export async function saveIdentity({
  eventSlug,
  participantId,
  values,
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
    updated_at: new Date().toISOString(),
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
        recovery_token_created_at: new Date().toISOString(),
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

  const upsertIdentity = await supabase.from("participant_identity").upsert(
    {
      participant_id: finalParticipantId,
      branch_keys: values.branchKeys,
      attended_edition_keys: values.previousEditionKeys,
      completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id" },
  );

  if (upsertIdentity.error) {
    throw new Error(upsertIdentity.error.message);
  }

  return {
    participantId: finalParticipantId,
    recoveryToken,
  };
}