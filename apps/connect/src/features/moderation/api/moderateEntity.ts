// src/features/moderation/api/moderateEntity.ts

import { supabase } from "../../../lib/supabase/client";

export async function moderateEntity({
  eventSlug,
  entityType,
  entityId,
  status,
  moderatorComment,
}: {
  eventSlug: string;
  entityType: "memory" | "photo";
  entityId: string;
  status: "approved" | "rejected";
  moderatorComment?: string;
}) {
  const payload = {
    moderation_status: status,
    moderator_comment: moderatorComment ?? null,
    moderated_at: new Date().toISOString(),
  };

  if (entityType === "memory") {
    const { error } = await supabase
      .from("family_person_memories")
      .update(payload)
      .eq("event_slug", eventSlug)
      .eq("id", entityId);

    if (error) throw error;
  }

  if (entityType === "photo") {
    const { error } = await supabase
      .from("family_person_photos")
      .update(payload)
      .eq("event_slug", eventSlug)
      .eq("id", entityId);

    if (error) throw error;
  }
}