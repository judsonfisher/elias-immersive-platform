/**
 * Client-side Matterport Showcase SDK event capture.
 * Connects to an embedded Matterport iframe, captures visitor interactions,
 * and sends batched events to the server for analytics storage.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type EventPayload = {
  type: "MOVE" | "ZOOM" | "TAG_CLICK" | "HOTSPOT_CLICK" | "DWELL";
  timestamp: string;
  positionX: number | null;
  positionY: number | null;
  positionZ: number | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  duration: number | null;
};

const FLUSH_INTERVAL = 5000;
const MAX_BATCH_SIZE = 50;
const MOVE_THROTTLE_MS = 500;
const MOVE_DISTANCE_THRESHOLD = 0.5;
const DWELL_THRESHOLD_MS = 3000;

export class ShowcaseEventCapture {
  private sdk: any = null;
  private scanId: string;
  private sessionId: string | null = null;
  private visitorId: string;
  private eventBuffer: EventPayload[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private lastPosition: { x: number; y: number; z: number } | null = null;
  private lastMoveTime = 0;
  private dwellStartTime = 0;
  private dwellPosition: { x: number; y: number; z: number } | null = null;
  private destroyed = false;

  constructor(scanId: string) {
    this.scanId = scanId;
    this.visitorId = this.getOrCreateVisitorId();
  }

  private getOrCreateVisitorId(): string {
    const key = "elias_visitor_id";
    try {
      let id = localStorage.getItem(key);
      if (!id) {
        id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem(key, id);
      }
      return id;
    } catch {
      return `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
  }

  private detectDeviceType(): string {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
    if (
      /mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)
    )
      return "Mobile";
    return "Desktop";
  }

  async connect(iframe: HTMLIFrameElement): Promise<any | null> {
    // Wait for MP_SDK to be available (loaded via script tag)
    try {
      const MP_SDK = await this.waitForSdk();
      const sdkKey = process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY;
      this.sdk = await MP_SDK.connect(iframe, sdkKey || undefined, "3.10");
    } catch (err) {
      console.warn(
        "[Elias] Matterport SDK connection failed — analytics and SDK controls unavailable.",
        err
      );
      this.sdk = null;
      return null;
    }

    await this.startSession();
    this.subscribeToEvents();

    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL);

    window.addEventListener("beforeunload", this.handleUnload);
    document.addEventListener("visibilitychange", this.handleVisibility);

    return this.sdk;
  }

  private waitForSdk(timeoutMs = 10000): Promise<any> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if ((window as any).MP_SDK) {
          resolve((window as any).MP_SDK);
        } else if (Date.now() - start > timeoutMs) {
          reject(new Error("Matterport SDK script did not load in time"));
        } else {
          setTimeout(check, 200);
        }
      };
      check();
    });
  }

  private async startSession(): Promise<void> {
    const response = await fetch("/api/scan-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        scanId: this.scanId,
        visitorId: this.visitorId,
        deviceType: this.detectDeviceType(),
        entryPoint: document.referrer || "Direct",
      }),
    });
    const data = await response.json();
    this.sessionId = data.sessionId;
  }

  private subscribeToEvents(): void {
    if (!this.sdk) return;

    // Camera pose → MOVE and DWELL events
    this.sdk.Camera.pose.subscribe({
      onChanged: (pose: any) => {
        if (this.destroyed) return;
        const now = Date.now();
        const pos = pose.position;

        const distance = this.lastPosition
          ? Math.sqrt(
              Math.pow(pos.x - this.lastPosition.x, 2) +
                Math.pow(pos.y - this.lastPosition.y, 2) +
                Math.pow(pos.z - this.lastPosition.z, 2)
            )
          : Infinity;

        if (distance > MOVE_DISTANCE_THRESHOLD) {
          // Check for dwell at previous position
          if (
            this.dwellPosition &&
            now - this.dwellStartTime > DWELL_THRESHOLD_MS
          ) {
            this.pushEvent({
              type: "DWELL",
              positionX: this.dwellPosition.x,
              positionY: this.dwellPosition.y,
              positionZ: this.dwellPosition.z,
              duration: (now - this.dwellStartTime) / 1000,
            });
          }

          // Throttle MOVE events
          if (now - this.lastMoveTime > MOVE_THROTTLE_MS) {
            this.pushEvent({
              type: "MOVE",
              positionX: pos.x,
              positionY: pos.y,
              positionZ: pos.z,
            });
            this.lastMoveTime = now;
          }

          this.dwellStartTime = now;
          this.dwellPosition = { x: pos.x, y: pos.y, z: pos.z };
        }

        this.lastPosition = { x: pos.x, y: pos.y, z: pos.z };
      },
    });

    // Mattertag clicks
    this.sdk.on(
      this.sdk.Mattertag.Event.CLICK,
      (tagSid: string) => {
        this.pushEvent({
          type: "TAG_CLICK",
          targetId: tagSid,
          positionX: this.lastPosition?.x ?? null,
          positionY: this.lastPosition?.y ?? null,
          positionZ: this.lastPosition?.z ?? null,
        });
      }
    );

    // Sweep navigation
    this.sdk.on(
      this.sdk.Sweep.Event.ENTER,
      (oldSweep: string, newSweep: string) => {
        this.pushEvent({
          type: "HOTSPOT_CLICK",
          targetId: newSweep,
          positionX: this.lastPosition?.x ?? null,
          positionY: this.lastPosition?.y ?? null,
          positionZ: this.lastPosition?.z ?? null,
          metadata: { fromSweep: oldSweep },
        });
      }
    );
  }

  private pushEvent(
    partial: Partial<EventPayload> & { type: EventPayload["type"] }
  ): void {
    this.eventBuffer.push({
      type: partial.type,
      timestamp: new Date().toISOString(),
      positionX: partial.positionX ?? null,
      positionY: partial.positionY ?? null,
      positionZ: partial.positionZ ?? null,
      targetId: partial.targetId ?? null,
      metadata: partial.metadata ?? null,
      duration: partial.duration ?? null,
    });

    if (this.eventBuffer.length >= MAX_BATCH_SIZE) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (!this.sessionId || this.eventBuffer.length === 0) return;

    const batch = this.eventBuffer.splice(0, MAX_BATCH_SIZE);

    try {
      await fetch("/api/scan-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId: this.scanId,
          sessionId: this.sessionId,
          events: batch,
        }),
      });
    } catch {
      // On failure, push events back for retry
      this.eventBuffer.unshift(...batch);
    }
  }

  private handleUnload = () => {
    this.endSession();
  };

  private handleVisibility = () => {
    if (document.visibilityState === "hidden") {
      this.flush();
    }
  };

  private endSession(): void {
    // Use sendBeacon for reliability during page unload
    if (this.sessionId && this.eventBuffer.length > 0) {
      const eventsBlob = new Blob(
        [
          JSON.stringify({
            scanId: this.scanId,
            sessionId: this.sessionId,
            events: this.eventBuffer,
          }),
        ],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/scan-events", eventsBlob);
      this.eventBuffer = [];
    }

    if (this.sessionId) {
      const sessionBlob = new Blob(
        [JSON.stringify({ action: "end", sessionId: this.sessionId })],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/scan-sessions", sessionBlob);
    }
  }

  // ─── Public SDK Controls ─────────────────────────────────────

  async moveToDollhouse(): Promise<void> {
    if (!this.sdk) return;
    await this.sdk.Mode.moveTo(this.sdk.Mode.Mode.DOLLHOUSE);
  }

  async moveToFloorplan(): Promise<void> {
    if (!this.sdk) return;
    await this.sdk.Mode.moveTo(this.sdk.Mode.Mode.FLOORPLAN);
  }

  async moveToInside(): Promise<void> {
    if (!this.sdk) return;
    await this.sdk.Mode.moveTo(this.sdk.Mode.Mode.INSIDE);
  }

  /**
   * Wait for the user to click a position in the 3D scan.
   * Uses the Matterport Pointer.intersection observable.
   * Returns the 3D position on click, or null if cancelled/timeout.
   */
  waitForClickPosition(
    timeoutMs = 30000
  ): Promise<{ x: number; y: number; z: number } | null> {
    return new Promise((resolve) => {
      if (!this.sdk) {
        resolve(null);
        return;
      }

      let resolved = false;
      let subscription: any = null;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          subscription?.cancel();
          resolve(null);
        }
      }, timeoutMs);

      // Subscribe to pointer intersections
      subscription = this.sdk.Pointer.intersection.subscribe({
        onChanged: (intersection: any) => {
          // Only capture actual object intersections (not empty space)
          if (!resolved && intersection && intersection.object !== "intersectedobject.NONE") {
            resolved = true;
            clearTimeout(timeout);
            subscription?.cancel();
            resolve({
              x: intersection.position.x,
              y: intersection.position.y,
              z: intersection.position.z,
            });
          }
        },
      });
    });
  }

  /**
   * Navigate the camera to look at a specific 3D position.
   */
  async lookAtPosition(position: {
    x: number;
    y: number;
    z: number;
  }): Promise<void> {
    if (!this.sdk) return;

    try {
      // Get current camera pose to use as origin
      const pose = await this.sdk.Camera.getPose();
      await this.sdk.Camera.lookAtScreenCoords(
        pose.position.x,
        pose.position.y,
        pose.position.z,
        position.x,
        position.y,
        position.z
      );
    } catch {
      // Fallback: just try to move near the position
      try {
        await this.sdk.Sweep.moveTo(
          await this.findNearestSweep(position)
        );
      } catch {
        // Best effort — some SDK versions don't support all camera methods
        console.warn("Could not navigate to annotation position");
      }
    }
  }

  /**
   * Find the nearest sweep to a given 3D position.
   */
  private async findNearestSweep(position: {
    x: number;
    y: number;
    z: number;
  }): Promise<string> {
    const sweeps = await this.sdk.Sweep.data.get();
    let nearestId = "";
    let nearestDist = Infinity;

    for (const [id, sweep] of Object.entries<any>(sweeps)) {
      if (!sweep.position) continue;
      const dist = Math.sqrt(
        Math.pow(sweep.position.x - position.x, 2) +
          Math.pow(sweep.position.y - position.y, 2) +
          Math.pow(sweep.position.z - position.z, 2)
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = id;
      }
    }

    return nearestId;
  }

  getSdk(): any {
    return this.sdk;
  }

  destroy(): void {
    this.destroyed = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    window.removeEventListener("beforeunload", this.handleUnload);
    document.removeEventListener("visibilitychange", this.handleVisibility);

    // Final flush
    this.flush();
  }
}
