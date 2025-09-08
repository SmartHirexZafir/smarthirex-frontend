'use client';

import { useState } from 'react';

type HistoryItem = {
  id: string;
  prompt: string;
  timestamp?: string;
  totalMatches: number;
  // backend se agar extra fields aayen to yahan add ho sakte hain
};

type Props = {
  historyData: HistoryItem[];
  onViewResults: (history: HistoryItem) => void;

  // ✅ Backwards-compatible props: support new modal-based rerun flow,
  // but still fall back to the legacy string-based callback if needed.
  onOpenRerunModal?: (history: HistoryItem) => void; // new (preferred)
  onRerunPrompt?: (prompt: string) => void;           // legacy
};

export default function HistoryBlocks({
  historyData,
  onViewResults,
  onOpenRerunModal,
  onRerunPrompt,
}: Props) {
  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // ✅ Updated: open popup-style rerun modal scoped to this history block if provided,
  // otherwise gracefully fall back to the legacy onRerunPrompt(prompt).
  const handleRerun = (history: HistoryItem) => {
    setRerunningId(history.id);
    if (onOpenRerunModal) {
      onOpenRerunModal(history);
    } else if (onRerunPrompt) {
      onRerunPrompt(history.prompt);
    }
    // brief visual feedback without delaying the action
    setTimeout(() => setRerunningId(null), 300);
  };

  const getMatchBadgeClasses = (count: number) => {
    // Theme-aware semantic colors
    if (count >= 15) return 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]';
    if (count >= 10) return 'bg-[hsl(var(--info))] text-[hsl(var(--info-foreground))]';
    if (count >= 5) return 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]';
    return 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]';
  };

  const getMatchIcon = (count: number) => {
    if (count >= 15) return 'ri-trophy-line';
    if (count >= 10) return 'ri-award-line';
    if (count >= 5) return 'ri-star-line';
    return 'ri-information-line';
  };

  const totalPages = Math.ceil(historyData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = historyData.slice(startIndex, startIndex + itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="space-y-6">
      {historyData.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center bg-[hsl(var(--primary)/.10)] shadow-glow">
            <i className="ri-history-line text-4xl text-[hsl(var(--muted-foreground))]"></i>
          </div>
          <h3 className="text-xl font-semibold">No History Found</h3>
          <p className="text-[hsl(var(--muted-foreground))]">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentItems.map((history: HistoryItem, index: number) => (
            <div
              key={history.id}
              className="card p-6 hover:shadow-glow transition-transform duration-300 ease-lux animate-rise-in relative overflow-hidden"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {/* soft ambient gradient veil */}
              <div className="pointer-events-none absolute inset-0 opacity-[.06] bg-luxe-aurora" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-glow gradient-border"
                        style={{
                          backgroundImage:
                            'linear-gradient(180deg, hsl(var(--foreground)/0.10), hsl(var(--foreground)/0.04)), linear-gradient(135deg, hsl(var(--g1)) 0%, hsl(var(--g2)) 45%, hsl(var(--g3)) 100%)',
                        }}
                      >
                        <i className="ri-brain-line text-[hsl(var(--primary-foreground))] text-xl"></i>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold truncate">{history.prompt}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-[hsl(var(--muted)/.6)] text-[hsl(var(--muted-foreground))] gradient-border">
                            <i className="ri-time-line mr-1"></i>
                            {history.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`px-4 py-2 rounded-full text-sm font-semibold shadow-glow whitespace-nowrap gradient-border ${getMatchBadgeClasses(
                      history.totalMatches
                    )}`}
                  >
                    <i className={`${getMatchIcon(history.totalMatches)} mr-2`}></i>
                    {history.totalMatches} candidates
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onViewResults(history)}
                    className="btn btn-primary flex-1 whitespace-nowrap"
                  >
                    <i className="ri-eye-line"></i>
                    <span>View Results</span>
                  </button>

                  <button
                    onClick={() => handleRerun(history)}
                    disabled={rerunningId === history.id}
                    className="btn btn-outline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
                    aria-label={`Re-run prompt for "${history.prompt}"`}
                  >
                    {rerunningId === history.id ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mr-2" />
                        Opening…
                      </div>
                    ) : (
                      <>
                        <i className="ri-refresh-line"></i>
                        <span>Re-run Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 pt-8">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="btn btn-outline shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="ri-arrow-left-line"></i>
            <span className="font-medium">Previous</span>
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-12 min-w-12 px-3 rounded-xl text-sm font-semibold transition-transform duration-200 ${
                  currentPage === page ? 'btn btn-primary' : 'btn btn-outline'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="btn btn-outline shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-medium">Next</span>
            <i className="ri-arrow-right-line"></i>
          </button>
        </div>
      )}

      {historyData.length > 0 && (
        <div className="text-center pt-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted)/.5)] rounded-full px-4 py-2 inline-block gradient-border">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, historyData.length)} of {historyData.length} search results
          </p>
        </div>
      )}
    </div>
  );
}
