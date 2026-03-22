import { supabase } from "../../../lib/supabase/client";

export async function createMyPersonPhoto(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
  file: File;
  caption?: string;
  consentObtained: boolean;
  setAsProfilePhoto?: boolean;
  participantFirstName?: string;
  participantLastName?: string;
  participantDisplayName?: string;
  personFirstName?: string;
  personLastName?: string;
  personDisplayName?: string;
}): Promise<void> {
  const {
    eventSlug,
    participantId,
    personId,
    file,
    caption,
    consentObtained,
    setAsProfilePhoto,
    participantFirstName,
    participantLastName,
    participantDisplayName,
    personFirstName,
    personLastName,
    personDisplayName,
  } = params;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `${eventSlug}/${personId}/${participantId}/${fileName}`;

  const uploadRes = await supabase.storage
    .from("family-person-photos")
    .upload(storagePath, file, {
      upsert: false,
    });

  if (uploadRes.error) throw uploadRes.error;

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("family_person_photos")
    .insert({
      event_slug: eventSlug,
      participant_id: participantId,
      person_id: personId,
      storage_path: storagePath,
      caption: caption ?? null,
      consent_obtained: consentObtained,
      set_as_profile_photo: setAsProfilePhoto ?? false,
      moderation_status: "pending",
      moderator_comment: null,
      moderated_at: null,
      submitted_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) throw error;

  const { error: fnError } = await supabase.functions.invoke(
    "send-photo-moderation-notification",
    {
      body: {
        photoId: data.id,
        eventSlug,
        participantId,
        personId,
        caption,
        setAsProfilePhoto,
        participantFirstName,
        participantLastName,
        participantDisplayName,
        personFirstName,
        personLastName,
        personDisplayName,
      },
    },
  );

  if (fnError) {
    console.error(
      "[createMyPersonPhoto] notification de modération non envoyée",
      fnError,
    );
  }
}