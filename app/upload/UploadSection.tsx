// smarthirex-frontend-main/app/upload/UploadSection.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/system/Toaster';

type FileWithPreview = File & { preview?: string };

type ProcessingFile = {
  id: number;
  name: string;
  size: number;
  progress: number; // 0..100
  status: 'processing' | 'completed' | 'error';
  errorMsg?: string;
};

interface UploadSectionProps {
  onFileUpload: (files: ProcessingFile[]) => void;
  uploadedFiles?: FileWithPreview[];
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

// concurrency for parallel uploads
const CONCURRENCY = 8;

// Hold durations
const PROGRESS_HOLD_MS = 2000;

// ✅ fallback paths (handles router prefix/no-prefix)
const UPLOAD_PATHS = ['/upload/upload-resumes', '/upload-resumes'];

export default function UploadSection({ onFileUpload }: UploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [showProgress, setShowProgress] = useState(false);

  // aggregated counters (across many requests)
  const [agg, setAgg] = useState({
    received: 0,
    inserted: 0,
    duplicates: 0,
    unsupported: 0,
    empty: 0,
    too_large: 0,
    parse_error: 0,
  });

  const { success, error } = useToast();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const procRef = useRef<ProcessingFile[]>([]);
  const firstSuccessToastRef = useRef(false);

  useEffect(() => {
    procRef.current = processingFiles;
  }, [processingFiles]);

  // Derived counts
  const totalCount = processingFiles.length;
  const completedCount = processingFiles.filter((f) => f.status === 'completed').length;

  // Overall % (average across rows)
  const overallPct =
    totalCount === 0
      ? 0
      : Math.round(
          processingFiles.reduce((sum, f) => sum + (Number.isFinite(f.progress) ? f.progress : 0), 0) / totalCount
        );

  // util: clear hold timers
  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  // clear timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // auto-hide progress after done + show final summary toast
  useEffect(() => {
    const allDone = totalCount > 0 && processingFiles.every((f) => f.status !== 'processing');
    if (!allDone) return;

    // build one clear summary toast
    const summary = `Uploaded ${agg.inserted} of ${agg.received} · Duplicates: ${agg.duplicates} · Unsupported: ${agg.unsupported} · Empty: ${agg.empty} · Too large: ${agg.too_large} · Parse errors: ${agg.parse_error}`;

    success(summary, undefined, 3000);

    const t2 = window.setTimeout(() => {
      setShowProgress(false);
      setProcessingFiles([]);
      setAgg({
        received: 0,
        inserted: 0,
        duplicates: 0,
        unsupported: 0,
        empty: 0,
        too_large: 0,
        parse_error: 0,
      });
    }, PROGRESS_HOLD_MS);
    timersRef.current.push(t2);

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [processingFiles, totalCount, agg, success]);

  // ---------- DnD ----------
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files) as FileWithPreview[];
    processFiles(files);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as FileWithPreview[];
    processFiles(files);
  };

  // ---------- Core upload (true per-file progress, parallel with limit) ----------
  async function processFiles(files: FileWithPreview[]) {
    if (!files.length) return;

    clearTimers();
    setShowProgress(true);

    // rows for UI
    const rows: ProcessingFile[] = files.map((file) => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'processing',
    }));
    setProcessingFiles(rows);

    // init aggregate
    setAgg({
      received: files.length,
      inserted: 0,
      duplicates: 0,
      unsupported: 0,
      empty: 0,
      too_large: 0,
      parse_error: 0,
    });

    // reset "started" info toast flag
    firstSuccessToastRef.current = false;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const uploadSingle = (idx: number, file: File) =>
      new Promise<void>((resolve) => {
        const row = rows[idx];

        const fd = new FormData();
        fd.append('files', file); // one file per request

        // ✅ attempt paths one by one with the same XHR progress UX
        const tryPath = (pathIndex: number) => {
          if (pathIndex >= UPLOAD_PATHS.length) {
            // all tried
            setProcessingFiles((prev) =>
              prev.map((f) =>
                f.id === row.id ? { ...f, status: 'error', progress: 0, errorMsg: 'Upload endpoint not reachable' } : f
              )
            );
            error(`Upload failed for ${file.name}`);
            return resolve();
          }

          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE}${UPLOAD_PATHS[pathIndex]}`);
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          // file byte progress
          xhr.upload.onprogress = (evt) => {
            if (!evt.lengthComputable) return;
            const pct = Math.min(100, Math.round((evt.loaded / evt.total) * 100));
            setProcessingFiles((prev) => prev.map((f) => (f.id === row.id ? { ...f, progress: pct } : f)));
          };

          xhr.onload = () => {
            const status = xhr.status;
            let resp: any = {};
            try {
              resp = JSON.parse(xhr.responseText || '{}');
            } catch {
              resp = {};
            }

            // If endpoint missing/blocked, try next path
            if (status === 404 || status === 405) {
              // reset progress for next attempt (visual clarity)
              setProcessingFiles((prev) =>
                prev.map((f) => (f.id === row.id ? { ...f, progress: 0 } : f))
              );
              return tryPath(pathIndex + 1);
            }

            const ok = status >= 200 && status < 300;
            if (!ok) {
              setProcessingFiles((prev) =>
                prev.map((f) =>
                  f.id === row.id ? { ...f, status: 'error', progress: 0, errorMsg: 'Upload failed' } : f
                )
              );
              error(`Upload failed for ${file.name}`);
              return resolve();
            }

            // determine outcome for this single file
            const inserted = Number(resp?.inserted ?? 0);
            const dup = Number(resp?.skipped?.duplicates ?? 0);
            const unsup = Number(resp?.skipped?.unsupported ?? 0);
            const empty = Number(resp?.skipped?.empty ?? 0);
            const tooLarge = Number(resp?.skipped?.too_large ?? 0);
            const parseErr = Number(resp?.skipped?.parse_error ?? 0);

            setAgg((a) => ({
              received: a.received,
              inserted: a.inserted + inserted,
              duplicates: a.duplicates + dup,
              unsupported: a.unsupported + unsup,
              empty: a.empty + empty,
              too_large: a.too_large + tooLarge,
              parse_error: a.parse_error + parseErr,
            }));

            if (inserted > 0) {
              setProcessingFiles((prev) =>
                prev.map((f) => (f.id === row.id ? { ...f, status: 'completed', progress: 100 } : f))
              );
              if (!firstSuccessToastRef.current) {
                firstSuccessToastRef.current = true;
                success('Upload started. Processing…', undefined, 2000);
              }
            } else {
              // show reason if we have it
              const reason =
                dup ? 'duplicate' :
                unsup ? 'unsupported' :
                empty ? 'empty' :
                tooLarge ? 'too large' :
                parseErr ? 'parse error' : 'skipped';
              setProcessingFiles((prev) =>
                prev.map((f) =>
                  f.id === row.id ? { ...f, status: 'error', progress: 0, errorMsg: reason } : f
                )
              );
              error(`Upload failed for ${file.name}`);
            }
            return resolve();
          };

          xhr.onerror = () => {
            // network glitch? try next path
            setProcessingFiles((prev) =>
              prev.map((f) =>
                f.id === row.id ? { ...f, progress: 0 } : f
              )
            );
            tryPath(pathIndex + 1);
          };

          xhr.send(fd);
        };

        // kick off first attempt
        tryPath(0);
      });

    // run with bounded concurrency
    let index = 0;
    const runners = Array.from({ length: Math.min(CONCURRENCY, files.length) }, async () => {
      while (index < files.length) {
        const myIdx = index++;
        await uploadSingle(myIdx, files[myIdx]);
      }
    });

    await Promise.all(runners);

    // tell parent with final statuses
    onFileUpload(procRef.current);
  }

  // ---------- Render ----------
  return (
    <section className="card-glass p-10 md:p-12 relative overflow-hidden animate-rise-in" aria-labelledby="upload-title">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.06] gradient-ink" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <header className="text-center mb-7">
        <h2 id="upload-title" className="text-3xl md:text-4xl font-extrabold gradient-text glow">
          Upload Resume Files
        </h2>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">Drag &amp; drop your resume files or click to browse</p>
      </header>

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files. Press Enter or Space to open file picker."
        aria-busy={processingFiles.some((f) => f.status === 'processing')}
        className={[
          'surface glass gradient-border rounded-3xl p-12 md:p-14 text-center transition-all ease-lux cursor-pointer',
          'border-2 border-dashed',
          isDragOver
            ? 'ring-2 ring-[hsl(var(--primary)/.45)] bg-[hsl(var(--muted)/.7)] shadow-glow scale-[1.01]'
            : 'hover:bg-[hsl(var(--muted)/.55)] hover:ring-1 hover:ring-[hsl(var(--primary)/.25)]',
        ].join(' ')}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <div className="mx-auto mb-7 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] text-[hsl(var(--primary-foreground))] shadow-glow transition-transform duration-300 hover:scale-105">
          <i className="ri-upload-cloud-2-line text-5xl" />
        </div>
        <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
          {isDragOver ? 'Drop files here' : 'Drop files or click to upload'}
        </h3>
        <p className="text-[hsl(var(--muted-foreground))] mb-6">Transform your hiring process with AI-powered resume screening</p>

        <button type="button" className="btn-primary shadow-glow px-6 py-3 text-base" onClick={() => fileInputRef.current?.click()}>
          <i className="ri-folder-open-line mr-2" />
          Upload CVs
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Overall Progress (live) */}
      {showProgress && totalCount > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">Uploading</p>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">{overallPct}%</span>
          </div>

          <div
            className="w-full h-3 rounded-full bg-[hsl(var(--muted))] overflow-hidden"
            role="progressbar"
            aria-valuenow={overallPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall upload progress"
          >
            <div
              className="h-3 bg-gradient-to-r from-[hsl(var(--g1))] to-[hsl(var(--g3))] transition-all duration-200"
              style={{ width: `${overallPct}%` }}
            />
          </div>

          <div className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            <span className="font-medium text-foreground">{completedCount}</span> out of{' '}
            <span className="font-medium text-foreground">{totalCount}</span> resumes uploaded
          </div>
        </div>
      )}
    </section>
  );
}
