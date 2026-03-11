import { supabase } from "../../../lib/supabase/client";
import type { IdentityFormValues } from "../components/IdentityForm";

type SaveIdentityInput = {
  eventSlug: string;
  participantId?: string | null;
  values: IdentityFormValues;
};

type SaveIdentityResult = {
  participantId: string;
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

export async function saveIdentity({
  eventSlug,
  participantId,
  values,
}: SaveIdentityInput): Promise<SaveIdentityResult> {
  let finalParticipantId = participantId ?? null;

  if (finalParticipantId) {
    const updateParticipant = await supabase
      .from("participants")
      .update({
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        nickname: values.nickname.trim() || null,
        birth_year: toBirthYearOrNull(values.birthYear),
        updated_at: new Date().toISOString(),
      })
      .eq("id", finalParticipantId)
      .select("id")
      .single();

    if (updateParticipant.error) {
      throw new Error(updateParticipant.error.message);
    }

    finalParticipantId = updateParticipant.data.id as string;
  } else {
    const insertParticipant = await supabase
      .from("participants")
      .insert({
        event_slug: eventSlug,
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        nickname: values.nickname.trim() || null,
        birth_year: toBirthYearOrNull(values.birthYear),
      })
      .select("id")
      .single();

    if (insertParticipant.error) {
      throw new Error(insertParticipant.error.message);
    }

    finalParticipantId = insertParticipant.data.id as string;
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

  return { participantId: finalParticipantId };
}