import { supabase } from "../../../lib/supabase/client";
import type { ContactOrganizerFormValues } from "../components/ContactOrganizerForm";

type SaveOrganizerMessageInput = {
  eventSlug: string;
  participantId?: string | null;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  values: ContactOrganizerFormValues;
};

function cleanText(value: string | null | undefined): string | null {
  const s = (value ?? "").trim();
  return s ? s : null;
}

export async function saveOrganizerMessage({
  eventSlug,
  participantId,
  senderFirstName,
  senderLastName,
  values,
}: SaveOrganizerMessageInput): Promise<void> {
  const payload = {
    eventSlug,
    participantId: participantId ?? null,
    senderFirstName: cleanText(senderFirstName),
    senderLastName: cleanText(senderLastName),
    values: {
      topic: values.topic,
      message: values.message.trim(),
      wantsReply: values.wantsReply,
      replyPreference: values.wantsReply ? values.replyPreference || null : null,
      email: values.wantsReply ? cleanText(values.email) : null,
      phone: values.wantsReply ? cleanText(values.phone) : null,
      whatsapp: values.wantsReply ? cleanText(values.whatsapp) : null,
      messenger: values.wantsReply ? cleanText(values.messenger) : null,
    },
  };

  const { data, error } = await supabase.functions.invoke("contact-organizer", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }
}