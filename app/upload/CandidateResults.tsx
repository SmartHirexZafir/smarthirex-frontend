'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function CandidateResults({
  candidates,
  isProcessing,
  activePrompt,
}: {
  candidates: any[];
  isProcessing: boolean;
  activePrompt: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const cleanedCandidates = useMemo(() => {
    const seen = new Set();
    return candidates
      .filter((c) => c && c._id && !seen.has(c._id) && c.semantic_score !== undefined)
      .map((c) => {
        seen.add(c._id);
        return c;
      })
      // keep original sorting field to avoid touching backend assumptions
      .sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
  }, [candidates]);

  const totalPages = Math.ceil(cleanedCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCandidates = cleanedCandidates.slice(startIndex, startIndex + itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <section className="card-glass relative overflow-hidden animate-rise-in" aria-labelledby="filtered-title">
      {/* Ambient overlays */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.06] gradient-ink" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-5 border-b border-border bg-gradient-to-r from-[hsl(var(--muted)/.5)] to-[hsl(var(--muted)/.35)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="filtered-title" className="text-2xl font-extrabold gradient-text glow">
                Filtered Candidates
              </h3>
              <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                {isProcessing
                  ? 'AI is analyzing candidates...'
                  : `Found ${cleanedCandidates.length} matching candidates`}
              </p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {isProcessing ? (
            // Loading state
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
                <p className="mb-2 font-medium text-foreground">Analyzing candidates...</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">"{activePrompt}"</p>
              </div>
            </div>
          ) : cleanedCandidates.length === 0 ? (
            // Empty state (modified as per requirement)
            <div className="py-14 max-w-2xl mx-auto text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] text-white shadow-glow">
                <i className="ri-filter-3-line text-2xl" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">No CVs found</h4>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                There is no CV uploaded from your side.
              </p>
            </div>
          ) : (
            <>
              {/* Cards grid */}
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {currentCandidates.map((candidate) => {
                  const {
                    _id,
                    name = 'Unnamed',
                    predicted_role,
                    category,
                    experience,
                    confidence,
                    semantic_score,
                    score_type,
                    related_roles,
                  } = candidate;

                  const jobRole = predicted_role || category || 'Unknown Role';
                  const expText = experience ? `${experience} years` : 'Not specified';
                  const confText =
                    confidence !== undefined ? `${Number(confidence).toFixed(2)}%` : 'N/A';
                  const score = semantic_score?.toFixed(2) || '0.00';
                  const scoreLabel = score_type || 'Prompt Match';

                  const topRelatedRoles = Array.isArray(related_roles)
                    ? related_roles.slice(0, 3)
                    : [];

                  return (
                    <article
                      key={_id}
                      className="surface glass border border-border rounded-2xl p-6 hover:shadow-glow transition-all duration-300"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="mb-1 text-lg font-bold text-foreground">{name}</h4>
                          <p className="mb-1 text-sm font-semibold text-[hsl(var(--g3))]">{jobRole}</p>
                          <p className="mb-1 text-xs text-[hsl(var(--muted-foreground))]">
                            <span className="font-semibold">Experience:</span> {expText}
                          </p>
                          <p className="mb-1 text-xs text-[hsl(var(--muted-foreground))]">
                            <span className="font-semibold">Model Confidence:</span> {confText}
                          </p>

                          {topRelatedRoles.length > 0 && (
                            <p className="mt-1 text-xs text-[hsl(var(--primary))]">
                              <span className="font-semibold">Also matches:</span>{' '}
                              {topRelatedRoles.map((r) => `${r.role} (${r.match}%)`).join(', ')}
                            </p>
                          )}
                        </div>

                        <div className="px-3 py-1 rounded-full text-sm font-semibold text-[hsl(var(--primary))] border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.06)] text-center">
                          <div>{score}%</div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">{scoreLabel}</div>
                        </div>
                      </div>

                      <Link
                        href={`/candidate/${_id}`}
                        className="btn btn-primary w-full justify-center"
                      >
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
                    disabled={currentPage === 1}
                    className="surface rounded-lg px-4 py-2 text-foreground hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <i className="ri-arrow-left-line mr-2" />
                    Previous
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-10 w-10 rounded-lg text-sm font-medium transition ${
                          currentPage === page
                            ? 'btn btn-primary'
                            : 'surface text-foreground hover:shadow-glow'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="surface rounded-lg px-4 py-2 text-foreground hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                    <i className="ri-arrow-right-line ml-2" />
                  </button>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Showing {startIndex + 1}-
                  {Math.min(startIndex + itemsPerPage, cleanedCandidates.length)} of{' '}
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
