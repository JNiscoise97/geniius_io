import type { FamilyTreeAction } from "../../types/actions";

export type SubmitMissingRelativeInput = {
  eventSlug: string;
  participantId: string;
  personId: string;
  relationType: "parent" | "child" | "spouse";
  note?: string;
};

export type SubmitMissingRelativeResult = {
  ok: true;
  action: FamilyTreeAction;
};

export async function submitMissingRelative(
  input: SubmitMissingRelativeInput,
): Promise<SubmitMissingRelativeResult> {
  const action: FamilyTreeAction = {
    id: `missing-relative:${input.personId}:${input.relationType}:${Date.now()}`,
    type:
      input.relationType === "parent"
        ? "add_missing_parent"
        : input.relationType === "child"
          ? "add_missing_child"
          : "add_missing_spouse",
    status: "pending",
    personId: input.personId,
    title:
      input.relationType === "parent"
        ? "Parent manquant proposé"
        : input.relationType === "child"
          ? "Enfant manquant proposé"
          : "Conjoint manquant proposé",
    description: input.note?.trim() || undefined,
    source: "tree-contribute",
    payload: {
      relationType: input.relationType,
      note: input.note?.trim() || "",
      eventSlug: input.eventSlug,
      participantId: input.participantId,
    },
  };

  return {
    ok: true,
    action,
  };
}