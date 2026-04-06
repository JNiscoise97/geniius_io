const STORAGE_KEY_PREFIX = "family-tree-recent-searches";

export type RecentFamilySearchEntry = {
  personId: string;
  viewedAt: string;
};

function getStorageKey(eventSlug: string) {
  return `${STORAGE_KEY_PREFIX}:${eventSlug}`;
}

export function getRecentFamilySearches(
  eventSlug: string,
  limit = 8,
): RecentFamilySearchEntry[] {
  try {
    const raw = window.localStorage.getItem(getStorageKey(eventSlug));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as RecentFamilySearchEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry) =>
          entry &&
          typeof entry.personId === "string" &&
          typeof entry.viewedAt === "string",
      )
      .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function pushRecentFamilySearch(
  eventSlug: string,
  personId: string,
  limit = 8,
): void {
  try {
    const existing = getRecentFamilySearches(eventSlug, limit * 2);
    const next: RecentFamilySearchEntry[] = [
      {
        personId,
        viewedAt: new Date().toISOString(),
      },
      ...existing.filter((entry) => entry.personId !== personId),
    ].slice(0, limit);

    window.localStorage.setItem(getStorageKey(eventSlug), JSON.stringify(next));
  } catch {
    // no-op
  }
}