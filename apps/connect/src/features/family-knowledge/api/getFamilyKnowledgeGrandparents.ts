import { supabase } from "../../../lib/supabase/client";
import {
  createFamilyOrderId,
  normalizeOrderedKeys,
  sortIdsByLegacyBirthOrder,
} from "../lib/siblingOrder";

export type FamilyKnowledgeGrandparentPerson = {
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
};

export type FamilyKnowledgeAuntUnclePerson = {
  id: string;
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
  relationshipType: "" | "both_parents" | "father_only" | "mother_only";
};

export type FamilyKnowledgeGrandparentsValues = {
  paternalGrandfather: FamilyKnowledgeGrandparentPerson;
  paternalGrandmother: FamilyKnowledgeGrandparentPerson;
  maternalGrandfather: FamilyKnowledgeGrandparentPerson;
  maternalGrandmother: FamilyKnowledgeGrandparentPerson;

  hasPaternalAuntsUncles: "" | "yes" | "no";
  paternalAuntsUncles: FamilyKnowledgeAuntUnclePerson[];
  knowsFatherSiblingOrder: boolean;
  paternalSiblingOrder: string[];

  hasMaternalAuntsUncles: "" | "yes" | "no";
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

export function createEmptyFamilyKnowledgeGrandparentPerson(
  known = true,
): FamilyKnowledgeGrandparentPerson {
  return {
    known,
    firstName: "",
    lastName: "",
    nickname: "",
    isAlive: "",
    hasPhoto: "",
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
    isAlive: "",
    hasPhoto: "",
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

function normalizeYesNo(value: unknown): "" | "yes" | "no" {
  return value === "yes" || value === "no" ? value : "";
}

function normalizeGrandparentPerson(input: any): FamilyKnowledgeGrandparentPerson {
  return {
    known: Boolean(input?.known),
    firstName: input?.firstName ?? "",
    lastName: input?.lastName ?? "",
    nickname: input?.nickname ?? "",
    isAlive: normalizeYesNo(input?.isAlive),
    hasPhoto: normalizeYesNo(input?.hasPhoto),
  };
}

function normalizeAuntUnclePerson(input: any): LegacyFamilyKnowledgeAuntUnclePerson {
  return {
    id: input?.id ?? createFamilyOrderId(),
    known: Boolean(input?.known),
    firstName: input?.firstName ?? "",
    lastName: input?.lastName ?? "",
    nickname: input?.nickname ?? "",
    isAlive: normalizeYesNo(input?.isAlive),
    hasPhoto: normalizeYesNo(input?.hasPhoto),
    relationshipType:
      input?.relationshipType === "both_parents" ||
      input?.relationshipType === "father_only" ||
      input?.relationshipType === "mother_only"
        ? input.relationshipType
        : "",
    birthOrder: input?.birthOrder ?? "",
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
    ? raw.paternalSiblingOrder.filter((value: unknown): value is string => typeof value === "string")
    : [];

  const rawMaternalOrder = Array.isArray(raw.maternalSiblingOrder)
    ? raw.maternalSiblingOrder.filter((value: unknown): value is string => typeof value === "string")
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