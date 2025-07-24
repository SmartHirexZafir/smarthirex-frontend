
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CandidateResults({ candidates, isProcessing, activePrompt }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const itemsPerPage = 6;

  const totalPages = Math.ceil(candidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCandidates = candidates.slice(startIndex, startIndex + itemsPerPage);

  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 70) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 90) return 'ri-medal-line';
    if (score >= 80) return 'ri-award-line';
    if (score >= 70) return 'ri-star-line';
    return 'ri-thumb-up-line';
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Filtered Candidates</h3>
              <p className="text-gray-600 mt-1">
                {isProcessing ? 'AI is analyzing candidates...' : `Found ${candidates.length} matching candidates`}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                <i className="ri-filter-2-line mr-1"></i>
                Smart Filter
              </div>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <i className={`${viewMode === 'grid' ? 'ri-list-unordered' : 'ri-grid-line'} text-gray-600`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isProcessing ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-900 font-medium mb-2">Analyzing candidates...</p>
                <p className="text-sm text-gray-600">"{activePrompt}"</p>
                <div className="mt-4 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">{candidate.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{candidate.currentRole}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <i className="ri-map-pin-line mr-1"></i>
                          {candidate.location}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(candidate.score)}`}>
                        <i className={`${getScoreIcon(candidate.score)} mr-1`}></i>
                        {candidate.score}%
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              candidate.matchedSkills.includes(skill)
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 3 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            +{candidate.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Experience</p>
                      <p className="text-sm font-medium text-gray-900">{candidate.experience}</p>
                    </div>

                    {/* Action */}
                    <Link
                      href={`/candidate/${candidate.id}`}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-center flex items-center justify-center"
                    >
                      <i className="ri-eye-line mr-2"></i>
                      View Profile
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
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

              {/* Results Summary */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, candidates.length)} of {candidates.length} candidates
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
