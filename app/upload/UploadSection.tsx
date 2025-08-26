'use client';

import React, { useState, useRef, useEffect } from 'react';

type FileWithPreview = File & { preview?: string };

type ProcessingFile = {
  id: number;
  name: string;
  size: number;
  progress: number;
  status: 'processing' | 'completed' | 'error';
};

interface UploadSectionProps {
  onFileUpload: (files: ProcessingFile[]) => void;
  uploadedFiles: FileWithPreview[];
}

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

export default function UploadSection({ onFileUpload }: UploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [allDone, setAllDone] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // mark complete files count
  useEffect(() => {
    const done = processingFiles.filter((f) => f.status === 'completed').length;
    setCompletedCount(done);
    if (done > 0 && done === processingFiles.length) {
      setAllDone(true);
    }
  }, [processingFiles]);

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

  // ---------- Core upload logic ----------
  const processFiles = async (files: FileWithPreview[]) => {
    if (!files.length) return;

    setAllDone(false);
    setCompletedCount(0);

    const newProcessingFiles: ProcessingFile[] = files.map((file) => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'processing',
    }));

    setProcessingFiles(newProcessingFiles);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const response = await fetch(`${API_BASE}/upload/upload-resumes`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const result = await safeParseJSON(response);

      if (response.ok && result && Array.isArray(result.resumes)) {
        // simulate progress per file
        newProcessingFiles.forEach((file) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              setProcessingFiles((prev) =>
                prev.map((f) =>
                  f.id === file.id ? { ...f, progress: 100, status: 'completed' } : f
                )
              );
            } else {
              setProcessingFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
              );
            }
          }, 100);
        });

        onFileUpload(newProcessingFiles);
      } else {
        setProcessingFiles((prev) =>
          prev.map((f) => ({ ...f, status: 'error', progress: 0 }))
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      setProcessingFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error', progress: 0 }))
      );
    }
  };

  async function safeParseJSON(res: Response): Promise<any> {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { detail: text };
    }
  }

  // ---------- Render ----------
  return (
    <section
      className="card-glass p-8 relative overflow-hidden animate-rise-in"
      aria-labelledby="upload-title"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.06] gradient-ink" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <header className="text-center mb-6">
        <h2 id="upload-title" className="text-2xl md:text-3xl font-extrabold gradient-text glow">
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
          'surface glass gradient-border rounded-3xl p-10 md:p-12 text-center transition-all ease-lux cursor-pointer',
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
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] text-white shadow-glow transition-transform duration-300 hover:scale-105">
          <i className="ri-upload-cloud-2-line text-4xl" />
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
          {isDragOver ? 'Drop files here' : 'Drop files or click to upload'}
        </h3>
        <p className="text-[hsl(var(--muted-foreground))] mb-6">
          Transform your hiring process with AI-powered resume screening
        </p>

        <button
          type="button"
          className="btn btn-primary shadow-glow"
          onClick={() => fileInputRef.current?.click()}
        >
          <i className="ri-folder-open-line mr-2" />
          Choose Files
        </button>

        <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
          <i className="ri-information-line mr-1" />
          Only PDF, DOC, and DOCX files up to 10MB are supported
        </p>

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

      {/* Unified Loader with progress bar */}
      {processingFiles.length > 0 && (
        <div className="mt-8 text-center">
          {!allDone ? (
            <>
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
              <p className="font-medium text-foreground">
                Uploading {completedCount} / {processingFiles.length} files...
              </p>
              <div className="mt-4 w-full max-w-md mx-auto h-3 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <div
                  className="h-3 bg-gradient-to-r from-[hsl(var(--g1))] to-[hsl(var(--g3))] transition-all duration-300"
                  style={{
                    width: `${Math.round((completedCount / processingFiles.length) * 100)}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--success))] text-white shadow-glow">
                <i className="ri-check-line text-3xl" />
              </div>
              <p className="font-medium text-foreground">Uploaded Successfully!</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
