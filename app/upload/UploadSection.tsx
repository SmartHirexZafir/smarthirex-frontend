'use client';

import React, { useState, useRef, useEffect } from 'react';

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
  /** optional banaya to TS prop mismatch se bache */
  uploadedFiles?: FileWithPreview[];
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

export default function UploadSection({ onFileUpload }: UploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [allDone, setAllDone] = useState<boolean>(false);

  // Visibility / toast
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const procRef = useRef<ProcessingFile[]>([]);
  useEffect(() => {
    procRef.current = processingFiles;
  }, [processingFiles]);

  // Derived counts
  const totalCount = processingFiles.length;
  const completedCount = processingFiles.filter((f) => f.status === 'completed').length;
  const errorCount = processingFiles.filter((f) => f.status === 'error').length;

  // Overall % (average of per-file progress)
  const overallPct =
    totalCount === 0
      ? 0
      : Math.round(
          processingFiles.reduce((sum, f) => sum + (Number.isFinite(f.progress) ? f.progress : 0), 0) /
            totalCount
        );

  useEffect(() => {
    if (processingFiles.length && processingFiles.every((f) => f.status !== 'processing')) {
      setAllDone(true);
    } else {
      setAllDone(false);
    }
  }, [processingFiles]);

  // Auto-dismiss progress + toast when done
  useEffect(() => {
    if (!allDone || totalCount === 0) return;

    // Toast message
    if (errorCount === 0) {
      setToastType('success');
      setToastMsg(`All ${totalCount} resumes uploaded successfully.`);
    } else {
      setToastType('warning');
      setToastMsg(`Uploaded ${completedCount} of ${totalCount} resumes. Some failed.`);
    }
    setShowToast(true);

    // Hide after a short delay
    const t1 = window.setTimeout(() => setShowToast(false), 2600);
    const t2 = window.setTimeout(() => {
      setShowProgress(false);
      setProcessingFiles([]);
      setAllDone(false);
    }, 3000);

    timersRef.current.push(t1, t2);

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]); // run when done flips to true

  // ---------- Drag & Drop handlers ----------
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

  // ---------- Core upload logic (REAL progress) ----------
  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const processFiles = async (files: FileWithPreview[]) => {
    if (!files.length) return;

    clearTimers();
    setAllDone(false);
    setShowToast(false);
    setShowProgress(true);

    const rows: ProcessingFile[] = files.map((file) => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'processing',
    }));

    setProcessingFiles(rows);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // helper: upload one file with per-file progress
    const uploadSingle = (row: ProcessingFile, file: File) =>
      new Promise<void>((resolve) => {
        const fd = new FormData();
        fd.append('files', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/upload/upload-resumes`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        // REAL bytes progress
        xhr.upload.onprogress = (evt) => {
          if (!evt.lengthComputable) return;
          const pct = Math.min(100, Math.round((evt.loaded / evt.total) * 100));
          setProcessingFiles((prev) =>
            prev.map((f) => (f.id === row.id ? { ...f, progress: pct } : f))
          );
        };

        xhr.onload = async () => {
          const ok = xhr.status >= 200 && xhr.status < 300;
          if (!ok) {
            let detail = 'Upload failed';
            try {
              const json = JSON.parse(xhr.responseText || '{}');
              if (typeof json?.detail === 'string') detail = json.detail;
            } catch {
              if (xhr.responseText) detail = xhr.responseText;
            }
            setProcessingFiles((prev) =>
              prev.map((f) =>
                f.id === row.id ? { ...f, status: 'error', progress: 0, errorMsg: detail } : f
              )
            );
            resolve();
            return;
          }

          // success -> mark 100%
          setProcessingFiles((prev) =>
            prev.map((f) => (f.id === row.id ? { ...f, progress: 100, status: 'completed' } : f))
          );
          resolve();
        };

        xhr.onerror = () => {
          setProcessingFiles((prev) =>
            prev.map((f) =>
              f.id === row.id ? { ...f, status: 'error', progress: 0, errorMsg: 'Network error' } : f
            )
          );
          resolve();
        };

        xhr.send(fd);
      });

    // upload sequentially (simpler; avoids server overload)
    for (let i = 0; i < rows.length; i++) {
      await uploadSingle(rows[i], files[i]);
    }

    // parent ko batado ke upload flow khatam ho gaya -> FINAL statuses
    onFileUpload(procRef.current);
  };

  // ---------- Render ----------
  return (
    <section
      className="card-glass p-10 md:p-12 relative overflow-hidden animate-rise-in"
      aria-labelledby="upload-title"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.06] gradient-ink" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <header className="text-center mb-7">
        <h2 id="upload-title" className="text-3xl md:text-4xl font-extrabold gradient-text glow">
          Upload Resume Files
        </h2>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">
          Drag &amp; drop your resume files or click to browse
        </p>
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
            ? 'ring-2 ring-[hsl(var(--primary)/.45)] bg-[hsl(var(--muted)/.7)] shadow-glow scale-[1.01)]'
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
        <div className="mx-auto mb-7 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] text-white shadow-glow transition-transform duration-300 hover:scale-105">
          <i className="ri-upload-cloud-2-line text-5xl" />
        </div>
        <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
          {isDragOver ? 'Drop files here' : 'Drop files or click to upload'}
        </h3>
        <p className="text-[hsl(var(--muted-foreground))] mb-6">
          Transform your hiring process with AI-powered resume screening
        </p>

        <button
          type="button"
          className="btn btn-primary shadow-glow px-6 py-3 text-base"
          onClick={() => fileInputRef.current?.click()}
        >
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

      {/* Overall Progress ONLY (no per-file rows) */}
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

      {/* Auto-dismiss Toast */}
      {showToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 shadow-lg border ${
            toastType === 'success'
              ? 'bg-[hsl(var(--success)/.12)] border-[hsl(var(--success))] text-[hsl(var(--success-foreground))]'
              : 'bg-[hsl(var(--warning)/.12)] border-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <i
              className={
                toastType === 'success' ? 'ri-check-line text-xl' : 'ri-alert-line text-xl'
              }
            />
            <span className="text-sm">{toastMsg}</span>
          </div>
        </div>
      )}
    </section>
  );
}
