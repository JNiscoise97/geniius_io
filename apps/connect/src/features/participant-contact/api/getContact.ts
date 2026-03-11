import { supabase } from "../../../lib/supabase/client";
import type { ContactFormValues } from "../components/ContactForm";

type GetContactInput = {
  participantId: string;
};

export async function getContact({
  participantId,
}: GetContactInput): Promise<ContactFormValues | null> {
  const res = await supabase
    .from("participant_contact")
    .select(
      "phone, email, allow_contact, allow_photos_share, allow_family_news",
    )
    .eq("participant_id", participantId)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data) return null;

  return {
    phone: res.data.phone ?? "",
    email: res.data.email ?? "",
    allowContact: res.data.allow_contact ?? false,
    allowPhotosShare: res.data.allow_photos_share ?? false,
    allowFamilyNews: res.data.allow_family_news ?? false,
  };
}