// smarthirex-frontend-main/app/history/RerunPromptModal.tsx
'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import ChatbotSection from '@/app/upload/ChatbotSection';

type HistoryItem = {
  id?: string;
  prompt?: string;
  totalMatches?: number;
  timestamp?: string;
  [key: string]: any;
};

type Props = {
  history: HistoryItem;
  onClose: () => void;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/+$/, '');

export default function RerunPromptModal({ history, onClose }: Props) {
  const [processing, setProcessing] = useState(false);

  const historyId = (history?.id || (history as any)?._id || '').toString();
  const activePrompt = history?.prompt || '';

  async function onPromptSubmit(prompt: string) {
    if (!historyId) return;
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/history/rerun/${historyId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      await res.text().catch(() => null);
    } catch {
      // swallow — keep UI identical
    } finally {
      setProcessing(false);
    }
  }

  const stopBgScroll = (e: any) => {
    e.preventDefault?.();
    e.stopPropagation?.();
  };

  const modal = (
    <>
      {/* Backdrop (blocks scroll without locking body) */}
      <div
        className="fixed inset-0 z-overlay bg-[hsl(var(--background)/.7)] backdrop-blur-sm"
        aria-hidden="true"
        onWheel={stopBgScroll}
        onTouchMove={stopBgScroll}
      />

      {/* Modal container */}
      <div
        className="fixed-center z-modal p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Re-run Prompt"
        onWheel={stopBgScroll}
        onTouchMove={stopBgScroll}
      >
        <div className="relative w-[92vw] max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card text-card-foreground border border-border shadow-2xl gradient-border">
          {/* Header */}
          <div className="relative p-6 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold gradient-text">Re-run Prompt</h2>
                {activePrompt ? (
                  <p className="text-xs text-muted-foreground/90 mt-1">
                    <i className="ri-message-2-line mr-1" /> Original: “{activePrompt}”
                  </p>
                ) : null}
              </div>
              <button
                onClick={onClose}
                className="btn btn-ghost rounded-full h-10 w-10 shrink-0"
                aria-label="Close re-run modal"
                title="Close"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
          </div>

          {/* Body: exact Upload chatbot UI */}
          <div className="p-6">
            <ChatbotSection
              activePrompt={activePrompt}
              isProcessing={processing}
              onPromptSubmit={onPromptSubmit}
              delegateToParent
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-end">
            <button onClick={onClose} className="btn btn-outline text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
