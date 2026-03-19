import { supabase } from "../../../lib/supabase/client";
import type { FamilyPersonContributionStats } from "../types/types-reactions";

export async function getPersonContributionStats(params: {
  eventSlug: string;
  personId: string;
}): Promise<FamilyPersonContributionStats> {
  const { eventSlug, personId } = params;

  const [
    memoriesRes,
    photosRes,
    reactionsRes,
  ] = await Promise.all([
    supabase
      .from("family_person_memories")
      .select("id", { count: "exact", head: true })
      .eq("event_slug", eventSlug)
      .eq("person_id", personId)
      .eq("moderation_status", "approved"),

    supabase
      .from("family_person_photos")
      .select("id", { count: "exact", head: true })
      .eq("event_slug", eventSlug)
      .eq("person_id", personId)
      .eq("moderation_status", "approved"),

    supabase
      .from("family_person_reactions")
      .select("id", { count: "exact", head: true })
      .eq("event_slug", eventSlug)
      .eq("person_id", personId)
      .eq("is_active", true),
  ]);

  if (memoriesRes.error) throw memoriesRes.error;
  if (photosRes.error) throw photosRes.error;
  if (reactionsRes.error) throw reactionsRes.error;

  return {
    memoriesCount: memoriesRes.count ?? 0,
    photosCount: photosRes.count ?? 0,
    reactionsCount: reactionsRes.count ?? 0,
  };
}