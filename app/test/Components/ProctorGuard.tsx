// app/test/Components/ProctorGuard.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProctorHeartbeat, type HeartbeatStatus } from "../Services/proctorHeartbeat";
import { VideoRecorder } from "../Services/videoRecorder";

type ProctorGuardProps = {
  /** Backend base URL, e.g. http://localhost:10000 */
  apiBase?: string;
  /** Required for /proctor/start */
  testId?: string | null;
  /** Required for /proctor/start */
  candidateId?: string | null;
  /** If you only have a token (before /tests/start), pass it to associate later; optional */
  token?: string | null;

  /** Send /proctor/heartbeat every N seconds */
  heartbeatIntervalSec?: number; // default 20
  /** Send /proctor/snapshot every M seconds */
  snapshotIntervalSec?: number; // default 30
  /** Enable frame uploads to backend */
  enableSnapshots?: boolean; // default true

  /** Show the local video preview UI */
  showPreview?: boolean; // default true
  /** Size of the preview box */
  previewWidth?: number; // default 240
  /** Corner placement for preview */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";

  /** NEW: Try to keep the page in fullscreen; soft enforcement (opt-in) */
  enforceFullscreen?: boolean; // default false (non-breaking)
  /** NEW: Show a faint watermark with candidate+test info (opt-in) */
  showWatermark?: boolean; // default false (non-breaking)
};

const DEFAULT_API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "http://localhost:10000"
).replace(/\/$/, "");

/**
 * ProctorGuard
 * - requests camera access
 * - starts a proctoring session on the backend
 * - sends periodic heartbeats and (optionally) image snapshots
 * - optional: deter screenshots (PrintScreen), react to visibility changes, fullscreen
 * - cleans up on unmount
 *
 * Enhancements:
 * - Integrates ProctorHeartbeat (singleton) for accurate camera health and resilient pings.
 * - Adds a watchdog to auto-recover the camera if a track ends or frames stall.
 * - No hardcoding: all endpoints derive from apiBase and props.
 */
export default function ProctorGuard({
  apiBase = DEFAULT_API_BASE,
  testId = null,
  candidateId = null,
  token = null,
  heartbeatIntervalSec = 20,
  snapshotIntervalSec = 30,
  enableSnapshots = true,
  showPreview = true,
  previewWidth = 240,
  position = "bottom-right",
  enforceFullscreen = false,
  showWatermark = false,
}: ProctorGuardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const hbRef = useRef<ProctorHeartbeat | null>(null);
  const lastFrameAtRef = useRef<number>(0); // used by watchdog
  const restartingRef = useRef<boolean>(false);
  const videoRecorderRef = useRef<VideoRecorder | null>(null);
  const recordingPromiseRef = useRef<Promise<Blob | null> | null>(null);
  const startVideoRecordingRef = useRef<(() => Promise<void>) | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "on" | "blocked" | "error">("idle");
  const [proctorError, setProctorError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null); // transient notices (e.g., screenshot attempt)
  const [videoStatus, setVideoStatus] = useState<"idle" | "recording" | "uploading" | "error">("idle");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const previewStyle = useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = {
      position: "fixed",
      zIndex: 50,
      width: previewWidth,
      aspectRatio: "4 / 3",
      borderRadius: 12,
      overflow: "hidden",
      background: "#000",
      boxShadow: "0 8px 30px rgba(0,0,0,.2)",
      border: "1px solid rgba(0,0,0,.1)",
    };
    const margin = 16;
    switch (position) {
      case "top-left":
        return { ...base, top: margin, left: margin };
      case "top-right":
        return { ...base, top: margin, right: margin };
      case "bottom-left":
        return { ...base, bottom: margin, left: margin };
      default:
        return { ...base, bottom: margin, right: margin };
    }
  }, [position, previewWidth]);

  // --- Helpers ---------------------------------------------------------------

  const attachFrameListener = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;

    // @ts-ignore experimental types - requestVideoFrameCallback
    if ("requestVideoFrameCallback" in v) {
      let id: number | null = null;
      const loop = (now: number) => {
        lastFrameAtRef.current = now;
        // @ts-ignore experimental
        id = v.requestVideoFrameCallback(loop);
      };
      // kick it off
      // @ts-ignore experimental
      id = v.requestVideoFrameCallback(loop);

      // cleanup on detach
      return () => {
        try {
          if (id && "cancelVideoFrameCallback" in v) {
            // @ts-ignore experimental
            v.cancelVideoFrameCallback(id);
          }
        } catch {}
      };
    } else {
      const onTimeUpdate = () => {
        lastFrameAtRef.current = performance.now();
      };
      v.addEventListener("timeupdate", onTimeUpdate);
      return () => v.removeEventListener("timeupdate", onTimeUpdate);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraStatus("idle");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play(); // may be blocked if not user-initiated; best-effort
        } catch {}
      }

      setCameraStatus("on");
      return true;
    } catch (err: any) {
      console.error("ProctorGuard: camera error", err);
      setCameraStatus(err?.name === "NotAllowedError" ? "blocked" : "error");
      setProctorError(err?.message || "Camera access failed");
      return false;
    }
  }, []);

  const restartCameraIfNeeded = useCallback(async () => {
    if (restartingRef.current) return;
    const s = streamRef.current;
    const video = videoRef.current;

    const hasLiveTrack =
      !!s && s.getVideoTracks?.().some((t) => t.readyState === "live");

    const frameIsFresh =
      Number.isFinite(lastFrameAtRef.current) &&
      performance.now() - lastFrameAtRef.current < Math.max(heartbeatIntervalSec * 1000 * 2, 8000);

    // If no live track or frames stale while tab is visible & focused — try restart once.
    if ((!hasLiveTrack || !frameIsFresh) && document.visibilityState === "visible" && document.hasFocus()) {
      try {
        restartingRef.current = true;
        // ✅ Stop video recording before restarting camera
        if (videoRecorderRef.current?.isActive()) {
          await videoRecorderRef.current.stop();
        }

        // stop old tracks first
        try {
          s?.getTracks?.().forEach((t) => t.stop());
        } catch {}
        streamRef.current = null;
        if (video) (video as HTMLVideoElement).srcObject = null;

        const ok = await startCamera();
        if (ok) {
          // ✅ Restart video recording with new stream
          await startVideoRecordingRef.current?.();

          // re-hook heartbeat media (if running)
          if (hbRef.current) {
            hbRef.current.setMedia({ stream: streamRef.current, videoEl: videoRef.current });
          }
          setNotice("Camera recovered and recording resumed.");
          window.setTimeout(() => setNotice(null), 1200);
        }
      } finally {
        restartingRef.current = false;
      }
    }
  }, [heartbeatIntervalSec, startCamera]);

  const stopCamera = useCallback(() => {
    try {
      const s = streamRef.current;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        (videoRef.current as HTMLVideoElement).srcObject = null;
      }
      setCameraStatus("idle");
    } catch {
      // ignore
    }
  }, []);

  const startSession = useCallback(async () => {
    if (!testId || !candidateId) {
      // We need both to bind session server-side
      setProctorError("Missing testId or candidateId for proctor session.");
      return null;
    }
    setStarting(true);
    try {
      const res = await fetch(`${apiBase}/proctor/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_id: testId, candidate_id: candidateId, token: token ?? undefined }),
        keepalive: true,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed to start proctor: ${res.status}`);
      }
      const data = (await res.json()) as { session_id: string; started_at: string };
      setSessionId(data.session_id);
      setProctorError(null);
      return data.session_id;
    } catch (e: any) {
      console.error("ProctorGuard: start session error:", e);
      setProctorError(e?.message || "Failed to start proctoring session");
      return null;
    } finally {
      setStarting(false);
    }
  }, [apiBase, testId, candidateId, token]);

  // kept for compatibility (not used when ProctorHeartbeat is active)
  const sendHeartbeat = useCallback(
    async (visible: boolean, focused: boolean) => {
      if (!sessionId) return;
      try {
        await fetch(`${apiBase}/proctor/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            page_visible: visible,
            focused,
          }),
          keepalive: true,
        });
      } catch {
        // non-fatal
      }
    },
    [apiBase, sessionId]
  );

  const captureAndUploadSnapshot = useCallback(async () => {
    if (!enableSnapshots || !sessionId) return;
    const video = videoRef.current;
    if (!video) return;

    const w = (video as HTMLVideoElement).videoWidth || 640;
    const h = (video as HTMLVideoElement).videoHeight || 480;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video as HTMLVideoElement, 0, 0, w, h);

    try {
      const dataURL = canvas.toDataURL("image/jpeg", 0.7); // ~70% quality
      const res = await fetch(`${apiBase}/proctor/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          image_base64: dataURL, // backend accepts dataURL or raw b64
          width: w,
          height: h,
          taken_at: new Date().toISOString(),
          candidate_token: token ?? undefined,
        }),
        keepalive: true,
      });
      if (!res.ok) {
        // not fatal
        console.warn("ProctorGuard: snapshot failed", await res.text());
      }
    } catch {
      // ignore network flakiness; try again at next interval
    }
  }, [apiBase, enableSnapshots, sessionId, token]);

  const endSession = useCallback(
    async (reason: string) => {
      if (!sessionId) return;
      try {
        await fetch(`${apiBase}/proctor/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, reason, candidate_token: token ?? undefined }),
          keepalive: true,
        });
      } catch {
        // ignore
      }
    },
    [apiBase, sessionId, token]
  );

  // ✅ Stop recording and finalize chunked upload
  const stopAndUploadVideo = useCallback(async () => {
    if (!videoRecorderRef.current || !videoRecorderRef.current.isActive()) {
      return;
    }

    try {
      setVideoStatus("idle");
      setVideoStatus("uploading");
      setUploadProgress(0);
      await videoRecorderRef.current.stop();
      setUploadProgress(100);
      console.log("ProctorGuard: Video uploaded successfully");
    } catch (error: any) {
      setVideoStatus("error");
      setVideoError(error?.message || "Video upload failed");
      console.error("ProctorGuard: Video upload error", error);
    } finally {
      if (videoStatus === "uploading") {
        window.setTimeout(() => setVideoStatus("idle"), 2000);
      }
    }
  }, [videoStatus]);

  // ✅ NEW: Start video recording
  const startVideoRecording = useCallback(async () => {
    if (!streamRef.current) {
      console.warn("ProctorGuard: No media stream available for video recording");
      return;
    }

    try {
      const recorder = new VideoRecorder({
        uploadUrl: `${apiBase}/proctor/video/upload`,
        onStart: () => {
          setVideoStatus("recording");
          setVideoError(null);
        },
        onUploadProgress: (percent) => {
          setUploadProgress(percent);
        },
        onError: (error) => {
          setVideoStatus("error");
          setVideoError(error.message);
          console.error("VideoRecorder error:", error);
        },
      });

      videoRecorderRef.current = recorder;
      if (sessionId && testId && candidateId) {
        recorder.startStreamingSession(sessionId, testId, candidateId, token ?? "");
      }
      const started = recorder.start(streamRef.current);

      if (!started) {
        setVideoStatus("error");
        setVideoError("Failed to start video recording");
      }
    } catch (error: any) {
      setVideoStatus("error");
      setVideoError(error?.message || "Failed to initialize video recorder");
      console.error("ProctorGuard: Video recorder init error", error);
    }
  }, [apiBase, sessionId, testId, candidateId, token]);

  useEffect(() => {
    startVideoRecordingRef.current = startVideoRecording;
    return () => {
      startVideoRecordingRef.current = null;
    };
  }, [startVideoRecording]);

  // --- Optional fullscreen ---------------------------------------------------
  const requestFullscreen = useCallback(async () => {
    if (!enforceFullscreen) return;
    try {
      const el = document.documentElement as any;
      if (!document.fullscreenElement && el?.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch {
      // ignore; browsers may block
    }
  }, [enforceFullscreen]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && (document as any).exitFullscreen) {
        await (document as any).exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  // --- Lifecycle -------------------------------------------------------------

  // Start camera + session on mount
  useEffect(() => {
    let cancelled = false;
    let detachFrame: (() => void) | undefined;

    (async () => {
      if (enforceFullscreen) {
        await requestFullscreen();
      }

      const camOk = await startCamera();
      if (!camOk || cancelled) return;

      // start observing frames for watchdog
      detachFrame = attachFrameListener();

      const sid = await startSession();
      if (!sid || cancelled) return;

      // ✅ Start video recording once session is established
      await startVideoRecording();
    })();

    return () => {
      cancelled = true;
      try { detachFrame?.(); } catch {}
    };
  }, [startCamera, startSession, requestFullscreen, enforceFullscreen, attachFrameListener, startVideoRecording]);

  // Instantiate + run ProctorHeartbeat once we have a session and a stream
  useEffect(() => {
    if (!sessionId || !videoRef.current) return;

    // (Re)create heartbeat instance whenever session or apiBase changes
    if (hbRef.current) {
      try { hbRef.current.stop(); } catch {}
      hbRef.current = null;
    }

    const hb = new ProctorHeartbeat({
      url: `${apiBase}/proctor/heartbeat`,
      intervalMs: Math.max(5, heartbeatIntervalSec) * 1000,
      onStatusChange: (s: HeartbeatStatus) => {
        // map hb status to our UI
        setCameraStatus(s === "idle" ? "idle" : "on");
        if (s === "degraded") {
          setNotice("Camera health degraded (background or stalled).");
          window.setTimeout(() => setNotice(null), 1400);
        }
      },
      // include session_id to match backend shape; other fields are additional but harmless
      extra: { session_id: sessionId, candidate_token: token ?? undefined },
    });

    hb.setIdentity({ testSessionId: sessionId, userId: candidateId ?? undefined });
    hb.setMedia({ stream: streamRef.current, videoEl: videoRef.current });
    hb.start();

    hbRef.current = hb;

    return () => {
      try { hb.stop(); } catch {}
      hbRef.current = null;
    };
  }, [sessionId, apiBase, heartbeatIntervalSec, candidateId, token]);

  // Watchdog to auto-recover camera if track ends or frames stall
  useEffect(() => {
    let alive = true;
    const interval = window.setInterval(() => {
      if (!alive) return;
      restartCameraIfNeeded();
    }, Math.max(heartbeatIntervalSec * 1000, 8000));
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [restartCameraIfNeeded, heartbeatIntervalSec]);

  // Legacy heartbeat (kept for compatibility) — disabled when ProctorHeartbeat is active
  useEffect(() => {
    if (!sessionId) return;
    if (hbRef.current) return; // ProctorHeartbeat is authoritative

    let alive = true;
    const send = () =>
      sendHeartbeat(document.visibilityState === "visible", document.hasFocus());

    // initial ping
    send();

    const id = window.setInterval(() => alive && send(), Math.max(5, heartbeatIntervalSec) * 1000);

    // also on visibility/focus changes
    const onVis = () => {
      send();
      // soft deterrent: if tab hidden, take a quick snapshot (if enabled)
      if (enableSnapshots && document.visibilityState !== "visible") {
        captureAndUploadSnapshot();
        setNotice("The test tab was hidden. Please keep it visible.");
        window.setTimeout(() => setNotice(null), 1600);
      }
    };
    const onFocus = () => send();
    const onBlur = () => {
      send();
      if (enableSnapshots) captureAndUploadSnapshot();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, [sessionId, heartbeatIntervalSec, sendHeartbeat, captureAndUploadSnapshot, enableSnapshots]);

  // Snapshot interval
  useEffect(() => {
    if (!sessionId || !enableSnapshots) return;
    let alive = true;
    const id = window.setInterval(
      () => alive && captureAndUploadSnapshot(),
      Math.max(10, snapshotIntervalSec) * 1000
    );
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [sessionId, enableSnapshots, snapshotIntervalSec, captureAndUploadSnapshot]);

  // ✅ Listen for suspicious activity events and auto-capture screenshots
  useEffect(() => {
    const handleSuspiciousActivity = (event: CustomEvent) => {
      const activityType = event.detail?.type;
      if (enableSnapshots && sessionId) {
        // Auto-capture screenshot on suspicious activity
        captureAndUploadSnapshot();
        
        // Log suspicious activity
        console.warn("Suspicious activity detected:", activityType, event.detail);
      }
    };

    window.addEventListener("proctor-suspicious-activity" as any, handleSuspiciousActivity as EventListener);
    return () => {
      window.removeEventListener("proctor-suspicious-activity" as any, handleSuspiciousActivity as EventListener);
    };
  }, [enableSnapshots, sessionId, captureAndUploadSnapshot]);

  // Cleanup on page unload + unmount
  useEffect(() => {
    const onBeforeUnload = () => {
      // Stop video recording and upload on unload
      stopAndUploadVideo();

      // best-effort end (keepalive=true)
      endSession("page_unload");
      try { hbRef.current?.stop(); } catch {}
      stopCamera();
      if (enforceFullscreen) {
        exitFullscreen();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      onBeforeUnload();
      window.removeEventListener("beforeunload", onBeforeUnload as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endSession, stopCamera, exitFullscreen, enforceFullscreen, stopAndUploadVideo]);

  // PrintScreen detection + best-effort clipboard clear (+ snapshot)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = (e.key || "").toLowerCase();
      if (key === "printscreen") {
        // Best-effort to overwrite clipboard (not guaranteed)
        try {
          (navigator as any).clipboard?.writeText?.(" ").catch(() => {});
        } catch {}
        if (enableSnapshots) {
          captureAndUploadSnapshot();
        }
        setNotice("Screenshots are not allowed.");
        window.setTimeout(() => setNotice(null), 1600);
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return true;
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true } as any);
  }, [captureAndUploadSnapshot, enableSnapshots]);

  // If the user exits fullscreen (soft enforcement), nudge & try to re-enter
  useEffect(() => {
    if (!enforceFullscreen) return;
    const onFsChange = async () => {
      if (!document.fullscreenElement) {
        setNotice("Please stay in fullscreen during the test.");
        window.setTimeout(() => setNotice(null), 1600);
        // try to re-enter (user may need to interact again)
        await requestFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [enforceFullscreen, requestFullscreen]);

  // --- UI -------------------------------------------------------------------

  return (
    <>
      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* hidden canvas for snapshot encoding */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {showPreview && (
        <div style={previewStyle} aria-label="proctoring-preview">
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              left: 8,
              bottom: 8,
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 11,
              background:
                cameraStatus === "on"
                  ? "rgba(16,185,129,.9)" // green
                  : cameraStatus === "blocked"
                  ? "rgba(239,68,68,.9)" // red
                  : "rgba(234,179,8,.9)", // amber
              color: "#fff",
            }}
            title={
              cameraStatus === "on"
                ? "Camera active"
                : cameraStatus === "blocked"
                ? "Camera blocked by the user"
                : cameraStatus === "error"
                ? "Camera error"
                : "Starting camera…"
            }
          >
            {starting ? "Starting…" : cameraStatus === "on" ? "Recording" : cameraStatus}
          </div>

          {/* ✅ Video Recording Status Indicator */}
          {videoStatus !== "idle" && (
            <div
              style={{
                position: "absolute",
                right: 8,
                top: 8,
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: "bold",
                background:
                  videoStatus === "recording"
                    ? "rgba(239, 68, 68, 0.9)" // red with pulse for recording
                    : videoStatus === "uploading"
                    ? "rgba(59, 130, 246, 0.9)" // blue for uploading
                    : "rgba(239, 68, 68, 0.9)", // red for error
                color: "#fff",
                animation: videoStatus === "recording" ? "pulse 1.5s infinite" : "none",
              }}
              title={videoStatus}
            >
              {videoStatus === "recording" && "● RECORDING"}
              {videoStatus === "uploading" && `UPLOADING ${uploadProgress}%`}
              {videoStatus === "error" && "VIDEO ERROR"}
            </div>
          )}
        </div>
      )}

      {/* Optional watermark overlay */}
      {showWatermark && candidateId && testId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 40,
            background: "transparent",
          }}
          aria-hidden
        >
          <div
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              opacity: 0.25,
              fontSize: 12,
              color: "#111",
              background: "rgba(255,255,255,.6)",
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,.08)",
              userSelect: "none",
              mixBlendMode: "multiply",
            }}
          >
            Candidate: {candidateId} &nbsp;|&nbsp; Test: {testId} &nbsp;|&nbsp; {new Date().toLocaleString()}
          </div>
        </div>
      )}

      {/* Minimal, non-intrusive error hint (kept invisible unless needed) */}
      {proctorError && (
        <div
          style={{
            position: "fixed",
            left: 16,
            bottom: 16,
            zIndex: 50,
            background: "rgba(239,68,68,.95)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 10,
            boxShadow: "0 8px 30px rgba(0,0,0,.25)",
            maxWidth: 360,
            fontSize: 13,
          }}
        >
          Proctoring: {proctorError}
        </div>
      )}

      {/* ✅ Video Error Indicator */}
      {videoError && (
        <div
          style={{
            position: "fixed",
            left: 16,
            bottom: proctorError ? 80 : 16,
            zIndex: 50,
            background: "rgba(239,68,68,.95)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 10,
            boxShadow: "0 8px 30px rgba(0,0,0,.25)",
            maxWidth: 360,
            fontSize: 13,
          }}
        >
          Video Recording: {videoError}
        </div>
      )}

      {/* Transient notices (e.g., screenshot attempt, tab hidden) */}
      {notice && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            zIndex: 60,
            background: "rgba(17,24,39,.9)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 999,
            fontSize: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,.25)",
          }}
        >
          {notice}
        </div>
      )}
    </>
  );
}
