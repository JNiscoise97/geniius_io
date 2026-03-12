import { supabase } from "../../../lib/supabase/client";

export type FamilyKnowledgeGodparentPerson = {
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
  isFamilyMember: "" | "yes" | "no";
};

export type FamilyKnowledgeParentGodparentPerson = {
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  hasPhoto: "" | "yes" | "no";
};

export type FamilyKnowledgeGodparentsValues = {
  personalGodparents: FamilyKnowledgeGodparentPerson[];
  fatherGodfather: FamilyKnowledgeParentGodparentPerson;
  fatherGodmother: FamilyKnowledgeParentGodparentPerson;
  motherGodfather: FamilyKnowledgeParentGodparentPerson;
  motherGodmother: FamilyKnowledgeParentGodparentPerson;
};

type GetFamilyKnowledgeGodparentsInput = {
  participantId: string;
};

export function createEmptyFamilyKnowledgeGodparentPerson(
  known = true,
): FamilyKnowledgeGodparentPerson {
  return {
    known,
    firstName: "",
    lastName: "",
    nickname: "",
    isAlive: "",
    hasPhoto: "",
    isFamilyMember: "",
  };
}

export function createEmptyFamilyKnowledgeParentGodparentPerson(
  known = true,
): FamilyKnowledgeParentGodparentPerson {
  return {
    known,
    firstName: "",
    lastName: "",
    nickname: "",
    hasPhoto: "",
  };
}

export function getDefaultFamilyKnowledgeGodparentsValues(): FamilyKnowledgeGodparentsValues {
  return {
    personalGodparents: [],
    fatherGodfather: createEmptyFamilyKnowledgeParentGodparentPerson(true),
    fatherGodmother: createEmptyFamilyKnowledgeParentGodparentPerson(true),
    motherGodfather: createEmptyFamilyKnowledgeParentGodparentPerson(true),
    motherGodmother: createEmptyFamilyKnowledgeParentGodparentPerson(true),
  };
}

function normalizeGodparentPerson(input: any): FamilyKnowledgeGodparentPerson {
  return {
    known: Boolean(input?.known),
    firstName: input?.firstName ?? "",
    lastName: input?.lastName ?? "",
    nickname: input?.nickname ?? "",
    isAlive:
      input?.isAlive === "yes" || input?.isAlive === "no" ? input.isAlive : "",
    hasPhoto:
      input?.hasPhoto === "yes" || input?.hasPhoto === "no" ? input.hasPhoto : "",
    isFamilyMember:
      input?.isFamilyMember === "yes" || input?.isFamilyMember === "no"
        ? input.isFamilyMember
        : "",
  };
}

function normalizeParentGodparentPerson(
  input: any,
): FamilyKnowledgeParentGodparentPerson {
  return {
    known: Boolean(input?.known),
    firstName: input?.firstName ?? "",
    lastName: input?.lastName ?? "",
    nickname: input?.nickname ?? "",
    hasPhoto:
      input?.hasPhoto === "yes" || input?.hasPhoto === "no" ? input.hasPhoto : "",
  };
}

export async function getFamilyKnowledgeGodparents({
  participantId,
}: GetFamilyKnowledgeGodparentsInput): Promise<FamilyKnowledgeGodparentsValues | null> {
  const res = await supabase
    .from("participant_family_knowledge_godparents")
    .select("data")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data?.data) return null;

  const raw = res.data.data;

  return {
    personalGodparents: Array.isArray(raw.personalGodparents)
      ? raw.personalGodparents.map(normalizeGodparentPerson)
      : [],
    fatherGodfather: normalizeParentGodparentPerson(raw.fatherGodfather),
    fatherGodmother: normalizeParentGodparentPerson(raw.fatherGodmother),
    motherGodfather: normalizeParentGodparentPerson(raw.motherGodfather),
    motherGodmother: normalizeParentGodparentPerson(raw.motherGodmother),
  };
}