// features/family-knowledge/api/getFamilyKnowledgeCloseFamily.ts

import { supabase } from "../../../lib/supabase/client";
import {
  createFamilyOrderId,
  normalizeOrderedKeys,
  sortIdsByLegacyBirthOrder,
} from "../lib/siblingOrder";

export type FamilyKnowledgeYesNo = "" | "yes" | "no";
export type FamilyKnowledgeSex = "" | "M" | "F" | "U";
export type FamilyKnowledgeConfidence = "" | "low" | "medium" | "high";

export type FamilyKnowledgePersonEntry = {
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

export type FamilyKnowledgeCloseFamilyValues = {
  parent1: FamilyKnowledgePersonEntry;
  parent2: FamilyKnowledgePersonEntry;

  hasSiblings: FamilyKnowledgeYesNo;
  siblings: FamilyKnowledgePersonEntry[];
  knowsSiblingOrder: boolean;
  siblingOrder: string[];

  hasChildren: FamilyKnowledgeYesNo;
  children: FamilyKnowledgePersonEntry[];

  isInRelationship: FamilyKnowledgeYesNo;
  partner: FamilyKnowledgePersonEntry;
};

type GetFamilyKnowledgeCloseFamilyInput = {
  participantId: string;
};

type LegacyFamilyKnowledgePersonEntry = FamilyKnowledgePersonEntry & {
  birthOrder?: string;
};

const SELF_SIBLING_ORDER_KEY = "self";

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

export function createEmptyFamilyKnowledgePerson(
  known = true,
): FamilyKnowledgePersonEntry {
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

    birthOrder: normalizeText(input?.birthOrder),
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

  if (!res.data?.data) {
    return null;
  }

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
    ? raw.siblingOrder.filter(
        (value: unknown): value is string => typeof value === "string",
      )
    : [];

  const legacyOrderedIds =
    rawSiblingOrder.length === 0
      ? sortIdsByLegacyBirthOrder(
          siblings.filter((sibling) => sibling.known),
        ).map((id) => `sibling:${id}`)
      : [];

  const siblingOrder = normalizeOrderedKeys({
    existingKeys:
      rawSiblingOrder.length > 0 ? rawSiblingOrder : legacyOrderedIds,
    allowedKeys: [SELF_SIBLING_ORDER_KEY, ...siblingKeys],
    fixedKey: SELF_SIBLING_ORDER_KEY,
  });

  return {
    ...defaults,

    parent1: normalizePerson(raw.parent1),
    parent2: normalizePerson(raw.parent2),

    hasSiblings: normalizeYesNo(raw.hasSiblings),
    siblings: siblings.map(({ birthOrder: _birthOrder, ...person }) => person),
    knowsSiblingOrder: Boolean(raw.knowsSiblingOrder),
    siblingOrder,

    hasChildren: normalizeYesNo(raw.hasChildren),
    children: children.map(({ birthOrder: _birthOrder, ...person }) => person),

    isInRelationship: normalizeYesNo(raw.isInRelationship),
    partner: normalizePerson(raw.partner),
  };
}