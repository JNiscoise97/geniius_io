import { supabase } from "../../../../lib/supabase/client";
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
  birthYear?: string | number | null;
}) {
  const { eventSlug, personId, firstName, lastName, nickname, birthYear } =
    params;

  const normalizedPersonId = personId.trim();
  if (!normalizedPersonId) {
    return;
  }

  const { data: existingOverrideRow, error: overrideReadError } = await supabase
    .from("person_overrides")
    .select(
      `
        id,
        overrides
      `,
    )
    .eq("event_slug", eventSlug)
    .eq("person_id", normalizedPersonId)
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
      person_id: normalizedPersonId,
      overrides: nextOverrides,
      updated_at: getNowIso(),
    });

  if (overrideInsertError) {
    throw overrideInsertError;
  }
}

const CLAIM_SELECT = `
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

  const normalizedPersonId = personId.trim();
  if (!normalizedPersonId) {
    throw new Error("Aucune fiche n’a été sélectionnée.");
  }

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

  /**
   * Nouveau modèle :
   * - plus de auto_verified
   * - si la personne choisie correspond à default_gedcom_person_id,
   *   on considère directement la claim comme approved
   * - sinon pending
   */
  const nextStatus =
    defaultGedcomPersonId === normalizedPersonId ? "approved" : "pending";

  const moderatedAt = nextStatus === "approved" ? now : null;

  /**
   * On lit la claim unique du participant pour cet event.
   */
  const { data: existing, error: existingError } = await supabase
    .from("family_person_identity_claims")
    .select(CLAIM_SELECT)
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let savedClaim: PersonIdentityClaim;

  if (existing) {
    const previousPersonId = existing.person_id?.trim() ?? "";
    const shouldRefreshSubmittedAt =
      previousPersonId !== normalizedPersonId ||
      (previousPersonId === "" && normalizedPersonId !== "");

    const updatePayload: Record<string, unknown> = {
      person_id: normalizedPersonId,
      claim_status: nextStatus,
      moderator_comment: null,
      moderated_at: moderatedAt,
      updated_at: now,
    };

    /**
     * Important :
     * le placeholder créé automatiquement ne doit pas fausser la date
     * de "demande envoyée". On remet submitted_at à maintenant quand
     * l'utilisateur choisit réellement une fiche ou change de cible.
     */
    if (shouldRefreshSubmittedAt) {
      updatePayload.submitted_at = now;
    }

    const { data, error } = await supabase
      .from("family_person_identity_claims")
      .update(updatePayload)
      .eq("id", existing.id)
      .select(CLAIM_SELECT)
      .single();

    if (error) {
      throw error;
    }

    savedClaim = data as PersonIdentityClaim;
  } else {
    /**
     * Fallback robuste si la ligne n'existe pas encore malgré le trigger.
     */
    const { data, error } = await supabase
      .from("family_person_identity_claims")
      .insert({
        event_slug: eventSlug,
        participant_id: participantId,
        person_id: normalizedPersonId,
        claim_status: nextStatus,
        moderator_comment: null,
        submitted_at: now,
        moderated_at: moderatedAt,
        updated_at: now,
      })
      .select(CLAIM_SELECT)
      .single();

    if (error) {
      throw error;
    }

    savedClaim = data as PersonIdentityClaim;
  }

  /**
   * Si la claim est approuvée immédiatement, on met à jour les overrides.
   */
  if (nextStatus === "approved") {
    await upsertProfileNamingAndBirthYearOverride({
      eventSlug,
      personId: normalizedPersonId,
      firstName: participant?.first_name ?? null,
      lastName: participant?.last_name ?? null,
      nickname: participant?.nickname ?? null,
      birthYear: participant?.birth_year ?? null,
    });
  }

  /**
   * Contrat mis à jour :
   * - "approved" si validation immédiate
   * - "submitted" sinon
   *
   * Il faudra que l'edge function soit alignée sur ce nouveau vocabulaire.
   */
  const notificationType = nextStatus === "approved" ? "approved" : "submitted";

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
        personId: normalizedPersonId,
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

  return {
    ...savedClaim,
    person_id: savedClaim.person_id?.trim() ?? "",
  } as PersonIdentityClaim;
}