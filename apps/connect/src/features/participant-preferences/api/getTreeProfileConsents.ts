import { supabase } from "../../../lib/supabase/client";

export type TreeProfileConsentsValues = {
  allowNameInFamilyTree: boolean | null;
  allowPhotoInFamilyTree: boolean | null;
  allowInfoInFamilyTree: boolean | null;
};

function toBooleanOrNull(value: boolean | null | undefined): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

export async function getTreeProfileConsents({
  participantId,
  eventSlug,
}: {
  participantId: string;
  eventSlug: string;
}): Promise<TreeProfileConsentsValues | null> {
  const { data, error } = await supabase
    .from("participant_consents")
    .select(
      `
      allow_name_in_family_tree,
      allow_photo_in_family_tree,
      allow_info_in_family_tree
      `,
    )
    .eq("participant_id", participantId)
    .eq("event_slug", eventSlug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    allowNameInFamilyTree: toBooleanOrNull(data.allow_name_in_family_tree),
    allowPhotoInFamilyTree: toBooleanOrNull(data.allow_photo_in_family_tree),
    allowInfoInFamilyTree: toBooleanOrNull(data.allow_info_in_family_tree),
  };
}