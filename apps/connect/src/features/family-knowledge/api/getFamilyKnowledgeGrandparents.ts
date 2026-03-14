import { supabase } from "../../../lib/supabase/client";

export type FamilyKnowledgeGrandparentPerson = {
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
};

export type FamilyKnowledgeAuntUnclePerson = {
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
  relationshipType: "" | "both_parents" | "father_only" | "mother_only";
  birthOrder: string;
};

export type FamilyKnowledgeGrandparentsValues = {
  paternalGrandfather: FamilyKnowledgeGrandparentPerson;
  paternalGrandmother: FamilyKnowledgeGrandparentPerson;
  maternalGrandfather: FamilyKnowledgeGrandparentPerson;
  maternalGrandmother: FamilyKnowledgeGrandparentPerson;

  hasPaternalAuntsUncles: "" | "yes" | "no";
  paternalAuntsUncles: FamilyKnowledgeAuntUnclePerson[];
  knowsFatherSiblingOrder: boolean;

  hasMaternalAuntsUncles: "" | "yes" | "no";
  maternalAuntsUncles: FamilyKnowledgeAuntUnclePerson[];
  knowsMotherSiblingOrder: boolean;
};

type GetFamilyKnowledgeGrandparentsInput = {
  participantId: string;
};

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
    known,
    firstName: "",
    lastName: "",
    nickname: "",
    isAlive: "",
    hasPhoto: "",
    relationshipType: "",
    birthOrder: "",
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

    hasMaternalAuntsUncles: "",
    maternalAuntsUncles: [],
    knowsMotherSiblingOrder: false,
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

function normalizeAuntUnclePerson(input: any): FamilyKnowledgeAuntUnclePerson {
  return {
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

  return {
    ...defaults,
    paternalGrandfather: normalizeGrandparentPerson(raw.paternalGrandfather),
    paternalGrandmother: normalizeGrandparentPerson(raw.paternalGrandmother),
    maternalGrandfather: normalizeGrandparentPerson(raw.maternalGrandfather),
    maternalGrandmother: normalizeGrandparentPerson(raw.maternalGrandmother),

    hasPaternalAuntsUncles: normalizeYesNo(raw.hasPaternalAuntsUncles),
    paternalAuntsUncles: Array.isArray(raw.paternalAuntsUncles)
      ? raw.paternalAuntsUncles.map(normalizeAuntUnclePerson)
      : [],
    knowsFatherSiblingOrder: Boolean(raw.knowsFatherSiblingOrder),

    hasMaternalAuntsUncles: normalizeYesNo(raw.hasMaternalAuntsUncles),
    maternalAuntsUncles: Array.isArray(raw.maternalAuntsUncles)
      ? raw.maternalAuntsUncles.map(normalizeAuntUnclePerson)
      : [],
    knowsMotherSiblingOrder: Boolean(raw.knowsMotherSiblingOrder),
  };
}