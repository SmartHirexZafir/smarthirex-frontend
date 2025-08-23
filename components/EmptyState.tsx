// app/components/EmptyState.tsx
'use client';

import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onUploadClick?: () => void;
  showUploadButton?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No CVs Found',
  description = 'You haven’t uploaded any CVs yet. Upload CVs to get started with filtering and testing.',
  onUploadClick,
  showUploadButton = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-gray-300 bg-white shadow-sm animate-[fadeIn_0.3s_ease]">
      {/* simple icon (no external lib) */}
      <div className="p-4 rounded-full bg-gray-100 mb-4">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          className="text-gray-500"
          aria-hidden="true"
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 2v6h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 13h8M8 17h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <p className="text-gray-500 mt-2 max-w-md">{description}</p>

      {showUploadButton && (
        <button
          type="button"
          onClick={onUploadClick}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          {/* upload arrow icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
            aria-hidden="true"
          >
            <path
              d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Upload CVs
        </button>
      )}

      {/* tiny keyframes (no external CSS needed) */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default EmptyState;
