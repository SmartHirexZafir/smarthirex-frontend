'use client';

import React, { useState, useRef } from 'react';

type FileWithPreview = File & { preview?: string };

type ParsedData = {
  name: string;
  email: string;
  phone: string;
  skills: string | string[];
  experience: string;
  location: string;
};

type ProcessingFile = {
  id: number;
  name: string;
  size: number;
  progress: number;
  status: 'processing' | 'completed' | 'error';
  parsedData?: ParsedData;
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
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

    // initialize UI entries
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

    // read token for protected endpoint
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const response = await fetch(`${API_BASE}/upload/upload-resumes`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      // backend may return helpful error JSON or plain text
      const result = await safeParseJSON(response);

      if (response.ok && result && Array.isArray(result.resumes)) {
        setUploadCount(result.resumes.length);
        setShowSuccessPopup(true);

        // simulate progress per file, then attach parsedData
        newProcessingFiles.forEach((file, index) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);

              const resume = result.resumes[index] || {};
              const parsedData: ParsedData = {
                name: resume?.name || `Candidate ${index + 1}`,
                email: resume?.email || `candidate${index + 1}@email.com`,
                phone: resume?.phone || `+1 (555) 123-456${index}`,
                skills: (Array.isArray(resume?.skills) && resume.skills.length
                  ? resume.skills[0]
                  : 'N/A') as string,
                experience: `${resume?.experience || 0} years`,
                location: resume?.location || 'N/A',
              };

              setProcessingFiles((prev) =>
                prev.map((f) =>
                  f.id === file.id
                    ? { ...f, progress: 100, status: 'completed', parsedData }
                    : f
                )
              );
            } else {
              setProcessingFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
              );
            }
          }, 100);
        });

        // emit to parent (so parent can refresh any state if needed)
        onFileUpload(newProcessingFiles);
      } else {
        // mark all as error if server rejected
        const detail =
          (result && (result.detail || result.message)) || 'Upload failed (server rejected).';
        console.error(detail);
        setProcessingFiles((prev) =>
          prev.map((f) => ({ ...f, status: 'error', progress: 0 }))
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      // mark all as error on network failure
      setProcessingFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error', progress: 0 }))
      );
    }
  };

  // ---------- Utilities ----------
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
      {/* Subtle themed ink + noise overlay */}
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
        onClick={() => fileInputRef.current?.click()}
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

      {/* Processing list */}
      {processingFiles.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Processing Files</h3>

          {processingFiles.map((file) => (
            <article
              key={file.id}
              className="surface rounded-2xl border border-border p-4 hover:shadow-glow transition-shadow"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary)/.12)]">
                    <i className="ri-file-text-line text-[hsl(var(--primary))] text-xl" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {file.status === 'processing' && (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
                  )}
                  {file.status === 'completed' && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--success))]">
                      <i className="ri-check-line text-white text-sm" />
                    </div>
                  )}
                  {file.status === 'error' && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--destructive))]">
                      <i className="ri-close-line text-white text-sm" />
                    </div>
                  )}
                  <span className="min-w-[40px] text-sm font-medium text-foreground">
                    {Math.round(file.progress)}%
                  </span>
                </div>
              </div>

              <div className="mb-4 h-2 w-full rounded-full bg-[hsl(var(--muted))]">
                <div
                  className={
                    file.status === 'error'
                      ? 'h-2 rounded-full bg-[hsl(var(--destructive))] transition-all duration-300'
                      : 'h-2 rounded-full bg-gradient-to-r from-[hsl(var(--g1))] to-[hsl(var(--g3))] transition-all duration-300'
                  }
                  style={{ width: `${file.progress}%` }}
                />
              </div>

              {file.status === 'completed' && file.parsedData && (
                <div className="surface rounded-xl border border-border p-4">
                  <h4 className="mb-3 flex items-center font-medium text-foreground">
                    <i className="ri-check-circle-line mr-2 text-[hsl(var(--success))]" />
                    Extracted Information
                  </h4>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-[hsl(var(--muted-foreground))]">Name</dt>
                      <dd className="font-medium text-foreground">{file.parsedData.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[hsl(var(--muted-foreground))]">Email</dt>
                      <dd className="font-medium text-foreground">{file.parsedData.email}</dd>
                    </div>
                    <div>
                      <dt className="text-[hsl(var(--muted-foreground))]">Experience</dt>
                      <dd className="font-medium text-foreground">{file.parsedData.experience}</dd>
                    </div>
                    <div>
                      <dt className="text-[hsl(var(--muted-foreground))]">Location</dt>
                      <dd className="font-medium text-foreground">{file.parsedData.location}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Success Pop-up */}
      {showSuccessPopup && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-xl bg-[hsl(var(--success))] px-6 py-4 text-white shadow-glow"
        >
          <strong>{uploadCount}</strong> CV{uploadCount === 1 ? '' : 's'} successfully uploaded!
          <button
            onClick={() => setShowSuccessPopup(false)}
            className="ml-4 underline decoration-white/80 decoration-2 underline-offset-2"
          >
            Close
          </button>
        </div>
      )}
    </section>
  );
}
