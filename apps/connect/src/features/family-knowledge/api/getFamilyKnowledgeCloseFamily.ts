import { supabase } from "../../../lib/supabase/client";
import {
  createFamilyOrderId,
  normalizeOrderedKeys,
  sortIdsByLegacyBirthOrder,
} from "../lib/siblingOrder";

export type FamilyKnowledgePersonEntry = {
  id: string;
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
};

export type FamilyKnowledgeCloseFamilyValues = {
  parent1: FamilyKnowledgePersonEntry;
  parent2: FamilyKnowledgePersonEntry;

  hasSiblings: "" | "yes" | "no";
  siblings: FamilyKnowledgePersonEntry[];
  knowsSiblingOrder: boolean;
  siblingOrder: string[];

  hasChildren: "" | "yes" | "no";
  children: FamilyKnowledgePersonEntry[];

  isInRelationship: "" | "yes" | "no";
  partner: FamilyKnowledgePersonEntry;
};

type GetFamilyKnowledgeCloseFamilyInput = {
  participantId: string;
};

type LegacyFamilyKnowledgePersonEntry = FamilyKnowledgePersonEntry & {
  birthOrder?: string;
};

const SELF_SIBLING_ORDER_KEY = "self";

export function createEmptyFamilyKnowledgePerson(
  known = true,
): FamilyKnowledgePersonEntry {
  return {
    id: createFamilyOrderId(),
    known,
    firstName: "",
    lastName: "",
    nickname: "",
    isAlive: "",
    hasPhoto: "",
  };
}

export function getDefaultFamilyKnowledgeCloseFamilyValues(): FamilyKnowledgeCloseFamilyValues {
  return {
    parent1: createEmptyFamilyKnowledgePerson(true),
    parent2: createEmptyFamilyKnowledgePerson(true),

    hasSiblings: "",
    siblings: [],
    knowsSiblingOrder: false,
    siblingOrder: [SELF_SIBLING_ORDER_KEY],

    hasChildren: "",
    children: [],

    isInRelationship: "",
    partner: createEmptyFamilyKnowledgePerson(true),
  };
}

function normalizePerson(input: any): LegacyFamilyKnowledgePersonEntry {
  return {
    id: input?.id ?? createFamilyOrderId(),
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

  const siblings: LegacyFamilyKnowledgePersonEntry[] = Array.isArray(raw.siblings)
    ? raw.siblings.map(normalizePerson)
    : [];

  const children: LegacyFamilyKnowledgePersonEntry[] = Array.isArray(raw.children)
    ? raw.children.map(normalizePerson)
    : [];

  const siblingKeys = siblings
    .filter((sibling) => sibling.known)
    .map((sibling) => `sibling:${sibling.id}`);

  const rawSiblingOrder = Array.isArray(raw.siblingOrder)
    ? raw.siblingOrder.filter((value: unknown): value is string => typeof value === "string")
    : [];

  const legacyOrderedIds =
    rawSiblingOrder.length === 0
      ? sortIdsByLegacyBirthOrder(
          siblings.filter((sibling) => sibling.known),
        ).map((id) => `sibling:${id}`)
      : [];

  const siblingOrder = normalizeOrderedKeys({
    existingKeys: rawSiblingOrder.length > 0 ? rawSiblingOrder : legacyOrderedIds,
    allowedKeys: [SELF_SIBLING_ORDER_KEY, ...siblingKeys],
    fixedKey: SELF_SIBLING_ORDER_KEY,
  });

  return {
    ...defaults,
    parent1: normalizePerson(raw.parent1),
    parent2: normalizePerson(raw.parent2),

    hasSiblings:
      raw.hasSiblings === "yes" || raw.hasSiblings === "no"
        ? raw.hasSiblings
        : "",
    siblings: siblings.map(({ birthOrder: _birthOrder, ...person }) => person),
    knowsSiblingOrder: Boolean(raw.knowsSiblingOrder),
    siblingOrder,

    hasChildren:
      raw.hasChildren === "yes" || raw.hasChildren === "no"
        ? raw.hasChildren
        : "",
    children: children.map(({ birthOrder: _birthOrder, ...person }) => person),

    isInRelationship:
      raw.isInRelationship === "yes" || raw.isInRelationship === "no"
        ? raw.isInRelationship
        : "",
    partner: normalizePerson(raw.partner),
  };
}