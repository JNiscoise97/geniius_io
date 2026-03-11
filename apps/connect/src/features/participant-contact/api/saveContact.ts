import { supabase } from "../../../lib/supabase/client";
import type { ContactFormValues } from "../components/ContactForm";

type SaveContactInput = {
  participantId: string;
  values: ContactFormValues;
};

function normalizePhone(raw: string): string | null {
  const s = raw.trim();
  return s ? s : null;
}

function normalizeEmail(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  return s ? s : null;
}

export async function saveContact({
  participantId,
  values,
}: SaveContactInput): Promise<void> {
  const upsertRes = await supabase.from("participant_contact").upsert(
    {
      participant_id: participantId,
      phone: normalizePhone(values.phone),
      email: normalizeEmail(values.email),
      allow_contact: values.allowContact,
      allow_photos_share: values.allowPhotosShare,
      allow_family_news: values.allowFamilyNews,
      completed: true,
    },
    { onConflict: "participant_id" },
  );

  if (upsertRes.error) {
    throw new Error(upsertRes.error.message);
  }
}