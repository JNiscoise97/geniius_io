// createMyPersonPhoto.ts
import { supabase } from "../../../lib/supabase/client";

export async function createMyPersonPhoto(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
  file: File;
  caption?: string;
  consentObtained: boolean;
}): Promise<void> {
  const { eventSlug, participantId, personId, file, caption, consentObtained } =
    params;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `${eventSlug}/${personId}/${participantId}/${fileName}`;

  const uploadRes = await supabase.storage
    .from("family-person-photos")
    .upload(storagePath, file, {
      upsert: false,
    });

  if (uploadRes.error) throw uploadRes.error;

  const { error } = await supabase.from("family_person_photos").insert({
    event_slug: eventSlug,
    participant_id: participantId,
    person_id: personId,
    storage_path: storagePath,
    caption: caption ?? null,
    consent_obtained: consentObtained,
    moderation_status: "pending",
    moderator_comment: null,
    moderated_at: null,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}