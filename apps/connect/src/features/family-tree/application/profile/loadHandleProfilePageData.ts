import { getMyPersonIdentityClaim } from "../../data/identity/getMyPersonIdentityClaim";
import { getTreeProfileConsents } from "../../../participant-preferences/api/getTreeProfileConsents";
import { supabase } from "../../../../lib/supabase/client";

export type HandleProfileValues = {
  allowNameInFamilyTree: boolean | null;
  allowPhotoInFamilyTree: boolean | null;
  allowInfoInFamilyTree: boolean | null;
};

export type ProfileStats = {
  reactionCount: number | null;
  profileViewCount: number | null;
};

function normalizePersonId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function getProfileReactionCount({
  eventSlug,
  personId,
}: {
  eventSlug: string;
  personId: string;
}): Promise<number> {
  const { count, error } = await supabase
    .from("family_person_reactions")
    .select("*", { count: "exact", head: true })
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .eq("is_active", true);

  if (error) {
    throw new Error(
      error.message || "Impossible de récupérer le nombre de réactions.",
    );
  }

  return count ?? 0;
}

async function getProfileViewCount({
  eventSlug,
  personId,
}: {
  eventSlug: string;
  personId: string;
}): Promise<number> {
  const { data, error } = await supabase
    .from("participant_family_tree_views")
    .select("participant_id")
    .eq("event_slug", eventSlug)
    .eq("person_id", personId);

  if (error) {
    throw new Error(
      error.message || "Impossible de récupérer le nombre de vues.",
    );
  }

  const distinctParticipantIds = new Set(
    (data ?? [])
      .map((row) => row.participant_id)
      .filter((participantId): participantId is string => Boolean(participantId)),
  );

  return distinctParticipantIds.size;
}

export async function loadHandleProfilePageData(params: {
  eventSlug: string;
  participantId: string | null;
}): Promise<{
  values: HandleProfileValues;
  identityStatus: "pending" | "approved" | "rejected" | null;
  verifiedPersonId: string | null;
  stats: ProfileStats;
}> {
  const { eventSlug, participantId } = params;

  const emptyValues: HandleProfileValues = {
    allowNameInFamilyTree: null,
    allowPhotoInFamilyTree: null,
    allowInfoInFamilyTree: null,
  };

  if (!participantId) {
    return {
      values: emptyValues,
      identityStatus: null,
      verifiedPersonId: null,
      stats: {
        reactionCount: null,
        profileViewCount: null,
      },
    };
  }

  const [existingConsents, identityClaim] = await Promise.all([
    getTreeProfileConsents({
      participantId,
      eventSlug,
    }).catch(() => null),
    getMyPersonIdentityClaim({
      eventSlug,
      participantId,
    }).catch(() => null),
  ]);

  const values: HandleProfileValues = existingConsents
    ? {
        allowNameInFamilyTree: existingConsents.allowNameInFamilyTree,
        allowPhotoInFamilyTree: existingConsents.allowPhotoInFamilyTree,
        allowInfoInFamilyTree: existingConsents.allowInfoInFamilyTree,
      }
    : emptyValues;

  const normalizedClaimedPersonId = normalizePersonId(identityClaim?.person_id ?? null);
  const identityStatus = identityClaim?.claim_status ?? null;

  const verifiedPersonId =
    identityStatus === "approved" && normalizedClaimedPersonId
      ? normalizedClaimedPersonId
      : null;

  if (!verifiedPersonId) {
    return {
      values,
      identityStatus,
      verifiedPersonId: null,
      stats: {
        reactionCount: null,
        profileViewCount: null,
      },
    };
  }

  const [reactionCount, profileViewCount] = await Promise.all([
    getProfileReactionCount({
      eventSlug,
      personId: verifiedPersonId,
    }).catch(() => null),
    getProfileViewCount({
      eventSlug,
      personId: verifiedPersonId,
    }).catch(() => null),
  ]);

  return {
    values,
    identityStatus,
    verifiedPersonId,
    stats: {
      reactionCount,
      profileViewCount,
    },
  };
}