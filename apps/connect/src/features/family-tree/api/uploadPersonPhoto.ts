import { supabase } from "../../../lib/supabase/client";

export async function uploadPersonPhoto(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
  file: File;
  caption?: string;
}): Promise<void> {
  const { eventSlug, participantId, personId, file, caption } = params;

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
    moderation_status: "pending",
  });

  if (error) throw error;
}