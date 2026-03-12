export type FamilyKnowledgeIntroPrefs = {
  hideNextTime: boolean;
};

export function getDefaultFamilyKnowledgeIntroPrefs(): FamilyKnowledgeIntroPrefs {
  return {
    hideNextTime: false,
  };
}

export function getFamilyKnowledgeIntroPrefs(
  slug: string,
): FamilyKnowledgeIntroPrefs {
  const raw = localStorage.getItem(
    `connect:${slug}:family-knowledge:intro:prefs`,
  );

  if (!raw) {
    return getDefaultFamilyKnowledgeIntroPrefs();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FamilyKnowledgeIntroPrefs>;

    return {
      hideNextTime: Boolean(parsed.hideNextTime),
    };
  } catch {
    return getDefaultFamilyKnowledgeIntroPrefs();
  }
}