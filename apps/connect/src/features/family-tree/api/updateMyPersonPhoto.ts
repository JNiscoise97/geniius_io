import { supabase } from "../../../lib/supabase/client";

export async function updateMyPersonPhoto(params: {
  photoId: string;
  participantId: string;
  caption?: string;
  consentObtained: boolean;
  file?: File;
  setAsProfilePhoto?: boolean;
  participantFirstName?: string;
  participantLastName?: string;
  participantDisplayName?: string;
  personFirstName?: string;
  personLastName?: string;
  personDisplayName?: string;
}): Promise<void> {
  const {
    photoId,
    participantId,
    caption,
    consentObtained,
    file,
    setAsProfilePhoto,
    participantFirstName,
    participantLastName,
    participantDisplayName,
    personFirstName,
    personLastName,
    personDisplayName,
  } = params;

  const now = new Date().toISOString();

  const { data: existingPhoto, error: existingPhotoError } = await supabase
    .from("family_person_photos")
    .select(
      `
        id,
        event_slug,
        person_id,
        participant_id,
        storage_path
      `,
    )
    .eq("id", photoId)
    .eq("participant_id", participantId)
    .neq("moderation_status", "deleted")
    .single();

  if (existingPhotoError) {
    throw existingPhotoError;
  }

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

    if (uploadRes.error) {
      throw uploadRes.error;
    }
  }

  const { error: updateError } = await supabase
    .from("family_person_photos")
    .update({
      storage_path: nextStoragePath,
      caption: caption ?? null,
      consent_obtained: consentObtained,
      set_as_profile_photo: setAsProfilePhoto ?? false,
      moderation_status: "pending",
      moderator_comment: null,
      moderated_at: null,
      updated_at: now,
    })
    .eq("id", photoId)
    .eq("participant_id", participantId)
    .neq("moderation_status", "deleted");

  if (updateError) {
    throw updateError;
  }

  const { error: notificationError } = await supabase.functions.invoke(
    "send-photo-moderation",
    {
      body: {
        photoId,
        eventSlug: existingPhoto.event_slug,
        participantId,
        personId: existingPhoto.person_id,
        caption: caption ?? "",
        storagePath: nextStoragePath,
        setAsProfilePhoto: setAsProfilePhoto ?? false,
        participantFirstName,
        participantLastName,
        participantDisplayName,
        personFirstName,
        personLastName,
        personDisplayName,
      },
    },
  );

  if (notificationError) {
    console.error(
      "[updateMyPersonPhoto] notification de modération non envoyée",
      notificationError,
    );
  }
}