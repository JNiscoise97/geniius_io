export type FamilyTreeActionType =
  | "identify_self"
  | "request_visibility"
  | "add_memory"
  | "add_photo"
  | "fix_identity"
  | "fix_name"
  | "fix_birth"
  | "fix_death"
  | "fix_place"
  | "add_missing_parent"
  | "add_missing_child"
  | "add_missing_spouse"
  | "review_relation"
  | "review_profile"
  | "invite_person"
  | "unknown";

export type FamilyTreeActionStatus =
  | "available"
  | "suggested"
  | "pending"
  | "done"
  | "blocked"
  | "hidden";

export type FamilyTreeAction = {
  id: string;
  type: FamilyTreeActionType;
  status: FamilyTreeActionStatus;

  personId?: string;
  relatedPersonId?: string;

  title: string;
  description?: string;
  helperText?: string;
  ctaLabel?: string;

  priority?: number;
  reason?: string;
  source?: "family-tree" | "tree-contribute" | "manual" | "system";

  payload?: Record<string, unknown>;
};