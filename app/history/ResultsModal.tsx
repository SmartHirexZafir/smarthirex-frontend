'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ResultsModal({ history, onClose }) {
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [showTestModal, setShowTestModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!history?.id) return;
      try {
        const res = await fetch(`http://localhost:10000/history/history-result/${history.id}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error('Failed to fetch results:', err);
        setResults(null);
      }
    };
    fetchResults();
  }, [history]);

  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      newSet.has(candidateId) ? newSet.delete(candidateId) : newSet.add(candidateId);
      return newSet;
    });
  };

  const handleSendTest = (candidate) => {
    setSelectedCandidate(candidate);
    setShowTestModal(true);
  };

  const handleScheduleInterview = (candidate) => {
    setSelectedCandidate(candidate);
    setShowInterviewModal(true);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (!results) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Search Results</h2>
              <p className="text-purple-100">"{results.prompt}"</p>
              <p className="text-sm text-purple-200 mt-1">
                <i className="ri-time-line mr-1"></i>
                {results.timestamp}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {results.totalMatches} Candidates Found
            </h3>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors">
                <i className="ri-download-line mr-1"></i>
                Export Results
              </button>
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                <i className="ri-mail-line mr-1"></i>
                Bulk Email
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {results.candidates.map((candidate) => (
              <div
                key={candidate._id}
                className={`bg-gray-50 rounded-xl p-4 border-2 transition-all duration-200 ${
                  selectedCandidates.has(candidate._id) 
                    ? 'border-purple-300 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.has(candidate._id)}
                    onChange={() => handleCandidateSelect(candidate._id)}
                    className="w-4 h-4 mt-2 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  
                  <img 
                    src={candidate.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${candidate.name}`}
                    alt={candidate.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{candidate.name}</h4>
                        <p className="text-sm text-gray-600">{candidate.email}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(candidate.score || candidate.match_score || 0)}`}>
                        {(candidate.score || candidate.match_score || 0)}% Match
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Match reasons:</p>
                      <div className="flex flex-wrap gap-1">
                        {(candidate.matchReasons || candidate.skills || []).slice(0, 5).map((reason, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/candidate/${candidate._id || candidate.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
                      >
                        <i className="ri-eye-line mr-1"></i>
                        View Candidate
                      </Link>
                      <button
                        onClick={() => handleSendTest(candidate)}
                        className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors border border-green-200 whitespace-nowrap"
                      >
                        <i className="ri-file-list-line mr-1"></i>
                        Send Test
                      </button>
                      <button
                        onClick={() => handleScheduleInterview(candidate)}
                        className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors border border-orange-200 whitespace-nowrap"
                      >
                        <i className="ri-calendar-event-line mr-1"></i>
                        Schedule Interview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedCandidates.size} of {results.candidates.length} candidates selected
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
                Save Selection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals remain unchanged */}
      {/* Test Modal & Interview Modal logic here, unchanged from your code... */}
    </div>
  );
}
