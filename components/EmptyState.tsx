// components/EmptyState.tsx
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
  // Static id to avoid styled-jsx transformations; sufficient for single-instance usage
  const headingId = 'empty-state-title';

  return (
    <div
      role="region"
      aria-labelledby={headingId}
      className="flex flex-col items-center justify-center text-center p-8 rounded-2xl glass shadow-soft border border-dashed border-border bg-background/40 animate-[fadeIn_0.3s_ease]"
    >
      {/* simple icon (no external lib) */}
      <div className="p-4 rounded-full bg-[hsl(var(--muted)/0.4)] mb-4 ring-1 ring-border">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[hsl(var(--muted-foreground))]"
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

      <h2 id={headingId} className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="text-[hsl(var(--muted-foreground))] mt-2 max-w-md">
        {description}
      </p>

      {showUploadButton && (
        <button
          type="button"
          onClick={onUploadClick}
          className="btn btn-primary mt-6"
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

      {/* Keyframes globalized so styled-jsx scoped class injection na ho */}
      <style jsx global>{`
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
