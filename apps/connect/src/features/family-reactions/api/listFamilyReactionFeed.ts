import { supabase } from "../../../lib/supabase/client";
import { getPersonLabelFromFamilyGraph } from "../../moderation/lib/moderationLabels";
import type {
  FamilyReactionAudience,
  FamilyReactionFeedItem,
  FamilyReactionKind,
} from "../types";

type ListFamilyReactionFeedParams = {
  eventSlug: string;
  currentParticipantId: string;
  audience: FamilyReactionAudience;
};

type ParticipantLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
};

function getParticipantLabel(participant: ParticipantLite | null | undefined) {
  if (!participant) return "Un cousin";

  const nickname = participant.nickname?.trim();
  if (nickname) return nickname;

  const fullName = [participant.first_name, participant.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Un cousin";
}

function buildReactionText(
  reactionType: FamilyReactionKind,
  participantLabel: string,
  personLabel: string,
): string {
  switch (reactionType) {
    case "touched_by_person":
      return `${participantLabel} a réagi avec “J’aime” à la fiche de ${personLabel}`;
    case "heard_of_person":
      return `${participantLabel} a indiqué avoir entendu parler de ${personLabel}`;
    case "knew_person":
      return `${participantLabel} a indiqué avoir connu ${personLabel}`;
    default:
      return `${participantLabel} a réagi à la fiche de ${personLabel}`;
  }
}

export async function listFamilyReactionFeed({
  eventSlug,
  currentParticipantId,
  audience,
}: ListFamilyReactionFeedParams): Promise<FamilyReactionFeedItem[]> {
  const participantFilter =
    audience === "mine" ? currentParticipantId : undefined;

  const reactionsQuery = supabase
    .from("family_person_reactions")
    .select(
      `
        id,
        event_slug,
        participant_id,
        person_id,
        reaction_type,
        is_active,
        created_at,
        updated_at,
        participants (
          id,
          first_name,
          last_name,
          nickname
        )
      `,
    )
    .eq("event_slug", eventSlug)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const memoriesQuery = supabase
    .from("family_person_memories")
    .select(
      `
        id,
        event_slug,
        participant_id,
        person_id,
        content,
        moderation_status,
        submitted_at,
        updated_at,
        participants (
          id,
          first_name,
          last_name,
          nickname
        )
      `,
    )
    .eq("event_slug", eventSlug)
    .in(
      "moderation_status",
      audience === "mine"
        ? ["pending", "approved", "rejected"]
        : ["approved"],
    )
    .order("submitted_at", { ascending: false });

  const photosQuery = supabase
    .from("family_person_photos")
    .select(
      `
        id,
        event_slug,
        participant_id,
        person_id,
        storage_path,
        caption,
        moderation_status,
        submitted_at,
        updated_at,
        participants (
          id,
          first_name,
          last_name,
          nickname
        )
      `,
    )
    .eq("event_slug", eventSlug)
    .in(
      "moderation_status",
      audience === "mine"
        ? ["pending", "approved", "rejected"]
        : ["approved"],
    )
    .order("submitted_at", { ascending: false });

  const [reactionsResult, memoriesResult, photosResult] = await Promise.all([
    participantFilter
      ? reactionsQuery.eq("participant_id", participantFilter)
      : reactionsQuery,
    participantFilter
      ? memoriesQuery.eq("participant_id", participantFilter)
      : memoriesQuery,
    participantFilter
      ? photosQuery.eq("participant_id", participantFilter)
      : photosQuery,
  ]);

  if (reactionsResult.error) throw reactionsResult.error;
  if (memoriesResult.error) throw memoriesResult.error;
  if (photosResult.error) throw photosResult.error;

  const reactionItems: FamilyReactionFeedItem[] = (reactionsResult.data ?? []).map(
    (row: any) => {
      const personLabel =
        getPersonLabelFromFamilyGraph(row.person_id) ?? row.person_id;
      const participantLabel = getParticipantLabel(row.participants);
      const kind = row.reaction_type as FamilyReactionKind;

      return {
        id: `reaction-${row.id}`,
        eventSlug: row.event_slug,
        personId: row.person_id,
        personLabel,
        participantId: row.participant_id,
        participantLabel,
        kind,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        text: buildReactionText(kind, participantLabel, personLabel),
        subtext: null,
        isMine: row.participant_id === currentParticipantId,
        storagePath: null,
        publicUrl: null,
      };
    },
  );

  const memoryItems: FamilyReactionFeedItem[] = (memoriesResult.data ?? []).map(
    (row: any) => {
      const personLabel =
        getPersonLabelFromFamilyGraph(row.person_id) ?? row.person_id;
      const participantLabel = getParticipantLabel(row.participants);

      return {
        id: `memory-${row.id}`,
        eventSlug: row.event_slug,
        personId: row.person_id,
        personLabel,
        participantId: row.participant_id,
        participantLabel,
        kind: "memory",
        createdAt: row.submitted_at,
        updatedAt: row.updated_at,
        text: `${participantLabel} a partagé un souvenir sur ${personLabel}`,
        subtext: row.content,
        isMine: row.participant_id === currentParticipantId,
        storagePath: null,
        publicUrl: null,
      };
    },
  );

  const photoItems: FamilyReactionFeedItem[] = (photosResult.data ?? []).map(
    (row: any) => {
      const personLabel =
        getPersonLabelFromFamilyGraph(row.person_id) ?? row.person_id;
      const participantLabel = getParticipantLabel(row.participants);

      const { data: publicUrlData } = supabase.storage
        .from("family-person-photos")
        .getPublicUrl(row.storage_path);

      return {
        id: `photo-${row.id}`,
        eventSlug: row.event_slug,
        personId: row.person_id,
        personLabel,
        participantId: row.participant_id,
        participantLabel,
        kind: "photo",
        createdAt: row.submitted_at,
        updatedAt: row.updated_at,
        text: `${participantLabel} a ajouté une photo pour ${personLabel}`,
        subtext: row.caption ?? null,
        isMine: row.participant_id === currentParticipantId,
        storagePath: row.storage_path,
        publicUrl: publicUrlData.publicUrl,
      };
    },
  );

  return [...reactionItems, ...memoryItems, ...photoItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}