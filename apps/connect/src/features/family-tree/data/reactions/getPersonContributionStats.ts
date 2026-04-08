import { supabase } from "../../../../lib/supabase/client";
import type { FamilyPersonContributionStats } from "../../types/reactions";


export async function getPersonContributionStats(params: {
  eventSlug: string;
  personId: string;
}): Promise<FamilyPersonContributionStats> {
  const { eventSlug, personId } = params;

  const [memoriesRes, photosRes, touchedRes, knownRes, heardRes] =
    await Promise.all([
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
        .eq("reaction_type", "touched_by_person")
        .eq("is_active", true),

      supabase
        .from("family_person_reactions")
        .select("id", { count: "exact", head: true })
        .eq("event_slug", eventSlug)
        .eq("person_id", personId)
        .eq("reaction_type", "knew_person")
        .eq("is_active", true),

      supabase
        .from("family_person_reactions")
        .select("id", { count: "exact", head: true })
        .eq("event_slug", eventSlug)
        .eq("person_id", personId)
        .eq("reaction_type", "heard_of_person")
        .eq("is_active", true),
    ]);

  if (memoriesRes.error) throw memoriesRes.error;
  if (photosRes.error) throw photosRes.error;
  if (touchedRes.error) throw touchedRes.error;
  if (knownRes.error) throw knownRes.error;
  if (heardRes.error) throw heardRes.error;

  return {
    memoriesCount: memoriesRes.count ?? 0,
    photosCount: photosRes.count ?? 0,
    reactionsCount: touchedRes.count ?? 0,
    knownCount: knownRes.count ?? 0,
    heardCount: heardRes.count ?? 0,
  };
}