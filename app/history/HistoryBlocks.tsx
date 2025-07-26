'use client';

import { useState } from 'react';

export default function HistoryBlocks({ historyData, onViewResults, onRerunPrompt }) {
  const [rerunningId, setRerunningId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleRerun = async (id, prompt) => {
    setRerunningId(id);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onRerunPrompt(prompt);
    setRerunningId(null);
  };

  const getMatchColor = (count) => {
    if (count >= 15) return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
    if (count >= 10) return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    if (count >= 5) return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
    return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
  };

  const getMatchIcon = (count) => {
    if (count >= 15) return 'ri-trophy-line';
    if (count >= 10) return 'ri-award-line';
    if (count >= 5) return 'ri-star-line';
    return 'ri-information-line';
  };

  const totalPages = Math.ceil(historyData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = historyData.slice(startIndex, startIndex + itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="space-y-6">
      {historyData.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-history-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No History Found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentItems.map((history, index) => (
            <div
              key={history.id}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/3 to-blue-500/3"></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <i className="ri-brain-line text-white text-xl"></i>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{history.prompt}</h3>
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            <i className="ri-time-line mr-1"></i>
                            {history.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg ${getMatchColor(history.totalMatches)}`}>
                    <i className={`${getMatchIcon(history.totalMatches)} mr-2`}></i>
                    {history.totalMatches} candidates
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onViewResults(history)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
                  >
                    <i className="ri-eye-line mr-2"></i>
                    View Results
                  </button>

                  <button
                    onClick={() => handleRerun(history.id, history.prompt)}
                    disabled={rerunningId === history.id}
                    className="px-8 py-3 rounded-xl font-medium bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
                  >
                    {rerunningId === history.id ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Running...
                      </div>
                    ) : (
                      <>
                        <i className="ri-refresh-line mr-2"></i>
                        Re-run Prompt
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-6 pt-8">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-sm"
          >
            <i className="ri-arrow-left-line"></i>
            <span className="font-medium">Previous</span>
          </button>

          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-110 ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-sm"
          >
            <span className="font-medium">Next</span>
            <i className="ri-arrow-right-line"></i>
          </button>
        </div>
      )}

      {historyData.length > 0 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, historyData.length)} of {historyData.length} search results
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
