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
  score?: number;
  match_score?: number;
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

/* ---------- Helpers for score fallback (prevents 0% when backend lacks scores) ---------- */
const tokenize = (s: string) =>
  (s || '')
    .toLowerCase()
    .match(/[a-zA-Z]+|\d+\+?/g)?.filter(t => !['and','or','the','a','an','in','with','of'].includes(t)) || [];

const candidateBlob = (c: Candidate) => {
  const parts: string[] = [];
  if (c.name) parts.push(c.name);
  if (c.email) parts.push(c.email);
  if (c.title) parts.push(c.title);
  if (c.role) parts.push(c.role);
  if (Array.isArray(c.skills)) parts.push(c.skills.join(' '));
  if (Array.isArray(c.matchReasons)) parts.push(c.matchReasons.join(' '));
  return parts.join(' ').toLowerCase();
};

const heuristicMatchScore = (prompt: string, c: Candidate): number => {
  const toks = tokenize(prompt);
  if (!toks.length) return 0;
  const blob = candidateBlob(c);
  let hits = 0;
  for (const t of toks) {
    if (t.endsWith('+') && /^\d+\+$/.test(t)) {
      const base = parseInt(t.slice(0, -1), 10);
      const nums = (blob.match(/\b\d+\b/g) || []).map(n => parseInt(n, 10));
      if (nums.some(n => n >= base)) hits += 1;
    } else if (blob.includes(t)) {
      hits += 1;
    }
  }
  // mirror backend fallback: base 40 + 15 per hit, capped 100
  return Math.max(0, Math.min(100, 40 + hits * 15));
};

export default function ResultsModal({ history, onClose }: Props) {
  const router = useRouter();

  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<ResultsPayload | null>(null);

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

  // ✅ Buttons open the *exact same* flows as the Candidate Profile by deep-linking with an action.
  // This guarantees identical functionality without duplicating logic.
  const goSendTest = (candidate: Candidate) => {
    const cid = candidate._id || candidate.id || '';
    if (!cid) return;
    router.push(`/candidate/${cid}?action=sendTest`);
  };

  const goScheduleInterview = (candidate: Candidate) => {
    const cid = candidate._id || candidate.id || '';
    if (!cid) return;
    router.push(`/candidate/${cid}?action=scheduleInterview`);
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
      <div className="absolute inset-0 bg-[hsl(var(--background)/.7)]" />

      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-card text-card-foreground border border-border shadow-2xl gradient-border">
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

          <div className="space-y-4">
            {results.candidates.map((candidate) => {
              const cid = candidate._id || candidate.id || '';

              // ✅ Dynamic match % (final_score / prompt_matching_score / score / match_score)
              let displayScore =
                Math.round(
                  Number(
                    candidate.final_score ??
                    candidate.prompt_matching_score ??
                    candidate.score ??
                    candidate.match_score ??
                    0
                  ) || 0
                );

              // If backend provided no score (common for older saved blocks), compute a heuristic fallback
              if ((!displayScore || displayScore === 0) && results.prompt) {
                displayScore = Math.round(heuristicMatchScore(results.prompt, candidate));
              }

              if (displayScore < 0) displayScore = 0;
              if (displayScore > 100) displayScore = 100;

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
                            displayScore
                          )}`}
                          aria-label={`Match score ${displayScore}%`}
                        >
                          {displayScore}% Match
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
