import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyPhotoTarget,
  FamilyPhotoUploadResult,
} from "../types/familyKnowledgePhotoTargets";

type UploadFamilyPhotoInput = {
  eventSlug: string;
  participantId: string;
  target: FamilyPhotoTarget;
  file: File;
};

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadFamilyKnowledgePhoto(
  input: UploadFamilyPhotoInput,
): Promise<FamilyPhotoUploadResult> {
  const { eventSlug, participantId, target, file } = input;

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg";

  const safeName = sanitizeFileName(file.name);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const storagePath = [
    "events",
    eventSlug,
    "participants",
    participantId,
    target.personType,
    target.key,
    `${timestamp}-${safeName || `photo.${extension}`}`,
  ].join("/");

  const { error: uploadError } = await supabase.storage
    .from("family-photos")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) {
    throw new Error(`Upload impossible : ${uploadError.message}`);
  }

  return {
    storagePath,
    publicUrl: null,
  };
}