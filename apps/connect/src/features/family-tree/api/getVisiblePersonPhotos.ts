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

const PHOTO_SELECT = `
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
  participant:participants!family_person_photos_participant_id_fkey (
    first_name,
    last_name,
    nickname
  )
`;

export async function getVisiblePersonPhotos(params: {
  eventSlug: string;
  personId: string;
  currentParticipantId: string;
}): Promise<PersonPhotoItem[]> {
  const { eventSlug, personId, currentParticipantId } = params;

  const { data: approvedRows, error: approvedError } = await supabase
    .from("family_person_photos")
    .select(PHOTO_SELECT)
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .eq("moderation_status", "approved")
    .order("submitted_at", { ascending: false });

    if (approvedError) {
  console.error("approvedError", approvedError);
  throw approvedError;
}

  const { data: mineRows, error: mineError } = await supabase
    .from("family_person_photos")
    .select(PHOTO_SELECT)
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .eq("participant_id", currentParticipantId)
    .in("moderation_status", ["pending", "rejected"])
    .order("submitted_at", { ascending: false });

  if (mineError) {
  console.error("mineError", mineError);
  throw mineError;
}

  const byId = new Map<string, any>();

  for (const row of approvedRows ?? []) {
    byId.set(row.id, row);
  }

  for (const row of mineRows ?? []) {
    byId.set(row.id, row);
  }

  return Array.from(byId.values())
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
        consent_obtained: Boolean(row.consent_obtained),
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