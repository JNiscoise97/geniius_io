// getVisiblePersonPhotos.ts
import { supabase } from "../../../lib/supabase/client";

export type PersonPhotoItem = {
  id: string;
  event_slug: string;
  participant_id: string;
  person_id: string;
  storage_path: string;
  public_url: string;
  caption?: string | null;
  consent_obtained: boolean;
  moderation_status: "pending" | "approved" | "rejected";
  moderator_comment?: string | null;
  submitted_at: string;
  updated_at: string;
  authorDisplayName?: string | null;
  isMine: boolean;
};

type ParticipantProfile = {
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
};

function buildDisplayName(
  profile: ParticipantProfile | null,
  participantId: string,
  currentParticipantId?: string | null,
): string | null {
  if (!profile) return null;

  if (currentParticipantId && participantId === currentParticipantId) {
    return "Moi";
  }

  const firstName = profile.first_name?.trim() ?? "";
  const lastName = profile.last_name?.trim() ?? "";
  const nickname = profile.nickname?.trim();

  if (nickname) {
    return `${firstName} "${nickname}" ${lastName}`.trim();
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || null;
}

export async function getVisiblePersonPhotos(params: {
  eventSlug: string;
  personId: string;
  currentParticipantId: string;
}): Promise<PersonPhotoItem[]> {
  const { eventSlug, personId, currentParticipantId } = params;

  // 1. Photos approuvées (tout le monde)
  const { data: approved, error: errorApproved } = await supabase
    .from("family_person_photos")
    .select(`
      id,
      event_slug,
      participant_id,
      person_id,
      storage_path,
      caption,
      consent_obtained,
      moderation_status,
      moderator_comment,
      submitted_at,
      updated_at,
      participant:participant_id (
        first_name,
        last_name,
        nickname
      )
    `)
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .eq("moderation_status", "approved");

  if (errorApproved) throw errorApproved;

  // 2. Mes photos (pending + rejected)
  const { data: mine, error: errorMine } = await supabase
    .from("family_person_photos")
    .select(`
      id,
      event_slug,
      participant_id,
      person_id,
      storage_path,
      caption,
      consent_obtained,
      moderation_status,
      moderator_comment,
      submitted_at,
      updated_at,
      participant:participant_id (
        first_name,
        last_name,
        nickname
      )
    `)
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .eq("participant_id", currentParticipantId)
    .in("moderation_status", ["pending", "rejected"]);

  if (errorMine) throw errorMine;

  const combined = [...(approved ?? []), ...(mine ?? [])];

  return combined
    .sort(
      (a, b) =>
        new Date(b.submitted_at).getTime() -
        new Date(a.submitted_at).getTime(),
    )
    .map((row: any) => {
      const { data: publicUrlData } = supabase.storage
        .from("family-person-photos")
        .getPublicUrl(row.storage_path);

      return {
        id: row.id,
        event_slug: row.event_slug,
        participant_id: row.participant_id,
        person_id: row.person_id,
        storage_path: row.storage_path,
        public_url: publicUrlData.publicUrl,
        caption: row.caption ?? null,
        consent_obtained: !!row.consent_obtained,
        moderation_status: row.moderation_status,
        moderator_comment: row.moderator_comment ?? null,
        submitted_at: row.submitted_at,
        updated_at: row.updated_at,
        authorDisplayName: buildDisplayName(
          row.participant,
          row.participant_id,
          currentParticipantId,
        ),
        isMine: row.participant_id === currentParticipantId,
      };
    });
}