import { supabase } from "../supabase/client";

export type PageTimeTrackerPayload = {
  participantId: string;
  eventSlug: string;
  pageKey: string;
  sessionId: string;
  enteredAt: string;
  leftAt: string;
  visibleMs: number;
  engagedMs: number;
  eventCount: number;
  deviceType: string | null;
};

export type PageTimeTrackerOptions = {
  participantId: string;
  eventSlug: string;
  pageKey: string;
  inactivityMs?: number;
  heartbeatMs?: number;
  enabled?: boolean;
  onError?: (error: unknown) => void;
};

type InternalState = {
  enteredAtMs: number;
  visibleSinceMs: number | null;
  engagedSinceMs: number | null;
  totalVisibleMs: number;
  totalEngagedMs: number;
  lastActivityMs: number;
  eventCount: number;
  destroyed: boolean;
};

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `pts_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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

async function savePageTime(payload: PageTimeTrackerPayload): Promise<void> {
  const { error } = await supabase.from("participant_page_time").upsert(
    {
      participant_id: payload.participantId,
      event_slug: payload.eventSlug,
      page_key: payload.pageKey,
      session_id: payload.sessionId,
      entered_at: payload.enteredAt,
      left_at: payload.leftAt,
      visible_ms: payload.visibleMs,
      engaged_ms: payload.engagedMs,
      event_count: payload.eventCount,
      device_type: payload.deviceType,
    },
    {
      onConflict: "participant_id,event_slug,page_key,session_id",
    },
  );

  if (error) {
    throw error;
  }
}

export class PageTimeTracker {
  private readonly participantId: string;
  private readonly eventSlug: string;
  private readonly pageKey: string;
  private readonly sessionId: string;
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

  constructor(options: PageTimeTrackerOptions) {
    this.participantId = options.participantId;
    this.eventSlug = options.eventSlug;
    this.pageKey = options.pageKey;
    this.inactivityMs = options.inactivityMs ?? 30_000;
    this.heartbeatMs = options.heartbeatMs ?? 15_000;
    this.enabled = options.enabled ?? true;
    this.onError = options.onError;
    this.sessionId = createSessionId();
    this.deviceType = getDeviceType();

    const currentMs = now();

    this.state = {
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
        void this.flush();
      }, this.heartbeatMs);
    }
  }

  async stop(): Promise<void> {
    if (this.state.destroyed) return;

    this.cleanupListeners();
    this.pauseAll();

    try {
      await this.flush();
    } finally {
      this.state.destroyed = true;
    }
  }

  markActivity(): void {
    if (!this.enabled || this.state.destroyed) return;
    this.onActivity();
  }

  getSnapshot() {
    this.recalculateRunningDurations();

    return {
      participantId: this.participantId,
      eventSlug: this.eventSlug,
      pageKey: this.pageKey,
      sessionId: this.sessionId,
      enteredAt: new Date(this.state.enteredAtMs).toISOString(),
      visibleMs: this.state.totalVisibleMs,
      engagedMs: this.state.totalEngagedMs,
      eventCount: this.state.eventCount,
      deviceType: this.deviceType,
    };
  }

  async flush(): Promise<void> {
    if (!this.enabled || this.state.destroyed) return;

    this.recalculateRunningDurations();

    const currentMs = now();

    const payload: PageTimeTrackerPayload = {
      participantId: this.participantId,
      eventSlug: this.eventSlug,
      pageKey: this.pageKey,
      sessionId: this.sessionId,
      enteredAt: new Date(this.state.enteredAtMs).toISOString(),
      leftAt: new Date(currentMs).toISOString(),
      visibleMs: Math.max(0, Math.round(this.state.totalVisibleMs)),
      engagedMs: Math.max(0, Math.round(this.state.totalEngagedMs)),
      eventCount: this.state.eventCount,
      deviceType: this.deviceType,
    };

    try {
      await savePageTime(payload);
    } catch (error) {
      this.onError?.(error);
    }
  }

  private onVisibilityChange(): void {
    if (isDocumentVisible()) {
      this.resumeIfNeeded();
    } else {
      this.pauseAll();
      void this.flush();
    }
  }

  private onPageHide(): void {
    this.pauseAll();
    void this.flush();
  }

  private onBeforeUnload(): void {
    this.pauseAll();
    void this.flush();
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

export function createPageTimeTracker(
  options: PageTimeTrackerOptions,
): PageTimeTracker {
  return new PageTimeTracker(options);
}