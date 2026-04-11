import { supabase } from "../../../lib/supabase/client";
import { getPersonLabelFromFamilyGraph } from "../../moderation/lib/moderationLabels";
import type {
  AdminParticipantTrackingPageItem,
  AdminParticipantTrackingSummary,
  AdminParticipantTrackingTreeItem,
} from "../types/adminParticipantTypes";

type GetAdminParticipantTrackingParams = {
  eventSlug: string;
  participantId: string;
};

type ParticipantPageTimeRow = {
  page_key: string;
  left_at: string | null;
  visible_ms: number | null;
  engaged_ms: number | null;
  event_count: number | null;
};

type ParticipantFamilyTreeViewRow = {
  person_id: string;
  left_at: string | null;
  visible_ms: number | null;
  engaged_ms: number | null;
  event_count: number | null;
};

function toNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function maxIsoDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;

  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

export async function getAdminParticipantTracking({
  eventSlug,
  participantId,
}: GetAdminParticipantTrackingParams): Promise<AdminParticipantTrackingSummary> {
  const [pageTimeRes, treeViewsRes] = await Promise.all([
    supabase
      .from("participant_page_time")
      .select("page_key, left_at, visible_ms, engaged_ms, event_count")
      .eq("event_slug", eventSlug)
      .eq("participant_id", participantId)
      .returns<ParticipantPageTimeRow[]>(),
    supabase
      .from("participant_family_tree_views")
      .select("person_id, left_at, visible_ms, engaged_ms, event_count")
      .eq("event_slug", eventSlug)
      .eq("participant_id", participantId)
      .returns<ParticipantFamilyTreeViewRow[]>(),
  ]);

  if (pageTimeRes.error) {
    throw new Error(
      `Impossible de charger le tracking pages : ${pageTimeRes.error.message}`
    );
  }

  if (treeViewsRes.error) {
    throw new Error(
      `Impossible de charger le tracking arbre : ${treeViewsRes.error.message}`
    );
  }

  const pageRows = pageTimeRes.data ?? [];
  const treeRows = treeViewsRes.data ?? [];

  const pageMap = new Map<string, AdminParticipantTrackingPageItem>();
  let totalPageVisibleMs = 0;
  let totalPageEngagedMs = 0;
  let totalPageEventCount = 0;
  let lastPageActivityAt: string | null = null;

  for (const row of pageRows) {
    const pageKey = row.page_key || "unknown";
    const visibleMs = toNumber(row.visible_ms);
    const engagedMs = toNumber(row.engaged_ms);
    const eventCount = toNumber(row.event_count);
    const leftAt = row.left_at ?? null;

    totalPageVisibleMs += visibleMs;
    totalPageEngagedMs += engagedMs;
    totalPageEventCount += eventCount;
    lastPageActivityAt = maxIsoDate(lastPageActivityAt, leftAt);

    const existing = pageMap.get(pageKey);

    if (!existing) {
      pageMap.set(pageKey, {
        pageKey,
        sessions: 1,
        visibleMs,
        engagedMs,
        eventCount,
        lastLeftAt: leftAt,
      });
      continue;
    }

    existing.sessions += 1;
    existing.visibleMs += visibleMs;
    existing.engagedMs += engagedMs;
    existing.eventCount += eventCount;
    existing.lastLeftAt = maxIsoDate(existing.lastLeftAt, leftAt);
  }

  const treeMap = new Map<string, AdminParticipantTrackingTreeItem>();
  let totalTreeVisibleMs = 0;
  let totalTreeEngagedMs = 0;
  let totalTreeEventCount = 0;
  let lastTreeActivityAt: string | null = null;

  for (const row of treeRows) {
    const personId = row.person_id || "unknown";
    const visibleMs = toNumber(row.visible_ms);
    const engagedMs = toNumber(row.engaged_ms);
    const eventCount = toNumber(row.event_count);
    const leftAt = row.left_at ?? null;

    totalTreeVisibleMs += visibleMs;
    totalTreeEngagedMs += engagedMs;
    totalTreeEventCount += eventCount;
    lastTreeActivityAt = maxIsoDate(lastTreeActivityAt, leftAt);

    const existing = treeMap.get(personId);

    if (!existing) {
      treeMap.set(personId, {
        personId,
        personLabel: getPersonLabelFromFamilyGraph(personId) ?? personId,
        views: 1,
        visibleMs,
        engagedMs,
        eventCount,
        lastLeftAt: leftAt,
      });
      continue;
    }

    existing.views += 1;
    existing.visibleMs += visibleMs;
    existing.engagedMs += engagedMs;
    existing.eventCount += eventCount;
    existing.lastLeftAt = maxIsoDate(existing.lastLeftAt, leftAt);
  }

  const topPages = Array.from(pageMap.values()).sort((a, b) => {
    if (b.engagedMs !== a.engagedMs) return b.engagedMs - a.engagedMs;
    if (b.visibleMs !== a.visibleMs) return b.visibleMs - a.visibleMs;
    return a.pageKey.localeCompare(b.pageKey, "fr");
  });

  const topTreePeople = Array.from(treeMap.values()).sort((a, b) => {
    if (b.engagedMs !== a.engagedMs) return b.engagedMs - a.engagedMs;
    if (b.visibleMs !== a.visibleMs) return b.visibleMs - a.visibleMs;
    return a.personLabel.localeCompare(b.personLabel, "fr");
  });

  return {
    pageSessionsCount: pageRows.length,
    pageDistinctCount: pageMap.size,
    totalPageVisibleMs,
    totalPageEngagedMs,
    totalPageEventCount,
    lastPageActivityAt,

    treeViewsCount: treeRows.length,
    treeDistinctPeopleCount: treeMap.size,
    totalTreeVisibleMs,
    totalTreeEngagedMs,
    totalTreeEventCount,
    lastTreeActivityAt,

    topPages,
    topTreePeople,
  };
}