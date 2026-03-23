import { supabase } from "../../../lib/supabase/client";
import type { PersonIdentityClaim } from "./getMyPersonIdentityClaim";

function getNowIso() {
  return new Date().toISOString();
}

function normalizeText(value?: string | null): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

async function upsertProfileNamingAndBirthYearOverride(params: {
  eventSlug: string;
  personId: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  birthYear?: string | null;
}) {
  const { eventSlug, personId, firstName, lastName, nickname, birthYear } =
    params;

  const { data: existingOverrideRow, error: overrideReadError } = await supabase
    .from("person_overrides")
    .select(
      `
        id,
        overrides
      `,
    )
    .eq("event_slug", eventSlug)
    .eq("person_id", personId)
    .maybeSingle();

  if (overrideReadError) {
    throw overrideReadError;
  }

  const nextOverrides: Record<string, unknown> = {
    ...((existingOverrideRow?.overrides as Record<string, unknown> | null) ??
      {}),
  };

  const normalizedFirstName = normalizeText(firstName);
  const normalizedLastName = normalizeText(lastName);
  const normalizedNickname = normalizeText(nickname);

  if (normalizedFirstName) {
    nextOverrides.firstName = normalizedFirstName;
  } else {
    delete nextOverrides.firstName;
  }

  if (normalizedLastName) {
    nextOverrides.lastName = normalizedLastName;
  } else {
    delete nextOverrides.lastName;
  }

  if (normalizedNickname) {
    nextOverrides.nickname = normalizedNickname;
  } else {
    nextOverrides.nickname = "";
  }

  if (birthYear === null || birthYear === undefined || birthYear === "") {
    nextOverrides.birthYear = "";
  } else {
    nextOverrides.birthYear = String(birthYear);
  }

  if (existingOverrideRow?.id) {
    const { error: overrideUpdateError } = await supabase
      .from("person_overrides")
      .update({
        overrides: nextOverrides,
        updated_at: getNowIso(),
      })
      .eq("id", existingOverrideRow.id);

    if (overrideUpdateError) {
      throw overrideUpdateError;
    }

    return;
  }

  const { error: overrideInsertError } = await supabase
    .from("person_overrides")
    .insert({
      event_slug: eventSlug,
      person_id: personId,
      overrides: nextOverrides,
      updated_at: getNowIso(),
    });

  if (overrideInsertError) {
    throw overrideInsertError;
  }
}

export async function saveMyPersonIdentityClaim(params: {
  eventSlug: string;
  participantId: string;
  personId: string;
  participantFirstName?: string;
  participantLastName?: string;
  participantDisplayName?: string;
  personFirstName?: string;
  personLastName?: string;
  personDisplayName?: string;
}): Promise<PersonIdentityClaim> {
  const {
    eventSlug,
    participantId,
    personId,
    participantFirstName,
    participantLastName,
    participantDisplayName,
    personFirstName,
    personLastName,
    personDisplayName,
  } = params;

  const now = getNowIso();

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select(
      `
        default_gedcom_person_id,
        first_name,
        last_name,
        nickname,
        birth_year
      `,
    )
    .eq("id", participantId)
    .single();

  if (participantError) {
    throw participantError;
  }

  const defaultGedcomPersonId =
    participant?.default_gedcom_person_id?.trim() || null;

  const nextStatus =
    defaultGedcomPersonId === personId ? "auto_verified" : "pending";

  const moderatedAt = nextStatus === "auto_verified" ? now : null;

  const claimSelect = `
    id,
    event_slug,
    participant_id,
    person_id,
    claim_status,
    moderator_comment,
    submitted_at,
    moderated_at,
    updated_at
  `;

  const { data: existing, error: existingError } = await supabase
    .from("family_person_identity_claims")
    .select(claimSelect)
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .eq("person_id", personId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let savedClaim: PersonIdentityClaim;

  if (existing) {
    const { data, error } = await supabase
      .from("family_person_identity_claims")
      .update({
        claim_status: nextStatus,
        moderator_comment: null,
        moderated_at: moderatedAt,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select(claimSelect)
      .single();

    if (error) {
      throw error;
    }

    savedClaim = data as PersonIdentityClaim;
  } else {
    const { data, error } = await supabase
      .from("family_person_identity_claims")
      .insert({
        event_slug: eventSlug,
        participant_id: participantId,
        person_id: personId,
        claim_status: nextStatus,
        moderator_comment: null,
        moderated_at: moderatedAt,
        updated_at: now,
      })
      .select(claimSelect)
      .single();

    if (error) {
      throw error;
    }

    savedClaim = data as PersonIdentityClaim;
  }

  const notificationType =
    nextStatus === "auto_verified" ? "auto_verified" : "submitted";

  if (nextStatus === "auto_verified") {
    await upsertProfileNamingAndBirthYearOverride({
      eventSlug,
      personId,
      firstName: participant?.first_name ?? null,
      lastName: participant?.last_name ?? null,
      nickname: participant?.nickname ?? null,
      birthYear: participant?.birth_year ?? null,
    });
  }

  const { error: fnError } = await supabase.functions.invoke(
    "send-identity-claim-notification",
    {
      body: {
        notificationType,
        claimId: savedClaim.id,
        eventSlug,
        participantId,
        participantFirstName,
        participantLastName,
        participantDisplayName,
        personId,
        personFirstName,
        personLastName,
        personDisplayName,
      },
    },
  );

  if (fnError) {
    console.error(
      "[saveMyPersonIdentityClaim] notification non envoyée",
      fnError,
    );
  }

  return savedClaim;
}