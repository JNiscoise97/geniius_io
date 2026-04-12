import { supabase } from "../../../../lib/supabase/client";

export type PersonAttendanceFlags = {
  attended2023: boolean | null;
  attended2024: boolean | null;
  isPresentToday: boolean;
};

type InPersonAssistRow = {
  declared_present: boolean;
  attended_2023: boolean | null;
  attended_2024: boolean | null;
  target_participant_id: string | null;
  created_at: string;
};

type ApprovedIdentityClaimRow = {
  participant_id: string | null;
};

type ParticipantOriginsRow = {
  attended_edition_keys: string[] | null;
};

function hasEdition(
  attendedEditionKeys: string[] | null | undefined,
  editionKey: string,
): boolean | null {
  if (!attendedEditionKeys) return null;
  return attendedEditionKeys.includes(editionKey);
}

function pickBoolean(
  primary: boolean | null | undefined,
  fallback: boolean | null,
): boolean | null {
  return primary !== null && primary !== undefined ? primary : fallback;
}

export async function getPersonAttendanceFlags(params: {
  eventSlug: string;
  personId: string;
}): Promise<PersonAttendanceFlags> {
  const { eventSlug, personId } = params;

  const { data: latestAssist, error: assistError } = await supabase
    .from("family_tree_in_person_assists")
    .select(
      "declared_present, attended_2023, attended_2024, target_participant_id, created_at",
    )
    .eq("event_slug", eventSlug)
    .eq("target_person_id", personId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<InPersonAssistRow>();

  if (assistError) {
    throw assistError;
  }

  let resolvedParticipantId = latestAssist?.target_participant_id ?? null;

  if (!resolvedParticipantId) {
    const { data: approvedClaim, error: approvedClaimError } = await supabase
      .from("family_person_identity_claims")
      .select("participant_id")
      .eq("event_slug", eventSlug)
      .eq("person_id", personId)
      .eq("claim_status", "approved")
      .maybeSingle<ApprovedIdentityClaimRow>();

    if (approvedClaimError) {
      throw approvedClaimError;
    }

    resolvedParticipantId = approvedClaim?.participant_id ?? null;
  }

  let origins2023: boolean | null = null;
  let origins2024: boolean | null = null;

  if (resolvedParticipantId) {
    const { data: origins, error: originsError } = await supabase
      .from("participant_origins")
      .select("attended_edition_keys")
      .eq("participant_id", resolvedParticipantId)
      .maybeSingle<ParticipantOriginsRow>();

    if (originsError) {
      throw originsError;
    }

    origins2023 = hasEdition(origins?.attended_edition_keys, "2023");
    origins2024 = hasEdition(origins?.attended_edition_keys, "2024");
  }

  return {
    attended2023: pickBoolean(latestAssist?.attended_2023, origins2023),
    attended2024: pickBoolean(latestAssist?.attended_2024, origins2024),
    isPresentToday: latestAssist?.declared_present === true,
  };
}