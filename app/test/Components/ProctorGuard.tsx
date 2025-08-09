// app/test/Components/ProctorGuard.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
};

/**
 * ProctorGuard
 * - requests camera access
 * - starts a proctoring session on the backend
 * - sends periodic heartbeats and (optionally) image snapshots
 * - cleans up on unmount
 */
export default function ProctorGuard({
  apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:10000",
  testId = null,
  candidateId = null,
  token = null,
  heartbeatIntervalSec = 20,
  snapshotIntervalSec = 30,
  enableSnapshots = true,
  showPreview = true,
  previewWidth = 240,
  position = "bottom-right",
}: ProctorGuardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "on" | "blocked" | "error">("idle");
  const [proctorError, setProctorError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

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

  const startCamera = useCallback(async () => {
    try {
      setCameraStatus("idle");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
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

  const stopCamera = useCallback(() => {
    try {
      const s = streamRef.current;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraStatus("idle");
    } catch (e) {
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
        body: JSON.stringify({ test_id: testId, candidate_id: candidateId }),
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
  }, [apiBase, testId, candidateId]);

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

    // Ensure we have some dimensions
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

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
        }),
        keepalive: true,
      });
      if (!res.ok) {
        // not fatal
        console.warn("ProctorGuard: snapshot failed", await res.text());
      }
    } catch (e) {
      // ignore network flakiness; try again at next interval
    }
  }, [apiBase, enableSnapshots, sessionId]);

  const endSession = useCallback(async (reason: string) => {
    if (!sessionId) return;
    try {
      await fetch(`${apiBase}/proctor/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, reason }),
        keepalive: true,
      });
    } catch {
      // ignore
    }
  }, [apiBase, sessionId]);

  // --- Lifecycle -------------------------------------------------------------

  // Start camera + session on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const camOk = await startCamera();
      if (!camOk || cancelled) return;

      const sid = await startSession();
      if (!sid || cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [startCamera, startSession]);

  // Heartbeat interval
  useEffect(() => {
    if (!sessionId) return;

    let alive = true;
    const send = () =>
      sendHeartbeat(document.visibilityState === "visible", document.hasFocus());

    // initial ping
    send();

    const id = window.setInterval(() => alive && send(), Math.max(5, heartbeatIntervalSec) * 1000);

    // also on visibility/focus changes
    const onVis = () => send();
    const onFocus = () => send();
    const onBlur = () => send();

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
  }, [sessionId, heartbeatIntervalSec, sendHeartbeat]);

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

  // Cleanup on page unload + unmount
  useEffect(() => {
    const onBeforeUnload = () => {
      // best-effort end (keepalive=true)
      endSession("page_unload");
      stopCamera();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      onBeforeUnload();
      window.removeEventListener("beforeunload", onBeforeUnload);
    };

    // NOTE: intentionally calling onBeforeUnload in cleanup to ensure we end.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endSession, stopCamera]);

  // --- UI -------------------------------------------------------------------

  return (
    <>
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
    </>
  );
}
