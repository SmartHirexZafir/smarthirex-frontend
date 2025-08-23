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

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>

      <div className="relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Resume Files</h2>
          <p className="text-gray-600">Drag & drop your resume files or click to browse</p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/50 transform scale-105'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="relative z-10">
            <div
              className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center transform transition-all duration-300 shadow-lg ${
                isDragOver ? 'scale-110 rotate-12' : 'hover:scale-105'
              }`}
            >
              <i className="ri-upload-cloud-2-line text-4xl text-white"></i>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {isDragOver ? 'Drop files here' : 'Drop files or click to upload'}
            </h3>
            <p className="text-gray-600 mb-6">
              Transform your hiring process with AI-powered resume screening
            </p>
            <button
              type="button"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
            >
              <i className="ri-folder-open-line mr-2"></i>
              Choose Files
            </button>
            <p className="text-sm text-gray-500 mt-4">
              <i className="ri-information-line mr-1"></i>
              Only PDF and DOCX files up to 10MB are supported
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {processingFiles.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Files</h3>
            {processingFiles.map((file) => (
              <div
                key={file.id}
                className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <i className="ri-file-text-line text-blue-600 text-xl"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {file.status === 'processing' && (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {file.status === 'completed' && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <i className="ri-check-line text-white text-sm"></i>
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <i className="ri-close-line text-white text-sm"></i>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900 min-w-[40px]">
                      {Math.round(file.progress)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      file.status === 'error'
                        ? 'bg-red-400'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>

                {file.status === 'completed' && file.parsedData && (
                  <div className="bg-white/80 rounded-xl p-4 border border-gray-200/50">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <i className="ri-check-circle-line text-green-500 mr-2"></i>
                      Extracted Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">{file.parsedData.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">{file.parsedData.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Experience:</span>
                        <span className="ml-2 font-medium">{file.parsedData.experience}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-2 font-medium">{file.parsedData.location}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Success Pop-up */}
        {showSuccessPopup && (
          <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50">
            <strong>{uploadCount}</strong> CV{uploadCount === 1 ? '' : 's'} successfully uploaded!
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="ml-4 text-sm underline"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
