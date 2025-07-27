'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CandidateProfile from './CandidateProfile';
import ResumePreview from './ResumePreview';
import ActionButtons from './ActionButtons';
import ScoreAnalysis from './ScoreAnalysis';

export default function CandidateDetail({ candidateId }: { candidateId: string }) {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:10000/candidate/${candidateId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Failed to fetch candidate');
        }
        setCandidate(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  const handleStatusChange = (newStatus: string) => {
    setCandidate((prev: any) => ({
      ...prev,
      status: newStatus,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-user-line text-6xl text-gray-400 mb-4"></i>
          <p className="text-gray-600 text-lg">{error || 'Candidate not found'}</p>
          <Link href="/upload" className="text-blue-600 hover:text-blue-800 mt-2 inline-block cursor-pointer">
            Back to candidates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/upload" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-line text-xl text-gray-600"></i>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Candidate Profile</h1>
                <p className="text-gray-600">Detailed view and assessment</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {candidate.rank !== undefined && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  <i className="ri-medal-line mr-2"></i>
                  Rank #{candidate.rank}
                </div>
              )}
              {candidate.score !== undefined && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                  <i className="ri-star-line mr-2"></i>
                  {candidate.score}% Match
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-4">
            <CandidateProfile candidate={candidate} />
            <ActionButtons candidate={candidate} onStatusChange={handleStatusChange} />
            <ScoreAnalysis candidate={candidate} />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-md rounded-t-2xl border border-gray-200/50 p-4">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { id: 'profile', label: 'Resume', icon: 'ri-file-text-line' },
                  { id: 'analysis', label: 'Analysis', icon: 'ri-bar-chart-line' },
                  { id: 'history', label: 'History', icon: 'ri-history-line' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <i className={`${tab.icon} mr-2`}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-b-2xl border-x border-b border-gray-200/50">
              {activeTab === 'profile' && <ResumePreview candidate={candidate} />}
              {activeTab === 'analysis' && <ScoreAnalysis candidate={candidate} detailed={true} />}
              {activeTab === 'history' && (
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interaction History</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <i className="ri-eye-line text-blue-600"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Profile viewed</p>
                        <p className="text-xs text-gray-500">Just now</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <i className="ri-upload-line text-green-600"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Resume uploaded</p>
                        <p className="text-xs text-gray-500">From database</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
