// app/history/ResultsModal.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { getMatchScore } from '@/lib/score';

type Candidate = {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
  final_score?: number | string;
  prompt_matching_score?: number | string;
  match_score?: number | string;
  score?: number | string;
  matchReasons?: string[];
  skills?: string[];
  title?: string;
  role?: string;
  predicted_role?: string;
  category?: string;
  currentRole?: string;
  ml_predicted_role?: string;
  job_role?: string;
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
  /** (Req. 6) Optional anchor to open near click position */
  anchor?: { x: number; y: number };
};

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/+$/, '');

export default function ResultsModal({ history, onClose, anchor }: Props) {
  const router = useRouter();

  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // fetch the results
  useEffect(() => {
    if (!history?.id) {
      setResults(null);
      return;
    }
    const ac = new AbortController();
    (async () => {
      try {
        const url = new URL(`${API_BASE}/history/history-result/${history.id}`);
        const res = await fetch(url.toString(), {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
          signal: ac.signal,
        });
        if (!res.ok) {
          setResults(null);
          return;
        }
        const data = (await res.json()) as ResultsPayload;
        setResults(data);
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.code === 20) return;
        setResults(null);
      }
    })();
    return () => ac.abort();
  }, [history]);

  // focus close on open
  useEffect(() => {
    if (results) {
      closeBtnRef.current?.focus({ preventScroll: true } as any);
    }
  }, [results]);

  const handleCandidateSelect = (candidateId: string) => {
    setSelectedCandidates(prev => {
      const next = new Set(prev);
      next.has(candidateId) ? next.delete(candidateId) : next.add(candidateId);
      return next;
    });
  };

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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-[hsl(var(--success)/.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/.35)]';
    if (score >= 80) return 'bg-[hsl(var(--info)/.15)] text-[hsl(var(--info))] border-[hsl(var(--info)/.35)]';
    if (score >= 70) return 'bg-[hsl(var(--warning)/.18)] text-[hsl(var(--warning-foreground))] border-[hsl(var(--warning)/.35)]';
    return 'bg-[hsl(var(--destructive)/.15)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/.35)]';
  };

  // ✅ Sort candidates by match score (descending - highest first)
  const sortedCandidates = useMemo(() => {
    if (!results?.candidates) return [];
    return [...results.candidates].sort((a, b) => {
      const scoreA = getMatchScore(a) ?? 0;
      const scoreB = getMatchScore(b) ?? 0;
      return scoreB - scoreA; // Descending order
    });
  }, [results?.candidates]);

  // ✅ Get predicted role for display
  const getPredictedRole = (candidate: Candidate): string => {
    return (
      candidate.predicted_role ||
      candidate.job_role ||
      candidate.role ||
      candidate.category ||
      candidate.currentRole ||
      candidate.ml_predicted_role ||
      ''
    ).trim();
  };

  if (!results) return null;

  return (
    <Modal
      open={!!results}
      onClose={onClose}
      labelledBy="results-modal-title"
      className="!p-0 z-modal !max-w-none !w-auto"
      anchor={undefined}
    >
      <div className="relative flex flex-col rounded-2xl bg-card text-card-foreground border border-border shadow-2xl gradient-border w-[95vw] sm:w-[85vw] lg:w-[80vw] max-w-[56rem]" style={{ maxHeight: '92vh' }}>
        {/* Header - Fixed */}
        <div className="relative p-6 border-b border-border shrink-0">
          <div className="absolute inset-0 -z-10 opacity-[.22] bg-[radial-gradient(900px_400px_at_-10%_-20%,hsl(var(--g1)/.6),transparent_60%),radial-gradient(800px_500px_at_120%_-20%,hsl(var(--g2)/.5),transparent_55%),radial-gradient(700px_700px_at_80%_120%,hsl(var(--g3)/.45),transparent_60%)]" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 id="results-modal-title" className="text-2xl font-bold mb-1 gradient-text">Search Results</h2>
              <p className="break-words text-sm text-muted-foreground">"{results.prompt}"</p>
              <p className="mt-1 text-xs text-muted-foreground/90">
                <i className="ri-time-line mr-1" />
                {results.timestamp}
              </p>
            </div>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              className="btn btn-ghost rounded-full h-10 w-10 shrink-0"
              aria-label="Close results modal"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{results.totalMatches} Candidates Found</h3>
          </div>

          {sortedCandidates.length === 0 ? (
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
              {sortedCandidates.map((candidate) => {
                const cid = candidate._id || candidate.id || '';
                const ms = getMatchScore(candidate);
                const normalized = Math.round(ms ?? 0);

                return (
                  <div
                    key={cid}
                    className={`rounded-2xl p-4 border transition-all duration-200 bg-card overflow-hidden ${
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
                            {getPredictedRole(candidate) && (
                              <p className="text-sm font-medium text-[hsl(var(--info))] truncate mt-0.5">
                                {getPredictedRole(candidate)}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground truncate">{candidate.email}</p>
                          </div>

                          <div
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getScoreColor(
                              normalized
                            )}`}
                            aria-label={`Match score ${normalized}%`}
                          >
                            {normalized}% Match
                          </div>
                        </div>

                        {candidate.matchReasons?.length ? (
                          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 mt-2 break-words">
                            {candidate.matchReasons.slice(0, 3).map((r, idx) => (
                              <li key={idx} className="break-words">{String(r)}</li>
                            ))}
                            {candidate.matchReasons.length > 3 && (
                              <li className="text-xs opacity-70">+{candidate.matchReasons.length - 3} more reasons</li>
                            )}
                          </ul>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/candidate/${cid}`}
                        className="btn btn-primary text-sm whitespace-nowrap shrink-0"
                        aria-label={`View ${candidate.name}`}
                      >
                        <i className="ri-eye-line mr-1" />
                        View Candidate
                      </Link>

                      <button
                        onClick={() => goSendTest(candidate)}
                        className="btn btn-primary text-sm whitespace-nowrap shrink-0"
                        aria-label={`Send Test to ${candidate.name}`}
                      >
                        <i className="ri-file-list-line mr-1" />
                        Send Test
                      </button>
                      <button
                        onClick={() => goScheduleInterview(candidate)}
                        className="btn btn-primary text-sm whitespace-nowrap shrink-0"
                        aria-label={`Schedule Interview with ${candidate.name}`}
                      >
                        <i className="ri-calendar-event-line mr-1" />
                        Schedule Interview
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-border bg-card shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {selectedCandidates.size} of {sortedCandidates.length} candidates selected
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button onClick={onClose} className="btn btn-outline text-sm shrink-0">
                Close
              </button>
              <button className="btn btn-primary text-sm shrink-0">Save Selection</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
