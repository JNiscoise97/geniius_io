// src/features/moderation/api/getModerationEntity.ts

import { supabase } from "../../../lib/supabase/client";
import { FAMILY_GRAPH } from "../../family-tree/api/loadGraph";
import type { ModerationEntityRecord } from "../types";

function getPersonLabel(personId: string) {
  const person = FAMILY_GRAPH.people[personId];
  if (!person) return personId;

  return `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
}

export async function getModerationEntity({
  eventSlug,
  entityType,
  entityId,
}: {
  eventSlug: string;
  entityType: "memory" | "photo";
  entityId: string;
}): Promise<ModerationEntityRecord> {

  if (entityType === "memory") {
    const { data, error } = await supabase
      .from("family_person_memories")
      .select("*")
      .eq("event_slug", eventSlug)
      .eq("id", entityId)
      .single();

    if (error || !data) throw new Error("Souvenir introuvable");

    return {
      id: data.id,
      type: "memory",
      title: "Souvenir proposé",
      subtitle: getPersonLabel(data.person_id),
      content: data.content,
      moderationStatus: data.moderation_status,
      moderatorComment: data.moderator_comment,
      submittedAt: data.submitted_at,
      moderatedAt: data.moderated_at,
    };
  }

  if (entityType === "photo") {
    const { data, error } = await supabase
      .from("family_person_photos")
      .select("*")
      .eq("event_slug", eventSlug)
      .eq("id", entityId)
      .single();

    if (error || !data) throw new Error("Photo introuvable");

    const { data: signed } = await supabase.storage
      .from("family-person-photos")
      .createSignedUrl(data.storage_path, 3600);

    return {
      id: data.id,
      type: "photo",
      title: "Photo proposée",
      subtitle: getPersonLabel(data.person_id),
      content: data.caption,
      imageUrl: signed?.signedUrl,
      moderationStatus: data.moderation_status,
      moderatorComment: data.moderator_comment,
      submittedAt: data.submitted_at,
      moderatedAt: data.moderated_at,
    };
  }

  throw new Error("Type non supporté");
}