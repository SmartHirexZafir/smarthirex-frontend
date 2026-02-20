// frontend/app/test/Services/videoRecorder.ts
/**
 * VideoRecorder
 * ----------------
 * Manages MediaRecorder for continuous video recording during test proctoring.
 * Features:
 *  - Auto-starts recording when stream is available
 *  - Handles stream track end/errors gracefully
 *  - Auto-stops on session end with proper cleanup
 *  - Uploads video blob to backend via multipart FormData
 *  - Provides progress callbacks for UI feedback
 *  - Implements chunking for large videos
 *  - Memory-efficient blob cleanup
 */

export interface VideoRecorderOptions {
  /** Backend endpoint for video upload (relative or absolute). */
  uploadUrl?: string; // default: "/proctor/video/upload"
  /** MIME type for recording (e.g., "video/webm;codecs=vp8,opus"). */
  mimeType?: string; // default: auto-detect
  /** Audio bitrate (bps). */
  audioBitsPerSecond?: number; // default: 128000
  /** Video bitrate (bps). */
  videoBitsPerSecond?: number; // default: 2500000
  /** Callback on recording start. */
  onStart?: () => void;
  /** Callback on data available (chunks recorded). */
  onDataAvailable?: (sizeBytes: number) => void;
  /** Callback on upload progress (0-100). */
  onUploadProgress?: (percent: number) => void;
  /** Callback on recording stop. */
  onStop?: (sizeBytes: number) => void;
  /** Callback on error. */
  onError?: (error: Error) => void;
  /** Request timeout for upload (ms). */
  uploadTimeoutMs?: number; // default: 120000 (2 mins)
  /** Provide custom fetch implementation (for tests). */
  fetchImpl?: typeof fetch;
}

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private opts: Required<Omit<VideoRecorderOptions, "onStart" | "onDataAvailable" | "onUploadProgress" | "onStop" | "onError" | "fetchImpl">> &
    Pick<VideoRecorderOptions, "onStart" | "onDataAvailable" | "onUploadProgress" | "onStop" | "onError" | "fetchImpl">;
  private isRecording = false;
  private uploadInProgress = false;
  private recordingSizeBytes = 0;
  private uploadAbortController: AbortController | null = null;
  private uploadId: string | null = null;
  private finalized = false;
  private pendingChunkUploads = new Set<Promise<boolean>>();
  private sessionCtx: {
    sessionId: string;
    testId: string;
    candidateId: string;
    candidateToken: string;
  } | null = null;

  constructor(options: VideoRecorderOptions = {}) {
    this.opts = {
      uploadUrl: options.uploadUrl ?? "/proctor/video/upload",
      mimeType: options.mimeType ?? this._getDefaultMimeType(),
      audioBitsPerSecond: options.audioBitsPerSecond ?? 128000,
      videoBitsPerSecond: options.videoBitsPerSecond ?? 2500000,
      onStart: options.onStart,
      onDataAvailable: options.onDataAvailable,
      onUploadProgress: options.onUploadProgress,
      onStop: options.onStop,
      onError: options.onError,
      uploadTimeoutMs: options.uploadTimeoutMs ?? 120000,
      fetchImpl: options.fetchImpl,
    };

    // Bindings
    this._onDataAvailable = this._onDataAvailable.bind(this);
    this._onError = this._onError.bind(this);
    this._onStop = this._onStop.bind(this);
  }

  /** Start recording from a MediaStream */
  start(stream: MediaStream): boolean {
    if (this.isRecording) {
      console.warn("VideoRecorder: Already recording");
      return false;
    }

    try {
      const options: MediaRecorderOptions = {
        mimeType: this.opts.mimeType,
        audioBitsPerSecond: this.opts.audioBitsPerSecond,
        videoBitsPerSecond: this.opts.videoBitsPerSecond,
      };

      this.mediaRecorder = new MediaRecorder(stream, options);
      this.recordingSizeBytes = 0;
      this.uploadId = null;
      this.finalized = false;
      this.isRecording = true;

      // Attach event handlers
      this.mediaRecorder.ondataavailable = this._onDataAvailable;
      this.mediaRecorder.onerror = this._onError;
      this.mediaRecorder.onstop = this._onStop;

      // Start recording
      this.mediaRecorder.start(5000); // Collect data every 5 seconds

      this.opts.onStart?.();
      console.log("VideoRecorder: Recording started");
      return true;
    } catch (error: any) {
      this.isRecording = false;
      const err = new Error(`Failed to start recording: ${error?.message || error}`);
      this.opts.onError?.(err);
      console.error(err);
      return false;
    }
  }

  startStreamingSession(sessionId: string, testId: string, candidateId: string, candidateToken: string) {
    this.sessionCtx = { sessionId, testId, candidateId, candidateToken };
  }

  /** Stop recording and finalize server-side upload */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve();
        return;
      }

      const onStopFinal = async () => {
        this.isRecording = false;
        await this._flushPendingUploads();
        await this._finalizeUpload();
        this.opts.onStop?.(this.recordingSizeBytes);
        console.log(`VideoRecorder: Recording stopped. Size: ${(this.recordingSizeBytes / 1024 / 1024).toFixed(2)} MB`);
        resolve();
      };

      // Temporarily override onstop to capture final state
      const originalOnStop = this.mediaRecorder!.onstop;
      this.mediaRecorder!.onstop = () => {
        if (originalOnStop) {
          originalOnStop.call(this.mediaRecorder as MediaRecorder, new Event("stop"));
        }
        onStopFinal().catch((e) => {
          const err = new Error(`Stop/finalize error: ${String((e as any)?.message || e)}`);
          this.opts.onError?.(err);
          resolve();
        });
      };

      try {
        this.mediaRecorder!.requestData();
      } catch {
        // ignore if recorder state does not allow requestData
      }
      this.mediaRecorder!.stop();
    });
  }

  /** Legacy upload path retained for compatibility. */
  async upload(blob: Blob, sessionId: string, testId: string, candidateId: string, candidateToken: string): Promise<boolean> {
    if (this.uploadInProgress) {
      console.warn("VideoRecorder: Upload already in progress");
      return false;
    }

    if (!blob || blob.size === 0) {
      const err = new Error("No video blob to upload");
      this.opts.onError?.(err);
      return false;
    }

    this.uploadInProgress = true;
    this.uploadAbortController = new AbortController();

    try {
      this.startStreamingSession(sessionId, testId, candidateId, candidateToken);
      const CHUNK_SIZE = 2 * 1024 * 1024;
      for (let offset = 0; offset < blob.size; offset += CHUNK_SIZE) {
        const part = blob.slice(offset, Math.min(offset + CHUNK_SIZE, blob.size), blob.type || "video/webm");
        const ok = await this._uploadChunk(part);
        if (!ok) throw new Error("Chunk upload failed");
      }
      await this._finalizeUpload();
      this.opts.onUploadProgress?.(100);
      return true;
    } catch (error: any) {
      const err = new Error(`Upload error: ${error?.message || error}`);
      this.opts.onError?.(err);
      console.error(err);
      return false;
    } finally {
      this.uploadInProgress = false;
      this.uploadAbortController = null;
    }
  }

  /** Cancel ongoing upload */
  cancelUpload(): void {
    this.uploadAbortController?.abort();
    this.uploadAbortController = null;
  }

  /** Get current recording state */
  isActive(): boolean {
    return this.isRecording;
  }

  /** Get recorded size in bytes */
  getRecordedSize(): number {
    return this.recordingSizeBytes;
  }

  /** Get MIME type being used */
  getMimeType(): string {
    return this.opts.mimeType;
  }

  // ---------- Private methods ----------

  private _onDataAvailable(event: BlobEvent) {
    if (event.data.size > 0) {
      this.recordingSizeBytes += event.data.size;
      this.opts.onDataAvailable?.(event.data.size);
      const p = this._uploadChunk(event.data)
        .catch((e) => {
          const err = new Error(`Chunk upload error: ${String((e as any)?.message || e)}`);
          this.opts.onError?.(err);
          return false;
        })
        .finally(() => {
          this.pendingChunkUploads.delete(p);
        });
      this.pendingChunkUploads.add(p);
    }
  }

  private _onError(event: Event & { error?: unknown }) {
    const err = new Error(`MediaRecorder error: ${String(event.error ?? "unknown")}`);
    this.opts.onError?.(err);
    this.isRecording = false;
    console.error(err);
  }

  private _onStop() {
    // Final cleanup and callback handled in stop() promise
  }

  private _getDefaultMimeType(): string {
    // Prefer WebM with VP8 + Opus for broad compatibility
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/webm",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback to empty (browser default)
    return "";
  }

  private async _flushPendingUploads(): Promise<void> {
    if (this.pendingChunkUploads.size === 0) return;
    await Promise.allSettled(Array.from(this.pendingChunkUploads));
  }

  private async _uploadChunk(chunk: Blob): Promise<boolean> {
    if (!this.sessionCtx) return false;
    if (!chunk || chunk.size === 0) return true;
    const impl = this.opts.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.opts.uploadTimeoutMs);
    try {
      const fd = new FormData();
      fd.append("chunk", chunk, `chunk_${Date.now()}.webm`);
      fd.append("session_id", this.sessionCtx.sessionId);
      fd.append("test_id", this.sessionCtx.testId);
      fd.append("candidate_id", this.sessionCtx.candidateId);
      fd.append("candidate_token", this.sessionCtx.candidateToken || "");
      if (this.uploadId) fd.append("upload_id", this.uploadId);
      const res = await impl(this.opts.uploadUrl.replace(/\/video\/upload$/, "/video/upload/chunk"), {
        method: "POST",
        body: fd,
        keepalive: true,
        signal: controller.signal,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Chunk upload failed: ${res.status} ${txt}`);
      }
      const payload = await res.json().catch(() => ({}));
      if (payload?.upload_id) this.uploadId = String(payload.upload_id);
      return true;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  private async _finalizeUpload(): Promise<void> {
    if (this.finalized || !this.sessionCtx || !this.uploadId) return;
    const impl = this.opts.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.opts.uploadTimeoutMs);
    try {
      const fd = new FormData();
      fd.append("upload_id", this.uploadId);
      fd.append("session_id", this.sessionCtx.sessionId);
      fd.append("test_id", this.sessionCtx.testId);
      fd.append("candidate_id", this.sessionCtx.candidateId);
      fd.append("candidate_token", this.sessionCtx.candidateToken || "");
      fd.append("uploaded_at", new Date().toISOString());
      const res = await impl(this.opts.uploadUrl.replace(/\/video\/upload$/, "/video/upload/finalize"), {
        method: "POST",
        body: fd,
        keepalive: true,
        signal: controller.signal,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Finalize upload failed: ${res.status} ${txt}`);
      }
      this.finalized = true;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}

/* ===========================
   Typical usage example
   ===========================
   const recorder = new VideoRecorder({
     uploadUrl: "/proctor/video/upload",
     onStart: () => console.log("Recording started"),
     onUploadProgress: (pct) => console.log("Upload:", pct, "%"),
     onError: (err) => console.error("Recorder error:", err),
   });

   // Start with a MediaStream
   const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
   recorder.start(stream);

   // Later, when test ends:
   const blob = await recorder.stop();
   if (blob) {
     const uploaded = await recorder.upload(blob, sessionId, testId, candidateId);
   }
*/
