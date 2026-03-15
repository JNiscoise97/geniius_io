export type FamilyKnowledgeTableName =
  | "participant_family_knowledge_close_family"
  | "participant_family_knowledge_current_links"
  | "participant_family_knowledge_godparents"
  | "participant_family_knowledge_grandparents"
  | "participant_family_knowledge_memory";

export type FamilyPhotoPersonType =
  | "parent"
  | "child"
  | "partner"
  | "current_link"
  | "grandparent"
  | "aunt_uncle"
  | "story_teller";

export type FamilyPhotoTarget = {
  sourceTable: FamilyKnowledgeTableName;
  personType: FamilyPhotoPersonType;
  key: string;
  label: string;
  displayName: string;
  years?: string | null;
  rawPath: string;
  rawData: Record<string, unknown>;
};

export type FamilyPhotoUploadResult = {
  storagePath: string;
  publicUrl?: string | null;
};