import { supabase } from "../../../lib/supabase/client";

export type ApprovedPersonPhoto = {
  id: string;
  event_slug: string;
  participant_id: string;
  person_id: string;
  storage_path: string;
  public_url: string;
  moderation_status: "approved";
  submitted_at: string;
  updated_at: string;
  caption?: string | null;
  authorDisplayName?: string | null;
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

export async function getApprovedPersonPhotos(params: {
  eventSlug: string;
  personId: string;
  currentParticipantId?: string | null;
}): Promise<ApprovedPersonPhoto[]> {
  const { eventSlug, personId, currentParticipantId } = params;

  const { data, error } = await supabase
    .from("family_person_photos")
    .select(`
      id,
      event_slug,
      participant_id,
      person_id,
      storage_path,
      moderation_status,
      submitted_at,
      updated_at,
      caption,
      participant:participant_id (
        first_name,
        last_name,
        nickname
      )
    `)
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .eq("moderation_status", "approved")
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
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
      moderation_status: row.moderation_status,
      submitted_at: row.submitted_at,
      updated_at: row.updated_at,
      caption: row.caption ?? null,
      authorDisplayName: buildDisplayName(
        row.participant,
        row.participant_id,
        currentParticipantId,
      ),
    };
  });
}