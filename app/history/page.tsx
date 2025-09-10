'use client';

import { useState, useEffect, useCallback } from 'react';
import HistoryFilter from './HistoryFilter';
import HistoryBlocks from './HistoryBlocks';
import ResultsModal from './ResultsModal';
import RerunPromptModal from './RerunPromptModal';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [rerunFor, setRerunFor] = useState<any | null>(null); // ✅ controls Re-run Prompt popup

  // fetch history (ignores AbortError cleanly)
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history/user-history`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      const data = await res.json();
      setHistoryData(data || []);
      setFilteredData(data || []);
    } catch (err: any) {
      // Ignore silent cancellations; only surface real errors
      if (err?.name === 'AbortError') return;
      console.error('Failed to load history:', err);
      setHistoryData([]);
      setFilteredData([]);
    }
  };

  useEffect(() => {
    let isActive = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/history/user-history`, {
          credentials: 'include',
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${txt}`);
        }

        const data = await res.json();
        if (!isActive) return;
        setHistoryData(data || []);
        setFilteredData(data || []);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (!isActive) return;
        console.error('Failed to load history:', err);
        setHistoryData([]);
        setFilteredData([]);
      }
    })();

    // No AbortController; just stop applying results after unmount
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Memoized to avoid changing function identity on each render.
   * HistoryFilter has a useEffect that depends on onFilter; without this,
   * that effect re-runs infinitely (causing the "Maximum update depth exceeded" error).
   */
  const handleFilter = useCallback((filteredResults: any[]) => {
    setFilteredData(filteredResults);
  }, []);

  const handleViewResults = (history: any) => {
    setSelectedHistory(history);
    setShowModal(true);
  };

  /**
   * Legacy global rerun (kept for backward compat if some child still calls it).
   * New behavior uses a scoped popup (RerunPromptModal) via onOpenRerunModal below.
   */
  const handleRerunPrompt = async (prompt: string) => {
    try {
      const res = await fetch(`${API_BASE}/chatbot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      // 🔁 Re-fetch to get fresh history from backend
      await fetchHistory();
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Failed to rerun prompt:', err);
    }
  };

  // Open the popup-style rerun modal scoped to a specific history block
  const openRerunModal = (history: any) => {
    setRerunFor(history);
  };

  /**
   * 🔒 Prevent the page from jumping to the top by locking body scroll
   * while any modal is open (Results or Re-run). Restores on close.
   * (No window.scrollTo is used anywhere in this file.)
   */
  useEffect(() => {
    const anyModalOpen = showModal || !!rerunFor;
    if (anyModalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    // If no modal open, ensure body overflow is reset
    document.body.style.overflow = '';
    return;
  }, [showModal, rerunFor]);

  return (
    <div className="min-h-screen">
      {/* Hero / Intro */}
      <section className="relative overflow-hidden py-14 md:py-20">
        {/* soft aurora wash */}
        <div className="absolute inset-0 pointer-events-none" />

        <div className="container relative z-10 max-w-6xl">
          <div className="mx-auto max-w-4xl text-center animate-rise-in">
            <h1 className="mb-4 font-bold gradient-text">
              Prompt History & Matching Results
            </h1>

            <p className="mx-auto max-w-3xl text-[hsl(var(--muted-foreground))] leading-relaxed">
              Track and review all your AI-powered resume matching activities with
              detailed analytics and insights.
            </p>
          </div>

          {/* Stats card */}
          <div className="mt-10">
            <div className="mx-auto max-w-3xl rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md shadow-glow gradient-border">
              <div className="relative z-10 grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/.18)] ring-1 ring-border">
                    <i className="ri-database-2-line text-xl text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{historyData.length}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Searches</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--success)/.18)] ring-1 ring-border">
                    <i className="ri-group-line text-xl text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {historyData.reduce(
                        (sum: number, item: any) => sum + (item.totalMatches || 0),
                        0
                      )}
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Matches</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-12">
        <div className="container max-w-6xl space-y-6">
          <HistoryFilter onFilter={handleFilter} />

          {/* subtle divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--border)/.8)] to-transparent" />

          <HistoryBlocks
            historyData={filteredData}
            onViewResults={handleViewResults}
            onOpenRerunModal={openRerunModal}   // scoped rerun flow
            onRerunPrompt={handleRerunPrompt}   // legacy fallback (kept)
          />
        </div>
      </section>

      {/* Results Modal */}
      {showModal && (
        <ResultsModal history={selectedHistory} onClose={() => setShowModal(false)} />
      )}

      {/* Re-run Prompt Modal (scoped to the selected history block) */}
      {rerunFor && (
        <RerunPromptModal
          history={rerunFor}
          onClose={async () => {
            setRerunFor(null);
            await fetchHistory(); // refresh list after saving narrowed results
          }}
        />
      )}
    </div>
  );
}
