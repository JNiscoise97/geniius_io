import { supabase } from "../supabase/client";

export type FamilyTreeViaAction =
  | "initial"
  | "parents_section"
  | "spouses_section"
  | "children_section"
  | "siblings_section"
  | "grandparents_section"
  | "relationship_path"
  | "recenter_root"
  | "recenter_source"
  | "direct_open";

export type FamilyTreeViewPayload = {
  participantId: string;
  eventSlug: string;
  browseSessionId: string;
  sourcePageKey: string;
  personId: string;
  fromPersonId: string | null;
  viaAction: FamilyTreeViaAction | null;
  enteredAt: string;
  leftAt: string;
  visibleMs: number;
  engagedMs: number;
  eventCount: number;
  deviceType: string | null;
};

export type FamilyTreeViewTrackerOptions = {
  participantId: string;
  eventSlug: string;
  sourcePageKey: string;
  initialPersonId: string;
  inactivityMs?: number;
  heartbeatMs?: number;
  enabled?: boolean;
  onError?: (error: unknown) => void;
};

type InternalState = {
  currentPersonId: string;
  currentFromPersonId: string | null;
  currentViaAction: FamilyTreeViaAction | null;
  enteredAtMs: number;
  visibleSinceMs: number | null;
  engagedSinceMs: number | null;
  totalVisibleMs: number;
  totalEngagedMs: number;
  lastActivityMs: number;
  eventCount: number;
  destroyed: boolean;
};

function createSessionId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function now(): number {
  return Date.now();
}

function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

function hasRecentActivity(
  lastActivityMs: number,
  inactivityMs: number,
): boolean {
  return now() - lastActivityMs <= inactivityMs;
}

function getDeviceType(): string | null {
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent.toLowerCase();

  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(ua)) return "mobile";
  return "desktop";
}

async function insertFamilyTreeView(
  payload: FamilyTreeViewPayload,
): Promise<void> {
  const { error } = await supabase.from("participant_family_tree_views").insert({
    participant_id: payload.participantId,
    event_slug: payload.eventSlug,
    browse_session_id: payload.browseSessionId,
    source_page_key: payload.sourcePageKey,
    person_id: payload.personId,
    from_person_id: payload.fromPersonId,
    via_action: payload.viaAction,
    entered_at: payload.enteredAt,
    left_at: payload.leftAt,
    visible_ms: payload.visibleMs,
    engaged_ms: payload.engagedMs,
    event_count: payload.eventCount,
    device_type: payload.deviceType,
  });

  if (error) {
    throw error;
  }
}

export class FamilyTreeViewTracker {
  private readonly participantId: string;
  private readonly eventSlug: string;
  private readonly sourcePageKey: string;
  private readonly browseSessionId: string;
  private readonly inactivityMs: number;
  private readonly heartbeatMs: number;
  private readonly enabled: boolean;
  private readonly onError?: (error: unknown) => void;
  private readonly deviceType: string | null;

  private state: InternalState;
  private heartbeatTimer: number | null = null;

  private readonly onVisibilityChangeBound =
    this.onVisibilityChange.bind(this);
  private readonly onPageHideBound = this.onPageHide.bind(this);
  private readonly onBeforeUnloadBound = this.onBeforeUnload.bind(this);
  private readonly onActivityBound = this.onActivity.bind(this);

  constructor(options: FamilyTreeViewTrackerOptions) {
    this.participantId = options.participantId;
    this.eventSlug = options.eventSlug;
    this.sourcePageKey = options.sourcePageKey;
    this.inactivityMs = options.inactivityMs ?? 30_000;
    this.heartbeatMs = options.heartbeatMs ?? 15_000;
    this.enabled = options.enabled ?? true;
    this.onError = options.onError;
    this.browseSessionId = createSessionId("ftv");
    this.deviceType = getDeviceType();

    const currentMs = now();

    this.state = {
      currentPersonId: options.initialPersonId,
      currentFromPersonId: null,
      currentViaAction: "initial",
      enteredAtMs: currentMs,
      visibleSinceMs: null,
      engagedSinceMs: null,
      totalVisibleMs: 0,
      totalEngagedMs: 0,
      lastActivityMs: currentMs,
      eventCount: 0,
      destroyed: false,
    };
  }

  start(): void {
    if (!this.enabled || this.state.destroyed) return;

    this.resumeIfNeeded();

    if (typeof document !== "undefined") {
      document.addEventListener(
        "visibilitychange",
        this.onVisibilityChangeBound,
      );
      document.addEventListener("click", this.onActivityBound, {
        passive: true,
      });
      document.addEventListener("scroll", this.onActivityBound, {
        passive: true,
      });
      document.addEventListener("touchstart", this.onActivityBound, {
        passive: true,
      });
      document.addEventListener("keydown", this.onActivityBound, {
        passive: true,
      });
    }

    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", this.onPageHideBound);
      window.addEventListener("beforeunload", this.onBeforeUnloadBound);

      this.heartbeatTimer = window.setInterval(() => {
        void this.flushCurrentView();
      }, this.heartbeatMs);
    }
  }

  async stop(): Promise<void> {
    if (this.state.destroyed) return;

    this.cleanupListeners();
    this.pauseAll();

    try {
      await this.flushCurrentView();
    } finally {
      this.state.destroyed = true;
    }
  }

  markActivity(): void {
    if (!this.enabled || this.state.destroyed) return;
    this.onActivity();
  }

  async changePerson(
    nextPersonId: string,
    viaAction: FamilyTreeViaAction,
  ): Promise<void> {
    if (!this.enabled || this.state.destroyed) return;
    if (nextPersonId === this.state.currentPersonId) return;

    this.pauseAll();
    await this.flushCurrentView();

    const currentMs = now();

    this.state.currentFromPersonId = this.state.currentPersonId;
    this.state.currentPersonId = nextPersonId;
    this.state.currentViaAction = viaAction;
    this.state.enteredAtMs = currentMs;
    this.state.visibleSinceMs = null;
    this.state.engagedSinceMs = null;
    this.state.totalVisibleMs = 0;
    this.state.totalEngagedMs = 0;
    this.state.eventCount = 0;
    this.state.lastActivityMs = currentMs;

    this.resumeIfNeeded();
  }

  getBrowseSessionId(): string {
    return this.browseSessionId;
  }

  private async flushCurrentView(): Promise<void> {
    if (!this.enabled || this.state.destroyed) return;

    this.recalculateRunningDurations();

    const currentMs = now();

    const payload: FamilyTreeViewPayload = {
      participantId: this.participantId,
      eventSlug: this.eventSlug,
      browseSessionId: this.browseSessionId,
      sourcePageKey: this.sourcePageKey,
      personId: this.state.currentPersonId,
      fromPersonId: this.state.currentFromPersonId,
      viaAction: this.state.currentViaAction,
      enteredAt: new Date(this.state.enteredAtMs).toISOString(),
      leftAt: new Date(currentMs).toISOString(),
      visibleMs: Math.max(0, Math.round(this.state.totalVisibleMs)),
      engagedMs: Math.max(0, Math.round(this.state.totalEngagedMs)),
      eventCount: this.state.eventCount,
      deviceType: this.deviceType,
    };

    if (
      payload.visibleMs === 0 &&
      payload.engagedMs === 0 &&
      payload.eventCount === 0
    ) {
      return;
    }

    try {
      await insertFamilyTreeView(payload);
    } catch (error) {
      this.onError?.(error);
    }
  }

  private onVisibilityChange(): void {
    if (isDocumentVisible()) {
      this.resumeIfNeeded();
    } else {
      this.pauseAll();
      void this.flushCurrentView();
    }
  }

  private onPageHide(): void {
    this.pauseAll();
    void this.flushCurrentView();
  }

  private onBeforeUnload(): void {
    this.pauseAll();
    void this.flushCurrentView();
  }

  private onActivity(): void {
    this.state.lastActivityMs = now();
    this.state.eventCount += 1;

    if (isDocumentVisible() && this.state.engagedSinceMs === null) {
      this.state.engagedSinceMs = now();
    }
  }

  private resumeIfNeeded(): void {
    if (!isDocumentVisible()) return;

    if (this.state.visibleSinceMs === null) {
      this.state.visibleSinceMs = now();
    }

    if (
      this.state.engagedSinceMs === null &&
      hasRecentActivity(this.state.lastActivityMs, this.inactivityMs)
    ) {
      this.state.engagedSinceMs = now();
    }
  }

  private pauseAll(): void {
    const currentMs = now();

    if (this.state.visibleSinceMs !== null) {
      this.state.totalVisibleMs += currentMs - this.state.visibleSinceMs;
      this.state.visibleSinceMs = null;
    }

    if (this.state.engagedSinceMs !== null) {
      this.state.totalEngagedMs += currentMs - this.state.engagedSinceMs;
      this.state.engagedSinceMs = null;
    }
  }

  private recalculateRunningDurations(): void {
    const currentMs = now();

    if (this.state.visibleSinceMs !== null) {
      this.state.totalVisibleMs += currentMs - this.state.visibleSinceMs;
      this.state.visibleSinceMs = currentMs;
    }

    if (this.state.engagedSinceMs !== null) {
      if (hasRecentActivity(this.state.lastActivityMs, this.inactivityMs)) {
        this.state.totalEngagedMs += currentMs - this.state.engagedSinceMs;
        this.state.engagedSinceMs = currentMs;
      } else {
        this.state.totalEngagedMs += Math.max(
          0,
          this.state.lastActivityMs - this.state.engagedSinceMs,
        );
        this.state.engagedSinceMs = null;
      }
    }
  }

  private cleanupListeners(): void {
    if (typeof document !== "undefined") {
      document.removeEventListener(
        "visibilitychange",
        this.onVisibilityChangeBound,
      );
      document.removeEventListener("click", this.onActivityBound);
      document.removeEventListener("scroll", this.onActivityBound);
      document.removeEventListener("touchstart", this.onActivityBound);
      document.removeEventListener("keydown", this.onActivityBound);
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", this.onPageHideBound);
      window.removeEventListener("beforeunload", this.onBeforeUnloadBound);

      if (this.heartbeatTimer !== null) {
        window.clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }
  }
}

export function createFamilyTreeViewTracker(
  options: FamilyTreeViewTrackerOptions,
): FamilyTreeViewTracker {
  return new FamilyTreeViewTracker(options);
}