'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function CandidateResults({ candidates, isProcessing, activePrompt }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const cleanedCandidates = useMemo(() => {
    const seen = new Set();
    return candidates
      .filter(c => {
        if (!c || !c._id || seen.has(c._id)) return false;
        seen.add(c._id);
        return true;
      })
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
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5"></div>

      <div className="relative z-10">
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Filtered Candidates</h3>
              <p className="text-gray-600 mt-1">
                {isProcessing
                  ? 'AI is analyzing candidates...'
                  : `Found ${cleanedCandidates.length} matching candidates`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isProcessing ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-900 font-medium mb-2">Analyzing candidates...</p>
                <p className="text-sm text-gray-600">"{activePrompt}"</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentCandidates.map((candidate) => {
                  const name = candidate.name || 'Unnamed';
                  const jobRole = candidate.predicted_role || candidate.category || 'Unknown Role';
                  const experience = candidate.experience ? `${candidate.experience} years` : 'Not specified';
                  const confidence = candidate.confidence !== undefined ? `${candidate.confidence.toFixed(2)}%` : 'N/A';
                  const score = candidate.semantic_score?.toFixed(2) || '0.00';
                  const scoreLabel = candidate.score_type || 'Prompt Match';
                  const relatedRoles = Array.isArray(candidate.related_roles) ? candidate.related_roles : [];

                  return (
                    <div
                      key={candidate._id}
                      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-1">{name}</h4>
                          <p className="text-sm text-purple-700 font-semibold mb-1">{jobRole}</p>
                          <p className="text-xs text-gray-500 mb-1"><span className="font-semibold">Experience:</span> {experience}</p>
                          <p className="text-xs text-gray-500 mb-1"><span className="font-semibold">Model Confidence:</span> {confidence}</p>

                          {relatedRoles.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              <span className="font-semibold">Also matches:</span>{' '}
                              {relatedRoles
                                .slice(0, 3)
                                .map(r => `${r.role} (${r.match}%)`)
                                .join(', ')}
                            </p>
                          )}
                        </div>

                        <div className="px-3 py-1 rounded-full text-sm font-semibold text-blue-800 border border-blue-200 bg-blue-50 shadow-sm text-center">
                          <div>{score}%</div>
                          <div className="text-xs text-gray-500">{scoreLabel}</div>
                        </div>
                      </div>

                      <Link
                        href={`/candidate/${candidate._id}`}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-center flex items-center justify-center"
                      >
                        <i className="ri-eye-line mr-2"></i>
                        View Profile
                      </Link>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 pt-6 border-t border-gray-200/50">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="ri-arrow-left-line"></i>
                    <span>Previous</span>
                  </button>

                  <div className="flex space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Next</span>
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, cleanedCandidates.length)} of {cleanedCandidates.length} candidates
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
