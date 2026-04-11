export type FamilyDocumentCategory =
  | "livret"
  | "liste_familiale"
  | "recit"
  | "archive_acte"
  | "image_archive";

export type FamilyDocumentFormat = "pdf" | "image";

export type FamilyDocumentOrientation = "portrait" | "landscape";

export type FamilyDocumentDefinition = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category: FamilyDocumentCategory;
  format: FamilyDocumentFormat;
  assetPath: string;
  order?: number;
  year?: number;
  publicationDateLabel?: string;
  author?: string;
  writingDate?: string;
  writingPlace?: string;
  orientation?: FamilyDocumentOrientation;
  personNames?: string[];
  place?: string;
  tags?: string[];
  isFeatured?: boolean;
};