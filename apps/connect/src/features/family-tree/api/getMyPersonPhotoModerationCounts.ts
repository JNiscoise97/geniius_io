// getMyPersonPhotoModerationCounts.ts
import { supabase } from "../../../lib/supabase/client";

export type MyPersonPhotoModerationCounts = {
  pending: number;
  approved: number;
  rejected: number;
};

export async function getMyPersonPhotoModerationCounts(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
}): Promise<MyPersonPhotoModerationCounts> {
  const { eventSlug, participantId, personId } = params;

  const { data, error } = await supabase
    .from("family_person_photos")
    .select("moderation_status")
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .eq("person_id", personId)
    .neq("moderation_status", "deleted");

  if (error) throw error;

  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  for (const row of data ?? []) {
    if (row.moderation_status === "pending") counts.pending += 1;
    if (row.moderation_status === "approved") counts.approved += 1;
    if (row.moderation_status === "rejected") counts.rejected += 1;
  }

  return counts;
}