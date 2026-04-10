import { supabase } from "../../../lib/supabase/client";

export type CreateActivityCollectPhotoInput = {
  eventSlug: string;
  activitySlug: string;
  participantId: string;
  questionId: string;
  file: File;
};

export type CreateActivityCollectPhotoResult = {
  storagePath: string;
  publicUrl: string;
};

function getSafeExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase()?.trim();

  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/heic": "heic",
    "image/heif": "heif",
  };

  return mimeToExt[file.type] ?? "jpg";
}

export async function createActivityCollectPhoto({
  eventSlug,
  activitySlug,
  participantId,
  questionId,
  file,
}: CreateActivityCollectPhotoInput): Promise<CreateActivityCollectPhotoResult> {
  const ext = getSafeExtension(file);
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = [
    eventSlug,
    activitySlug,
    participantId,
    questionId,
    fileName,
  ].join("/");

  const { error: uploadError } = await supabase.storage
    .from("activity-collect-photos")
    .upload(storagePath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("activity-collect-photos")
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: data.publicUrl,
  };
}