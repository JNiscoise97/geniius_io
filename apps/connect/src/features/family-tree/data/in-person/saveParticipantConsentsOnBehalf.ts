import { supabase } from "../../../../lib/supabase/client";

function getNowIso() {
  return new Date().toISOString();
}

export async function saveParticipantConsentsOnBehalf(params: {
  eventSlug: string;
  participantId: string;
  allowNameInFamilyTree: boolean | null;
  allowPhotoInFamilyTree: boolean | null;
  allowInfoInFamilyTree: boolean | null;
}): Promise<void> {
  const now = getNowIso();

  const { error } = await supabase
    .from("participant_consents")
    .upsert(
      {
        event_slug: params.eventSlug,
        participant_id: params.participantId,
        allow_name_in_family_tree: params.allowNameInFamilyTree,
        allow_photo_in_family_tree: params.allowPhotoInFamilyTree,
        allow_info_in_family_tree: params.allowInfoInFamilyTree,
        completed: true,
        page_seen_at: now,
        submitted_at: now,
        updated_at: now,
      },
      {
        onConflict: "event_slug,participant_id",
      },
    );

  if (error) {
    throw error;
  }
}