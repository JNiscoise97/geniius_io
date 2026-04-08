// features/family-knowledge/api/getFamilyKnowledgeGrandparents.ts

import { supabase } from "../../../lib/supabase/client";
import {
  createFamilyOrderId,
  normalizeOrderedKeys,
  sortIdsByLegacyBirthOrder,
} from "../lib/siblingOrder";

export type FamilyKnowledgeYesNo = "" | "yes" | "no";
export type FamilyKnowledgeSex = "" | "M" | "F" | "U";
export type FamilyKnowledgeConfidence = "" | "low" | "medium" | "high";

export type FamilyKnowledgeGrandparentPerson = {
  id: string;
  known: boolean;

  firstName: string;
  lastName: string;
  nickname: string;

  sex: FamilyKnowledgeSex;

  birthYear: string;
  deathYear: string;

  birthPlace: string;
  currentPlace: string;
  deathPlace: string;

  isAlive: FamilyKnowledgeYesNo;
  hasPhoto: FamilyKnowledgeYesNo;

  confidence: FamilyKnowledgeConfidence;
  notes: string;
};

export type FamilyKnowledgeAuntUnclePerson = {
  id: string;
  known: boolean;

  firstName: string;
  lastName: string;
  nickname: string;

  sex: FamilyKnowledgeSex;

  birthYear: string;
  deathYear: string;

  birthPlace: string;
  currentPlace: string;
  deathPlace: string;

  isAlive: FamilyKnowledgeYesNo;
  hasPhoto: FamilyKnowledgeYesNo;

  confidence: FamilyKnowledgeConfidence;
  notes: string;

  relationshipType: "" | "both_parents" | "father_only" | "mother_only";
};

export type FamilyKnowledgeGrandparentsValues = {
  paternalGrandfather: FamilyKnowledgeGrandparentPerson;
  paternalGrandmother: FamilyKnowledgeGrandparentPerson;
  maternalGrandfather: FamilyKnowledgeGrandparentPerson;
  maternalGrandmother: FamilyKnowledgeGrandparentPerson;

  hasPaternalAuntsUncles: FamilyKnowledgeYesNo;
  paternalAuntsUncles: FamilyKnowledgeAuntUnclePerson[];
  knowsFatherSiblingOrder: boolean;
  paternalSiblingOrder: string[];

  hasMaternalAuntsUncles: FamilyKnowledgeYesNo;
  maternalAuntsUncles: FamilyKnowledgeAuntUnclePerson[];
  knowsMotherSiblingOrder: boolean;
  maternalSiblingOrder: string[];
};

type GetFamilyKnowledgeGrandparentsInput = {
  participantId: string;
};

type LegacyFamilyKnowledgeAuntUnclePerson = FamilyKnowledgeAuntUnclePerson & {
  birthOrder?: string;
};

export const FATHER_SIBLING_ORDER_KEY = "father";
export const MOTHER_SIBLING_ORDER_KEY = "mother";

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeYesNo(value: unknown): FamilyKnowledgeYesNo {
  return value === "yes" || value === "no" ? value : "";
}

function normalizeSex(value: unknown): FamilyKnowledgeSex {
  return value === "M" || value === "F" || value === "U" ? value : "";
}

function normalizeConfidence(value: unknown): FamilyKnowledgeConfidence {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "";
}

export function createEmptyFamilyKnowledgeGrandparentPerson(
  known = true,
): FamilyKnowledgeGrandparentPerson {
  return {
    id: createFamilyOrderId(),
    known,

    firstName: "",
    lastName: "",
    nickname: "",

    sex: "",

    birthYear: "",
    deathYear: "",

    birthPlace: "",
    currentPlace: "",
    deathPlace: "",

    isAlive: "",
    hasPhoto: "",

    confidence: "",
    notes: "",
  };
}

export function createEmptyFamilyKnowledgeAuntUnclePerson(
  known = true,
): FamilyKnowledgeAuntUnclePerson {
  return {
    id: createFamilyOrderId(),
    known,

    firstName: "",
    lastName: "",
    nickname: "",

    sex: "",

    birthYear: "",
    deathYear: "",

    birthPlace: "",
    currentPlace: "",
    deathPlace: "",

    isAlive: "",
    hasPhoto: "",

    confidence: "",
    notes: "",

    relationshipType: "",
  };
}

export function getDefaultFamilyKnowledgeGrandparentsValues(): FamilyKnowledgeGrandparentsValues {
  return {
    paternalGrandfather: createEmptyFamilyKnowledgeGrandparentPerson(true),
    paternalGrandmother: createEmptyFamilyKnowledgeGrandparentPerson(true),
    maternalGrandfather: createEmptyFamilyKnowledgeGrandparentPerson(true),
    maternalGrandmother: createEmptyFamilyKnowledgeGrandparentPerson(true),

    hasPaternalAuntsUncles: "",
    paternalAuntsUncles: [],
    knowsFatherSiblingOrder: false,
    paternalSiblingOrder: [FATHER_SIBLING_ORDER_KEY],

    hasMaternalAuntsUncles: "",
    maternalAuntsUncles: [],
    knowsMotherSiblingOrder: false,
    maternalSiblingOrder: [MOTHER_SIBLING_ORDER_KEY],
  };
}

function normalizeGrandparentPerson(input: any): FamilyKnowledgeGrandparentPerson {
  return {
    id: normalizeText(input?.id) || createFamilyOrderId(),
    known: Boolean(input?.known),

    firstName: normalizeText(input?.firstName),
    lastName: normalizeText(input?.lastName),
    nickname: normalizeText(input?.nickname),

    sex: normalizeSex(input?.sex),

    birthYear: normalizeText(input?.birthYear),
    deathYear: normalizeText(input?.deathYear),

    birthPlace: normalizeText(input?.birthPlace),
    currentPlace: normalizeText(input?.currentPlace),
    deathPlace: normalizeText(input?.deathPlace),

    isAlive: normalizeYesNo(input?.isAlive),
    hasPhoto: normalizeYesNo(input?.hasPhoto),

    confidence: normalizeConfidence(input?.confidence),
    notes: normalizeText(input?.notes),
  };
}

function normalizeAuntUnclePerson(input: any): LegacyFamilyKnowledgeAuntUnclePerson {
  return {
    id: normalizeText(input?.id) || createFamilyOrderId(),
    known: Boolean(input?.known),

    firstName: normalizeText(input?.firstName),
    lastName: normalizeText(input?.lastName),
    nickname: normalizeText(input?.nickname),

    sex: normalizeSex(input?.sex),

    birthYear: normalizeText(input?.birthYear),
    deathYear: normalizeText(input?.deathYear),

    birthPlace: normalizeText(input?.birthPlace),
    currentPlace: normalizeText(input?.currentPlace),
    deathPlace: normalizeText(input?.deathPlace),

    isAlive: normalizeYesNo(input?.isAlive),
    hasPhoto: normalizeYesNo(input?.hasPhoto),

    confidence: normalizeConfidence(input?.confidence),
    notes: normalizeText(input?.notes),

    relationshipType:
      input?.relationshipType === "both_parents" ||
      input?.relationshipType === "father_only" ||
      input?.relationshipType === "mother_only"
        ? input.relationshipType
        : "",

    birthOrder: normalizeText(input?.birthOrder),
  };
}

export async function getFamilyKnowledgeGrandparents({
  participantId,
}: GetFamilyKnowledgeGrandparentsInput): Promise<FamilyKnowledgeGrandparentsValues | null> {
  const res = await supabase
    .from("participant_family_knowledge_grandparents")
    .select("data")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data?.data) {
    return null;
  }

  const raw = res.data.data;
  const defaults = getDefaultFamilyKnowledgeGrandparentsValues();

  const paternalAuntsUncles: LegacyFamilyKnowledgeAuntUnclePerson[] = Array.isArray(
    raw.paternalAuntsUncles,
  )
    ? raw.paternalAuntsUncles.map(normalizeAuntUnclePerson)
    : [];

  const maternalAuntsUncles: LegacyFamilyKnowledgeAuntUnclePerson[] = Array.isArray(
    raw.maternalAuntsUncles,
  )
    ? raw.maternalAuntsUncles.map(normalizeAuntUnclePerson)
    : [];

  const paternalKeys = paternalAuntsUncles
    .filter((person) => person.known)
    .map((person) => `paternal:${person.id}`);

  const maternalKeys = maternalAuntsUncles
    .filter((person) => person.known)
    .map((person) => `maternal:${person.id}`);

  const rawPaternalOrder = Array.isArray(raw.paternalSiblingOrder)
    ? raw.paternalSiblingOrder.filter(
        (value: unknown): value is string => typeof value === "string",
      )
    : [];

  const rawMaternalOrder = Array.isArray(raw.maternalSiblingOrder)
    ? raw.maternalSiblingOrder.filter(
        (value: unknown): value is string => typeof value === "string",
      )
    : [];

  const legacyPaternalOrder =
    rawPaternalOrder.length === 0
      ? sortIdsByLegacyBirthOrder(
          paternalAuntsUncles.filter((person) => person.known),
        ).map((id) => `paternal:${id}`)
      : [];

  const legacyMaternalOrder =
    rawMaternalOrder.length === 0
      ? sortIdsByLegacyBirthOrder(
          maternalAuntsUncles.filter((person) => person.known),
        ).map((id) => `maternal:${id}`)
      : [];

  return {
    ...defaults,

    paternalGrandfather: normalizeGrandparentPerson(raw.paternalGrandfather),
    paternalGrandmother: normalizeGrandparentPerson(raw.paternalGrandmother),
    maternalGrandfather: normalizeGrandparentPerson(raw.maternalGrandfather),
    maternalGrandmother: normalizeGrandparentPerson(raw.maternalGrandmother),

    hasPaternalAuntsUncles: normalizeYesNo(raw.hasPaternalAuntsUncles),
    paternalAuntsUncles: paternalAuntsUncles.map(
      ({ birthOrder: _birthOrder, ...person }) => person,
    ),
    knowsFatherSiblingOrder: Boolean(raw.knowsFatherSiblingOrder),
    paternalSiblingOrder: normalizeOrderedKeys({
      existingKeys:
        rawPaternalOrder.length > 0 ? rawPaternalOrder : legacyPaternalOrder,
      allowedKeys: [FATHER_SIBLING_ORDER_KEY, ...paternalKeys],
      fixedKey: FATHER_SIBLING_ORDER_KEY,
    }),

    hasMaternalAuntsUncles: normalizeYesNo(raw.hasMaternalAuntsUncles),
    maternalAuntsUncles: maternalAuntsUncles.map(
      ({ birthOrder: _birthOrder, ...person }) => person,
    ),
    knowsMotherSiblingOrder: Boolean(raw.knowsMotherSiblingOrder),
    maternalSiblingOrder: normalizeOrderedKeys({
      existingKeys:
        rawMaternalOrder.length > 0 ? rawMaternalOrder : legacyMaternalOrder,
      allowedKeys: [MOTHER_SIBLING_ORDER_KEY, ...maternalKeys],
      fixedKey: MOTHER_SIBLING_ORDER_KEY,
    }),
  };
}