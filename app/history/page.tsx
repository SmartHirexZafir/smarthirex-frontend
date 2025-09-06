'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import HistoryFilter from './HistoryFilter';
import HistoryBlocks from './HistoryBlocks';
import ResultsModal from './ResultsModal';
import RerunPromptModal from './RerunPromptModal';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

/** Normalize a score coming from Mongo (handles 0–1 ratios & 0–100 values). */
function normalizePercent(val: unknown): number | null {
  const n = typeof val === 'string' ? parseFloat(val) : typeof val === 'number' ? val : NaN;
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n;
  const bounded = Math.max(0, Math.min(100, pct));
  return Math.round((bounded + Number.EPSILON) * 100) / 100; // 2dp
}

/** Merge/compute matching score for a candidate (prompt match % shown on cards). */
function computeMatchingScore(c: any): number | null {
  return (
    normalizePercent(c?.prompt_matching_score) ??
    normalizePercent(c?.semantic_score) ??
    normalizePercent(c?.final_score) ??
    normalizePercent(c?.match_score) ??
    null
  );
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [rerunFor, setRerunFor] = useState<any | null>(null); // ✅ new: controls Re-run Prompt popup

  // Scroll lock bookkeeping so "View Results" doesn't jump to top (Req 5.1)
  const scrollLockRef = useRef<{ y: number; locked: boolean }>({ y: 0, locked: false });

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
      // Ensure scroll is unlocked if the component unmounts while modal is open
      if (scrollLockRef.current.locked) {
        unlockScroll();
      }
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

  // -------- View Results: lock scroll + ensure matching scores come from Mongo (Req 5.1) --------
  const lockScroll = () => {
    if (typeof window === 'undefined' || scrollLockRef.current.locked) return;
    const y = window.scrollY || window.pageYOffset || 0;
    scrollLockRef.current = { y, locked: true };
    // Lock the body at current position so page doesn't jump to top
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  };

  const unlockScroll = () => {
    if (typeof window === 'undefined' || !scrollLockRef.current.locked) return;
    const { y } = scrollLockRef.current;
    // Restore styles
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    scrollLockRef.current = { y: 0, locked: false };
    // Restore scroll position exactly where the user was
    window.scrollTo(0, y);
  };

  // Try multiple detail endpoints to fetch results including match scores
  const fetchHistoryDetail = async (h: any) => {
    const id = h?._id ?? h?.id ?? h?.historyId ?? h?.history_id;
    if (!id) return null;

    const paths = [
      `${API_BASE}/history/${id}`,
      `${API_BASE}/history/detail/${id}`,
      `${API_BASE}/history/user-history/${id}`,
    ];

    for (const url of paths) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (res.status === 404) continue;
        if (!res.ok) {
          const _txt = await res.text().catch(() => '');
          continue;
        }
        const data = await res.json();
        return data || null;
      } catch {
        // try next
      }
    }
    return null;
  };

  const hydrateWithScores = (raw: any): any => {
    if (!raw) return raw;
    // Normalize candidates/results array names
    const results: any[] =
      (Array.isArray(raw.results) && raw.results) ||
      (Array.isArray(raw.candidates) && raw.candidates) ||
      (Array.isArray(raw.resumes) && raw.resumes) ||
      [];

    const withScores = results.map((c) => {
      const matchingScore = computeMatchingScore(c);
      return { ...c, matchingScore, match_score: matchingScore ?? c?.match_score ?? null };
    });

    return { ...raw, results: withScores };
  };

  const openResultsModal = async (history: any) => {
    // 1) Lock scroll so opening the modal never jumps the page (Req 5.1)
    lockScroll();

    // 2) Set initial selection quickly (UI responsive), then hydrate with details
    setSelectedHistory(history);
    setShowModal(true);

    // 3) Fetch detail & inject matching scores if available from Mongo
    const detail = await fetchHistoryDetail(history);
    if (detail) {
      setSelectedHistory((prev: any) => {
        // Prefer detail version but keep any metadata from the original block
        const merged = { ...prev, ...detail };
        return hydrateWithScores(merged);
      });
    } else {
      // If no detail endpoint, still compute scores from what we have
      setSelectedHistory((prev: any) => hydrateWithScores(prev));
    }
  };

  const closeResultsModal = () => {
    setShowModal(false);
    setSelectedHistory(null);
    unlockScroll();
  };

  const handleViewResults = (history: any) => {
    // Wrap the existing behavior with the improved modal open (Req 5.1)
    void openResultsModal(history);
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

  // ✅ New: open the popup-style rerun modal scoped to a specific history block (Req 5.3)
  const openRerunModal = (history: any) => {
    setRerunFor(history);
  };

  return (
    <div className="min-h-screen">
      {/* Hero / Intro */}
      <section className="relative overflow-hidden py-14 md:py-20">
        {/* soft aurora wash */}
        <div className="absolute inset-0 pointer-events-none" />

        <div className="container relative z-10 max-w-6xl">
          <div className="mx-auto max-w-4xl text-center animate-rise-in">
            <h1 className="mb-4 font-bold gradient-text">
              Prompt History &amp; Matching Results
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
            onOpenRerunModal={openRerunModal}   // ✅ new scoped rerun flow (Req 5.3)
            onRerunPrompt={handleRerunPrompt}   // legacy fallback (kept)
          />
        </div>
      </section>

      {/* Results Modal (scroll-locked; scores hydrated from Mongo when available) */}
      {showModal && (
        <ResultsModal history={selectedHistory} onClose={closeResultsModal} />
      )}

      {/* ✅ Re-run Prompt Modal (scoped to the selected history block) */}
      {rerunFor && (
        <RerunPromptModal
          history={rerunFor}
          onClose={async () => {
            setRerunFor(null);
            await fetchHistory(); // refresh list after saving narrowed results
          }}
        />
      )}
      {/* Footer is rendered globally in layout.tsx to keep a single unified footer across pages. */}
    </div>
  );
}
