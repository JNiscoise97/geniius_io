import type {
  FamilyReactionFeedItem,
  FamilyReactionSection,
  FamilyReactionSectionKey,
} from "../types";

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDifferenceInCalendarDays(left: Date, right: Date) {
  const leftStart = getStartOfDay(left).getTime();
  const rightStart = getStartOfDay(right).getTime();
  return Math.round((leftStart - rightStart) / (1000 * 60 * 60 * 24));
}

export function getFamilyReactionSectionKey(
  dateString: string,
): FamilyReactionSectionKey {
  const now = new Date();
  const target = new Date(dateString);
  const diffDays = getDifferenceInCalendarDays(now, target);

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays >= 2 && diffDays <= 6) return "week";
  return "older";
}

export function getFamilyReactionSectionTitle(
  key: FamilyReactionSectionKey,
): string {
  switch (key) {
    case "today":
      return "Aujourd’hui";
    case "yesterday":
      return "Hier";
    case "week":
      return "Cette semaine";
    case "older":
      return "Avant";
  }
}

export function getFamilyReactionSectionSubtitle(
  key: FamilyReactionSectionKey,
): string {
  switch (key) {
    case "today":
      return "Les dernières interactions publiées aujourd’hui.";
    case "yesterday":
      return "Les interactions partagées hier.";
    case "week":
      return "Les publications récentes de ces derniers jours.";
    case "older":
      return "Les interactions plus anciennes de l’espace famille.";
  }
}

export function groupFamilyReactionFeedItems(
  items: FamilyReactionFeedItem[],
): FamilyReactionSection[] {
  const buckets: Record<FamilyReactionSectionKey, FamilyReactionFeedItem[]> = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };

  for (const item of items) {
    const key = getFamilyReactionSectionKey(item.createdAt);
    buckets[key].push(item);
  }

  const sections: FamilyReactionSection[] = [
    {
      key: "today",
      title: getFamilyReactionSectionTitle("today"),
      items: buckets.today,
    },
    {
      key: "yesterday",
      title: getFamilyReactionSectionTitle("yesterday"),
      items: buckets.yesterday,
    },
    {
      key: "week",
      title: getFamilyReactionSectionTitle("week"),
      items: buckets.week,
    },
    {
      key: "older",
      title: getFamilyReactionSectionTitle("older"),
      items: buckets.older,
    },
  ];

  return sections.filter((section) => section.items.length > 0);
}