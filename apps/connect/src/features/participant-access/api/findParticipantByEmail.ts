import { supabase } from "../../../lib/supabase/client";

export type FindParticipantByEmailInput = {
  eventSlug: string;
  email: string;
};

export type FindParticipantByEmailResult =
  | {
      found: true;
      participantId: string;
      eventSlug: string;
      email: string;
      maskedDisplayName: string;
    }
  | {
      found: false;
      eventSlug: string;
      email: string;
    };

type ParticipantRow = {
  id: string;
  event_slug: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

function normalizeEmail(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function maskNamePart(value?: string): string {
  const v = value?.trim();
  if (!v) return "";
  if (v.length === 1) return "*";
  return `${v[0]}${"*".repeat(Math.max(4, v.length - 1))}`;
}

function buildMaskedDisplayName(firstName?: string, lastName?: string): string {
  const parts = [maskNamePart(firstName), maskNamePart(lastName)].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Profil familial";
}

export async function findParticipantByEmail({
  eventSlug,
  email,
}: FindParticipantByEmailInput): Promise<FindParticipantByEmailResult> {
  const normalizedEventSlug = eventSlug.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEventSlug) {
    throw new Error("eventSlug requis.");
  }

  if (!normalizedEmail) {
    throw new Error("Adresse email requise.");
  }

  const participantRes = await supabase
    .from("participants")
    .select("id, event_slug, first_name, last_name, email, updated_at, created_at")
    .eq("event_slug", normalizedEventSlug)
    .eq("email", normalizedEmail)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (participantRes.error) {
    throw new Error(participantRes.error.message);
  }

  const participant = (participantRes.data?.[0] as ParticipantRow | undefined) ?? null;

  if (!participant) {
    return {
      found: false,
      eventSlug: normalizedEventSlug,
      email: normalizedEmail,
    };
  }

  return {
    found: true,
    participantId: participant.id,
    eventSlug: participant.event_slug,
    email: participant.email ?? normalizedEmail,
    maskedDisplayName: buildMaskedDisplayName(
      participant.first_name ?? undefined,
      participant.last_name ?? undefined,
    ),
  };
}