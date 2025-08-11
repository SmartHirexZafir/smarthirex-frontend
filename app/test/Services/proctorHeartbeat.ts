// frontend/app/test/Services/proctorHeartbeat.ts
/**
 * ProctorHeartbeat
 * ----------------
 * A lightweight heartbeat client that:
 *  - Checks camera/media stream health (track.readyState, stalled frames).
 *  - Reports tab visibility/focus + page URL.
 *  - Uses navigator.sendBeacon during pagehide/unload; falls back to fetch.
 *  - Debounces rapid changes and applies exponential backoff on failures.
 *
 * Typical backend endpoint shape (FastAPI):
 *   POST /proctor/heartbeat
 *   { testSessionId, userId, ts, focus, visible, camera: {...}, pageUrl, extra }
 */

type Json = Record<string, unknown>;

export type HeartbeatStatus = "ok" | "degraded" | "idle" | "error";

export interface ProctorHeartbeatOptions {
  /** Heartbeat endpoint (relative or absolute). */
  url?: string; // default: "/proctor/heartbeat"
  /** How often to ping when everything is healthy (ms). */
  intervalMs?: number; // default: 5000
  /** Max backoff between retries (ms). */
  maxBackoffMs?: number; // default: 30000
  /** Request timeout for fetch pings (ms). */
  requestTimeoutMs?: number; // default: 3500
  /** Extra payload fields to include on every heartbeat. */
  extra?: Json;
  /** Callback on computed status change (optional). */
  onStatusChange?: (status: HeartbeatStatus) => void;
  /** Provide a custom fetch implementation (for tests). */
  fetchImpl?: typeof fetch;
}

export interface IdentityParams {
  testSessionId: string;
  userId?: string;
}

export interface MediaParams {
  stream?: MediaStream | null;
  videoEl?: HTMLVideoElement | null;
}

type InternalState = {
  running: boolean;
  stream?: MediaStream | null;
  videoEl?: HTMLVideoElement | null;
  testSessionId?: string;
  userId?: string;
  timer?: number;
  backoffMs: number;
  lastFrameTs?: number; // monotonic timestamp when a new frame was observed
  lastStatus?: HeartbeatStatus;
};

export class ProctorHeartbeat {
  private opts: Required<Omit<ProctorHeartbeatOptions, "onStatusChange" | "fetchImpl" | "extra">> &
    Pick<ProctorHeartbeatOptions, "onStatusChange" | "fetchImpl" | "extra">;
  private st: InternalState;

  constructor(options: ProctorHeartbeatOptions = {}) {
    this.opts = {
      url: options.url ?? "/proctor/heartbeat",
      intervalMs: options.intervalMs ?? 5000,
      maxBackoffMs: options.maxBackoffMs ?? 30000,
      requestTimeoutMs: options.requestTimeoutMs ?? 3500,
      onStatusChange: options.onStatusChange,
      fetchImpl: options.fetchImpl,
      extra: options.extra,
    };

    this.st = {
      running: false,
      backoffMs: this.opts.intervalMs,
    };

    // Bindings
    this._onVisibility = this._onVisibility.bind(this);
    this._onPageHide = this._onPageHide.bind(this);
    this._tick = this._tick.bind(this);
    this._attachVideoCallbacks = this._attachVideoCallbacks.bind(this);
  }

  /** Provide/replace identity fields */
  setIdentity(params: IdentityParams) {
    this.st.testSessionId = params.testSessionId;
    this.st.userId = params.userId;
  }

  /** Provide/replace media references */
  setMedia(params: MediaParams) {
    this.st.stream = params.stream ?? null;
    this.st.videoEl = params.videoEl ?? null;
    this._attachVideoCallbacks();
  }

  /** Start the heartbeat loop */
  start() {
    if (this.st.running) return;
    this.st.running = true;

    // Visibility + lifecycle listeners
    document.addEventListener("visibilitychange", this._onVisibility, { passive: true });
    window.addEventListener("pagehide", this._onPageHide);
    window.addEventListener("beforeunload", this._onPageHide);

    // If we have a video element, start frame observation
    this._attachVideoCallbacks();

    // Kick the loop
    this._queueNext(0);
  }

  /** Stop the heartbeat loop and remove listeners */
  stop() {
    if (!this.st.running) return;
    this.st.running = false;

    if (this.st.timer) {
      window.clearTimeout(this.st.timer);
      this.st.timer = undefined;
    }

    document.removeEventListener("visibilitychange", this._onVisibility);
    window.removeEventListener("pagehide", this._onPageHide);
    window.removeEventListener("beforeunload", this._onPageHide);

    // Detach rVFC if present
    if (this.st.videoEl && "cancelVideoFrameCallback" in this.st.videoEl) {
      try {
        // @ts-ignore experimental
        this.st.videoEl.cancelVideoFrameCallback?.(this._rVfcId!);
      } catch {}
    }
  }

  // ---------- Internal ----------

  private _rVfcId: number | null = null;

  private _attachVideoCallbacks() {
    const v = this.st.videoEl;
    if (!v) return;

    // Modern browsers: requestVideoFrameCallback (rVFC).
    const hasRVFC = "requestVideoFrameCallback" in v;
    if (hasRVFC) {
      const loop = (now: number /* DOMHighResTimeStamp */) => {
        this.st.lastFrameTs = now;
        // @ts-ignore experimental
        this._rVfcId = v.requestVideoFrameCallback(loop);
      };
      // Cancel previous loop if any
      if (this._rVfcId && "cancelVideoFrameCallback" in v) {
        try {
          // @ts-ignore experimental
          v.cancelVideoFrameCallback(this._rVfcId);
        } catch {}
      }
      // @ts-ignore experimental
      this._rVfcId = v.requestVideoFrameCallback(loop);
    } else {
      // Fallback: periodically sample readyState/timeupdate
      const onTimeUpdate = () => {
        this.st.lastFrameTs = performance.now();
      };
      v.removeEventListener("timeupdate", onTimeUpdate); // avoid doubles
      v.addEventListener("timeupdate", onTimeUpdate);
    }
  }

  private _onVisibility() {
    // Send an immediate ping on visibility changes (foreground/background swap).
    this._queueNext(50);
  }

  private _onPageHide() {
    // Best-effort final beacon.
    this._send(true).catch(() => {
      /* ignore – page is closing */
    });
  }

  private _queueNext(ms: number) {
    if (!this.st.running) return;
    if (this.st.timer) window.clearTimeout(this.st.timer);
    this.st.timer = window.setTimeout(this._tick, ms);
  }

  private async _tick() {
    if (!this.st.running) return;
    const ok = await this._send(false);
    // Adjust schedule
    if (ok) {
      this.st.backoffMs = this.opts.intervalMs;
    } else {
      // exponential backoff up to max
      this.st.backoffMs = Math.min(
        this.st.backoffMs * 2,
        this.opts.maxBackoffMs
      );
    }
    this._queueNext(this.st.backoffMs);
  }

  private _computeCameraStatus(): {
    status: HeartbeatStatus;
    details: Json;
  } {
    const stream = this.st.stream ?? undefined;
    const videoEl = this.st.videoEl ?? undefined;

    const visible = !document.hidden;
    const focus = document.hasFocus();

    let videoTracks = 0;
    let audioTracks = 0;
    let liveTracks = 0;

    if (stream) {
      const vts = stream.getVideoTracks?.() ?? [];
      const ats = stream.getAudioTracks?.() ?? [];
      videoTracks = vts.length;
      audioTracks = ats.length;
      liveTracks = [...vts, ...ats].filter((t) => t.readyState === "live").length;
    }

    // Is video producing frames?
    const now = performance.now();
    const frameAge = this.st.lastFrameTs ? now - this.st.lastFrameTs : Infinity;

    // Heuristics:
    //  - ok: at least one live video track AND recent frame within 2 intervals
    //  - degraded: live track but no recent frame OR tab not visible/focused
    //  - idle: no live tracks (ended or missing)
    let status: HeartbeatStatus = "idle";
    if (liveTracks > 0 && videoTracks > 0) {
      const frameRecent = frameAge < this.opts.intervalMs * 2;
      if (frameRecent && visible && focus) status = "ok";
      else status = "degraded";
    } else {
      status = "idle";
    }

    return {
      status,
      details: {
        visible,
        focus,
        videoTracks,
        audioTracks,
        liveTracks,
        frameAgeMs: isFinite(frameAge) ? Math.round(frameAge) : null,
        readyState: videoEl ? (videoEl.readyState ?? null) : null,
      },
    };
  }

  private async _send(useBeacon: boolean): Promise<boolean> {
    const { status, details } = this._computeCameraStatus();

    // Fire status change callback if needed
    if (status !== this.st.lastStatus) {
      this.st.lastStatus = status;
      this.opts.onStatusChange?.(status);
    }

    const payload: Json = {
      testSessionId: this.st.testSessionId,
      userId: this.st.userId,
      ts: new Date().toISOString(),
      pageUrl: location.href,
      status, // "ok" | "degraded" | "idle"
      camera: details,
      extra: this.opts.extra ?? {},
    };

    // If identity is missing, still report (backend can reject/ignore).
    const body = JSON.stringify(payload);

    // Prefer Beacon for background/unload events
    if (useBeacon && "sendBeacon" in navigator) {
      try {
        const ok = navigator.sendBeacon(this.opts.url, new Blob([body], { type: "application/json" }));
        return ok;
      } catch {
        // fallthrough to fetch
      }
    }

    // Fetch with timeout
    const controller = new AbortController();
    const to = window.setTimeout(() => controller.abort(), this.opts.requestTimeoutMs);
    try {
      const impl = this.opts.fetchImpl ?? fetch;
      const resp = await impl(this.opts.url, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true, // allow on unload in some browsers
        signal: controller.signal,
      });
      return resp.ok;
    } catch {
      return false;
    } finally {
      window.clearTimeout(to);
    }
  }
}

/* ===========================
   Minimal usage example
   ===========================
   const hb = new ProctorHeartbeat({
     url: "/proctor/heartbeat",
     intervalMs: 5000,
     onStatusChange: (s) => console.log("HB status:", s),
   });

   hb.setIdentity({ testSessionId: sessionId, userId });
   hb.setMedia({ stream, videoEl });
   hb.start();

   // Later:
   // hb.stop();
*/
