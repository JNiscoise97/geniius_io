export type FamilyKnowledgeTableName =
  | "participant_family_knowledge_close_family"
  | "participant_family_knowledge_godparents"
  | "participant_family_knowledge_grandparents"
  | "participant_family_knowledge_siblings";

export type FamilyPhotoPersonType =
  | "parent"
  | "godparent"
  | "grandparent"
  | "sibling";

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