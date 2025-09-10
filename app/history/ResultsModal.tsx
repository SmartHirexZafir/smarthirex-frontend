// smarthirex-frontend-main/app/history/ResultsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ---- Types (safe for strict TS, no backend changes) ---- */
type Candidate = {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
  final_score?: number;                // ✅ dynamic match %
  prompt_matching_score?: number;      // ✅ dynamic match %
  matchReasons?: string[];
  skills?: string[];
  title?: string;
  role?: string;
};

type ResultsPayload = {
  prompt: string;
  timestamp: string;
  totalMatches: number;
  candidates: Candidate[];
};

type HistoryObj = { id?: string };

type Props = {
  history: HistoryObj | null;
  onClose: () => void;
};

/* ✅ Align with rest of app: use NEXT_PUBLIC_API_BASE_URL and provide localhost fallback */
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/+$/, '');

export default function ResultsModal({ history, onClose }: Props) {
  const router = useRouter();

  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<ResultsPayload | null>(null);

  // 🔒 Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!history?.id) {
      setResults(null);
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        // Build URL safely to avoid double slashes
        const url = new URL(`${API_BASE}/history/history-result/${history.id}`);
        const res = await fetch(url.toString(), {
          method: 'GET',
          credentials: 'include', // in case your backend relies on cookies/session
          headers: { Accept: 'application/json' },
          signal: ac.signal,
        });

        if (!res.ok) {
          console.error('Failed to fetch results:', res.status, res.statusText);
          setResults(null);
          return;
        }

        const data = (await res.json()) as ResultsPayload;
        setResults(data);
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.code === 20) return;
        console.error('Failed to fetch results:', err);
        setResults(null);
      }
    })();

    return () => ac.abort();
  }, [history]);

  const handleCandidateSelect = (candidateId: string) => {
    setSelectedCandidates(prev => {
      const next = new Set(prev);
      next.has(candidateId) ? next.delete(candidateId) : next.add(candidateId);
      return next;
    });
  };

  // Buttons: navigate to dedicated pages with candidateId query string
  const goSendTest = (candidate: Candidate) => {
    const cid = candidate._id || candidate.id || '';
    if (!cid) return;
    router.push(`/test?candidateId=${encodeURIComponent(cid)}`);
  };

  const goScheduleInterview = (candidate: Candidate) => {
    const cid = candidate._id || candidate.id || '';
    if (!cid) return;
    router.push(`/meetings?candidateId=${encodeURIComponent(cid)}`);
  };

  // theme-aware score badge colors (kept same thresholds)
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-[hsl(var(--success)/.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/.35)]';
    if (score >= 80) return 'bg-[hsl(var(--info)/.15)] text-[hsl(var(--info))] border-[hsl(var(--info)/.35)]';
    if (score >= 70) return 'bg-[hsl(var(--warning)/.18)] text-[hsl(var(--warning-foreground))] border-[hsl(var(--warning)/.35)]';
    return 'bg-[hsl(var(--destructive)/.15)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/.35)]';
  };

  if (!results) return null;

  return (
    <div className="fixed inset-0 z-overlay p-4 flex items-center justify-center">
      {/* Themed backdrop */}
      <div className="absolute inset-0 bg-[hsl(var(--background)/.7)]" aria-hidden="true" />

      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card text-card-foreground border border-border shadow-2xl gradient-border">
        {/* Header */}
        <div className="relative p-6">
          <div className="absolute inset-0 -z-10 opacity-[.22] bg-[radial-gradient(900px_400px_at_-10%_-20%,hsl(var(--g1)/.6),transparent_60%),radial-gradient(800px_500px_at_120%_-20%,hsl(var(--g2)/.5),transparent_55%),radial-gradient(700px_700px_at_80%_120%,hsl(var(--g3)/.45),transparent_60%)]" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold mb-1 gradient-text">Search Results</h2>
              <p className="truncate text-sm text-muted-foreground">“{results.prompt}”</p>
              <p className="mt-1 text-xs text-muted-foreground/90">
                <i className="ri-time-line mr-1" />
                {results.timestamp}
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost rounded-full h-10 w-10 shrink-0"
              aria-label="Close results modal"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 overflow-y-auto max-h-[60vh]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              {results.totalMatches} Candidates Found
            </h3>
          </div>

          {results.candidates.length === 0 ? (
            // Neat empty state
            <div className="py-14 max-w-2xl mx-auto text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] text-[hsl(var(--primary-foreground))] shadow-glow">
                <i className="ri-user-search-line text-2xl" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">No candidates saved for this search</h4>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Try running a new query or adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.candidates.map((candidate) => {
                const cid = candidate._id || candidate.id || '';

                // ✅ Matching Score from Mongo: final_score || prompt_matching_score
                const rawScore =
                  (typeof candidate.final_score === 'number' ? candidate.final_score : undefined) ??
                  (typeof candidate.prompt_matching_score === 'number' ? candidate.prompt_matching_score : undefined) ?? 0;

                // Normalize to 0–100 (accept 0..1 ratios too)
                const normalized = (() => {
                  const n = Number(rawScore);
                  if (!Number.isFinite(n)) return 0;
                  const pct = n <= 1 ? n * 100 : n;
                  return Math.max(0, Math.min(100, Math.round(pct)));
                })();

                return (
                  <div
                    key={cid}
                    className={`rounded-xl p-4 border transition-all duration-200 bg-card ${
                      selectedCandidates.has(cid)
                        ? 'border-[hsl(var(--primary)/.45)] ring-1 ring-[hsl(var(--primary)/.25)] shadow-glow'
                        : 'border-border hover:border-[hsl(var(--border)/.9)]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.has(cid)}
                        onChange={() => handleCandidateSelect(cid)}
                        className="mt-2 h-4 w-4 rounded border-border text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                        aria-label={`Select ${candidate.name}`}
                      />

                      <img
                        src={candidate.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${candidate.name}`}
                        alt={candidate.name}
                        className="h-16 w-16 rounded-full object-cover border border-border shadow-soft"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-lg font-semibold truncate">{candidate.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">{candidate.email}</p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-medium border whitespace-nowrap ${getScoreColor(
                              normalized
                            )}`}
                            aria-label={`Match score ${normalized}%`}
                          >
                            {normalized}% Match
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/candidate/${cid}`}
                            className="btn btn-primary text-sm whitespace-nowrap"
                            aria-label={`View ${candidate.name}`}
                          >
                            <i className="ri-eye-line mr-1" />
                            View Candidate
                          </Link>

                          <button
                            onClick={() => goSendTest(candidate)}
                            className="btn btn-primary text-sm whitespace-nowrap"
                            aria-label={`Send Test to ${candidate.name}`}
                          >
                            <i className="ri-file-list-line mr-1" />
                            Send Test
                          </button>
                          <button
                            onClick={() => goScheduleInterview(candidate)}
                            className="btn btn-primary text-sm whitespace-nowrap"
                            aria-label={`Schedule Interview with ${candidate.name}`}
                          >
                            <i className="ri-calendar-event-line mr-1" />
                            Schedule Interview
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedCandidates.size} of {results.candidates.length} candidates selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="btn btn-outline text-sm"
              >
                Close
              </button>
              <button className="btn btn-primary text-sm">
                Save Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
