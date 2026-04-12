// src/features/family-tree/application/in-person/submitInPersonAssist.ts

import { supabase } from "../../../../lib/supabase/client";
import { saveInPersonAssist } from "../../data/in-person/saveInPersonAssist";
import { saveParticipantConsentsOnBehalf } from "../../data/in-person/saveParticipantConsentsOnBehalf";

export type InPersonAssistPayload = {
  eventSlug: string;
  helperParticipantId: string;

  targetPersonId?: string | null;
  targetParticipantId?: string | null;

  declaredPresent: boolean;
  attended2023?: boolean | null;
  attended2024?: boolean | null;

  allowName: boolean | null;
  allowPhoto: boolean | null;
  allowInfo: boolean | null;

  email?: string | null;
  birthYear?: number | null;

  targetIsMinor?: boolean;
  consentCollectedFrom?: string | null;

  notes?: string | null;

  testimonyInterest?:
  | "very_willing"
  | "willing"
  | "maybe"
  | "reluctant"
  | "no"
  | null;
  testimonyTopics?: string | null;

  targetFirstName?: string | null;
  targetLastName?: string | null;
};

export type SubmitInPersonAssistResult = {
  assistSaved: true;
  participantCreated: boolean;
  invitationSent: boolean;
  targetParticipantId: string | null;
  warnings: string[];
};

type ParticipantLookupRow = {
  id: string;
  email: string | null;
};

function normalizeEmail(value?: string | null): string | null {
  const email = value?.trim().toLowerCase() ?? "";
  return email || null;
}

function normalizeBirthYear(value?: number | null): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;

  const year = Math.trunc(value);
  if (year < 1800 || year > 2100) return null;

  return year;
}

function hasAtLeastOneConsent(payload: InPersonAssistPayload): boolean {
  return (
    payload.allowName !== null ||
    payload.allowPhoto !== null ||
    payload.allowInfo !== null
  );
}

async function findParticipantByEmail(params: {
  eventSlug: string;
  email: string;
}): Promise<ParticipantLookupRow | null> {
  const { eventSlug, email } = params;

  const { data, error } = await supabase
    .from("participants")
    .select("id, email")
    .eq("event_slug", eventSlug)
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ParticipantLookupRow | null;
}

async function createParticipantOnBehalf(params: {
  eventSlug: string;
  email?: string | null;
  birthYear?: number | null;
  targetPersonId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): Promise<string> {
  const {
    eventSlug,
    email,
    birthYear,
    targetPersonId,
    firstName,
    lastName,
  } = params;

  const payload = {
    event_slug: eventSlug,
    first_name: firstName?.trim() || null,
    last_name: lastName?.trim() || null,
    nickname: null,
    birth_year: birthYear ?? null,
    phone: null,
    email: email ?? null,
    has_whatsapp: false,
    messenger: null,
    preferred_contact_channels: [],
    default_gedcom_person_id: targetPersonId?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("participants")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

async function resolveTargetParticipantId(
  payload: InPersonAssistPayload,
): Promise<{
  targetParticipantId: string | null;
  participantCreated: boolean;
  invitationSent: boolean;
}> {
  if (payload.targetParticipantId?.trim()) {
    return {
      targetParticipantId: payload.targetParticipantId.trim(),
      participantCreated: false,
      invitationSent: false,
    };
  }

  const normalizedEmail = normalizeEmail(payload.email);

  if (normalizedEmail) {
    const existingParticipant = await findParticipantByEmail({
      eventSlug: payload.eventSlug,
      email: normalizedEmail,
    });

    if (existingParticipant?.id) {
      return {
        targetParticipantId: existingParticipant.id,
        participantCreated: false,
        invitationSent: false,
      };
    }
  }

  if (!normalizedEmail) {
    return {
      targetParticipantId: null,
      participantCreated: false,
      invitationSent: false,
    };
  }

  const createdParticipantId = await createParticipantOnBehalf({
    eventSlug: payload.eventSlug,
    email: normalizedEmail,
    birthYear: normalizeBirthYear(payload.birthYear),
    targetPersonId: payload.targetPersonId ?? null,
    firstName: payload.targetFirstName ?? null,
    lastName: payload.targetLastName ?? null,
  });

  return {
    targetParticipantId: createdParticipantId,
    participantCreated: true,
    invitationSent: true,
  };
}

export async function submitInPersonAssist(
  payload: InPersonAssistPayload,
): Promise<SubmitInPersonAssistResult> {
  const warnings: string[] = [];

  let resolvedTargetParticipantId: string | null =
    payload.targetParticipantId?.trim() || null;
  let participantCreated = false;
  let invitationSent = false;

  try {
    const resolution = await resolveTargetParticipantId(payload);
    resolvedTargetParticipantId = resolution.targetParticipantId;
    participantCreated = resolution.participantCreated;
    invitationSent = resolution.invitationSent;
  } catch (error) {
    console.error(
      "[submitInPersonAssist] impossible de résoudre / créer le participant cible",
      error,
    );
    warnings.push(
      "Le participant cible n’a pas pu être rattaché automatiquement, mais l’assistance va quand même être enregistrée.",
    );
  }

  try {
    if (resolvedTargetParticipantId && hasAtLeastOneConsent(payload)) {
      await saveParticipantConsentsOnBehalf({
        eventSlug: payload.eventSlug,
        participantId: resolvedTargetParticipantId,
        allowNameInFamilyTree: payload.allowName,
        allowPhotoInFamilyTree: payload.allowPhoto,
        allowInfoInFamilyTree: payload.allowInfo,
      });
    }
  } catch (error) {
    console.error(
      "[submitInPersonAssist] impossible d’enregistrer les consentements",
      error,
    );
    warnings.push(
      "Les consentements n’ont pas pu être enregistrés automatiquement avec le participant.",
    );
  }

  await saveInPersonAssist({
    eventSlug: payload.eventSlug,
    helperParticipantId: payload.helperParticipantId,
    targetPersonId: payload.targetPersonId ?? null,
    targetParticipantId: resolvedTargetParticipantId,
    targetEmail: normalizeEmail(payload.email),
    targetBirthYear: normalizeBirthYear(payload.birthYear),
    declaredPresent: payload.declaredPresent,
    attended2023: payload.attended2023 ?? null,
    attended2024: payload.attended2024 ?? null,
    allowNameInFamilyTree: payload.allowName,
    allowPhotoInFamilyTree: payload.allowPhoto,
    allowInfoInFamilyTree: payload.allowInfo,
    photoTaken: false,
    notes: payload.notes ?? null,
    targetIsMinor: payload.targetIsMinor ?? false,
    consentCollectedFrom: payload.consentCollectedFrom ?? null,
    testimonyInterest: payload.testimonyInterest ?? null,
    testimonyTopics: payload.testimonyTopics ?? null,
  });

  return {
    assistSaved: true,
    participantCreated,
    invitationSent,
    targetParticipantId: resolvedTargetParticipantId,
    warnings,
  };
}