import { supabase } from "../../../lib/supabase/client";
import type { AnnouncementRecipient } from "../types";

type ParticipantRow = {
  id: string;
  event_slug: string;
  email: string | null;
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
};

function buildDisplayName(row: ParticipantRow): string {
  const nickname = row.nickname?.trim();
  if (nickname) return nickname;

  const firstName = row.first_name?.trim() ?? "";
  const lastName = row.last_name?.trim() ?? "";
  const joined = `${firstName} ${lastName}`.trim();

  if (joined) return joined;
  return row.email ?? "Participant";
}

export async function getAnnouncementRecipients(
  eventSlug: string,
): Promise<AnnouncementRecipient[]> {
  const { data, error } = await supabase
    .from("participants")
    .select(
      "id,event_slug,email,first_name,last_name,nickname",
    )
    .eq("event_slug", eventSlug)
    .not("email", "is", null)
    .order("first_name", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ParticipantRow[];

  return rows
    .filter((row) => !!row.email?.trim())
    .map((row) => ({
      participantId: row.id,
      eventSlug: row.event_slug,
      email: row.email!.trim().toLowerCase(),
      firstName: row.first_name ?? null,
      lastName: row.last_name ?? null,
      nickname: row.nickname ?? null,
      displayName: buildDisplayName(row),
    }));
}