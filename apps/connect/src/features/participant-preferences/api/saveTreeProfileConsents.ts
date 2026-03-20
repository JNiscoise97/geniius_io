import { supabase } from "../../../lib/supabase/client";

export type SaveTreeProfileConsentsInput = {
  participantId: string;
  eventSlug: string;
  values: {
    allowNameInFamilyTree: boolean | null;
    allowPhotoInFamilyTree: boolean | null;
    allowInfoInFamilyTree: boolean | null;
  };
};

export async function saveTreeProfileConsents({
  participantId,
  eventSlug,
  values,
}: SaveTreeProfileConsentsInput): Promise<void> {
  const now = new Date().toISOString();

  const res = await supabase.from("participant_consents").upsert(
    {
      participant_id: participantId,
      event_slug: eventSlug,
      allow_name_in_family_tree: values.allowNameInFamilyTree,
      allow_photo_in_family_tree: values.allowPhotoInFamilyTree,
      allow_info_in_family_tree: values.allowInfoInFamilyTree,
      submitted_at: now,
      completed: true,
      updated_at: now,
    },
    { onConflict: "event_slug,participant_id" },
  );

  if (res.error) {
    throw new Error(res.error.message);
  }
}