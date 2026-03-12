import { supabase } from "../../../lib/supabase/client";

export type FamilyKnowledgePersonEntry = {
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
  birthOrder: string;
};

export type FamilyKnowledgeCloseFamilyValues = {
  parent1: FamilyKnowledgePersonEntry;
  parent2: FamilyKnowledgePersonEntry;
  siblings: FamilyKnowledgePersonEntry[];
  knowsSiblingOrder: boolean;
  children: FamilyKnowledgePersonEntry[];
  isInRelationship: "" | "yes" | "no";
  partner: FamilyKnowledgePersonEntry;
};

type GetFamilyKnowledgeCloseFamilyInput = {
  participantId: string;
};

export function createEmptyFamilyKnowledgePerson(
  known = true,
): FamilyKnowledgePersonEntry {
  return {
    known,
    firstName: "",
    lastName: "",
    nickname: "",
    isAlive: "",
    hasPhoto: "",
    birthOrder: "",
  };
}

export function getDefaultFamilyKnowledgeCloseFamilyValues(): FamilyKnowledgeCloseFamilyValues {
  return {
    parent1: createEmptyFamilyKnowledgePerson(true),
    parent2: createEmptyFamilyKnowledgePerson(true),
    siblings: [],
    knowsSiblingOrder: false,
    children: [],
    isInRelationship: "",
    partner: createEmptyFamilyKnowledgePerson(true),
  };
}

function normalizePerson(input: any): FamilyKnowledgePersonEntry {
  return {
    known: Boolean(input?.known),
    firstName: input?.firstName ?? "",
    lastName: input?.lastName ?? "",
    nickname: input?.nickname ?? "",
    isAlive:
      input?.isAlive === "yes" || input?.isAlive === "no" ? input.isAlive : "",
    hasPhoto:
      input?.hasPhoto === "yes" || input?.hasPhoto === "no" ? input.hasPhoto : "",
    birthOrder: input?.birthOrder ?? "",
  };
}

export async function getFamilyKnowledgeCloseFamily({
  participantId,
}: GetFamilyKnowledgeCloseFamilyInput): Promise<FamilyKnowledgeCloseFamilyValues | null> {
  const res = await supabase
    .from("participant_family_knowledge_close_family")
    .select("data")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data?.data) return null;

  const raw = res.data.data;
  const defaults = getDefaultFamilyKnowledgeCloseFamilyValues();

  return {
    ...defaults,
    parent1: normalizePerson(raw.parent1),
    parent2: normalizePerson(raw.parent2),
    siblings: Array.isArray(raw.siblings)
      ? raw.siblings.map(normalizePerson)
      : [],
    knowsSiblingOrder: Boolean(raw.knowsSiblingOrder),
    children: Array.isArray(raw.children)
      ? raw.children.map(normalizePerson)
      : [],
    isInRelationship:
      raw.isInRelationship === "yes" || raw.isInRelationship === "no"
        ? raw.isInRelationship
        : "",
    partner: normalizePerson(raw.partner),
  };
}