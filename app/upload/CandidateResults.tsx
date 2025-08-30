'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type Candidate = {
  _id?: string;
  id?: string;
  name?: string;
  predicted_role?: string;
  category?: string;
  currentRole?: string;

  // Experience fields (multiple aliases)
  experience?: number | string;
  total_experience_years?: number;
  years_of_experience?: number;
  experience_years?: number;
  yoe?: number;

  // ✅ New additive fields (if backend provides)
  experience_display?: string;   // e.g. "2 years", "0.5 years"
  experience_rounded?: number;   // e.g. 2.0, 0.5

  location?: string;
  confidence?: number;
  semantic_score?: number;
  final_score?: number;
  score_type?: string;
  skills?: string[];

  // ✅ Additive from ml_interface
  skillsTruncated?: string[];
  skillsOverflowCount?: number;

  related_roles?: { role: string; match?: number }[];
  relatedRoles?: { role: string; score?: number }[]; // alt shape

  is_strict_match?: boolean;
  match_type?: 'exact' | 'close';
};

export default function CandidateResults({
  candidates,
  isProcessing,
  activePrompt,
}: {
  candidates: Candidate[];
  isProcessing: boolean;
  activePrompt: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayed, setDisplayed] = useState<Candidate[]>([]);
  const [promptChanging, setPromptChanging] = useState(false);
  const lastPromptRef = useRef<string>('');

  const itemsPerPage = 6;

  // Helpers
  const safeName = (n: any) => (String(n || '').trim() ? String(n).trim() : 'No Name');
  const safeNum = (v: any, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const clamp2 = (n?: number | null) =>
    typeof n === 'number' && Number.isFinite(n) ? n.toFixed(2) : undefined;

  // ✅ experience formatter (fallback if display fields not provided)
  const formatYears = (v: any): string => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 'Not specified';
    if (n > 0 && n < 1) return '< 1 year';
    if (n >= 1) return `${Math.round(n)} year${Math.round(n) === 1 ? '' : 's'}`;
    return 'Not specified';
  };

  // Clear immediately when a new prompt is set
  useEffect(() => {
    if (activePrompt !== lastPromptRef.current) {
      lastPromptRef.current = activePrompt;
      setPromptChanging(true);        // show skeleton
      setDisplayed([]);               // clear old candidates immediately
      setCurrentPage(1);
    }
  }, [activePrompt]);

  // When processing ends, commit the latest candidates to UI
  useEffect(() => {
    if (!isProcessing) {
      setDisplayed(Array.isArray(candidates) ? candidates : []);
      setPromptChanging(false);
    }
  }, [isProcessing, candidates]);

  // Clean/sort candidates for rendering
  const cleanedCandidates = useMemo(() => {
    const seen = new Set<string>();
    return (Array.isArray(displayed) ? displayed : [])
      .filter((c) => c && (c._id ?? c.id) !== undefined)
      .filter((c) => {
        const key = String(c._id ?? c.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        // sort by final_score, then semantic_score
        const s1 = safeNum(b.final_score) - safeNum(a.final_score);
        if (s1 !== 0) return s1;
        const s2 = safeNum(b.semantic_score) - safeNum(a.semantic_score);
        return s2;
      });
  }, [displayed]);

  const totalPages = Math.ceil(Math.max(1, cleanedCandidates.length) / itemsPerPage);
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * itemsPerPage;
  const currentCandidates = cleanedCandidates.slice(startIndex, startIndex + itemsPerPage);

  const nextPage = () => {
    if (page < totalPages) setCurrentPage(page + 1);
  };
  const prevPage = () => {
    if (page > 1) setCurrentPage(page - 1);
  };

  const Pill = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/50 px-2.5 py-1 text-xs text-foreground">
      {children}
    </span>
  );

  const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.06)] px-2 py-1 text-[10px] font-semibold text-[hsl(var(--primary))]">
      {children}
    </span>
  );

  const Avatar = ({ name }: { name: string }) => {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('');
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] text-white shadow-glow text-sm font-bold">
        {initials || 'CN'}
      </div>
    );
  };

  // Match summary (flags kept for future, but header is standardized)
  const matchMeta = useMemo(() => {
    let strictCount = 0;
    let closeCount = 0;
    for (const c of cleanedCandidates) {
      if (c?.is_strict_match === true || c?.match_type === 'exact') strictCount++;
      else if (c?.is_strict_match === false || c?.match_type === 'close') closeCount++;
      else strictCount++; // default to exact when flag missing
    }
    return {
      strictCount,
      closeCount,
      total: cleanedCandidates.length,
    };
  }, [cleanedCandidates]);

  // Standardized header line (as required)
  const HeaderStatus = () => {
    if (isProcessing || promptChanging) return <>AI is analyzing candidates...</>;
    return <>Showing {matchMeta.total} result{matchMeta.total === 1 ? '' : 's'} for your query.</>;
  };

  const SkeletonGrid = () => (
    <div className="mb-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: itemsPerPage }).map((_, i) => (
        <div
          key={i}
          className="surface glass border border-border rounded-2xl p-6 animate-pulse"
          aria-hidden="true"
        >
          <div className="mb-4 flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-[hsl(var(--muted))]" />
            <div className="flex-1 min-w-0">
              <div className="h-4 w-40 bg-[hsl(var(--muted))] rounded mb-2" />
              <div className="h-3 w-28 bg-[hsl(var(--muted))] rounded" />
            </div>
          </div>
          <div className="h-2 w-full bg-[hsl(var(--muted))] rounded mb-2" />
          <div className="h-2 w-3/4 bg-[hsl(var(--muted))] rounded mb-5" />
          <div className="h-10 w-full bg-[hsl(var(--muted))] rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <section className="card-glass relative overflow-hidden animate-rise-in" aria-labelledby="filtered-title">
      {/* Ambient overlays */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.06] gradient-ink" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-6 border-b border-border bg-gradient-to-r from-[hsl(var(--muted)/.5)] to-[hsl(var(--muted)/.35)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="filtered-title" className="text-2xl md:text-3xl font-extrabold gradient-text glow">
                Filtered Candidates
              </h3>
              <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                <HeaderStatus />
              </p>
              {!isProcessing && !promptChanging && (
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {`Query: “${(activePrompt || '').toString()}”`}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="p-6">
          {isProcessing || promptChanging ? (
            // Skeleton while loading or switching prompts
            <div className="py-6">
              <SkeletonGrid />
            </div>
          ) : cleanedCandidates.length === 0 ? (
            // Empty state
            <div className="py-14 max-w-2xl mx-auto text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] text-white shadow-glow">
                <i className="ri-filter-3-line text-2xl" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">No results</h4>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Try widening your criteria or changing the query.
              </p>
            </div>
          ) : (
            <>
              {/* Cards grid */}
              <div className="mb-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {currentCandidates.map((candidate) => {
                  const id = String(candidate._id ?? candidate.id);
                  const name = safeName(candidate.name);

                  // Role line: show complete, no truncation
                  const jobRole =
                    candidate.predicted_role || candidate.category || candidate.currentRole || 'Unknown Role';

                  // Prefer clean experience display from backend if present
                  const expDisplayFromBackend =
                    (typeof candidate.experience_display === 'string' && candidate.experience_display.trim()) ||
                    null;

                  // Use experience_rounded numeric if present; else fall back through aliases
                  const experienceNumeric =
                    typeof candidate.experience_rounded === 'number'
                      ? candidate.experience_rounded
                      : (candidate.total_experience_years ??
                        candidate.years_of_experience ??
                        candidate.experience_years ??
                        candidate.yoe ??
                        Number(candidate.experience));

                  const expText = expDisplayFromBackend || formatYears(experienceNumeric);

                  const confNum = safeNum(candidate.confidence);
                  const confText = Number.isFinite(confNum) ? `${confNum.toFixed(2)}%` : 'N/A';

                  const semScoreNum = safeNum(candidate.semantic_score);
                  const semScoreText = Number.isFinite(semScoreNum) ? `${semScoreNum.toFixed(2)}%` : null;

                  // Skills: use server-provided truncated list if available
                  const skillsFromServer = Array.isArray(candidate.skillsTruncated)
                    ? candidate.skillsTruncated
                    : Array.isArray(candidate.skills)
                    ? candidate.skills
                    : [];

                  const shownSkills = (skillsFromServer || [])
                    .filter((s) => String(s || '').trim() !== '')
                    .slice(0, 6);

                  // Overflow: prefer server count if provided, otherwise compute diff
                  const overflow =
                    typeof candidate.skillsOverflowCount === 'number'
                      ? Math.max(0, candidate.skillsOverflowCount)
                      : Math.max(0, (candidate.skills || []).length - shownSkills.length);

                  const location = (candidate.location && String(candidate.location).trim()) || 'N/A';

                  // Related roles: accept both shapes
                  const relatedRoles =
                    (Array.isArray(candidate.related_roles) && candidate.related_roles.length > 0
                      ? candidate.related_roles.map((r) => ({ role: r.role, match: r.match }))
                      : Array.isArray(candidate.relatedRoles)
                      ? candidate.relatedRoles.map((r) => ({
                          role: r.role,
                          match: typeof r.score === 'number' ? r.score * 100 : undefined,
                        }))
                      : []) || [];

                  // Optional match badge
                  const matchBadge =
                    candidate.match_type === 'exact' || candidate.is_strict_match
                      ? 'Exact match'
                      : candidate.match_type === 'close'
                      ? 'Close match'
                      : null;

                  return (
                    <article
                      key={id}
                      className="surface glass border border-border rounded-2xl p-6 hover:shadow-glow transition-all duration-300 h-full flex flex-col"
                    >
                      <div className="mb-4 flex items-start gap-4">
                        <Avatar name={name} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {/* ✅ Full name & role (no truncate) */}
                              <h4 className="mb-0.5 break-words text-lg font-bold text-foreground">{name}</h4>
                              <p className="break-words text-sm font-semibold text-[hsl(var(--g3))]">{jobRole}</p>
                              {matchBadge && (
                                <div className="mt-2">
                                  <Badge>
                                    <i className="ri-equalizer-line" /> {matchBadge}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="text-right">
                              {/* smaller badge */}
                              {semScoreText && (
                                <div className="px-2 py-1 rounded-full text-xs font-semibold text-[hsl(var(--primary))] border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.06)]">
                                  {semScoreText}
                                </div>
                              )}
                              {/* fixed subtitle */}
                              <div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                                Prompt Matching score
                              </div>
                            </div>
                          </div>

                          {/* meta pills */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Pill>
                              <i className="ri-briefcase-2-line" /> {expText}
                            </Pill>
                            <Pill>
                              <i className="ri-map-pin-line" /> {location}
                            </Pill>
                            <Pill>
                              <i className="ri-shield-check-line" /> Model Confidence {confText}
                            </Pill>
                          </div>
                        </div>
                      </div>

                      {/* Skills — single line with +N overflow */}
                      <div className="mb-5">
                        <div className="mb-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">Core skills</div>
                        {shownSkills.length > 0 ? (
                          <div className="flex flex-nowrap items-center gap-2 overflow-hidden">
                            {shownSkills.map((s: any, idx: number) => (
                              <span
                                key={idx}
                                className="whitespace-nowrap rounded-full border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.06)] px-2.5 py-1 text-xs text-[hsl(var(--primary))]"
                              >
                                {String(s)}
                              </span>
                            ))}
                            {overflow > 0 && (
                              <span
                                className="ml-1 whitespace-nowrap rounded-full border border-border/60 bg-card/50 px-2.5 py-1 text-xs text-foreground"
                                title={`${overflow} more skill${overflow === 1 ? '' : 's'}`}
                              >
                                +{overflow}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">No skills mentioned</p>
                        )}
                      </div>

                      {/* Related Roles with visible score */}
                      {relatedRoles.length > 0 && (
                        <div className="mb-5">
                          <div className="mb-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                            Related roles
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {relatedRoles.slice(0, 3).map((r, idx) => {
                              const pct =
                                typeof r.match === 'number' && Number.isFinite(r.match)
                                  ? ` (${Math.round(r.match)}%)`
                                  : '';
                              return (
                                <span
                                  key={idx}
                                  className="rounded-full border border-border/60 bg-card/50 px-2.5 py-1 text-xs text-foreground"
                                >
                                  {r.role}
                                  {pct}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Button aligned bottom across cards */}
                      <Link href={`/candidate/${id}`} className="btn btn-primary w-full justify-center mt-auto">
                        <i className="ri-eye-line mr-2" />
                        View Profile
                      </Link>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 border-t border-border pt-6">
                  <button
                    onClick={prevPage}
                    disabled={page === 1}
                    className="surface rounded-lg px-4 py-2 text-foreground hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <i className="ri-arrow-left-line mr-2" />
                    Previous
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`h-10 w-10 rounded-lg text-sm font-medium transition ${
                          page === p ? 'btn btn-primary' : 'surface text-foreground hover:shadow-glow'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={page === totalPages}
                    className="surface rounded-lg px-4 py-2 text-foreground hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                    <i className="ri-arrow-right-line ml-2" />
                  </button>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, cleanedCandidates.length)} of{' '}
                  {cleanedCandidates.length} candidates
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
