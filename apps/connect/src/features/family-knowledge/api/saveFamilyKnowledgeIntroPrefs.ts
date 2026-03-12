import type { FamilyKnowledgeIntroPrefs } from "./getFamilyKnowledgeIntroPrefs";

type SaveFamilyKnowledgeIntroPrefsInput = {
  slug: string;
  values: FamilyKnowledgeIntroPrefs;
};

export function saveFamilyKnowledgeIntroPrefs({
  slug,
  values,
}: SaveFamilyKnowledgeIntroPrefsInput): void {
  localStorage.setItem(
    `connect:${slug}:family-knowledge:intro:prefs`,
    JSON.stringify({
      hideNextTime: values.hideNextTime,
    }),
  );
}