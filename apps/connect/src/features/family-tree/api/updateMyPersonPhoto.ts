import { supabase } from "../../../lib/supabase/client";

export async function updateMyPersonPhoto(params: {
  photoId: string;
  participantId: string;
  caption?: string;
  consentObtained: boolean;
  file?: File;
}): Promise<void> {
  const { photoId, participantId, caption, consentObtained, file } = params;

  const { data: existingPhoto, error: existingPhotoError } = await supabase
    .from("family_person_photos")
    .select("id, event_slug, person_id, participant_id, storage_path")
    .eq("id", photoId)
    .eq("participant_id", participantId)
    .neq("moderation_status", "deleted")
    .single();

  if (existingPhotoError) throw existingPhotoError;

  let nextStoragePath = existingPhoto.storage_path;

  if (file) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    nextStoragePath = `${existingPhoto.event_slug}/${existingPhoto.person_id}/${existingPhoto.participant_id}/${fileName}`;

    const uploadRes = await supabase.storage
      .from("family-person-photos")
      .upload(nextStoragePath, file, {
        upsert: false,
      });

    if (uploadRes.error) throw uploadRes.error;
  }

  const { error } = await supabase
    .from("family_person_photos")
    .update({
      storage_path: nextStoragePath,
      caption: caption ?? null,
      consent_obtained: consentObtained,
      moderation_status: "pending",
      moderator_comment: null,
      moderated_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", photoId)
    .eq("participant_id", participantId)
    .neq("moderation_status", "deleted");

  if (error) throw error;
}