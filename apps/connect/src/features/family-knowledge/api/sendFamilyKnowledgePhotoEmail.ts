import { supabase } from "../../../lib/supabase/client";
import type { FamilyPhotoTarget } from "../types/familyKnowledgePhotoTargets";

type SendFamilyPhotoEmailInput = {
  eventSlug: string;
  participantId: string;
  target: FamilyPhotoTarget;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export async function sendFamilyKnowledgePhotoEmail(
  input: SendFamilyPhotoEmailInput,
): Promise<void> {
  const { error } = await supabase.functions.invoke("send-family-photo-email", {
    body: input,
  });

  if (error) {
    throw new Error(
      `Notification email impossible : ${error.message}`,
    );
  }
}