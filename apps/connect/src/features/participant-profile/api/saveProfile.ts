import { supabase } from "../../../lib/supabase/client";
import type { ProfileFormValues } from "../components/ProfileForm";

type SaveProfileInput = {
  participantId: string;
  values: ProfileFormValues;
};

function cleanText(value: string): string | null {
  const s = value.trim();
  return s ? s : null;
}

export async function saveProfile({
  participantId,
  values,
}: SaveProfileInput): Promise<void> {
  const res = await supabase.from("participant_profile").upsert(
    {
      participant_id: participantId,
      city: cleanText(values.city),
      occupation: cleanText(values.occupation),
      interests: cleanText(values.interests),
      personality_word: cleanText(values.personalityWord),
      family_memory: cleanText(values.familyMemory),
      cousinade_expectation: cleanText(values.cousinadeExpectation),
      free_share: cleanText(values.freeShare),
      completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id" },
  );

  if (res.error) {
    throw new Error(res.error.message);
  }
}